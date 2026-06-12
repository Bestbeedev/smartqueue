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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import { authApi } from '../../api/authApi';

export const ForgotPasswordScreen: React.FC = () => {
  const colors = useThemeColors();
  const isDark = !!colors.dark?.background;

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Veuillez entrer votre adresse email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Adresse email invalide.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erreur lors de l\'envoi. Veuillez réessayer.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setSent(false);
    setEmail('');
    setError('');
  };

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
              <Ionicons name="lock-open-outline" size={44} color="#FFF" />
            </View>
            <Text style={styles.headerTitle}>Mot de passe oublié</Text>
            <Text style={styles.headerSubtitle}>
              {sent
                ? 'Vérifiez votre boîte email'
                : 'Entrez votre email pour recevoir un lien de réinitialisation'}
            </Text>
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            {sent ? (
              <View style={styles.successContainer}>
                <View style={[styles.successIconContainer, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="checkmark-circle" size={56} color={colors.success} />
                </View>
                <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Email envoyé !</Text>
                <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
                  Si un compte correspond à{' '}
                  <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{email}</Text>
                  , vous recevrez un lien de réinitialisation dans les prochaines minutes.
                </Text>
                <Text style={[styles.spamNote, { color: colors.textTertiary }]}>
                  Vérifiez vos spams si vous ne le trouvez pas.
                </Text>
                <TouchableOpacity
                  style={[styles.retryButton, { borderColor: colors.border }]}
                  onPress={handleRetry}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.retryButtonText, { color: colors.primary }]}>
                    Essayer avec un autre email
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.formContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.formLabel, { color: colors.textTertiary }]}>Adresse email</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceSecondary, borderColor: error ? colors.danger : colors.border }]}>
                  <Ionicons name="mail-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    placeholder="votre@email.com"
                    placeholderTextColor={colors.textTertiary}
                    value={email}
                    onChangeText={(t) => { setEmail(t); setError(''); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
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
                  <LinearGradient
                    colors={['#3B82F6', '#1D4ED8']}
                    style={styles.submitGradient}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.submitButtonText}>Envoyer le lien</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.backLink} onPress={() => router.push('/login')}>
              <Ionicons name="arrow-back-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.backLinkText, { color: colors.textSecondary }]}>
                Retour à la connexion
              </Text>
            </TouchableOpacity>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    paddingHorizontal: 16,
  },

  content: { padding: 20, paddingBottom: 40 },

  formContainer: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 8,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  errorText: { fontSize: 12 },

  submitButton: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  disabledButton: { opacity: 0.7 },
  submitGradient: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  successMessage: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  spamNote: { fontSize: 12, textAlign: 'center', marginBottom: 24 },
  retryButton: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  retryButtonText: { fontSize: 14, fontWeight: '600' },

  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  backLinkText: { fontSize: 14 },
});

export default ForgotPasswordScreen;
