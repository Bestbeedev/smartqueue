import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../store/authStore';
import { usersApi } from '../../api/usersApi';
import { Theme } from '../../theme';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { Button } from '../../components/ui/Button';

export const PersonalInfoScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { user, setUser } = useAuth();
  const { AlertComponent, showError, showSuccess, showInfo } = useCustomAlert();
  
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      showError('Erreur', 'Le nom est obligatoire.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await usersApi.updateProfile({ name, phone });
      setUser(response.data || response);
      showSuccess('Succès', 'Votre profil a été mis à jour.', 'OK', () => navigation.goBack());
    } catch (error) {
      console.error('Update profile error:', error);
      showError('Erreur', 'Impossible de mettre à jour le profil.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.separator, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Informations personnelles</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Nom complet</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.separator }]}
            value={name}
            onChangeText={setName}
            placeholder="Votre nom"
            placeholderTextColor={colors.textTertiary}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Email (non modifiable)</Text>
          <TextInput
            style={[styles.input, styles.disabledInput, { backgroundColor: colors.surfaceSecondary, color: colors.textTertiary, borderColor: colors.separator }]}
            value={user?.email || ''}
            editable={false}
            selectTextOnFocus={false}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Téléphone</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.separator }]}
            value={phone}
            onChangeText={setPhone}
            placeholder="Votre numéro de téléphone"
            placeholderTextColor={colors.textTertiary}
            keyboardType="phone-pad"
          />
        </View>

        <Button
          title="Enregistrer les modifications"
          onPress={handleSave}
          isLoading={isLoading}
          variant="primary"
          style={styles.saveButton}
        />
        
        <View style={styles.dangerZone}>
          <TouchableOpacity onPress={() => showInfo('Supprimer mon compte', 'Cette action est irréversible. Contactez le support pour supprimer votre compte.')}>
            <Text style={[styles.dangerText, { color: colors.danger }]}>Supprimer mon compte</Text>
          </TouchableOpacity>
        </View>
        {AlertComponent}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: Theme.colors.separator,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 44,
    backgroundColor: Theme.colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: Theme.colors.textPrimary,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: Theme.colors.separator,
  },
  disabledInput: {
    backgroundColor: Theme.colors.surfaceSecondary,
    color: Theme.colors.textTertiary,
  },
  saveButton: {
    marginTop: 10,
  },
  dangerZone: {
    marginTop: 40,
    alignItems: 'center',
  },
  dangerText: {
    color: Theme.colors.danger,
    fontSize: 15,
    fontWeight: '500',
  },
});

export default PersonalInfoScreen;
