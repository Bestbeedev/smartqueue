import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../theme';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useSettings } from '../../store/settingsStore';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { notificationsApi } from '../../api/notificationsApi';

export const NotificationPrefsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { pushNotificationsEnabled, setPushNotificationsEnabled } = useSettings();
  const { AlertComponent, showError } = useCustomAlert();

  const [pushEnabled, setPushEnabled] = useState(pushNotificationsEnabled);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [travelAlerts, setTravelAlerts] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les préférences depuis le backend au montage.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const prefs = await notificationsApi.getPreferences();
        if (cancelled) return;
        setPushEnabled(!!prefs.push_enabled);
        setSmsEnabled(!!prefs.sms_enabled);
        setTravelAlerts(prefs.enable_travel_alerts !== false);
      } catch (error) {
        console.warn('[NotificationPrefs] load failed:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Met à jour une préférence côté backend, avec rollback optimiste si échec.
  const persist = async (
    patch: Parameters<typeof notificationsApi.updatePreferences>[0],
    rollback: () => void,
  ) => {
    try {
      await notificationsApi.updatePreferences(patch);
    } catch {
      rollback();
      showError('Erreur', 'Impossible de mettre à jour les préférences.');
    }
  };

  const handleTogglePush = async (value: boolean) => {
    setPushEnabled(value);
    try {
      await setPushNotificationsEnabled(value);
    } catch {
      // setting local non bloquant
    }
    await persist({ push_enabled: value }, () => setPushEnabled(!value));
  };

  const handleToggleSms = async (value: boolean) => {
    setSmsEnabled(value);
    await persist({ sms_enabled: value }, () => setSmsEnabled(!value));
  };

  const handleToggleTravel = async (value: boolean) => {
    setTravelAlerts(value);
    await persist({ enable_travel_alerts: value }, () => setTravelAlerts(!value));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.separator, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Canaux de notification</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={[styles.row, { borderBottomColor: colors.separator }]}>
            <View style={styles.rowLeft}>
              <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Notifications Push</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={handleTogglePush}
              trackColor={{ false: colors.separator, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={styles.rowLeft}>
              <Ionicons name="chatbubble-outline" size={20} color={colors.success} />
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Alertes SMS</Text>
            </View>
            <Switch
              value={smsEnabled}
              onValueChange={handleToggleSms}
              trackColor={{ false: colors.separator, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Rappels intelligents</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={[styles.rowLeft, { flex: 1, paddingRight: 12 }]}>
              <Ionicons name="navigate-outline" size={20} color={colors.primary} />
              <Text style={[styles.rowLabel, { color: colors.textPrimary, flexShrink: 1 }]}>Alertes de trajet (« partez maintenant »)</Text>
            </View>
            <Switch
              value={travelAlerts}
              onValueChange={handleToggleTravel}
              trackColor={{ false: colors.separator, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <Text style={[styles.hintText, { color: colors.textTertiary }]}>
          Activez les alertes de trajet pour être prévenu du meilleur moment pour partir, en fonction de votre position et de l&apos;avancée de la file. Gardez les notifications activées pour ne pas manquer votre tour.
        </Text>
        {AlertComponent}
      </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: Theme.colors.separator,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Theme.colors.textPrimary },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  section: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Theme.colors.separator,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowLabel: { fontSize: 16, color: Theme.colors.textPrimary, marginLeft: 12 },
  hintText: {
    fontSize: 14,
    color: Theme.colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
});

export default NotificationPrefsScreen;
