// Types pour la navigation React Native

// Types pour la navigation principale (Stack)
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined;
  ScanScreen: undefined;
  ServiceDetails: {
    establishmentId: number;
    serviceId?: number;
    fromQr?: boolean;
  };
  LiveTicket: {
    ticketId: number;
  };
  PersonalInfo: undefined;
  NotificationPreferences: undefined;
  AboutApp: undefined;
  HelpSupport: undefined;
};

// Types pour les tabs
export type TabParamList = {
  Explore: undefined;
  Tickets: undefined;
  History: undefined;
  Profile: undefined;
};

// Types pour la navigation Explore (Stack)
export type ExploreStackParamList = {
  ExploreHome: undefined;
  ServiceDetails: {
    establishmentId: number;
    serviceId?: number;
    fromQr?: boolean;
  };
};

// Types pour la navigation Tickets (Stack)
export type TicketsStackParamList = {
  TicketsHome: undefined;
  LiveTicket: {
    ticketId: number;
  };
  ScanScreen: undefined;
  ServiceDetails: {
    establishmentId: number;
    serviceId?: number;
    fromQr?: boolean;
  };
};

// Types pour la navigation History (Stack)
export type HistoryStackParamList = {
  HistoryHome: undefined;
};

// Types pour la navigation Profile (Stack)
export type ProfileStackParamList = {
  ProfileHome: undefined;
  PersonalInfo: undefined;
  NotificationPreferences: undefined;
  PaymentMethods: undefined;
  HelpSupport: undefined;
  AboutApp: undefined;
  Settings: undefined;
};

// Types génériques pour la navigation
export type NavigationProp<T extends Record<string, object>> = {
  navigate: (screen: keyof T, params?: T[keyof T]) => void;
  goBack: () => void;
  replace: (screen: keyof T, params?: T[keyof T]) => void;
  reset: (state: any) => void;
  dispatch: (action: any) => void;
  isFocused: () => boolean;
  canGoBack: () => boolean;
  getId: () => string | undefined;
  getParent: () => any;
  getState: () => any;
  addListener: (event: string, callback: (event: any) => void) => any;
  removeListener: (event: string, callback: (event: any) => void) => void;
};

export type RouteProp<T extends Record<string, object>, K extends keyof T> = {
  key: string;
  name: K;
  params: T[K];
  path: string;
};

// Types pour les props de navigation
export interface ScreenProps<T extends Record<string, object>, K extends keyof T> {
  navigation: NavigationProp<T>;
  route: RouteProp<T, K>;
}

// Types pour les écrans avec paramètres optionnels
export type OptionalScreenProps<T extends Record<string, object>, K extends keyof T> = {
  navigation: NavigationProp<T>;
  route: RouteProp<T, K>;
  params?: Partial<T[K]>;
};

// Types pour les écrans modaux
export type ModalParamList = {
  TicketQR: {
    ticketId: number;
    ticketNumber: string;
  };
  NotificationDetails: {
    notificationId: number;
  };
  ConfirmAction: {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  };
  DatePicker: {
    initialDate?: Date;
    minimumDate?: Date;
    maximumDate?: Date;
    onDateSelected: (date: Date) => void;
  };
  ImagePicker: {
    aspect?: [number, number];
    quality?: number;
    onImageSelected: (imageUri: string) => void;
  };
};

// Types pour les deep links
export type DeepLinkParams = {
  establishmentId?: number;
  serviceId?: number;
  ticketId?: number;
  qrCode?: string;
  action?: 'join' | 'view' | 'scan';
};

// Types pour les transitions de navigation
export type NavigationTransition = {
  type: 'slide' | 'fade' | 'modal' | 'none';
  duration?: number;
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
};

// Types pour les guards de navigation
export type NavigationGuard = {
  canNavigate: (from: string, to: string, params?: any) => boolean;
  onBlocked?: (from: string, to: string, params?: any) => void;
  fallback?: string;
};

// Types pour les middlewares de navigation
export type NavigationMiddleware = {
  onNavigationStart?: (screen: string, params?: any) => void;
  onNavigationEnd?: (screen: string, params?: any) => void;
  onNavigationError?: (error: Error, screen: string, params?: any) => void;
};

// Types pour les événements de navigation
export type NavigationEvent = {
  type: 'focus' | 'blur' | 'beforeRemove' | 'state' | 'gestureStart' | 'gestureEnd' | 'gestureCancel';
  data?: any;
};

// Types pour les configurations de navigation
export type NavigationConfig = {
  defaultScreen: keyof RootStackParamList;
  deepLinking?: {
    prefixes: string[];
    config: {
      screens: Record<string, string>;
    };
  };
  linking?: {
    prefixes: string[];
    config: {
      screens: Record<string, string | {
        path: string;
        screens?: Record<string, string>;
      }>;
    };
  };
  theme?: {
    colors: {
      primary: string;
      background: string;
      card: string;
      text: string;
      border: string;
      notification: string;
    };
  };
};

