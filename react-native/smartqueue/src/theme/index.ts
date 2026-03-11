import Colors, { getColor, StatusColors, Gradients } from './colors';
import Typography, { getTextStyle, createTextStyle } from './typography';
import Spacing, { 
  createPaddingStyle, 
  createMarginStyle, 
  createSpacingStyle,
  horizontalSpacing,
  verticalSpacing 
} from './spacing';

// Theme principal export
export const Theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  
  // Helper functions
  getColor,
  getTextStyle,
  createTextStyle,
  createPaddingStyle,
  createMarginStyle,
  createSpacingStyle,
  horizontalSpacing,
  verticalSpacing,
  
  // Semantic colors
  statusColors: StatusColors,
  gradients: Gradients,
  
  // Component-specific themes
  components: {
    // Button theme
    button: {
      primary: {
        backgroundColor: Colors.primary,
        color: '#FFFFFF',
        borderRadius: 25,
        paddingHorizontal: 24,
        paddingVertical: 12,
        ...Typography.textStyles.button,
      },
      secondary: {
        backgroundColor: Colors.surface,
        color: Colors.primary,
        borderRadius: 25,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: Colors.primary,
        ...Typography.textStyles.button,
      },
      danger: {
        backgroundColor: Colors.danger,
        color: '#FFFFFF',
        borderRadius: 25,
        paddingHorizontal: 24,
        paddingVertical: 12,
        ...Typography.textStyles.button,
      },
      ghost: {
        backgroundColor: 'transparent',
        color: Colors.primary,
        borderRadius: 25,
        paddingHorizontal: 24,
        paddingVertical: 12,
        ...Typography.textStyles.button,
      },
    },
    
    // Card theme
    card: {
      default: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: Spacing.lg,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
      },
      elevated: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: Spacing.lg,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 4,
      },
      outlined: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
      },
    },
    
    // Input theme
    input: {
      default: {
        backgroundColor: Colors.inputBackground,
        borderRadius: 12,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.inputBorder,
        ...Typography.textStyles.body,
      },
      focused: {
        backgroundColor: Colors.inputBackground,
        borderRadius: 12,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderWidth: 2,
        borderColor: Colors.inputBorderFocused,
        ...Typography.textStyles.body,
      },
      error: {
        backgroundColor: Colors.inputBackground,
        borderRadius: 12,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderWidth: 2,
        borderColor: Colors.danger,
        ...Typography.textStyles.body,
      },
    },
    
    // Badge theme
    badge: {
      primary: {
        backgroundColor: Colors.primary,
        color: '#FFFFFF',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: 8,
        ...Typography.textStyles.badge,
      },
      low: {
        backgroundColor: Colors.crowdLow,
        color: '#FFFFFF',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: 8,
        ...Typography.textStyles.badge,
      },
      moderate: {
        backgroundColor: Colors.crowdModerate,
        color: '#FFFFFF',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: 8,
        ...Typography.textStyles.badge,
      },
      high: {
        backgroundColor: Colors.crowdBusy,
        color: '#FFFFFF',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: 8,
        ...Typography.textStyles.badge,
      },
      success: {
        backgroundColor: Colors.success,
        color: '#FFFFFF',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: 8,
        ...Typography.textStyles.badge,
      },
      warning: {
        backgroundColor: Colors.warning,
        color: '#FFFFFF',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: 8,
        ...Typography.textStyles.badge,
      },
      danger: {
        backgroundColor: Colors.danger,
        color: '#FFFFFF',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: 8,
        ...Typography.textStyles.badge,
      },
    },
    
    // Tab bar theme
    tabBar: {
      active: {
        color: Colors.tabActive,
        ...Typography.textStyles.tabBar,
      },
      inactive: {
        color: Colors.tabInactive,
        ...Typography.textStyles.tabBar,
      },
      background: Colors.tabBackground,
      height: 83,
      paddingBottom: 34,
      paddingTop: 8,
    },
    
    // Navigation theme
    navigation: {
      title: {
        color: Colors.textPrimary,
        ...Typography.textStyles.navigationTitle,
      },
      background: Colors.navigationBackground,
      borderBottomColor: Colors.navigationBorder,
      borderBottomWidth: 0.5,
      height: 44,
    },
    
    // List theme
    list: {
      item: {
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        minHeight: 44,
        borderBottomColor: Colors.separator,
        borderBottomWidth: 0.5,
      },
      section: {
        backgroundColor: Colors.background,
        paddingTop: Spacing.xxl,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
      },
    },
    
    // Modal theme
    modal: {
      background: Colors.surface,
      borderRadius: 16,
      padding: Spacing.xxl,
      shadowColor: Colors.shadowDark,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  
  // Dark mode theme
  dark: {
    colors: Colors.dark,
    components: {
      button: {
        primary: {
          backgroundColor: Colors.primary,
          color: '#FFFFFF',
          borderRadius: 25,
          paddingHorizontal: 24,
          paddingVertical: 12,
          ...Typography.textStyles.button,
        },
        secondary: {
          backgroundColor: Colors.dark.surfaceSecondary,
          color: Colors.primary,
          borderRadius: 25,
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: Colors.primary,
          ...Typography.textStyles.button,
        },
      },
      card: {
        default: {
          backgroundColor: Colors.dark.surface,
          borderRadius: 12,
          padding: Spacing.lg,
          shadowColor: Colors.dark.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 2,
        },
      },
      input: {
        default: {
          backgroundColor: Colors.dark.inputBackground,
          borderRadius: 12,
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.md,
          borderWidth: 1,
          borderColor: Colors.dark.inputBorder,
          color: Colors.dark.textPrimary,
          ...Typography.textStyles.body,
        },
      },
    },
  },
};

// Export default theme
export default Theme;

// Export individual modules
export {
  Colors,
  Typography,
  Spacing,
  getColor,
  getTextStyle,
  createTextStyle,
  StatusColors,
  Gradients,
};
