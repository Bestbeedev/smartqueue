import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useThemeColors } from '../../src/hooks/useThemeColors';

export default function AgentLayout() {
  const colors = useThemeColors();

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
