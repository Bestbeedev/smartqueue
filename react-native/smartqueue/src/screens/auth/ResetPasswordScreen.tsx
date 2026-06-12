import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import { authApi } from '../../api/authApi';

export const ResetPasswordScreen: React.FC = () => {
  const colors = useThemeColors();
  const isDark = !!colors.dark?.background;
  const params = useLocalSearchParams<{ token?: string; email?: string }>();

  const [token, setToken] = useState(params.token || '');
  const [email, setEmail] = useState(params.email || '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');

    if (!email.trim()) { setError('Email requis.'); return; }
    if (!token.trim()) { setError('Token requis.'); return; }
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    if (password !== passwordConfirmation) { setError('Les mots de passe ne correspondent pas.'); return; }

    setLoading(true);
    try {
      await authApi.resetPassword(token.trim(), email.trim(), password, passwordConfirmation);
      setDone(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Token invalide ou expiré. Refaites une demande.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    iconName: string,
    placeholder: string,
    value: string,
    onChange: (t: string) => void,
    opts?: { secure?: boolean; keyboardType?: any; editable?: boolean }
  ) => (
    <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
      <Ionicons name={iconName as any} size={20} color={colors.textTertiary} style={styles.inputIcon} />
      <TextInput
        style={[styles.input, { color: opts?.editable === false ? colors.textSecondary : colors.textPrimary }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={onChange}
        secureTextEntry={opts?.secure && !showPassword}
        keyboardType={opts?.keyboardType || 'default'}
        autoCapitalize="none"
        autoCorrect={false}
        editable={opts?.editable !== false}
      />
      {opts?.secure && (
        <TouchableOpacity onPress={() => setShowPassword(s => !s)} style={styles.eyeButton}>
          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <LinearGradient
            colors={isDark ? ['#1E3A5F', '#2563EB'] : ['#3B82F6', '#1D4ED8']}
            style={styles.header}
          >
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Ionicons name="key-outline" size={44} color="#FFF" />
            </View>
            <Text style={styles.headerTitle}>Nouveau mot de passe</Text>
            <Text style={styles.headerSubtitle}>
              {done ? 'Mot de passe réinitialisé avec succès' : 'Choisissez un nouveau mot de passe sécurisé'}
            </Text>
          </LinearGradient>

          <View style={styles.content}>
            {done ? (
              <View style={styles.successContainer}>
                <View style={[styles.successIconContainer, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="checkmark-circle" size={56} color={colors.success} />
                </View>
                <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Mot de passe modifié !</Text>
                <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
                  Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
                </Text>
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={() => router.replace('/login')}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.loginGradient}>
                    <Text style={styles.loginButtonText}>Se connecter</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.formContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* Email */}
                <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>Email</Text>
                <View style={{ marginBottom: 14 }}>
                  {renderInput('mail-outline', 'votre@email.com', email, setEmail, { keyboardType: 'email-address', editable: !params.email })}
                </View>

                {/* Token (si non fourni via deep link) */}
                {!params.token && (
                  <>
                    <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>Code de réinitialisation</Text>
                    <View style={{ marginBottom: 14 }}>
                      {renderInput('shield-checkmark-outline', 'Collez votre token ici', token, setToken)}
                    </View>
                  </>
                )}

                {/* Nouveau mot de passe */}
                <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>Nouveau mot de passe</Text>
                <View style={{ marginBottom: 14 }}>
                  {renderInput('lock-closed-outline', '8 caractères minimum', password, setPassword, { secure: true })}
                </View>

                {/* Confirmation */}
                <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>Confirmer le mot de passe</Text>
                <View style={{ marginBottom: 4 }}>
                  {renderInput('lock-closed-outline', 'Répétez le mot de passe', passwordConfirmation, setPasswordConfirmation, { secure: true })}
                </View>

                {password && passwordConfirmation && password !== passwordConfirmation && (
                  <Text style={[styles.mismatch, { color: colors.danger }]}>Les mots de passe ne correspondent pas.</Text>
                )}

                {!!error && (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle-outline" size={14} color={colors.danger} />
                    <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.disabledButton]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.submitGradient}>
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.submitButtonText}>Réinitialiser le mot de passe</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {!done && (
              <TouchableOpacity style={styles.backLink} onPress={() => router.push('/forgot-password')}>
                <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.backLinkText, { color: colors.textSecondary }]}>
                  Faire une nouvelle demande
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center', paddingHorizontal: 16 },

  content: { padding: 20, paddingBottom: 40 },

  formContainer: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15 },
  eyeButton: { padding: 4 },
  mismatch: { fontSize: 12, marginBottom: 8 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  errorText: { fontSize: 12, flex: 1 },

  submitButton: { borderRadius: 14, overflow: 'hidden', marginTop: 12 },
  disabledButton: { opacity: 0.7 },
  submitGradient: { height: 48, alignItems: 'center', justifyContent: 'center' },
  submitButtonText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  successContainer: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 8 },
  successIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: { fontSize: 22, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  successMessage: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  loginButton: { width: '100%', borderRadius: 14, overflow: 'hidden' },
  loginGradient: { height: 48, alignItems: 'center', justifyContent: 'center' },
  loginButtonText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  backLinkText: { fontSize: 14 },
});

export default ResetPasswordScreen;
