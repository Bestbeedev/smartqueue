import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTicket } from '../../store/ticketStore';
import { Theme } from '../../theme';
import { TabParamList } from '../../navigation/types';
import { useThemeColors } from '../../hooks/useThemeColors';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import ProgressCircle from '../../components/ui/ProgressCircle';
import Button from '../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';

type TicketsNavigationProp = NativeStackNavigationProp<TabParamList, 'Tickets'>;

// Composant TicketsScreen
export const TicketsScreen: React.FC = () => {
  const navigation = useNavigation<TicketsNavigationProp>();
  const colors = useThemeColors();
  const {
    hasActiveTicket,
    activeTicket,
    position,
    etaMinutes,
    isAlmostThere,
    isCalled,
    error,
    refreshActiveTicket,
    cancelTicket,
  } = useTicket();
  
  const [refreshing, setRefreshing] = useState(false);

  // Rafraîchir les données
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshActiveTicket();
    } catch (error) {
      console.error('Error refreshing ticket:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Annuler le ticket actif
  const handleCancelTicket = () => {
    if (!activeTicket) return;

    Alert.alert(
      'Annuler le ticket',
      'Êtes-vous sûr de vouloir annuler votre ticket ? Vous perdrez votre place dans la file.',
      [
        {
          text: 'Non',
          style: 'cancel',
        },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelTicket(activeTicket.id);
            } catch (error) {
              console.error('Error canceling ticket:', error);
              Alert.alert('Erreur', 'Impossible d\'annuler le ticket. Veuillez réessayer.');
            }
          },
        },
      ]
    );
  };

  // Navigation vers les différentes fonctionnalités
  const handleScanQR = () => {
    navigation.navigate('ScanScreen' as any);
  };

  const handleViewLiveTicket = () => {
    if (!activeTicket) return;
    navigation.navigate('LiveTicket' as any, {
      ticketId: activeTicket.id,
    });
  };

  const handleViewHistory = () => {
    navigation.navigate('history' as any);
  };

  // Rendu du ticket actif
  const renderActiveTicket = () => {
    if (!hasActiveTicket) {
      return (
        <Card variant="default" style={styles.noTicketCard}>
          <View style={styles.noTicketContent}>
            <Ionicons
              name="ticket-outline"
              size={64}
              color={colors.textTertiary}
            />
            <Text style={[styles.noTicketTitle, { color: colors.textPrimary }]}>
              Aucun ticket actif
            </Text>
            <Text style={[styles.noTicketSubtitle, { color: colors.textSecondary }]}>
              Scannez un QR code ou rejoignez une file pour obtenir un ticket
            </Text>
            <Button
              title="Scanner un QR code"
              onPress={handleScanQR}
              variant="primary"
              icon={<Ionicons name="qr-code-outline" size={20} color="#FFFFFF" />}
              style={styles.scanButton}
            />
          </View>
        </Card>
      );
    }

    return (
      <Card variant="elevated" style={styles.activeTicketCard}>
        {/* Header du ticket */}
        <View style={styles.ticketHeader}>
          <View style={styles.ticketHeaderLeft}>
            <Text style={[styles.ticketTitle, { color: colors.textPrimary }]}>
              Ticket Actif
            </Text>
            {isCalled && (
              <Badge variant="success" size="small">
                APPELÉ
              </Badge>
            )}
            {isAlmostThere && !isCalled && (
              <Badge variant="warning" size="small">
                BIENTÔT VOTRE TOUR
              </Badge>
            )}
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <Ionicons
              name="refresh-outline"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Contenu principal du ticket */}
        <View style={styles.ticketContent}>
          {/* Cercle de progression */}
          <View style={styles.progressContainer}>
            <ProgressCircle
              progress={position > 0 ? Math.max(0, (1 - position / 10) * 100) : 100}
              size={150}
              strokeWidth={12}
              showText={true}
              text={position.toString()}
              textColor={isCalled ? colors.success : colors.textPrimary}
              progressColor={isCalled ? colors.success : colors.primary}
              animated={true}
            />
            <Text style={[styles.positionLabel, { color: colors.textSecondary }]}>
              {isCalled ? 'Appelé' : `${position}ème dans la file`}
            </Text>
          </View>

          {/* Informations du ticket */}
          <View style={styles.ticketInfo}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Numéro
              </Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {activeTicket?.number}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Service
              </Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {activeTicket?.service?.name || 'Service'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Établissement
              </Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {activeTicket?.establishment?.name || 'Établissement'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Temps estimé
              </Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {etaMinutes} min
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.ticketActions}>
          <Button
            title="Voir le ticket en direct"
            onPress={handleViewLiveTicket}
            variant="primary"
            fullWidth
            icon={<Ionicons name="eye-outline" size={20} color="#FFFFFF" />}
            style={styles.actionButton}
          />
          <Button
            title="Annuler le ticket"
            onPress={handleCancelTicket}
            variant="danger"
            fullWidth
            icon={<Ionicons name="close-outline" size={20} color="#FFFFFF" />}
            style={styles.actionButton}
          />
        </View>
      </Card>
    );
  };

  // Rendu des actions rapides
  const renderQuickActions = () => {
    const actions = [
      {
        id: 'scan',
        title: 'Scanner QR',
        subtitle: 'Rejoindre une file rapidement',
        icon: <Ionicons name="qr-code-outline" size={24} color={colors.primary} />,
        onPress: handleScanQR,
        color: colors.primary,
      },
      {
        id: 'history',
        title: 'Historique',
        subtitle: 'Vos tickets précédents',
        icon: <Ionicons name="time-outline" size={24} color={colors.secondary} />,
        onPress: handleViewHistory,
        color: colors.secondary,
      },
      {
        id: 'map',
        title: 'Carte',
        subtitle: 'Établissements proches',
        icon: <Ionicons name="map-outline" size={24} color={colors.success} />,
        onPress: () => navigation.navigate('Explore' as any),
        color: colors.success,
      },
    ];

    return (
      <Card variant="default" style={styles.quickActionsCard}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Actions rapides
        </Text>
        <View style={styles.actionsGrid}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[styles.actionCard, { backgroundColor: action.color + '10' }]}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                {action.icon}
              </View>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
                {action.title}
              </Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                {action.subtitle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>
    );
  };

  // Rendu des statistiques
  const renderStats = () => {
    if (!hasActiveTicket) return null;

    return (
      <Card variant="default" style={styles.statsCard}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Statistiques en direct
        </Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {position}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Position
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.warning }]}>
              {etaMinutes}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Minutes
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {Math.max(0, position - 1)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Personnes avant
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <ScrollView 
      className="flex-1" 
      style={{ backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View className="px-5 pt-12 pb-4 flex-row items-center justify-between bg-white shadow-sm">
        <TouchableOpacity 
          className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Ma File d&apos;Attente</Text>
        <TouchableOpacity className="w-10 h-10 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {error ? (
        <View className="flex-1 items-center justify-center p-10 mt-20">
          <Ionicons name="alert-circle-outline" size={80} color={colors.danger} />
          <Text style={[styles.noTicketTitle, { color: colors.textPrimary, textAlign: 'center' }]}>
            Oups ! Une erreur est survenue
          </Text>
          <Text style={[styles.noTicketSubtitle, { color: colors.textSecondary }]}>
            {error.includes('401') ? 'Votre session a expiré. Veuillez vous reconnecter.' : error}
          </Text>
          <Button
            title="Réessayer"
            variant="primary"
            onPress={handleRefresh}
            style={styles.scanButton}
          />
        </View>
      ) : (
        <View style={styles.content}>
          {renderActiveTicket()}
          {renderStats()}
          {renderQuickActions()}
          
          <View style={styles.bottomSpace} />
        </View>
      )}
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Theme.spacing.lg,
  },
  activeTicketCard: {
    marginBottom: Theme.spacing.lg,
  },
  noTicketCard: {
    marginBottom: Theme.spacing.lg,
  },
  noTicketContent: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xxxl,
  },
  noTicketTitle: {
    fontSize: 34,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
    lineHeight: 41,
    letterSpacing: 0.37,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
  },
  noTicketSubtitle: {
    fontSize: 17,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
    lineHeight: 22,
    letterSpacing: -0.43,
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.lg,
  },
  scanButton: {
    paddingHorizontal: Theme.spacing.xl,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  ticketHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
    lineHeight: 22,
    letterSpacing: -0.43,
    marginRight: Theme.spacing.sm,
  },
  refreshButton: {
    padding: Theme.spacing.sm,
  },
  ticketContent: {
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  positionLabel: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
    lineHeight: 21,
    letterSpacing: -0.32,
    marginTop: Theme.spacing.sm,
  },
  ticketInfo: {
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: Theme.colors.separator,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
    lineHeight: 21,
    letterSpacing: -0.32,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
    lineHeight: 21,
    letterSpacing: -0.32,
  },
  ticketActions: {
    gap: Theme.spacing.md,
  },
  actionButton: {
    marginBottom: Theme.spacing.sm,
  },
  quickActionsCard: {
    marginBottom: Theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
    lineHeight: 22,
    letterSpacing: -0.43,
    marginBottom: Theme.spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  actionCard: {
    flex: 1,
    padding: Theme.spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
    lineHeight: 21,
    letterSpacing: -0.32,
    textAlign: 'center',
    marginBottom: Theme.spacing.xs,
  },
  actionSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
    lineHeight: 18,
    letterSpacing: -0.08,
    textAlign: 'center',
  },
  statsCard: {
    marginBottom: Theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
    lineHeight: 34,
    letterSpacing: 0.36,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
    lineHeight: 18,
    letterSpacing: -0.08,
    marginTop: Theme.spacing.xs,
  },
  bottomSpace: {
    height: Theme.spacing.xxl,
  },
});

export default TicketsScreen;
