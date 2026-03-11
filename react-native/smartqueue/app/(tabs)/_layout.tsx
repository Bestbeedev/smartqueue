import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../src/theme';
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
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 30 : 20,
          left: '10%',
          right: '10%',
          width: '90%',
          height: 64,
          borderRadius: 32,
          backgroundColor: Platform.OS === 'ios' ? colors.tabBackground : colors.background,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
          paddingBottom: 0,
          alignSelf: 'center',
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
            },
            android: {
              elevation: 10,
            },
          }),
        },
        tabBarItemStyle: {
          height: 64,
          paddingVertical: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explorer',
          tabBarIcon: ({ color, size, focused }) => (
            <View className={`items-center justify-center w-12 h-12 rounded-full ${focused ? 'bg-blue-50' : ''}`}>
              <Ionicons name={focused ? "map" : "map-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color, size, focused }) => (
            <View className={`items-center justify-center w-12 h-12 rounded-full ${focused ? 'bg-blue-50' : ''}`}>
              <Ionicons name={focused ? "qr-code" : "qr-code-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'Tickets',
          tabBarIcon: ({ color, size, focused }) => (
            <View className={`items-center justify-center w-12 h-12 rounded-full ${focused ? 'bg-blue-50' : ''}`}>
              <Ionicons name={focused ? "ticket" : "ticket-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          tabBarIcon: ({ color, size, focused }) => (
            <View className={`items-center justify-center w-12 h-12 rounded-full ${focused ? 'bg-blue-50' : ''}`}>
              <Ionicons name={focused ? "time" : "time-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size, focused }) => (
            <View className={`items-center justify-center w-12 h-12 rounded-full ${focused ? 'bg-blue-50' : ''}`}>
              <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
            </View>
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
