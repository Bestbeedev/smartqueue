import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
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
import { router } from 'expo-router';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { CustomActionSheet, Option } from '../../components/ui/CustomActionSheet';

type ProfileNavigationProp = NativeStackNavigationProp<TabParamList, 'Profile'>;

// Types pour les options de menu
// ...imports restent inchangés

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

  // Etats des action sheets
  const [alertChannelsVisible, setAlertChannelsVisible] = useState(false);
  const [alertTimingVisible, setAlertTimingVisible] = useState(false);
  const [transportModeVisible, setTransportModeVisible] = useState(false);

  // Options pour les action sheets
  const alertChannelOptions: Option[] = [
    { label: 'Push uniquement', value: 'push', icon: 'notifications-outline' },
    { label: 'SMS uniquement', value: 'sms', icon: 'chatbubble-outline' },
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

  // Gérer les sélections
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
  
  const pushNotificationsEnabled = preferences.push_notifications_enabled;

  // Déconnexion
  const handleLogout = () => {
    showWarning(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      'Déconnexion',
      async () => {
        try {
          await logout();
          router.push('/login');
        } catch (error) {
          console.error('Erreur de déconnexion :', error);
        }
      },
      'Annuler'
    );
  };

  // Sections du menu
  const menuSections = [
    {
      title: 'Paramètres du compte',
      items: [
        {
          id: 'personalInfo',
          title: 'Informations personnelles',
          subtitle: 'Nom, email, téléphone',
          icon: 'person-outline',
          iconBg: 'bg-blue-100',
          onPress: () => router.push('/personal-info'),
        },
      ] as MenuItem[],
    },
    {
      title: 'Préférences des alertes',
      items: [
        {
          id: 'alertChannels',
          title: 'Canaux d’alerte',
          subtitle: channels.includes('sms') ? 'Push & SMS' : 'Push uniquement',
          icon: 'notifications-outline',
          iconBg: 'bg-orange-100',
          onPress: () => setAlertChannelsVisible(true),
        },
        {
          id: 'alertMargin',
          title: 'Timing des alertes',
          subtitle: `${marginMinutes} min avant le tour`,
          icon: 'time-outline',
          iconBg: 'bg-blue-100',
          onPress: () => setAlertTimingVisible(true),
        },
        {
          id: 'transportMode',
          title: 'Mode de transport',
          subtitle: TRANSPORT_MODE_OPTIONS.find(o => o.value === preferredTransportMode)?.label || 'Moto',
          icon: 'car-outline',
          iconBg: 'bg-purple-100',
          onPress: () => setTransportModeVisible(true),
        },
        {
          id: 'safetyAlert',
          title: 'Alerte de sécurité',
          subtitle: enableSafetyAlert ? '2e alerte 2 min avant' : 'Désactivé',
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
      title: 'Préférences de l’application',
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
          title: 'Mode sombre',
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
      title: 'Support & À propos',
      items: [
        {
          id: 'help',
          title: 'Aide & support',
          icon: 'help-circle-outline',
          iconBg: 'bg-purple-100',
          onPress: () => router.push('/help-support'),
        },
        {
          id: 'about',
          title: 'À propos de SmartQueue',
          icon: 'information-circle-outline',
          iconBg: 'bg-gray-100',
          onPress: () => router.push('/about'),
        },
      ] as MenuItem[],
    },
  ];

  // Formater la date d’inscription
  const getMemberSince = () => {
    if (!user?.created_at) return 'Récemment';
    try {
      const date = new Date(user.created_at);
      return date.toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
      });
    } catch (error) {
      return 'Récemment';
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
      {/* En-tête du profil */}
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
        
        <Text className="text-2xl font-bold text-gray-900">{user?.name || 'Profil utilisateur'}</Text>
        <Text className="text-gray-500 font-medium mb-1">{user?.email || 'user@example.com'}</Text>
        <View className="bg-gray-100 px-3 py-1 rounded-full mt-2">
          <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
            Membre depuis {getMemberSince()}
          </Text>
        </View>
      </View>

      {/* Sections du menu */}
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

        {/* Bouton déconnexion */}
        <TouchableOpacity 
          className="flex-row items-center justify-center bg-red-50 h-16 rounded-3xl border border-red-100"
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text className="text-red-500 font-bold ml-2 text-base">Déconnexion</Text>
        </TouchableOpacity>

        <Text className="text-center text-gray-300 text-xs mt-8 mb-4">
          SmartQueue v1.0.0 • Fait avec amour
        </Text>
      </View>
      {AlertComponent}

      {/* Action Sheets personnalisés */}
      <CustomActionSheet
        visible={alertChannelsVisible}
        title="Canaux d’alerte"
        message="Choisissez comment recevoir les alertes"
        options={alertChannelOptions}
        selectedValue={channels.includes('sms') ? (channels.includes('push') ? 'push_sms' : 'sms') : 'push'}
        onSelect={handleSelectAlertChannel}
        onClose={() => setAlertChannelsVisible(false)}
        type="warning"
      />

      <CustomActionSheet
        visible={alertTimingVisible}
        title="Timing des alertes"
        message="Quand être alerté avant votre tour"
        options={alertTimingOptions}
        selectedValue={marginMinutes}
        onSelect={handleSelectAlertTiming}
        onClose={() => setAlertTimingVisible(false)}
        type="info"
      />

      <CustomActionSheet
        visible={transportModeVisible}
        title="Mode de transport"
        message="Pour le calcul du temps de trajet"
        options={transportModeOptions}
        selectedValue={preferredTransportMode}
        onSelect={handleSelectTransportMode}
        onClose={() => setTransportModeVisible(false)}
        type="info"
      />
    </ScrollView>
  );
};

export default ProfileScreen;
