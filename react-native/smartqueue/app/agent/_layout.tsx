import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { useAuth } from '../../src/store/authStore';

export default function AgentLayout() {
  const colors = useThemeColors();
  const { user } = useAuth();

  // Only agents and admins can access this space
  if (user?.role !== 'agent' && user?.role !== 'admin') {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="queue" />
        <Stack.Screen name="called" />
        <Stack.Screen name="absent" />
        <Stack.Screen name="priority" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
