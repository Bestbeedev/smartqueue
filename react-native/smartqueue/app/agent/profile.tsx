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
import { useAuth } from '../../src/store/authStore';
import { useSettings } from '../../src/store/settingsStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCustomAlert } from '../../src/hooks/useCustomAlert';
import { useTheme } from '../../src/hooks/useTheme';

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

export default function AgentProfileScreen() {
  const { user, logout } = useAuth();
  const { 
    isDarkMode, 
    setDarkMode,
    preferences,
    updatePreferences,
    loadPreferences 
  } = useSettings();
  const { colors } = useTheme();
  const { AlertComponent, showWarning } = useCustomAlert();
  
  const [avatarUri] = useState<string | null>(null);

  // Charger les préférences au montage
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);
  
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

  // Navigation vers infos personnelles
  const navigateToPersonalInfo = () => {
    router.push('/personal-info');
  };

  // Navigation vers aide
  const navigateToHelp = () => {
    router.push('/help-support');
  };

  // Navigation vers à propos
  const navigateToAbout = () => {
    router.push('/about');
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
          onPress: navigateToPersonalInfo,
        },
        {
          id: 'role',
          title: 'Rôle',
          subtitle: user?.role === 'admin' ? 'Administrateur' : 'Agent',
          icon: 'shield-outline',
          iconBg: 'bg-green-100',
          onPress: () => {},
        },
      ] as MenuItem[],
    },
    {
      title: 'Services assignés',
      items: [
        {
          id: 'services',
          title: 'Mes services',
          subtitle: `${((user as any)?.services || []).length} service(s) assigné(s)`,
          icon: 'layers-outline',
          iconBg: 'bg-orange-100',
          onPress: () => router.push('/agent'),
        },
        {
          id: 'counters',
          title: 'Mes guichets',
          subtitle: `${((user as any)?.counters || []).length} guichet(s) assigné(s)`,
          icon: 'desktop-outline',
          iconBg: 'bg-purple-100',
          onPress: () => router.push('/agent'),
        },
      ] as MenuItem[],
    },
    {
      title: 'Préférences de l\'application',
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
          onPress: navigateToHelp,
        },
        {
          id: 'about',
          title: 'À propos de SmartQueue',
          icon: 'information-circle-outline',
          iconBg: 'bg-gray-100',
          onPress: navigateToAbout,
        },
      ] as MenuItem[],
    },
  ];

  // Formater la date d'inscription
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
      style={styles.menuItem}
      onPress={item.onPress}
      disabled={item.toggle || item.id === 'role'}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: item.iconBg.replace('bg-', '').replace('100', '50') }]}>
          <Ionicons name={item.icon} size={22} color={item.destructive ? '#EF4444' : getIconColor(item.iconBg)} />
        </View>
        <View style={styles.menuItemText}>
          <Text style={[styles.menuItemTitle, { color: colors.textPrimary }, item.destructive && { color: colors.danger }]}>{item.title}</Text>
          {item.subtitle && <Text style={[styles.menuItemSubtitle, { color: colors.textTertiary }]}>{item.subtitle}</Text>}
        </View>
      </View>
      
      {item.toggle ? (
        <Switch
          value={item.toggleValue}
          onValueChange={item.onToggle}
          trackColor={{ false: colors.borderSecondary, true: colors.primary }}
          thumbColor={Platform.OS === 'ios' ? undefined : colors.surface}
        />
      ) : item.id === 'role' ? (
        <View style={[styles.roleBadge, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.roleText, { color: colors.primary }]}>
            {user?.role === 'admin' ? 'Admin' : 'Agent'}
          </Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={20} color={colors.textQuaternary} />
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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Elegant Gradient Header */}
      <LinearGradient
        colors={isDarkMode ? ['#0F172A', '#1E3A5F', '#1E40AF'] : ['#1E40AF', '#3B82F6', '#60A5FA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          {/* Badge Agent/Admin */}
          <View style={[styles.agentBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
            <Text style={styles.agentBadgeText}>
              {user?.role === 'admin' ? 'Administrateur' : 'Agent'}
            </Text>
          </View>

          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarContainer, { backgroundColor: colors.surface }]}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {(user?.name || 'A').charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <TouchableOpacity style={[styles.cameraButton, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {/* User Info */}
          <Text style={[styles.userName, { color: '#FFFFFF' }]}>{user?.name || 'Agent Profile'}</Text>
          <Text style={[styles.userEmail, { color: 'rgba(255,255,255,0.85)' }]}>{user?.email || 'agent@example.com'}</Text>
          
          {/* Member Badge */}
          <View style={styles.memberBadge}>
            <Ionicons name="calendar-outline" size={12} color="#FFFFFF" />
            <Text style={[styles.memberText, { color: '#FFFFFF' }]}>Member since {getMemberSince()}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Menu Sections */}
      <View style={[styles.menuContainer, { backgroundColor: colors.background }]}>
        {menuSections.map((section, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>{section.title}</Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
              {section.items.map((item, itemIdx) => (
                <View key={item.id}>
                  {renderItem(item)}
                  {itemIdx < section.items.length - 1 && <View style={[styles.divider, { backgroundColor: colors.separator }]} />}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Bouton déconnexion */}
        <TouchableOpacity 
          style={[styles.logoutButton, { shadowColor: colors.danger }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.danger + '40', colors.danger + '40']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.logoutGradient}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.danger} />
            <Text style={[styles.logoutText, { color: colors.danger }]}>Déconnexion</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: colors.textQuaternary }]}>SmartQueue Agent v1.0.0 • Built with Love</Text>
      </View>
      {AlertComponent}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingTop: 60,
    paddingBottom: 30,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    alignItems: 'center',
  },
  agentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  agentBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
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
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  userEmail: {
    fontSize: 15,
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
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 0.5,
    borderWidth: 1,
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
    marginBottom: 3,
  },
  menuItemSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    marginLeft: 60,
  },
  logoutButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 8,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 0,
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
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 100,
  },
});
