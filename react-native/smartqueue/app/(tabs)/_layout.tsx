import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import '../../global.css';
import { useThemeColors } from '../../src/hooks/useThemeColors';

export default function TabLayout() {
  const colors = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: -2,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 0 : 0,
          left: 20,
          right: 20,
          height: 70,
          borderRadius: 0,
          backgroundColor: colors.background,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarItemStyle: {
          paddingVertical: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explorer',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "map" : "map-outline"} 
              size={focused ? 26 : 22} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "qr-code" : "qr-code-outline"} 
              size={focused ? 26 : 22} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'Tickets',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "ticket" : "ticket-outline"} 
              size={focused ? 26 : 22} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "time" : "time-outline"} 
              size={focused ? 26 : 22} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "person" : "person-outline"} 
              size={focused ? 26 : 22} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="live-ticket"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}