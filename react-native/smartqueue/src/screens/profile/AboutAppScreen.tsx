import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../theme';
import { useThemeColors } from '../../hooks/useThemeColors';

export const AboutAppScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.separator, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>À propos</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoContainer}>
          <Ionicons name="infinite" size={80} color={colors.primary} />
          <Text style={[styles.appName, { color: colors.textPrimary }]}>SmartQueue</Text>
          <Text style={[styles.version, { color: colors.textTertiary }]}>Version 1.0.0 (Build 1)</Text>
        </View>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          SmartQueue est une solution innovante de gestion de files d'attente virtuelles, conçue pour optimiser le temps des clients et l'efficacité des établissements.
        </Text>
        <View style={styles.links}>
          <TouchableOpacity style={[styles.link, { borderBottomColor: colors.separator }]}><Text style={[styles.linkText, { color: colors.primary }]}>Conditions d'utilisation</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.link, { borderBottomColor: colors.separator }]}><Text style={[styles.linkText, { color: colors.primary }]}>Politique de confidentialité</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Theme.colors.surface, borderBottomWidth: 0.5, borderBottomColor: Theme.colors.separator },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Theme.colors.textPrimary },
  content: { padding: 24, alignItems: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  appName: { fontSize: 28, fontWeight: '800', color: Theme.colors.textPrimary, marginTop: 16 },
  version: { fontSize: 14, color: Theme.colors.textTertiary, marginTop: 4 },
  description: { fontSize: 16, color: Theme.colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  links: { width: '100%', gap: 16 },
  link: { paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Theme.colors.separator },
  linkText: { fontSize: 16, color: Theme.colors.primary },
});

export default AboutAppScreen;
