import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100">
        <TouchableOpacity
          className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#374151" />
        </TouchableOpacity>
        <Text className="flex-1 text-xl font-bold text-gray-900 ml-3">
          Notifications
        </Text>
        <TouchableOpacity className="px-3 py-1">
          <Text className="text-blue-600 font-medium text-sm">Tout marquer lu</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Empty state */}
        <View className="items-center justify-center py-20 px-6">
          <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
            <Ionicons name="notifications-off-outline" size={40} color="#9CA3AF" />
          </View>
          <Text className="text-lg font-bold text-gray-900 mb-2">
            Aucune notification
          </Text>
          <Text className="text-gray-500 text-center">
            Vous serez informé quand votre ticket sera appelé ou quand il y a des mises à jour importantes.
          </Text>
        </View>

        {/* Sample notifications - uncomment when implementing real notifications */}
        {/*
        <View className="px-4 py-3">
          <Text className="text-xs font-semibold text-gray-400 uppercase mb-2">Aujourd'hui</Text>
          
          <View className="bg-white rounded-xl p-4 mb-2 border border-gray-100">
            <View className="flex-row">
              <View className="w-10 h-10 rounded-full bg-orange-100 items-center justify-center">
                <Ionicons name="notifications" size={20} color="#F97316" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="font-semibold text-gray-900">C'est votre tour !</Text>
                <Text className="text-gray-500 text-sm mt-1">
                  Guichet N°3 - Hôpital Central
                </Text>
                <Text className="text-gray-400 text-xs mt-1">Il y a 5 min</Text>
              </View>
            </View>
          </View>

          <View className="bg-white rounded-xl p-4 mb-2 border border-gray-100">
            <View className="flex-row">
              <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
                <Ionicons name="time" size={20} color="#3B82F6" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="font-semibold text-gray-900">Position mise à jour</Text>
                <Text className="text-gray-500 text-sm mt-1">
                  Vous êtes maintenant 3ème dans la file
                </Text>
                <Text className="text-gray-400 text-xs mt-1">Il y a 15 min</Text>
              </View>
            </View>
          </View>
        </View>
        */}
      </ScrollView>
    </View>
  );
}
