import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';

export default function Scan() {
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
    // TODO: Implement QR code scanning logic
    setTimeout(() => {
      setIsScanning(false);
      // Navigate to a ticket or queue after successful scan
      router.push('/(tabs)/tickets');
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scanner QR Code</Text>
        <Text style={styles.subtitle}>
          Scannez le QR code d'un établissement pour rejoindre sa file d'attente
        </Text>
      </View>

      <View style={styles.scannerArea}>
        <View style={styles.scannerFrame}>
          {isScanning ? (
            <View style={styles.scanning}>
              <Ionicons name="radio-outline" size={60} color="#007AFF" />
              <Text style={styles.scanningText}>Recherche du QR code...</Text>
            </View>
          ) : (
            <View style={styles.scannerPlaceholder}>
              <Ionicons name="qr-code-outline" size={80} color="#8E8E93" />
              <Text style={styles.placeholderText}>Positionnez le QR code ici</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.scanButton, isScanning && styles.scanButtonDisabled]} 
        onPress={handleScan}
        disabled={isScanning}
      >
        <Ionicons name="camera-outline" size={24} color="#FFFFFF" />
        <Text style={styles.scanButtonText}>
          {isScanning ? 'Analyse en cours...' : 'Scanner le QR code'}
        </Text>
      </TouchableOpacity>

      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>Instructions:</Text>
        <Text style={styles.instructionText}>• Assurez-vous d'avoir suffisamment de lumière</Text>
        <Text style={styles.instructionText}>• Tenez votre téléphone à environ 20cm du QR code</Text>
        <Text style={styles.instructionText}>• Centrez le QR code dans le cadre</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  scannerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#007AFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  scannerPlaceholder: {
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 16,
    textAlign: 'center',
  },
  scanning: {
    alignItems: 'center',
  },
  scanningText: {
    fontSize: 16,
    color: '#007AFF',
    marginTop: 16,
    fontWeight: '500',
  },
  scanButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 30,
    gap: 8,
  },
  scanButtonDisabled: {
    backgroundColor: '#8E8E93',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
    lineHeight: 20,
  },
});
