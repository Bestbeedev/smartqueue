import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { CameraView, CameraType, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTicket } from '../../src/store/ticketStore';
import axiosClient from '../../src/api/axiosClient';

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { hasActiveTicket } = useTicket();

  // Handle QR code scan result
  const handleBarCodeScanned = useCallback(async (result: BarcodeScanningResult) => {
    if (scanned || isProcessing) return;
    
    setScanned(true);
    setIsProcessing(true);

    try {
      const { data } = result;
      
      // Parse QR code data - expected format: smartqueue://establishment/{id}
      // or just the establishment ID
      let establishmentId: string | null = null;
      
      if (data.startsWith('smartqueue://establishment/')) {
        establishmentId = data.replace('smartqueue://establishment/', '');
      } else if (data.startsWith('http')) {
        // Handle web URLs - extract ID from URL
        const urlParts = data.split('/');
        establishmentId = urlParts[urlParts.length - 1];
      } else if (/^\d+$/.test(data)) {
        // Just a number
        establishmentId = data;
      }

      if (!establishmentId) {
        Alert.alert('QR Code invalide', 'Ce QR code n\'est pas un code SmartQueue valide.');
        setScanned(false);
        setIsProcessing(false);
        return;
      }

      // Check if user already has active ticket
      if (hasActiveTicket) {
        Alert.alert(
          'Ticket actif',
          'Vous avez déjà un ticket actif. Voulez-vous le remplacer ?',
          [
            { text: 'Annuler', style: 'cancel', onPress: () => {
              setScanned(false);
              setIsProcessing(false);
            }},
            { 
              text: 'Continuer', 
              onPress: () => {
                router.push({
                  pathname: '/service-details',
                  params: { establishmentId, fromQr: 'true' },
                });
                setIsProcessing(false);
              }
            },
          ]
        );
      } else {
        // Navigate to establishment details
        router.push({
          pathname: '/service-details',
          params: { establishmentId, fromQr: 'true' },
        });
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      Alert.alert('Erreur', 'Impossible de traiter le QR code. Veuillez réessayer.');
      setScanned(false);
      setIsProcessing(false);
    }
  }, [scanned, isProcessing, hasActiveTicket]);

  // Request permission if not granted
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Permission not granted
  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="camera-outline" size={64} color="#8E8E93" />
          <Text style={styles.permissionTitle}>Chargement...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <View style={styles.permissionIconContainer}>
            <Ionicons name="camera-outline" size={64} color="#FF3B30" />
          </View>
          <Text style={styles.permissionTitle}>Accès à la caméra requis</Text>
          <Text style={styles.permissionText}>
            Pour scanner des QR codes, SmartQueue a besoin d&apos;accéder à votre caméra.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Autoriser la caméra</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.settingsButton} 
            onPress={() => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            }}
          >
            <Text style={styles.settingsButtonText}>Ouvrir les paramètres</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={flashEnabled}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        {/* Overlay */}
        <View style={[styles.overlay, { paddingTop: insets.top + 20 }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scanner QR Code</Text>
            <TouchableOpacity 
              style={styles.flashButton}
              onPress={() => setFlashEnabled(!flashEnabled)}
            >
              <Ionicons 
                name={flashEnabled ? "flash" : "flash-off"} 
                size={24} 
                color={flashEnabled ? "#FFD60A" : "white"} 
              />
            </TouchableOpacity>
          </View>

          {/* Scanner Frame */}
          <View style={styles.scannerContainer}>
            <View style={styles.scannerFrame}>
              {/* Corner decorations */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {/* Scanning line animation */}
              {isProcessing && (
                <View style={styles.scanningLine} />
              )}
            </View>
            <Text style={styles.scannerHint}>
              {isProcessing ? 'Traitement en cours...' : 'Positionnez le QR code dans le cadre'}
            </Text>
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <Ionicons name="sunny-outline" size={20} color="#007AFF" />
              </View>
              <Text style={styles.instructionText}>Assurez-vous d&apos;avoir suffisamment de lumière</Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <Ionicons name="phone-portrait-outline" size={20} color="#007AFF" />
              </View>
              <Text style={styles.instructionText}>Tenez votre téléphone à environ 20cm du QR code</Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <Ionicons name="scan-outline" size={20} color="#007AFF" />
              </View>
              <Text style={styles.instructionText}>Le scan se fait automatiquement</Text>
            </View>
          </View>

          {/* Rescan button */}
          {scanned && !isProcessing && (
            <TouchableOpacity 
              style={styles.rescanButton}
              onPress={() => setScanned(false)}
            >
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.rescanButtonText}>Scanner à nouveau</Text>
            </TouchableOpacity>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  flashButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#007AFF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  scanningLine: {
    position: 'absolute',
    top: '50%',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  scannerHint: {
    marginTop: 24,
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
  },
  instructions: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    marginHorizontal: 20,
    marginBottom: 60,
    borderRadius: 16,
    padding: 20,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,122,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
  },
  rescanButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },
  rescanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,59,48,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1D1D1F',
    textAlign: 'center',
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  settingsButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
