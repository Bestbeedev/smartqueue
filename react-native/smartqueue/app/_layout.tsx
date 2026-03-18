import { useEffect, useRef } from 'react';
import { Slot, useRouter, usePathname, useRootNavigationState } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/store/authStore';
import '../global.css';

export default function RootLayout() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const rootNavigationState = useRootNavigationState();
  const isMounted = useRef(false);

  useEffect(() => {
    // Wait for navigation to be ready
    if (!rootNavigationState?.key) return;
    
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, [rootNavigationState?.key]);

  useEffect(() => {
    if (isLoading || !isMounted.current || !rootNavigationState?.key) return;

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      if (pathname !== '/login' && pathname !== '/register') {
        router.replace('/login');
      }
      return;
    }

    const isAgent = user?.role === 'agent' || user?.role === 'admin';
    const isAgentPath = pathname.startsWith('/agent');
    const isAuthPath = pathname === '/login' || pathname === '/register';

    // If agent, only allow /agent paths
    if (isAgent && !isAgentPath && !isAuthPath) {
      router.replace('/agent');
      return;
    }

    // If regular user, block access to /agent
    if (!isAgent && isAgentPath) {
      router.replace('/(tabs)');
      return;
    }
  }, [isAuthenticated, isLoading, user, pathname, rootNavigationState?.key]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}
