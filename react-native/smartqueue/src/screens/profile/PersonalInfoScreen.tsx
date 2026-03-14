import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../store/authStore';
import { usersApi } from '../../api/usersApi';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { useThemeColors } from '../../hooks/useThemeColors';
import { router } from 'expo-router';


export const PersonalInfoScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const isDark = !!colors.dark?.background;
  const { user, updateUser } = useAuth();
  const { AlertComponent, showError, showSuccess } = useCustomAlert();
  
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      showError('Erreur', 'Le nom est obligatoire.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await usersApi.updateProfile({ name, phone });
      updateUser({ name, phone });
      showSuccess('Succès', 'Votre profil a été mis à jour.', 'OK', () => {
        setIsEditing(false);
      });
    } catch (error) {
      console.error('Update profile error:', error);
      showError('Erreur', 'Impossible de mettre à jour le profil.');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = () => {
    return (name || user?.name || 'U').charAt(0).toUpperCase();
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Gradient Header */}
      <LinearGradient
        colors={isDark ? ['#1E3A5F', '#2563EB', '#3B82F6'] : [colors.primary, colors.secondary, '#1D4ED8']}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.iconButton}
            activeOpacity={0.8}
          >
            <View style={[styles.iconButtonBg, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Profil</Text>
          <TouchableOpacity 
            onPress={() => setIsEditing(!isEditing)}
            style={styles.iconButton}
            activeOpacity={0.8}
          >
            <View style={[styles.iconButtonBg, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name={isEditing ? "close" : "pencil"} size={22} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{getInitials()}</Text>
            </View>
            <TouchableOpacity style={[styles.cameraButton, { backgroundColor: colors.primary, borderColor: colors.surface }]} activeOpacity={0.8}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.userName, { color: '#FFFFFF' }]}>{user?.name || 'Utilisateur'}</Text>
          <Text style={[styles.userEmail, { color: 'rgba(255,255,255,0.8)' }]}>{user?.email}</Text>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Info Cards */}
        <View style={[styles.formContainer, { backgroundColor: colors.surface }]}>
          {/* Name Field */}
          <View style={[styles.fieldContainer, { borderBottomColor: colors.border }]}>
            <View style={[styles.fieldIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="person" size={20} color={colors.primary} />
            </View>
            <View style={styles.fieldContent}>
              <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>Nom complet</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.textPrimary }, !isEditing && { color: colors.textSecondary }]}
                value={name}
                onChangeText={setName}
                placeholder="Votre nom"
                placeholderTextColor={colors.textTertiary}
                editable={isEditing}
              />
            </View>
          </View>

          {/* Email Field */}
          <View style={[styles.fieldContainer, { borderBottomColor: colors.border }]}>
            <View style={[styles.fieldIconContainer, { backgroundColor: colors.secondary + '15' }]}>
              <Ionicons name="mail" size={20} color={colors.secondary} />
            </View>
            <View style={styles.fieldContent}>
              <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>Email</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.textSecondary }]}
                value={user?.email || ''}
                editable={false}
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            </View>
          </View>

          {/* Phone Field */}
          <View style={[styles.fieldContainer, { borderBottomColor: colors.border }]}>
            <View style={[styles.fieldIconContainer, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="call" size={20} color={colors.success} />
            </View>
            <View style={styles.fieldContent}>
              <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>Téléphone</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.textPrimary }, !isEditing && { color: colors.textSecondary }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="+33 6 12 34 56 78"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
                editable={isEditing}
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        {isEditing && (
          <TouchableOpacity
            style={[styles.saveButton, { shadowColor: colors.primary }, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.saveButtonGradient}
            >
              {isLoading ? (
                <Ionicons name="sync" size={24} color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                  <Text style={[styles.saveButtonText, { color: '#FFFFFF' }]}>Enregistrer</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Delete Account Section */}
        <View style={styles.dangerSection}>
          <Text style={[styles.dangerTitle, { color: colors.textTertiary }]}>Zone de danger</Text>
          <TouchableOpacity 
            style={[styles.dangerButton, { backgroundColor: colors.danger + '10', borderColor: colors.danger + '30' }]}
            onPress={() => showError('Supprimer mon compte', 'Cette action est irréversible. Contactez le support à support@smartqueue.com pour supprimer votre compte.', 'J\'ai compris')}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
            <Text style={[styles.dangerButtonText, { color: colors.danger }]}>Supprimer mon compte</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>

        {AlertComponent}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  iconButton: {
    width: 44,
    height: 44,
  },
  iconButtonBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  formContainer: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
   
  },
  fieldIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldInput: {
    fontSize: 16,
    fontWeight: '600',
    padding: 0,
    height: 24,
  },
  fieldInputDisabled: {
  },
  verifiedBadge: {
    marginLeft: 8,
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  dangerSection: {
    marginTop: 10,
  },
  dangerTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  dangerButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
});

export default PersonalInfoScreen;
