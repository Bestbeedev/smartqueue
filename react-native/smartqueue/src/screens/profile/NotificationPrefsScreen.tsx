import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../theme';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useSettings } from '../../store/settingsStore';
import { useCustomAlert } from '../../hooks/useCustomAlert';

export const NotificationPrefsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { pushNotificationsEnabled, setPushNotificationsEnabled } = useSettings();
  const { AlertComponent, showError } = useCustomAlert();
  
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [ticketUpdates, setTicketUpdates] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleTogglePush = async (value: boolean) => {
    try {
      await setPushNotificationsEnabled(value);
    } catch (error) {
      showError('Erreur', 'Impossible de mettre à jour les préférences.');
    }
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Canaux de notification</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={[styles.row, { borderBottomColor: colors.separator }]}>
            <View style={styles.rowLeft}>
              <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Notifications Push</Text>
            </View>
            <Switch
              value={pushNotificationsEnabled}
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
              onValueChange={setSmsEnabled}
              trackColor={{ false: colors.separator, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Types de notification</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={[styles.row, { borderBottomColor: colors.separator }]}>
            <View style={styles.rowLeft}>
              <Text style={[styles.rowLabel, { color: colors.textPrimary, marginLeft: 0 }]}>Mises à jour des tickets</Text>
            </View>
            <Switch
              value={ticketUpdates}
              onValueChange={setTicketUpdates}
              trackColor={{ false: colors.separator, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={styles.rowLeft}>
              <Text style={[styles.rowLabel, { color: colors.textPrimary, marginLeft: 0 }]}>Offres et promotions</Text>
            </View>
            <Switch
              value={promotions}
              onValueChange={setPromotions}
              trackColor={{ false: colors.separator, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <Text style={[styles.hintText, { color: colors.textTertiary }]}
          Nous vous recommandons de garder les notifications activées pour ne pas manquer votre tour dans la file d'attente.
        </Text>
        {AlertComponent}
      </ScrollView>
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
