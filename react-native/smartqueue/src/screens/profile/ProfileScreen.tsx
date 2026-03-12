import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  Switch,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../store/authStore';
import { useSettings } from '../../store/settingsStore';
import { useAlertPreferencesStore } from '../../store/alertPreferencesStore';
import { MARGIN_OPTIONS, TRANSPORT_MODE_OPTIONS, AlertChannel } from '../../types/alertPreferences';
import { TabParamList } from '../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { CustomActionSheet, Option } from '../../components/ui/CustomActionSheet';

type ProfileNavigationProp = NativeStackNavigationProp<TabParamList, 'Profile'>;

// Types pour les options de menu
interface MenuItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  onPress: () => void;
  destructive?: boolean;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
}

// Composant ProfileScreen
export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileNavigationProp>();
  const { user, logout } = useAuth();
  const { 
    isDarkMode, 
    setDarkMode,
    preferences,
    updatePreferences,
    loadPreferences 
  } = useSettings();
  const {
    channels,
    marginMinutes,
    marginOption,
    enableSafetyAlert,
    phoneNumber,
    preferredTransportMode,
    setChannels,
    setMarginMinutes,
    setEnableSafetyAlert,
    setPhoneNumber,
    setPreferredTransportMode,
    loadPreferences: loadAlertPreferences,
  } = useAlertPreferencesStore();
  const { AlertComponent, showWarning } = useCustomAlert();
  
  const [isLoading] = useState(false);
  const [avatarUri] = useState<string | null>(null);

  // Action sheets visibility state
  const [alertChannelsVisible, setAlertChannelsVisible] = useState(false);
  const [alertTimingVisible, setAlertTimingVisible] = useState(false);
  const [transportModeVisible, setTransportModeVisible] = useState(false);

  // Options for action sheets
  const alertChannelOptions: Option[] = [
    { label: 'Push only', value: 'push', icon: 'notifications-outline' },
    { label: 'SMS only', value: 'sms', icon: 'chatbubble-outline' },
    { label: 'Push & SMS', value: 'push_sms', icon: 'notifications-circle-outline' },
  ];

  const alertTimingOptions: Option[] = MARGIN_OPTIONS.map(opt => ({
    label: opt.label,
    value: opt.value === 'custom' ? marginMinutes : (opt.value as number),
  }));

  const transportModeOptions: Option[] = TRANSPORT_MODE_OPTIONS.map(opt => ({
    label: opt.label,
    value: opt.value,
    icon: opt.value === 'walking' ? 'walk' : opt.value === 'motorcycle' ? 'bicycle' : 'car',
  }));

  // Handle selections
  const handleSelectAlertChannel = (value: string | number) => {
    if (value === 'push') setChannels(['push']);
    else if (value === 'sms') setChannels(['sms']);
    else if (value === 'push_sms') setChannels(['push', 'sms']);
  };

  const handleSelectAlertTiming = (value: string | number) => {
    setMarginMinutes(value as number, String(value));
  };

  const handleSelectTransportMode = (value: string | number) => {
    setPreferredTransportMode(value as string);
  };

  // Charger les préférences au montage
  useEffect(() => {
    loadPreferences();
    loadAlertPreferences();
  }, [loadPreferences, loadAlertPreferences]);
  
  // Push notifications enabled from preferences
  const pushNotificationsEnabled = preferences.push_notifications_enabled;

  // Gérer la déconnexion
  const handleLogout = () => {
    showWarning(
      'Log Out',
      'Are you sure you want to log out?',
      'Log Out',
      async () => {
        try {
          await logout();
          router.push('/login');
        } catch (error) {
          console.error('Logout error:', error);
        }
      },
      'Cancel'
    );
  };

  // Sections du menu
  const menuSections = [
    {
      title: 'Account Settings',
      items: [
        {
          id: 'personalInfo',
          title: 'Personal Information',
          subtitle: 'Name, email, phone',
          icon: 'person-outline',
          iconBg: 'bg-blue-100',
          onPress: () => router.push('/personal-info'),
        },
        {
          id: 'paymentMethods',
          title: 'Payment Methods',
          subtitle: 'Manage your cards',
          icon: 'card-outline',
          iconBg: 'bg-green-100',
          onPress: () => router.push('/payment-methods'),
        },
      ] as MenuItem[],
    },
    {
      title: 'Alert Preferences',
      items: [
        {
          id: 'alertChannels',
          title: 'Alert Channels',
          subtitle: channels.includes('sms') ? 'Push & SMS' : 'Push only',
          icon: 'notifications-outline',
          iconBg: 'bg-orange-100',
          onPress: () => setAlertChannelsVisible(true),
        },
        {
          id: 'alertMargin',
          title: 'Alert Timing',
          subtitle: `${marginMinutes} min before turn`,
          icon: 'time-outline',
          iconBg: 'bg-blue-100',
          onPress: () => setAlertTimingVisible(true),
        },
        {
          id: 'transportMode',
          title: 'Transport Mode',
          subtitle: TRANSPORT_MODE_OPTIONS.find(o => o.value === preferredTransportMode)?.label || 'Moto',
          icon: 'car-outline',
          iconBg: 'bg-purple-100',
          onPress: () => setTransportModeVisible(true),
        },
        {
          id: 'safetyAlert',
          title: 'Safety Alert',
          subtitle: enableSafetyAlert ? '2nd alert 2 min before' : 'Disabled',
          icon: 'shield-checkmark-outline',
          iconBg: 'bg-green-100',
          onPress: () => {},
          toggle: true,
          toggleValue: enableSafetyAlert,
          onToggle: setEnableSafetyAlert,
        },
      ] as MenuItem[],
    },
    {
      title: 'App Preferences',
      items: [
        {
          id: 'notifications',
          title: 'Notifications',
          icon: 'notifications-outline',
          iconBg: 'bg-orange-100',
          onPress: () => {},
          toggle: true,
          toggleValue: pushNotificationsEnabled,
          onToggle: (value: boolean) => updatePreferences({ push_notifications_enabled: value }),
        },
        {
          id: 'darkMode',
          title: 'Dark Mode',
          icon: 'moon-outline',
          iconBg: 'bg-indigo-100',
          onPress: () => {},
          toggle: true,
          toggleValue: isDarkMode,
          onToggle: setDarkMode,
        },
      ] as MenuItem[],
    },
    {
      title: 'Support & About',
      items: [
        {
          id: 'help',
          title: 'Help & Support',
          icon: 'help-circle-outline',
          iconBg: 'bg-purple-100',
          onPress: () => router.push('/help-support'),
        },
        {
          id: 'about',
          title: 'About SmartQueue',
          icon: 'information-circle-outline',
          iconBg: 'bg-gray-100',
          onPress: () => router.push('/about'),
        },
      ] as MenuItem[],
    },
  ];

  // Formater la date d'inscription
  const getMemberSince = () => {
    if (!user?.created_at) return 'Recently';
    try {
      const date = new Date(user.created_at);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
    } catch (error) {
      return 'Recently';
    }
  };

  const renderItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={item.onPress}
      disabled={item.toggle || isLoading}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: item.iconBg.replace('bg-', '').replace('100', '50') }]}>
          <Ionicons name={item.icon} size={22} color={item.destructive ? '#EF4444' : getIconColor(item.iconBg)} />
        </View>
        <View style={styles.menuItemText}>
          <Text style={[styles.menuItemTitle, item.destructive && styles.destructiveText]}>{item.title}</Text>
          {item.subtitle && <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>}
        </View>
      </View>
      
      {item.toggle ? (
        <Switch
          value={item.toggleValue}
          onValueChange={item.onToggle}
          trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
          thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
      )}
    </TouchableOpacity>
  );

  const getIconColor = (iconBg: string) => {
    const colorMap: Record<string, string> = {
      'bg-blue-100': '#3B82F6',
      'bg-green-100': '#10B981',
      'bg-orange-100': '#F97316',
      'bg-purple-100': '#8B5CF6',
      'bg-indigo-100': '#6366F1',
      'bg-gray-100': '#6B7280',
    };
    return colorMap[iconBg] || '#1F2937';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Elegant Gradient Header */}
      <LinearGradient
        colors={['#1E40AF', '#3B82F6', '#60A5FA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarContainer}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <TouchableOpacity style={styles.cameraButton} activeOpacity={0.8}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {/* User Info */}
          <Text style={styles.userName}>{user?.name || 'User Profile'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          
          {/* Member Badge */}
          <View style={styles.memberBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#3B82F6" />
            <Text style={styles.memberText}>Member since {getMemberSince()}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Menu Sections */}
      <View style={styles.menuContainer}>
        {menuSections.map((section, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, itemIdx) => (
                <View key={item.id}>
                  {renderItem(item)}
                  {itemIdx < section.items.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Log Out Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FEE2E2', '#FECACA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.logoutGradient}
          >
            <Ionicons name="log-out-outline" size={22} color="#DC2626" />
            <Text style={styles.logoutText}>Log Out</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.versionText}>SmartQueue v1.0.0 • Built with Love</Text>
      </View>
      {AlertComponent}

      {/* Custom Action Sheets */}
      <CustomActionSheet
        visible={alertChannelsVisible}
        title="Alert Channels"
        message="Choose how to receive alerts"
        options={alertChannelOptions}
        selectedValue={channels.includes('sms') ? (channels.includes('push') ? 'push_sms' : 'sms') : 'push'}
        onSelect={handleSelectAlertChannel}
        onClose={() => setAlertChannelsVisible(false)}
        type="warning"
      />

      <CustomActionSheet
        visible={alertTimingVisible}
        title="Alert Timing"
        message="When to alert before your turn"
        options={alertTimingOptions}
        selectedValue={marginMinutes}
        onSelect={handleSelectAlertTiming}
        onClose={() => setAlertTimingVisible(false)}
        type="info"
      />

      <CustomActionSheet
        visible={transportModeVisible}
        title="Transport Mode"
        message="For travel time calculation"
        options={transportModeOptions}
        selectedValue={preferredTransportMode}
        onSelect={handleSelectTransportMode}
        onClose={() => setTransportModeVisible(false)}
        type="info"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingTop: 60,
    paddingBottom: 30,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#3B82F6',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  userEmail: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    marginBottom: 12,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backdropFilter: 'blur(10px)',
  },
  memberText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  menuContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 3,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  destructiveText: {
    color: '#DC2626',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 60,
  },
  logoutButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
  },
  versionText: {
    textAlign: 'center',
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 24,
  },
});

export default ProfileScreen;
