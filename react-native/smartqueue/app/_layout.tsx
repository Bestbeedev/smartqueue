import { Redirect, Slot } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/store/authStore';
import '../global.css';

export default function RootLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  // Authenticated - render the app
  return <Slot />;
}
