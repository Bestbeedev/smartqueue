import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useThemeColors } from '../../hooks/useThemeColors';

const FeatureItem: React.FC<{ icon: any; title: string; description: string; colors: any }> = ({ icon, title, description, colors }) => (
  <View style={styles.featureItem}>
    <View style={[styles.featureIcon, { backgroundColor: colors.success + '15' }]}>
      <Ionicons name={icon} size={24} color={colors.success} />
    </View>
    <View style={styles.featureContent}>
      <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>{description}</Text>
    </View>
  </View>
);

const StatItem: React.FC<{ value: string; label: string; colors: any }> = ({ value, label, colors }) => (
  <View style={styles.statItem}>
    <Text style={[styles.statValue, { color: colors.success }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
  </View>
);

export const AboutAppScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const isDark = !!colors.dark?.background;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Gradient Header */}
      <LinearGradient
        colors={isDark ? ['#065F46', '#059669', '#10B981'] : [colors.success, '#059669', '#047857']}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.topBar}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.iconButton}
            activeOpacity={0.8}
          >
            <View style={[styles.iconButtonBg, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>À propos</Text>
          <View style={styles.iconButton} />
        </View>

        {/* App Logo Section */}
        <View style={styles.logoSection}>
          <View style={[styles.logoContainer, { backgroundColor: colors.surface }]}>
            <Ionicons name="ticket" size={48} color={colors.success} />
          </View>
          <Text style={[styles.appName, { color: '#FFFFFF' }]}>SmartQueue</Text>
          <Text style={[styles.version, { color: 'rgba(255,255,255,0.8)' }]}>Version 1.0.0</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
          <StatItem value="10K+" label="Utilisateurs" colors={colors} />
          <View style={[styles.statDivider, { backgroundColor: colors.separator }]} />
          <StatItem value="10+" label="Établissements" colors={colors} />
          <View style={[styles.statDivider, { backgroundColor: colors.separator }]} />
          <StatItem value="50K+" label="Tickets générés" colors={colors} />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>Notre mission</Text>
          <Text style={[styles.description, { color: colors.textSecondary, backgroundColor: colors.surface }]}>
            SmartQueue révolutionne la gestion des files d'attente en permettant aux clients de rejoindre une file virtuellement, sans attendre physiquement. Notre solution optimise le temps des clients et améliore l'efficacité des établissements.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>Fonctionnalités</Text>
          <View style={[styles.featuresCard, { backgroundColor: colors.surface }]}>
            <FeatureItem 
              icon="qr-code" 
              title="Scan QR Rapide" 
              description="Rejoignez une file en scannant simplement un QR code"
              colors={colors}
            />
            <FeatureItem 
              icon="time" 
              title="Temps Réel" 
              description="Suivez votre position et le temps d'attente estimé"
              colors={colors}
            />
            <FeatureItem 
              icon="notifications" 
              title="Notifications" 
              description="Recevez des alertes quand c'est votre tour"
              colors={colors}
            />
            <FeatureItem 
              icon="map" 
              title="Carte Interactive" 
              description="Trouvez les établissements proches de vous"
              colors={colors}
            />
          </View>
        </View>

        {/* Legal Links */}
        <View style={[styles.linksCard, { backgroundColor: colors.surface }]}>
          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => Linking.openURL('https://smartqueue.app/terms')}
          >
            <Ionicons name="document-text-outline" size={22} color={colors.textSecondary} />
            <Text style={[styles.linkText, { color: colors.textPrimary }]}>Conditions d'utilisation</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          <View style={[styles.linkDivider, { backgroundColor: colors.separator }]} />
          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => Linking.openURL('https://smartqueue.app/privacy')}
          >
            <Ionicons name="shield-checkmark-outline" size={22} color={colors.textSecondary} />
            <Text style={[styles.linkText, { color: colors.textPrimary }]}>Politique de confidentialité</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Copyright */}
        <Text style={[styles.copyright, { color: colors.textTertiary }]}>
          © 2026 SmartQueue. Tous droits réservés.{'\n'}
          Conçu avec plein d'amour au Bénin
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 44,
    height: 44,
  },
  iconButtonBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
  },
  version: {
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    marginLeft: 4,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featuresCard: {
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
  },
  linksCard: {
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  linkDivider: {
    height: 1,
    marginLeft: 56,
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  copyright: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AboutAppScreen;

