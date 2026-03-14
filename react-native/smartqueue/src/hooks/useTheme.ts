import { useSettings } from '../store/settingsStore';
import Colors from '../theme/colors';

/**
 * Hook personnalisé pour accéder au thème dynamique (light/dark mode)
 * Utilise isDarkMode du settingsStore et retourne les couleurs appropriées
 */
export const useTheme = () => {
  const { isDarkMode } = useSettings();

  // Retourne les couleurs selon le mode
  const themeColors = {
    // Backgrounds
    background: isDarkMode ? Colors.dark.background : Colors.background,
    surface: isDarkMode ? Colors.dark.surface : Colors.surface,
    surfaceSecondary: isDarkMode ? Colors.dark.surfaceSecondary : Colors.surfaceSecondary,
    surfaceTertiary: isDarkMode ? Colors.dark.surfaceTertiary : Colors.surfaceTertiary,

    // Text
    textPrimary: isDarkMode ? Colors.dark.textPrimary : Colors.textPrimary,
    textSecondary: isDarkMode ? Colors.dark.textSecondary : Colors.textSecondary,
    textTertiary: isDarkMode ? Colors.dark.textTertiary : Colors.textTertiary,
    textQuaternary: isDarkMode ? Colors.dark.textQuaternary : Colors.textQuaternary,

    // Borders & Separators
    separator: isDarkMode ? Colors.dark.separator : Colors.separator,
    border: isDarkMode ? Colors.dark.border : Colors.border,
    borderSecondary: isDarkMode ? Colors.dark.borderSecondary : Colors.borderSecondary,

    // Inputs
    inputBackground: isDarkMode ? Colors.dark.inputBackground : Colors.inputBackground,
    inputBorder: isDarkMode ? Colors.dark.inputBorder : Colors.inputBorder,

    // Navigation & TabBar
    tabBackground: isDarkMode ? Colors.dark.tabBackground : Colors.tabBackground,
    navigationBackground: isDarkMode ? Colors.dark.navigationBackground : Colors.navigationBackground,

    // Shadows
    shadow: isDarkMode ? Colors.dark.shadow : Colors.shadow,

    // Couleurs primaires (inchangées)
    primary: Colors.primary,
    secondary: Colors.secondary,
    accent: Colors.accent,
    success: Colors.success,
    warning: Colors.warning,
    danger: Colors.danger,
    info: Colors.info,

    // Status
    statusOpen: Colors.statusOpen,
    statusClosed: Colors.statusClosed,
    statusBusy: Colors.statusBusy,
    crowdLow: Colors.crowdLow,
    crowdModerate: Colors.crowdModerate,
    crowdBusy: Colors.crowdBusy,
  };

  // Styles communs pour les écrans
  const screenStyles = {
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    scrollView: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    card: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      shadowColor: themeColors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.3 : 0.08,
      shadowRadius: 8,
      elevation: isDarkMode ? 4 : 2,
    },
    header: {
      backgroundColor: themeColors.surface,
      borderBottomColor: themeColors.separator,
      borderBottomWidth: 0.5,
    },
    input: {
      backgroundColor: themeColors.inputBackground,
      borderColor: themeColors.inputBorder,
      color: themeColors.textPrimary,
    },
  };

  // Helper pour créer des styles de texte
  const textStyle = (variant: 'title' | 'subtitle' | 'body' | 'caption' | 'button' = 'body') => {
    const baseStyle = {
      color: themeColors.textPrimary,
    };

    switch (variant) {
      case 'title':
        return { ...baseStyle, fontSize: 28, fontWeight: '700' as const };
      case 'subtitle':
        return { ...baseStyle, fontSize: 20, fontWeight: '600' as const, color: themeColors.textSecondary };
      case 'body':
        return { ...baseStyle, fontSize: 16, fontWeight: '400' as const };
      case 'caption':
        return { ...baseStyle, fontSize: 14, fontWeight: '400' as const, color: themeColors.textTertiary };
      case 'button':
        return { ...baseStyle, fontSize: 16, fontWeight: '600' as const };
      default:
        return baseStyle;
    }
  };

  return {
    isDarkMode,
    colors: themeColors,
    screenStyles,
    textStyle,
  };
};

export default useTheme;
