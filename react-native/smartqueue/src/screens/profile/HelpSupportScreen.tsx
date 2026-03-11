import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../theme';
import { useThemeColors } from '../../hooks/useThemeColors';

export const HelpSupportScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.separator, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Aide & Support</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Contactez-nous</Text>
        <TouchableOpacity style={[styles.contactItem, { backgroundColor: colors.surface }]} onPress={() => Linking.openURL('mailto:support@smartqueue.com')}>
          <Ionicons name="mail-outline" size={24} color={colors.primary} />
          <View style={styles.contactInfo}>
            <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>Email</Text>
            <Text style={[styles.contactValue, { color: colors.textPrimary }]}>support@smartqueue.com</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.contactItem, { backgroundColor: colors.surface }]} onPress={() => Linking.openURL('tel:+33123456789')}>
          <Ionicons name="call-outline" size={24} color={colors.success} />
          <View style={styles.contactInfo}>
            <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>Téléphone</Text>
            <Text style={[styles.contactValue, { color: colors.textPrimary }]}>+33 1 23 45 67 89</Text>
          </View>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 32 }]}>FAQ</Text>
        {[
          'Comment rejoindre une file ?',
          'Puis-je annuler mon ticket ?',
          'Comment fonctionnent les notifications ?',
        ].map((q, i) => (
          <TouchableOpacity key={i} style={[styles.faqItem, { borderBottomColor: colors.separator }]}>
            <Text style={[styles.faqText, { color: colors.textPrimary }]}>{q}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Theme.colors.surface, borderBottomWidth: 0.5, borderBottomColor: Theme.colors.separator },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Theme.colors.textPrimary },
  content: { padding: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: Theme.colors.textSecondary, textTransform: 'uppercase', marginBottom: 16 },
  contactItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.surface, padding: 16, borderRadius: 12, marginBottom: 12 },
  contactInfo: { marginLeft: 16 },
  contactLabel: { fontSize: 12, color: Theme.colors.textSecondary },
  contactValue: { fontSize: 16, fontWeight: '600', color: Theme.colors.textPrimary },
  faqItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: Theme.colors.separator },
  faqText: { fontSize: 16, color: Theme.colors.textPrimary },
});

export default HelpSupportScreen;
