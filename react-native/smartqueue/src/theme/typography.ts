import { Platform, TextStyle } from 'react-native';

// Typography System - iOS Style
export const Typography = {
  // iOS Font Weights
  fontWeight: {
    ultralight: Platform.OS === 'ios' ? '100' : '200',
    thin: Platform.OS === 'ios' ? '200' : '300',
    light: Platform.OS === 'ios' ? '300' : '400',
    regular: Platform.OS === 'ios' ? '400' : '400',
    medium: Platform.OS === 'ios' ? '500' : '500',
    semibold: Platform.OS === 'ios' ? '600' : '600',
    bold: Platform.OS === 'ios' ? '700' : '700',
    heavy: Platform.OS === 'ios' ? '800' : '800',
    black: Platform.OS === 'ios' ? '900' : '900',
  },

  // iOS Font Families
  fontFamily: {
    system: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
    systemRegular: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
    mono: Platform.OS === 'ios' ? 'SF Mono' : 'monospace',
  },

  // iOS Text Styles - basés sur les guidelines Apple
  textStyles: {
    // Large Title - iOS Large Title
    largeTitle: {
      fontSize: 34,
      fontWeight: 700 as const,
      fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
      lineHeight: 41,
      letterSpacing: 0.37,
    },

    // Title 1 - iOS Title 1
    title1: {
      fontSize: 28,
      fontWeight: 700 as const,
      fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
      lineHeight: 34,
      letterSpacing: 0.36,
    },

    // Title 2 - iOS Title 2
    title2: {
      fontSize: 22,
      fontWeight: 700 as const,
      fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
      lineHeight: 28,
      letterSpacing: 0.35,
    },

    // Title 3 - iOS Title 3
    title3: {
      fontSize: 20,
      fontWeight: 600 as const,
      fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
      lineHeight: 25,
      letterSpacing: 0.38,
    },

    // Headline - iOS Headline
    headline: {
      fontSize: 17,
      fontWeight: 600 as const,
      fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
      lineHeight: 22,
      letterSpacing: -0.43,
    },

    // Body - iOS Body
    body: {
      fontSize: 17,
      fontWeight: 400 as const,
      fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
      lineHeight: 22,
      letterSpacing: -0.43,
    },

    // Callout - iOS Callout
    callout: {
      fontSize: 16,
      fontWeight: 400 as const,
      fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
      lineHeight: 21,
      letterSpacing: -0.32,
    },

    // Subhead - iOS Subhead
    subhead: {
      fontSize: 15,
      fontWeight: 400 as const,
      fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
      lineHeight: 20,
      letterSpacing: -0.24,
    },

    // Footnote - iOS Footnote
    footnote: {
      fontSize: 13,
      fontWeight: 400 as const,
      fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
      lineHeight: 18,
      letterSpacing: -0.08,
    },

    // Caption 1 - iOS Caption 1
    caption1: {
      fontSize: 12,
      fontWeight: 400 as const,
      fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
      lineHeight: 16,
      letterSpacing: 0,
    },

    // Caption 2 - iOS Caption 2
    caption2: {
      fontSize: 11,
      fontWeight: 400 as const,
      fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
      lineHeight: 13,
      letterSpacing: 0.07,
    },

    // Custom styles pour VQS
    button: {
      fontSize: 17,
      fontWeight: 600 as const,
      fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
      lineHeight: 22,
      letterSpacing: -0.43,
    },

    // Badge text
    badge: {
      fontSize: 11,
      fontWeight: 600 as const,
      fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
      lineHeight: 13,
      letterSpacing: 0.07,
    },

    // Tab bar text
    tabBar: {
      fontSize: 10,
      fontWeight: 500 as const,
      fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
      lineHeight: 12,
      letterSpacing: 0.5,
    },

    // Navigation title
    navigationTitle: {
      fontSize: 17,
      fontWeight: 600 as const,
      fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
      lineHeight: 22,
      letterSpacing: -0.43,
    },

    // Search input
    searchInput: {
      fontSize: 17,
      fontWeight: 400 as const,
      fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
      lineHeight: 22,
      letterSpacing: -0.43,
    },

    // Placeholder text
    placeholder: {
      fontSize: 17,
      fontWeight: 400 as const,
      fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
      lineHeight: 22,
      letterSpacing: -0.43,
    },

    // Error text
    error: {
      fontSize: 13,
      fontWeight: 400 as const,
      fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
      lineHeight: 18,
      letterSpacing: -0.08,
    },

    // Success text
    success: {
      fontSize: 13,
      fontWeight: 400 as const,
      fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
      lineHeight: 18,
      letterSpacing: -0.08,
    },
  },
};

// Helper function pour obtenir un style de texte
export const getTextStyle = (styleName: keyof typeof Typography.textStyles) => {
  return Typography.textStyles[styleName];
};

// Helper function pour créer un style de texte personnalisé
export const createTextStyle = (
  baseStyle: keyof typeof Typography.textStyles,
  overrides: Partial<TextStyle> = {}
) => {
  return {
    ...Typography.textStyles[baseStyle],
    ...overrides,
  };
};

export default Typography;
