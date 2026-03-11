import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { TicketsScreen as VQSTicketsScreen } from '../../src/screens/tickets/TicketsScreen';

export default function TicketsScreen() {
  return <VQSTicketsScreen />;
}
