import { Redirect } from 'expo-router';
import { useAuth } from '../src/store/authStore';

export default function Index() {
  const { isAuthenticated } = useAuth();

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/login'} />;
}
