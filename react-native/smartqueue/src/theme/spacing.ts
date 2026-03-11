// Spacing System - iOS Design Guidelines
// Basé sur une grille de 4px pour maintenir la cohérence

export const Spacing = {
  // Base spacing units (4px grid)
  xs: 4,      // 4px - Micro spacing
  sm: 8,      // 8px - Small spacing
  md: 12,     // 12px - Medium spacing
  lg: 16,     // 16px - Large spacing
  xl: 20,     // 20px - Extra large spacing
  xxl: 24,    // 24px - 2x large spacing
  xxxl: 32,   // 32px - 3x large spacing
  huge: 48,   // 48px - Huge spacing
  massive: 64, // 64px - Massive spacing
  
  // iOS-specific spacing values
  padding: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 48,
    massive: 64,
  },
  
  margin: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 48,
    massive: 64,
  },
  
  gap: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 48,
    massive: 64,
  },
  
  // Component-specific spacing
  components: {
    // Button spacing
    button: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      minWidth: 44,
      minHeight: 44,
    },
    
    // Card spacing
    card: {
      padding: 16,
      borderRadius: 12,
      marginHorizontal: 16,
      marginVertical: 8,
    },
    
    // List item spacing
    listItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      minHeight: 44,
    },
    
    // Section spacing
    section: {
      paddingTop: 24,
      paddingBottom: 24,
      paddingHorizontal: 16,
    },
    
    // Header spacing
    header: {
      paddingTop: 16,
      paddingBottom: 16,
      paddingHorizontal: 16,
    },
    
    // Modal spacing
    modal: {
      padding: 24,
      borderRadius: 16,
    },
    
    // Input field spacing
    input: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      marginVertical: 8,
    },
    
    // Tab bar spacing
    tabBar: {
      height: 83, // iOS tab bar height
      paddingBottom: 34, // Bottom safe area
      paddingTop: 8,
    },
    
    // Navigation bar spacing
    navigationBar: {
      height: 44,
      paddingHorizontal: 16,
      paddingTop: 0,
    },
    
    // Status bar spacing
    statusBar: {
      height: 44, // iOS status bar
    },
    
    // Safe area spacing
    safeArea: {
      top: 44,    // Status bar
      bottom: 34, // Home indicator
    },
    
    // Form spacing
    form: {
      fieldSpacing: 16,
      sectionSpacing: 24,
      buttonSpacing: 32,
    },
    
    // Map overlay spacing
    mapOverlay: {
      top: 16,
      bottom: 16,
      left: 16,
      right: 16,
    },
    
    // Badge spacing
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    
    // Icon spacing
    icon: {
      xs: 8,
      sm: 12,
      md: 16,
      lg: 20,
      xl: 24,
    },
    
    // Avatar spacing
    avatar: {
      xs: 24,
      sm: 32,
      md: 40,
      lg: 48,
      xl: 64,
      xxl: 80,
    },
  },
  
  // Screen-specific spacing
  screen: {
    // Safe area insets
    safeArea: {
      top: 44,
      bottom: 34,
      left: 0,
      right: 0,
    },
    
    // Content margins
    content: {
      horizontal: 16,
      vertical: 16,
    },
    
    // Section spacing
    sections: {
      top: 24,
      between: 32,
      bottom: 32,
    },
  },
  
  // Animation spacing
  animation: {
    // Durées en ms
    duration: {
      fast: 200,
      normal: 300,
      slow: 500,
    },
    
    // Easing curves
    easing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    },
  },
};

// Helper functions pour créer des styles de spacing
export const createPaddingStyle = (top?: number, right?: number, bottom?: number, left?: number) => ({
  paddingTop: top || 0,
  paddingRight: right || 0,
  paddingBottom: bottom || 0,
  paddingLeft: left || 0,
});

export const createMarginStyle = (top?: number, right?: number, bottom?: number, left?: number) => ({
  marginTop: top || 0,
  marginRight: right || 0,
  marginBottom: bottom || 0,
  marginLeft: left || 0,
});

export const createSpacingStyle = (type: 'padding' | 'margin', size: keyof typeof Spacing) => ({
  [`${type}Top`]: Spacing[size],
  [`${type}Right`]: Spacing[size],
  [`${type}Bottom`]: Spacing[size],
  [`${type}Left`]: Spacing[size],
});

// Helper pour le spacing horizontal
export const horizontalSpacing = (size: keyof typeof Spacing) => ({
  paddingHorizontal: Spacing[size],
});

// Helper pour le spacing vertical
export const verticalSpacing = (size: keyof typeof Spacing) => ({
  paddingVertical: Spacing[size],
});

export default Spacing;
