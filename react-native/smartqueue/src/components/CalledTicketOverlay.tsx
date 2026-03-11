import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { formatDistance, formatTravelTime, DistanceInfo } from '../utils/distance';

interface CalledTicketOverlayProps {
  visible: boolean;
  counterNumber?: string;
  distanceInfo: DistanceInfo | null;
  countdownSeconds: number; // Default 180 (3 minutes)
  hasRecalled: boolean;
  onEnRoute: () => void;
  onRecall: () => void;
  onDismiss: () => void;
}

export const CalledTicketOverlay: React.FC<CalledTicketOverlayProps> = ({
  visible,
  counterNumber,
  distanceInfo,
  countdownSeconds = 180,
  hasRecalled,
  onEnRoute,
  onRecall,
  onDismiss,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(countdownSeconds);
  const [isExpired, setIsExpired] = useState(false);
  const flashAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Countdown timer
  useEffect(() => {
    if (!visible || isExpired) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, isExpired]);

  // Reset when visibility changes
  useEffect(() => {
    if (visible) {
      setTimeRemaining(countdownSeconds);
      setIsExpired(false);
    }
  }, [visible, countdownSeconds]);

  // Flash animation for urgency
  useEffect(() => {
    if (visible && timeRemaining <= 60 && timeRemaining > 0) {
      const flash = Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, {
            toValue: 0.5,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(flashAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      flash.start();
      return () => flash.stop();
    }
  }, [visible, timeRemaining, flashAnim]);

  // Haptic feedback when called
  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      // Vibrate pattern
      const pattern = [0, 500, 200, 500, 200, 500];
      Vibration.vibrate(Platform.OS === 'ios' ? [0, 500, 200, 500] : pattern);
    }
  }, [visible]);

  // Format countdown as MM:SS
  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle "I'm on my way" button
  const handleEnRoute = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onEnRoute();
  };

  // Handle "Recall me" button
  const handleRecall = () => {
    if (hasRecalled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onRecall();
    // Reset countdown after recall
    setTimeRemaining(countdownSeconds);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
    >
      <View className="flex-1 bg-gradient-to-b from-orange-500 to-red-600" style={{ backgroundColor: '#EA580C' }}>
        {/* Header */}
        <View className="pt-16 px-6 items-center">
          <Animated.View style={{ opacity: flashAnim }}>
            <View className="w-24 h-24 rounded-full bg-white/20 items-center justify-center mb-4">
              <Ionicons name="notifications" size={48} color="white" />
            </View>
          </Animated.View>
          
          <Text className="text-white text-3xl font-bold text-center mb-2">
            C'est votre tour !
          </Text>
          
          {counterNumber && (
            <View className="bg-white/20 px-6 py-2 rounded-full">
              <Text className="text-white text-lg font-bold">
                Guichet N° {counterNumber}
              </Text>
            </View>
          )}
        </View>

        {/* Countdown */}
        <View className="items-center mt-8">
          {isExpired ? (
            <View className="bg-black/30 px-8 py-4 rounded-2xl">
              <Text className="text-white text-2xl font-bold text-center">
                Délai expiré
              </Text>
              <Text className="text-white/80 text-center mt-1">
                Votre ticket a été marqué absent
              </Text>
            </View>
          ) : (
            <>
              <Text className="text-white/80 text-lg mb-2">Temps restant</Text>
              <Animated.Text 
                className="text-white text-7xl font-black"
                style={{ opacity: flashAnim }}
              >
                {formatCountdown(timeRemaining)}
              </Animated.Text>
            </>
          )}
        </View>

        {/* Distance Info */}
        {distanceInfo && !isExpired && (
          <View className="mx-6 mt-6 bg-white/15 rounded-2xl p-4">
            <View className="flex-row items-center justify-center mb-3">
              <Ionicons name="location" size={20} color="white" />
              <Text className="text-white font-bold ml-2">Distance actuelle</Text>
            </View>
            <View className="flex-row justify-around">
              <View className="items-center">
                <Ionicons name="navigate" size={18} color="white" />
                <Text className="text-white font-bold mt-1">
                  {formatDistance(distanceInfo.kilometers)}
                </Text>
              </View>
              <View className="items-center">
                <Ionicons name="car" size={18} color="white" />
                <Text className="text-white font-bold mt-1">
                  {formatTravelTime(distanceInfo.travelTimes.car)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        {!isExpired && (
          <View className="flex-1 justify-end pb-12 px-6">
            {/* "I'm on my way" button */}
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                className="bg-white h-16 rounded-2xl flex-row items-center justify-center mb-4"
                onPress={handleEnRoute}
                activeOpacity={0.8}
              >
                <Ionicons name="walk" size={24} color="#EA580C" />
                <Text className="text-orange-600 font-bold text-lg ml-2">
                  Je suis en route
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* "Recall me" button */}
            <TouchableOpacity
              className={`h-16 rounded-2xl flex-row items-center justify-center border-2 ${
                hasRecalled 
                  ? 'bg-white/10 border-white/30' 
                  : 'bg-transparent border-white'
              }`}
              onPress={handleRecall}
              disabled={hasRecalled}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={hasRecalled ? "checkmark-circle" : "refresh"} 
                size={24} 
                color={hasRecalled ? "rgba(255,255,255,0.5)" : "white"} 
              />
              <Text className={`font-bold text-lg ml-2 ${
                hasRecalled ? 'text-white/50' : 'text-white'
              }`}>
                {hasRecalled ? 'Rappel déjà utilisé' : 'Me rappeler'}
              </Text>
            </TouchableOpacity>

            {/* Info text */}
            <Text className="text-white/60 text-center text-sm mt-4">
              {hasRecalled 
                ? 'Le rappel ne peut être utilisé qu\'une seule fois'
                : 'Un rappel vous sera envoyé par SMS et notification'
              }
            </Text>
          </View>
        )}

        {/* Expired state - Get new ticket */}
        {isExpired && (
          <View className="flex-1 justify-end pb-12 px-6">
            <TouchableOpacity
              className="bg-white h-16 rounded-2xl flex-row items-center justify-center"
              onPress={onDismiss}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={24} color="#EA580C" />
              <Text className="text-orange-600 font-bold text-lg ml-2">
                Prendre un nouveau ticket
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

export default CalledTicketOverlay;
