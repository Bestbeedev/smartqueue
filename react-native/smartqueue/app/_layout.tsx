import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/store/authStore';
import '../global.css';

export default function RootLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (isLoading || hasRedirected) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';
    const inAgentGroup = segments[0] === 'agent';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!isAuthenticated && !inAuthGroup) {
      setHasRedirected(true);
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      // User is authenticated but on auth screen - redirect appropriately
      setHasRedirected(true);
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, hasRedirected]);

  // Reset redirect flag when auth state changes
  useEffect(() => {
    setHasRedirected(false);
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}
