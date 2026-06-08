import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const { width, height } = Dimensions.get('window');
const SCAN_SIZE = width * 0.65;

export const ScanScreen: React.FC = () => {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { AlertComponent, showError, showInfo } = useCustomAlert();
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Animate scan line
  useEffect(() => {
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    );
    scanLoop.start();
    return () => scanLoop.stop();
  }, []);

  // Request camera permission
  useEffect(() => {
    (async () => {
      try {
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

      let qrData: { establishment_id?: number; service_id?: number } = {};
      try {
        qrData = JSON.parse(data);
      } catch {
        qrData = { establishment_id: parseInt(data) };
      }

      if (qrData.establishment_id) {
        router.push({
          pathname: '/service-details',
          params: {
            establishmentId: String(qrData.establishment_id),
            serviceId: qrData.service_id ? String(qrData.service_id) : '',
            fromQr: 'true',
          },
        });
      } else {
        showError('QR invalide', 'Ce QR code n\'est pas reconnu.', 'OK', () => setIsProcessing(false));
      }
    } catch (error) {
      showError('Erreur', 'Impossible de traiter ce QR code.', 'OK', () => setIsProcessing(false));
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
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      {/* Header compact */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scanner</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Zone de scan */}
      <View style={styles.scanContainer}>
        <View style={[styles.scanFrame, { width: SCAN_SIZE, height: SCAN_SIZE }]}>
          {/* Coins */}
          <View style={[styles.corner, styles.cornerTL, { borderColor: '#FFF' }]} />
          <View style={[styles.corner, styles.cornerTR, { borderColor: '#FFF' }]} />
          <View style={[styles.corner, styles.cornerBL, { borderColor: '#FFF' }]} />
          <View style={[styles.corner, styles.cornerBR, { borderColor: '#FFF' }]} />
          
          {/* Ligne de scan animée */}
          <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineTranslateY }] }]} />
        </View>

        <Text style={styles.scanHint}>
          Placez le QR code dans le cadre
        </Text>
      </View>

      {/* Contrôles en bas */}
      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.controlBtn} onPress={() => setShowManualEntry(true)}>
          <View style={[styles.controlIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Ionicons name="keypad-outline" size={24} color="#FFF" />
          </View>
          <Text style={styles.controlLabel}>Manuel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlBtn} onPress={() => setIsTorchOn(!isTorchOn)}>
          <View style={[styles.controlIcon, { backgroundColor: isTorchOn ? '#F59E0B' : 'rgba(255,255,255,0.15)' }]}>
            <Ionicons name={isTorchOn ? "flashlight" : "flashlight-outline"} size={24} color="#FFF" />
          </View>
          <Text style={styles.controlLabel}>Lampe</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet pour saisie manuelle */}
      {showManualEntry && (
        <View style={[styles.manualSheet, { backgroundColor: colors.surface }]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Code manuel</Text>
          <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
            Entrez le code à 6 chiffres
          </Text>
          
          <TextInput
            style={[styles.codeInput, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="000000"
            placeholderTextColor={colors.textTertiary}
            value={manualCode}
            onChangeText={setManualCode}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />

          <View style={styles.sheetActions}>
            <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.surfaceSecondary }]} onPress={() => { setShowManualEntry(false); setManualCode(''); }}>
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.confirmBtn, { backgroundColor: manualCode.length === 6 ? colors.primary : colors.surfaceSecondary }]}
              onPress={handleManualSubmit}
              disabled={manualCode.length !== 6}
            >
              <Text style={[styles.confirmBtnText, { color: manualCode.length === 6 ? '#FFF' : colors.textTertiary }]}>Valider</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {AlertComponent}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  headerPlaceholder: { width: 36 },
  scanContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { position: 'relative', justifyContent: 'center', alignItems: 'center' },
  corner: { position: 'absolute', width: 20, height: 20, borderWidth: 2 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: '#34C759', shadowColor: '#34C759', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 4 },
  scanHint: { color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', marginTop: 24, paddingHorizontal: 40 },
  bottomControls: { flexDirection: 'row', justifyContent: 'center', gap: 32, paddingBottom: 30 },
  controlBtn: { alignItems: 'center' },
  controlIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  controlLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  manualSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 10 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  sheetSubtitle: { fontSize: 13, marginBottom: 20 },
  codeInput: { height: 52, borderRadius: 14, paddingHorizontal: 16, textAlign: 'center', fontSize: 22, fontWeight: '700', letterSpacing: 6, borderWidth: 1, marginBottom: 20 },
  sheetActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600' },
  confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  confirmBtnText: { fontSize: 15, fontWeight: '600' },
});

export default ScanScreen;