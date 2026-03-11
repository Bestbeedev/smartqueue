import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTicket } from '../../store/ticketStore';
import { useTicketSocket } from '../../hooks/useTicketSocket';

interface LiveTicketScreenProps {
  ticketId?: string;
}

export const LiveTicketScreen: React.FC<LiveTicketScreenProps> = ({ ticketId }) => {
  const numericTicketId = ticketId ? Number(ticketId) : null;

  const {
    activeTicket,
    position,
    etaMinutes,
    isAlmostThere,
    isCalled,
    cancelTicket,
  } = useTicket();

  // WebSocket connection
  useTicketSocket(numericTicketId?.toString() || null);
  
  console.log('[LiveTicketScreen] ticketId:', numericTicketId, 'position:', position);

  // Flash animation for "called" state
  const flashAnim = useRef(new Animated.Value(0)).current;
  const positionAnim = useRef(new Animated.Value(1)).current;

  // Flash animation when "called"
  useEffect(() => {
    if (isCalled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const flashLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
          Animated.timing(flashAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
        ]),
        { iterations: 3 }
      );
      flashLoop.start();
    }
  }, [isCalled]); // flashAnim is a ref, so it's stable and doesn't need to be in dependencies

  // Haptic when "almost"
  useEffect(() => {
    if (isAlmostThere && !isCalled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [isAlmostThere, isCalled]);

  // Animate position number change
  useEffect(() => {
    Animated.sequence([
      Animated.timing(positionAnim, { toValue: 0.7, duration: 200, useNativeDriver: true }),
      Animated.spring(positionAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
  }, [position]); // positionAnim is a ref, so it's stable and doesn't need to be in dependencies

  const handleCancelTicket = () => {
    Alert.alert(
      'Quitter la file ?',
      'Vous perdrez votre place dans la file d\'attente. Cette action est irréversible.',
      [
        { text: 'Rester', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelTicket(numericTicketId!);
              router.back();
            } catch {
              Alert.alert('Erreur', 'Impossible d\'annuler le ticket.');
            }
          },
        },
      ]
    );
  };

  const getOrdinal = (n: number): string => {
    if (n === 1) return '1er';
    return `${n}ème`;
  };

  // ── CALLED STATE ──────────────────────────────────────
  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="px-5 pt-12 pb-6 flex-row items-center justify-between">
          <View className="w-10" />
          <Text className="text-xl font-bold text-gray-900">Detail Ticket</Text>
          <TouchableOpacity 
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-200"
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Ticket Card */}
        <View className="mx-5 bg-white rounded-[40px] p-8 items-center shadow-xl shadow-gray-200 border border-gray-100 mb-8">
          {/* QR Code Section */}
          <View className="bg-gray-50 p-6 rounded-[32px] mb-8 border border-gray-100">
            <Ionicons name="qr-code" size={180} color="#111827" />
          </View>

          <Text className="text-2xl font-bold text-gray-900 mb-2">You are almost there!</Text>
          
          <View className="flex-row items-center bg-green-50 px-3 py-1 rounded-full mb-6">
            <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            <Text className="text-green-600 text-xs font-bold uppercase tracking-widest">Mini-Status LIVE</Text>
          </View>

          {/* Large Position */}
          <View className="items-center mb-8">
            <Text className="text-6xl font-black text-blue-600">{getOrdinal(position)}</Text>
            <Text className="text-gray-400 font-bold uppercase tracking-tighter mt-1">in the line</Text>
          </View>

          <View className="w-full h-px bg-gray-100 mb-8" />

          {/* Info Details */}
          <View className="w-full gap-4">
            <View className="flex-row justify-between">
              <Text className="text-gray-400 font-medium">Ticket ID</Text>
              <Text className="text-gray-900 font-bold">{activeTicket?.number || `TKT-${numericTicketId}`}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-400 font-medium">Est. Wait Time</Text>
              <Text className="text-gray-900 font-bold">{etaMinutes} mins</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-5 gap-3">
          <TouchableOpacity className="flex-row items-center justify-center bg-blue-600 h-16 rounded-2xl shadow-lg shadow-blue-200">
            <Ionicons name="map-outline" size={20} color="white" className="mr-2" />
            <Text className="text-white font-bold text-base ml-2">Open Navigation</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center justify-center bg-black h-16 rounded-2xl">
            <Ionicons name="card-outline" size={20} color="white" className="mr-2" />
            <Text className="text-white font-bold text-base ml-2">Add to Wallet</Text>
          </TouchableOpacity>
        </View>

        {/* Cancel Ticket Link */}
        <TouchableOpacity className="py-8 items-center" onPress={handleCancelTicket}>
          <Text className="text-gray-400 font-bold uppercase tracking-widest text-xs">Cancel Ticket</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};


export default LiveTicketScreen;
