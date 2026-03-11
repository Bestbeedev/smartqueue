import React, { useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Platform,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { useSettings } from '../../store/settingsStore';
import { Theme } from '../../theme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Types pour le bottom sheet
export interface BottomSheetProps {
  children: React.ReactNode;
  isVisible: boolean;
  onClose: () => void;
  snapPoints?: (string | number)[];
  enablePanDownToClose?: boolean;
  backdropOpacity?: number;
  style?: any;
  headerComponent?: React.ReactNode;
  footerComponent?: React.ReactNode;
}

// Composant BottomSheet avec style iOS
export const CustomBottomSheet: React.FC<BottomSheetProps> = ({
  children,
  isVisible,
  onClose,
  snapPoints = ['25%', '50%', '90%'],
  enablePanDownToClose = true,
  backdropOpacity = 0.4,
  style,
  headerComponent,
  footerComponent,
}) => {
  const { isDarkMode } = useSettings();
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Gérer l'ouverture/fermeture du bottom sheet
  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  // Ouvrir le bottom sheet quand isVisible change
  React.useEffect(() => {
    if (isVisible && bottomSheetRef.current) {
      bottomSheetRef.current.snapToIndex(0);
    } else if (!isVisible && bottomSheetRef.current) {
      bottomSheetRef.current.close();
    }
  }, [isVisible]);

  // Style du fond
  const backgroundStyle = useMemo(() => [
    styles.background,
    {
      backgroundColor: isDarkMode 
        ? Theme.colors.dark.surface 
        : Theme.colors.surface,
    },
    style,
  ], [isDarkMode, style]);

  // Style du handle
  const handleStyle = useMemo(() => [
    styles.handle,
    {
      backgroundColor: isDarkMode 
        ? Theme.colors.dark.textTertiary 
        : Theme.colors.textTertiary,
    },
  ], [isDarkMode]);

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      {isVisible && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
      )}
      
      <BottomSheet
        ref={bottomSheetRef}
        index={isVisible ? 0 : -1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose={enablePanDownToClose}
        backgroundStyle={backgroundStyle}
        handleIndicatorStyle={handleStyle}
        handleStyle={styles.handleContainer}
        containerStyle={styles.container}
      >
        {/* Header optionnel */}
        {headerComponent && (
          <View style={styles.header}>
            {headerComponent}
          </View>
        )}
        
        {/* Contenu principal */}
        <View style={styles.content}>
          {children}
        </View>
        
        {/* Footer optionnel */}
        {footerComponent && (
          <View style={styles.footer}>
            {footerComponent}
          </View>
        )}
      </BottomSheet>
    </GestureHandlerRootView>
  );
};

// Types pour le header du bottom sheet
export interface BottomSheetHeaderProps {
  title?: string;
  subtitle?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
  rightComponent?: React.ReactNode;
}

// Composant Header pour BottomSheet
export const BottomSheetHeader: React.FC<BottomSheetHeaderProps> = ({
  title,
  subtitle,
  showCloseButton = true,
  onClose,
  rightComponent,
}) => {
  const { isDarkMode } = useSettings();

  const textStyle = {
    color: isDarkMode ? Theme.colors.dark.textPrimary : Theme.colors.textPrimary,
  };

  const subtitleStyle = {
    color: isDarkMode ? Theme.colors.dark.textSecondary : Theme.colors.textSecondary,
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        {title && (
          <Text style={[styles.title, textStyle]}>{title}</Text>
        )}
        {subtitle && (
          <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
        )}
      </View>
      
      <View style={styles.headerRight}>
        {rightComponent}
        {showCloseButton && onClose && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.closeButtonText, textStyle]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Types pour les boutons d'action du bottom sheet
export interface BottomSheetActionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
  last?: boolean;
}

// Composant Action pour BottomSheet
export const BottomSheetAction: React.FC<BottomSheetActionProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  destructive = false,
  disabled = false,
  last = false,
}) => {
  const { isDarkMode } = useSettings();

  const containerStyle = [
    styles.actionContainer,
    !last && styles.actionBorder,
    {
      opacity: disabled ? 0.5 : 1,
    },
  ];

  const titleStyle = [
    styles.actionTitle,
    {
      color: destructive 
        ? Theme.colors.danger 
        : isDarkMode 
          ? Theme.colors.dark.textPrimary 
          : Theme.colors.textPrimary,
    },
  ];

  const subtitleStyle = [
    styles.actionSubtitle,
    {
      color: isDarkMode 
        ? Theme.colors.dark.textSecondary 
        : Theme.colors.textSecondary,
    },
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon && (
        <View style={styles.actionIcon}>
          {icon}
        </View>
      )}
      
      <View style={styles.actionContent}>
        <Text style={titleStyle}>{title}</Text>
        {subtitle && (
          <Text style={subtitleStyle}>{subtitle}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Types pour le bottom sheet draggable
export interface DraggableBottomSheetProps {
  children: React.ReactNode;
  initialHeight?: number;
  minHeight?: number;
  maxHeight?: number;
  onHeightChange?: (height: number) => void;
}

// Composant DraggableBottomSheet (alternative simple sans @gorhom/bottom-sheet)
export const DraggableBottomSheet: React.FC<DraggableBottomSheetProps> = ({
  children,
  initialHeight = Dimensions.get('window').height * 0.5,
  minHeight = 100,
  maxHeight = Dimensions.get('window').height * 0.9,
  onHeightChange,
}) => {
  const { isDarkMode } = useSettings();
  const [height, setHeight] = React.useState(initialHeight);

  const handleHeightChange = (newHeight: number) => {
    const clampedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
    setHeight(clampedHeight);
    onHeightChange?.(clampedHeight);
  };

  const containerStyle = [
    styles.draggableContainer,
    {
      height,
      backgroundColor: isDarkMode 
        ? Theme.colors.dark.surface 
        : Theme.colors.surface,
    },
  ];

  return (
    <View style={containerStyle}>
      <View style={styles.dragHandle} />
      <View style={styles.draggableContent}>
        {children}
      </View>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 1,
  },
  container: {
    zIndex: 2,
  },
  background: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  handleContainer: {
    paddingVertical: Theme.spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
  },
  header: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Theme.colors.separator,
  },
  content: {
    flex: 1,
    paddingHorizontal: Theme.spacing.lg,
  },
  footer: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
    borderTopWidth: 0.5,
    borderTopColor: Theme.colors.separator,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    ...Theme.typography.textStyles.headline,
    fontWeight: '600',
  },
  subtitle: {
    ...Theme.typography.textStyles.footnote,
    marginTop: Theme.spacing.xs / 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    padding: Theme.spacing.sm,
    borderRadius: 16,
    backgroundColor: Theme.colors.surfaceSecondary,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
  },
  actionBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: Theme.colors.separator,
  },
  actionIcon: {
    marginRight: Theme.spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    ...Theme.typography.textStyles.body,
    fontWeight: '500',
  },
  actionSubtitle: {
    ...Theme.typography.textStyles.footnote,
    marginTop: Theme.spacing.xs / 2,
  },
  draggableContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.textTertiary,
    alignSelf: 'center',
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  draggableContent: {
    flex: 1,
    paddingHorizontal: Theme.spacing.lg,
  },
});

export default CustomBottomSheet;
