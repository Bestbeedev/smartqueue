import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Theme } from '../../theme';
import { useThemeColors } from '../../hooks/useThemeColors';

const { width, height } = Dimensions.get('window');
const SCAN_SIZE = width * 0.65;

export const ScanScreen: React.FC = () => {
  const navigation = useNavigation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const cornerAnim = useRef(new Animated.Value(1)).current;

  // Animate scan line
  useEffect(() => {
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    scanLoop.start();

    const cornerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(cornerAnim, { toValue: 0.85, duration: 800, useNativeDriver: true }),
        Animated.timing(cornerAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    cornerLoop.start();

    return () => {
      scanLoop.stop();
      cornerLoop.stop();
    };
  }, []);

  // Request camera permission
  useEffect(() => {
    (async () => {
      try {
        // In a real implementation, use expo-camera to request permissions
        // For now, simulate permission granted
        setHasPermission(true);
      } catch (e) {
        setHasPermission(false);
      }
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Parse QR data - expect JSON with establishment_id and service_id
      let qrData: { establishment_id?: number; service_id?: number } = {};
      try {
        qrData = JSON.parse(data);
      } catch {
        qrData = { establishment_id: parseInt(data) };
      }

      if (qrData.establishment_id) {
        navigation.navigate('ServiceDetails' as never, {
          establishmentId: qrData.establishment_id,
          serviceId: qrData.service_id,
          fromQr: true,
        } as never);
      } else {
        Alert.alert('QR invalide', 'Ce QR code n\'est pas reconnu par SmartQueue.', [
          { text: 'OK', onPress: () => setIsProcessing(false) },
        ]);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de traiter ce QR code.', [
        { text: 'OK', onPress: () => setIsProcessing(false) },
      ]);
    }
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    handleBarCodeScanned({ type: 'manual', data: manualCode.trim() });
    setShowManualEntry(false);
    setManualCode('');
  };

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_SIZE - 3],
  });

  return (
    <View className="flex-1 bg-black">
      {/* Top Header */}
      <View className="absolute top-0 left-0 right-0 z-10 px-5 pt-12 pb-6 flex-row items-center justify-between">
        <TouchableOpacity 
          className="w-10 h-10 items-center justify-center rounded-full bg-white/20" 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white">Scan to Join Queue</Text>
        <View className="w-10" /> {/* Spacer */}
      </View>

      {/* Camera View Overlay */}
      <View className="flex-1 items-center justify-center">
        {/* Scanning Frame */}
        <View 
          className="w-72 h-72 border-2 border-white/50 rounded-3xl overflow-hidden relative items-center justify-center"
        >
          {/* Animated Scan Line */}
          <Animated.View
            className="absolute left-0 right-0 h-1 bg-green-500 shadow-lg"
            style={[
              { shadowColor: '#34C759', shadowOpacity: 0.9, shadowRadius: 6 },
              { transform: [{ translateY: scanLineTranslateY }] }
            ]}
          />
        </View>

        <Text className="text-white/70 text-center mt-10 px-10 text-base">
          Position your QR code within the frame to automatically join the queue.
        </Text>
      </View>

      {/* Bottom Controls */}
      <View className="absolute bottom-10 left-0 right-0 flex-row justify-center gap-8 px-10 pb-6">
        <TouchableOpacity 
          className="items-center"
          onPress={() => setShowManualEntry(true)}
        >
          <View className="w-16 h-16 rounded-full bg-white/10 items-center justify-center mb-2 border border-white/20">
            <Ionicons name="keypad" size={28} color="white" />
          </View>
          <Text className="text-white/70 text-xs font-bold uppercase tracking-wider">Manual Entry</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="items-center"
          onPress={() => setIsTorchOn(!isTorchOn)}
        >
          <View className={`w-16 h-16 rounded-full ${isTorchOn ? 'bg-yellow-500' : 'bg-white/10'} items-center justify-center mb-2 border border-white/20`}>
            <Ionicons name={isTorchOn ? "flashlight" : "flashlight-outline"} size={28} color="white" />
          </View>
          <Text className="text-white/70 text-xs font-bold uppercase tracking-wider">Flashlight</Text>
        </TouchableOpacity>
      </View>

      {/* Manual entry bottom sheet model */}
      {showManualEntry && (
        <View className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl p-8 z-20 shadow-2xl">
          <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-6" />
          <Text className="text-xl font-bold text-gray-900 mb-2">Manual Entry</Text>
          <Text className="text-gray-500 mb-6">Enter the 6-digit code shown below the QR code.</Text>
          
          <TextInput
            className="bg-gray-100 rounded-2xl p-4 text-center text-2xl font-bold tracking-widest text-gray-900 mb-6 border border-gray-200"
            placeholder="000000"
            placeholderTextColor="#9CA3AF"
            value={manualCode}
            onChangeText={setManualCode}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />

          <View className="flex-row gap-4">
            <TouchableOpacity 
              className="flex-1 bg-gray-100 p-4 rounded-2xl items-center"
              onPress={() => { setShowManualEntry(false); setManualCode(''); }}
            >
              <Text className="text-gray-600 font-bold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className={`flex-1 ${manualCode.length === 6 ? 'bg-blue-600' : 'bg-gray-300'} p-4 rounded-2xl items-center`}
              onPress={handleManualSubmit}
              disabled={manualCode.length !== 6}
            >
              <Text className="text-white font-bold">Verify Code</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  darkSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 54,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  darkSide: {
    flex: 1,
    height: SCAN_SIZE,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  torchSide: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  torchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  torchActive: {
    backgroundColor: Theme.colors.warning + 'AA',
  },
  scanFrame: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    overflow: 'hidden',
    position: 'relative',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#34C759',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 4,
  },
  hintText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  manualButtonText: {
    color: Theme.colors.primary,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  manualSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.separator,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    marginBottom: 16,
  },
  codeInput: {
    height: 50,
    borderRadius: 12,
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Theme.colors.textPrimary,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Theme.colors.separator,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
  },
  sheetButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.separator,
  },
  cancelBtnText: {
    color: Theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: Theme.colors.primary,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledBtn: {
    opacity: 0.4,
  },
});

export default ScanScreen;
