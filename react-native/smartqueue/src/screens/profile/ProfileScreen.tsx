import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  Platform,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../store/authStore';
import { useSettings } from '../../store/settingsStore';
import { useAlertPreferencesStore } from '../../store/alertPreferencesStore';
import { MARGIN_OPTIONS, TRANSPORT_MODE_OPTIONS, AlertChannel } from '../../types/alertPreferences';
import { TabParamList } from '../../navigation/types';
import { Ionicons } from '@expo/vector-icons';

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
  
  const [isLoading] = useState(false);
  const [avatarUri] = useState<string | null>(null);

  // Charger les préférences au montage
  useEffect(() => {
    loadPreferences();
    loadAlertPreferences();
  }, [loadPreferences, loadAlertPreferences]);
  
  // Push notifications enabled from preferences
  const pushNotificationsEnabled = preferences.push_notifications_enabled;

  // Gérer la déconnexion
  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
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
          onPress: () => navigation.navigate('PersonalInfo' as any),
        },
        {
          id: 'paymentMethods',
          title: 'Payment Methods',
          subtitle: 'Manage your cards',
          icon: 'card-outline',
          iconBg: 'bg-green-100',
          onPress: () => navigation.navigate('PaymentMethods' as any),
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
          onPress: () => {
            Alert.alert(
              'Alert Channels',
              'Choose how to receive alerts',
              [
                { text: 'Push only', onPress: () => setChannels(['push']) },
                { text: 'SMS only', onPress: () => setChannels(['sms']) },
                { text: 'Push & SMS', onPress: () => setChannels(['push', 'sms']) },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          },
        },
        {
          id: 'alertMargin',
          title: 'Alert Timing',
          subtitle: `${marginMinutes} min before turn`,
          icon: 'time-outline',
          iconBg: 'bg-blue-100',
          onPress: () => {
            const options = MARGIN_OPTIONS.map(opt => ({
              text: opt.label,
              onPress: () => setMarginMinutes(opt.value === 'custom' ? marginMinutes : opt.value as number, opt.value),
            }));
            Alert.alert('Alert Timing', 'When to alert before your turn', [...options, { text: 'Cancel', style: 'cancel' }]);
          },
        },
        {
          id: 'transportMode',
          title: 'Transport Mode',
          subtitle: TRANSPORT_MODE_OPTIONS.find(o => o.value === preferredTransportMode)?.label || 'Moto',
          icon: 'car-outline',
          iconBg: 'bg-purple-100',
          onPress: () => {
            const options = TRANSPORT_MODE_OPTIONS.map(opt => ({
              text: opt.label,
              onPress: () => setPreferredTransportMode(opt.value),
            }));
            Alert.alert('Transport Mode', 'For travel time calculation', [...options, { text: 'Cancel', style: 'cancel' }]);
          },
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
          onPress: () => navigation.navigate('HelpSupport' as any),
        },
        {
          id: 'about',
          title: 'About SmartQueue',
          icon: 'information-circle-outline',
          iconBg: 'bg-gray-100',
          onPress: () => navigation.navigate('AboutApp' as any),
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
      className="flex-row items-center justify-between py-4"
      onPress={item.onPress}
      disabled={item.toggle || isLoading}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center flex-1">
        <View className={`w-10 h-10 ${item.iconBg} rounded-xl items-center justify-center mr-4`}>
          <Ionicons name={item.icon} size={22} color={item.destructive ? '#EF4444' : '#1F2937'} />
        </View>
        <View className="flex-1">
          <Text className={`text-base font-semibold ${item.destructive ? 'text-red-500' : 'text-gray-900'}`}>{item.title}</Text>
          {item.subtitle && <Text className="text-gray-400 text-xs mt-0.5">{item.subtitle}</Text>}
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
        <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View className="bg-white px-5 pt-16 pb-8 items-center border-b border-gray-100">
        <TouchableOpacity className="relative mb-4">
          <View className="w-24 h-24 rounded-full bg-blue-600 items-center justify-center">
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} className="w-24 h-24 rounded-full" />
            ) : (
              <Text className="text-white text-3xl font-bold">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full items-center justify-center shadow-md border border-gray-50">
            <Ionicons name="camera" size={16} color="#4B5563" />
          </View>
        </TouchableOpacity>
        
        <Text className="text-2xl font-bold text-gray-900">{user?.name || 'User Profile'}</Text>
        <Text className="text-gray-500 font-medium mb-1">{user?.email || 'user@example.com'}</Text>
        <View className="bg-gray-100 px-3 py-1 rounded-full mt-2">
          <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
            Member since {getMemberSince()}
          </Text>
        </View>
      </View>

      {/* Menu Sections */}
      <View className="px-5 mt-6 pb-12">
        {menuSections.map((section, idx) => (
          <View key={idx} className="mb-8">
            <Text className="text-gray-400 font-bold uppercase tracking-widest text-[11px] mb-3 ml-1">
              {section.title}
            </Text>
            <View className="bg-white rounded-[32px] px-5 shadow-sm border border-gray-100">
              {section.items.map((item, itemIdx) => (
                <View key={item.id}>
                  {renderItem(item)}
                  {itemIdx < section.items.length - 1 && <View className="h-px bg-gray-50 w-full" />}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Log Out Button */}
        <TouchableOpacity 
          className="flex-row items-center justify-center bg-red-50 h-16 rounded-3xl border border-red-100"
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text className="text-red-500 font-bold ml-2 text-base">Log Out</Text>
        </TouchableOpacity>

        <Text className="text-center text-gray-300 text-xs mt-8 mb-4">
          SmartQueue v1.0.0 • Built with Love
        </Text>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;
