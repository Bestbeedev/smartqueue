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
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 30 : 20,
          marginHorizontal: 20,
          height: 60,
          borderRadius: 30,
          backgroundColor: 'rgba(255,255,255,0.9)', // translucide
          borderTopWidth: 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 15 },
          shadowOpacity: 0.15,
          shadowRadius: 25,
          elevation: 15,
          backdropFilter: 'blur(100px)',
          paddingHorizontal: 30,
          justifyContent: 'space-between',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.05)'
        },
        tabBarItemStyle: {
          height: 50,
          width: 44,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: focused ? colors.primary : 'transparent',
              transform: [{ scale: focused ? 1.1 : 1 }],
            }}>
              <Ionicons 
                name="map-outline" 
                size={22} 
                color={focused ? '#FFFFFF' : color} 
              />
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="scan"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: focused ? colors.primary : 'transparent',
              transform: [{ scale: focused ? 1.1 : 1 }],
            }}>
              <Ionicons 
                name="qr-code-outline" 
                size={22} 
                color={focused ? '#FFFFFF' : color} 
              />
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="tickets"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: focused ? colors.primary : 'transparent',
              transform: [{ scale: focused ? 1.1 : 1 }],
            }}>
              <Ionicons 
                name="ticket-outline" 
                size={22} 
                color={focused ? '#FFFFFF' : color} 
              />
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: focused ? colors.primary : 'transparent',
              transform: [{ scale: focused ? 1.1 : 1 }],
            }}>
              <Ionicons 
                name="time-outline" 
                size={22} 
                color={focused ? '#FFFFFF' : color} 
              />
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: focused ? colors.primary : 'transparent',
              transform: [{ scale: focused ? 1.1 : 1 }],
            }}>
              <Ionicons 
                name="person-outline" 
                size={22} 
                color={focused ? '#FFFFFF' : color} 
              />
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