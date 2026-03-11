/**
 * Alert Preferences Types
 * User-configurable settings for queue notifications
 */

// Alert channels - can be combined
export type AlertChannel = 'push' | 'sms';

// Predefined margin options in minutes
export type MarginOption = 5 | 10 | 15 | 20 | 'custom';

export interface AlertPreferences {
  // Which channels to use for alerts
  channels: AlertChannel[];
  
  // Minutes before estimated turn to trigger alert
  marginMinutes: number;
  
  // Whether margin is custom or predefined
  marginOption: MarginOption;
  
  // Enable second safety alert 2 minutes before if not confirmed
  enableSafetyAlert: boolean;
  
  // Phone number for SMS fallback
  phoneNumber?: string;
  
  // Preferred transport mode for travel time calculation
  preferredTransportMode: 'walking' | 'motorcycle' | 'car';
}

// Default alert preferences
export const DEFAULT_ALERT_PREFERENCES: AlertPreferences = {
  channels: ['push'],
  marginMinutes: 10,
  marginOption: 10,
  enableSafetyAlert: false,
  preferredTransportMode: 'motorcycle',
};

// Margin options for UI selector
export const MARGIN_OPTIONS: { value: MarginOption; label: string }[] = [
  { value: 5, label: '5 minutes' },
  { value: 10, label: '10 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 20, label: '20 minutes' },
  { value: 'custom', label: 'Personnalisé' },
];

// Transport mode options for UI
export const TRANSPORT_MODE_OPTIONS: { value: 'walking' | 'motorcycle' | 'car'; label: string; icon: string }[] = [
  { value: 'walking', label: 'À pied', icon: 'walk' },
  { value: 'motorcycle', label: 'Moto', icon: 'bicycle' },
  { value: 'car', label: 'Voiture', icon: 'car' },
];
