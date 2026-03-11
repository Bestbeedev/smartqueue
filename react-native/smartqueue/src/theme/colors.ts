// iOS System Colors - Design System pour VQS
export const Colors = {
  // Primary iOS Colors
  primary: '#007AFF',           // iOS Blue
  secondary: '#5856D6',         // iOS Purple
  accent: '#FF6B35',            // Orange accent
  
  // System Colors
  success: '#34C759',           // iOS Green
  warning: '#FF9500',           // iOS Orange
  danger: '#FF3B30',            // iOS Red
  info: '#5AC8FA',              // iOS Light Blue
  
  // Background Colors
  background: '#F2F2F7',       // iOS System Gray 6
  surface: '#FFFFFF',           // Pure White
  surfaceSecondary: '#F8F9FA',   // Light gray surface
  surfaceTertiary: '#EFEFF4',   // iOS System Gray 5
  
  // Text Colors
  textPrimary: '#000000',       // iOS Label
  textSecondary: '#6C6C70',     // iOS Secondary Label
  textTertiary: '#8E8E93',      // iOS Tertiary Label
  textQuaternary: '#C6C6C8',    // iOS Quaternary Label
  
  // Crowd Level Colors
  crowdLow: '#34C759',          // Green - Low wait
  crowdModerate: '#FF9500',     // Orange - Moderate wait
  crowdBusy: '#FF3B30',         // Red - High wait
  
  // Border & Separator Colors
  separator: '#C6C6C8',         // iOS Separator
  border: '#D1D1D6',            // iOS Border
  borderSecondary: '#E5E5EA',   // Light border
  
  // Tab Bar Colors
  tabActive: '#007AFF',         // Active tab color
  tabInactive: '#8E8E93',       // Inactive tab color
  tabBackground: 'rgba(255, 255, 255, 0.72)', // iOS blur effect
  
  // Navigation Colors
  navigationBackground: '#F8F9FA',
  navigationBorder: '#C6C6C8',
  
  // Input Colors
  inputBackground: '#FFFFFF',
  inputBorder: '#D1D1D6',
  inputBorderFocused: '#007AFF',
  inputPlaceholder: '#8E8E93',
  
  // Button Colors
  buttonPrimary: '#007AFF',
  buttonSecondary: '#F2F2F7',
  buttonDanger: '#FF3B30',
  buttonSuccess: '#34C759',
  
  // Status Colors
  statusOpen: '#34C759',
  statusClosed: '#8E8E93',
  statusBusy: '#FF3B30',
  
  // Map Colors
  mapMarkerLow: '#34C759',
  mapMarkerModerate: '#FF9500',
  mapMarkerBusy: '#FF3B30',
  mapMarkerUser: '#007AFF',
  
  // Shadow Colors
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowDark: 'rgba(0, 0, 0, 0.15)',
  
  // Dark Mode Colors
  dark: {
    background: '#000000',
    surface: '#1C1C1E',
    surfaceSecondary: '#2C2C2E',
    surfaceTertiary: '#3A3A3C',
    textPrimary: '#FFFFFF',
    textSecondary: '#EBEBF5',
    textTertiary: '#EBEBF599',
    textQuaternary: '#EBEBF54D',
    separator: '#38383A',
    border: '#38383A',
    borderSecondary: '#48484A',
    tabBackground: 'rgba(28, 28, 30, 0.72)',
    navigationBackground: '#1C1C1E',
    inputBackground: '#2C2C2E',
    inputBorder: '#48484A',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

// Helper functions pour obtenir les couleurs selon le thème
export const getColor = (colorName: keyof typeof Colors, isDark: boolean = false) => {
  if (isDark && Colors.dark[colorName as keyof typeof Colors.dark]) {
    return Colors.dark[colorName as keyof typeof Colors.dark];
  }
  return Colors[colorName];
};

// Couleurs sémantiques pour les états
export const StatusColors = {
  low: Colors.crowdLow,
  moderate: Colors.crowdModerate,
  high: Colors.crowdBusy,
  open: Colors.statusOpen,
  closed: Colors.statusClosed,
  busy: Colors.statusBusy,
  success: Colors.success,
  warning: Colors.warning,
  danger: Colors.danger,
  info: Colors.info,
};

// Gradients prédéfinis
export const Gradients = {
  primary: ['#007AFF', '#5856D6'],
  success: ['#34C759', '#30D158'],
  warning: ['#FF9500', '#FF9F0A'],
  danger: ['#FF3B30', '#FF453A'],
  card: ['rgba(255, 255, 255, 0.72)', 'rgba(255, 255, 255, 0.1)'],
};

export default Colors;
