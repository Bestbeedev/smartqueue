import { useEffect } from 'react';
import { Slot, useRouter, usePathname } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/store/authStore';
import '../global.css';

export default function RootLayout() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

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
  }, [isAuthenticated, isLoading, user, pathname]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}
