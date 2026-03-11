import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Theme } from '../../theme';

// Types pour les badges
export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'low' | 'moderate' | 'high' | 'success' | 'warning' | 'danger' | 'primary';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

// Composant Badge avec style iOS
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
}) => {
  // Obtenir les couleurs selon la variante
  const getBadgeStyle = () => {
    return Theme.components.badge[variant] || Theme.components.badge.primary;
  };

  // Obtenir la taille du badge
  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: Theme.spacing.xs,
          paddingVertical: Theme.spacing.xs / 2,
          borderRadius: 6,
        };
      case 'large':
        return {
          paddingHorizontal: Theme.spacing.md,
          paddingVertical: Theme.spacing.sm,
          borderRadius: 10,
        };
      default: // medium
        return {
          paddingHorizontal: Theme.spacing.sm,
          paddingVertical: Theme.spacing.xs,
          borderRadius: 8,
        };
    }
  };

  // Obtenir le style du texte selon la taille
  const getTextSizeStyle = (): TextStyle => {
    switch (size) {
      case 'small':
        return Theme.typography.textStyles.caption2;
      case 'large':
        return Theme.typography.textStyles.footnote;
      default: // medium
        return Theme.typography.textStyles.badge;
    }
  };

  // Style du conteneur
  const containerStyle: ViewStyle = {
    ...getBadgeStyle(),
    ...getSizeStyle(),
    alignSelf: 'flex-start',
    ...style,
  };

  // Style du texte
  const containerTextStyle: TextStyle = {
    ...getTextSizeStyle(),
    color: getBadgeStyle().color || '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    ...textStyle,
  };

  return (
    <View style={containerStyle}>
      <Text style={containerTextStyle}>{children}</Text>
    </View>
  );
};

// Types pour les badges de notification
export interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  showZero?: boolean;
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
}

// Composant Badge pour les notifications (badge circulaire avec nombre)
export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  maxCount = 99,
  showZero = false,
  style,
  size = 'medium',
}) => {
  // Ne pas afficher si count = 0 et showZero = false
  if (count === 0 && !showZero) {
    return null;
  }

  // Formater le nombre affiché
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  // Obtenir la taille du badge
  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'small':
        return {
          width: 16,
          height: 16,
          borderRadius: 8,
          minWidth: 16,
        };
      case 'large':
        return {
          width: 28,
          height: 28,
          borderRadius: 14,
          minWidth: 28,
        };
      default: // medium
        return {
          width: 20,
          height: 20,
          borderRadius: 10,
          minWidth: 20,
        };
    }
  };

  // Obtenir la taille du texte
  const getTextSizeStyle = (): TextStyle => {
    switch (size) {
      case 'small':
        return {
          fontSize: 8,
          fontWeight: '600',
        };
      case 'large':
        return {
          fontSize: 12,
          fontWeight: '600',
        };
      default: // medium
        return {
          fontSize: 10,
          fontWeight: '600',
        };
    }
  };

  const containerStyle: ViewStyle = {
    ...getSizeStyle(),
    backgroundColor: Theme.colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -4,
    right: -4,
    zIndex: 1,
    ...style,
  };

  const textStyle: TextStyle = {
    ...getTextSizeStyle(),
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: (getTextSizeStyle().fontSize || 10) + 2,
  };

  return (
    <View style={containerStyle}>
      <Text style={textStyle}>{displayCount}</Text>
    </View>
  );
};

// Types pour les badges de statut (avec icône)
export interface StatusBadgeProps {
  status: 'online' | 'offline' | 'busy' | 'away';
  showText?: boolean;
  text?: string;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

// Composant Badge pour les statuts (point coloré + texte optionnel)
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showText = false,
  text,
  size = 'medium',
  style,
}) => {
  // Obtenir la couleur selon le statut
  const getStatusColor = (): string => {
    switch (status) {
      case 'online':
        return Theme.colors.success;
      case 'offline':
        return Theme.colors.textTertiary;
      case 'busy':
        return Theme.colors.danger;
      case 'away':
        return Theme.colors.warning;
      default:
        return Theme.colors.textTertiary;
    }
  };

  // Obtenir la taille du point
  const getDotSize = (): ViewStyle => {
    switch (size) {
      case 'small':
        return {
          width: 6,
          height: 6,
          borderRadius: 3,
        };
      case 'large':
        return {
          width: 12,
          height: 12,
          borderRadius: 6,
        };
      default: // medium
        return {
          width: 8,
          height: 8,
          borderRadius: 4,
        };
    }
  };

  // Obtenir le texte du statut
  const getStatusText = (): string => {
    if (text) return text;
    
    switch (status) {
      case 'online':
        return 'En ligne';
      case 'offline':
        return 'Hors ligne';
      case 'busy':
        return 'Occupé';
      case 'away':
        return 'Absent';
      default:
        return 'Inconnu';
    }
  };

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    ...style,
  };

  const dotStyle: ViewStyle = {
    ...getDotSize(),
    backgroundColor: getStatusColor(),
    marginRight: showText ? Theme.spacing.xs : 0,
  };

  const textStyle = {
    ...Theme.typography.textStyles.caption1,
    color: Theme.colors.textSecondary,
  };

  return (
    <View style={containerStyle}>
      <View style={dotStyle} />
      {showText && (
        <Text style={textStyle}>{getStatusText()}</Text>
      )}
    </View>
  );
};

export default Badge;
