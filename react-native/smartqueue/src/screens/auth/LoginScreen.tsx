import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../store/authStore';
import { Theme } from '../../theme';
// eslint-disable-next-line import/no-named-as-default
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Ionicons } from '@expo/vector-icons';

// Types pour le formulaire
interface LoginFormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

// Composant LoginScreen
export const LoginScreen: React.FC = () => {
  const { login, isLoading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Animation du formulaire
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Animation au montage
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Effacer l'erreur quand le formulaire change
  React.useEffect(() => {
    if (error) {
      clearError();
    }
  }, [formData, error, clearError]);

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validation email
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'L\'email n\'est pas valide';
    }

    // Validation mot de passe
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await login({
        email: formData.email.trim(),
        password: formData.password,
      });
      router.replace('/(tabs)');
    } catch (error) {
      // L'erreur est gérée dans le store
      console.error('Login error:', error);
    }
  };

  // Gérer les changements du formulaire
  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Navigation vers l'inscription
  const handleGoToRegister = () => {
    router.push('/onboarding');
  };

  // Mot de passe oublié
  const handleForgotPassword = () => {
    Alert.alert(
      'Mot de passe oublié',
      'Entrez votre adresse email pour recevoir un lien de réinitialisation.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Envoyer',
          onPress: () => {
            // TODO: Implémenter la réinitialisation du mot de passe
            console.log('Send password reset to:', formData.email);
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.content, { backgroundColor: Theme.colors.background }]}>
        {/* Animation du contenu */}
        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: Theme.colors.textPrimary }]}>
              Connexion
            </Text>
            <Text style={[styles.subtitle, { color: Theme.colors.textSecondary }]}>
              Accédez à votre file d'attente virtuelle
            </Text>
          </View>

          {/* Formulaire */}
          <Card variant="default" style={styles.formCard}>
            {/* Champ Email */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={Theme.colors.textTertiary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.input,
                    { color: Theme.colors.textPrimary },
                    errors.email && styles.inputError,
                  ]}
                  placeholder="Adresse email"
                  placeholderTextColor={Theme.colors.textTertiary}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
              {errors.email && (
                <Text style={[styles.errorText, { color: Theme.colors.danger }]}>
                  {errors.email}
                </Text>
              )}
            </View>

            {/* Champ Mot de passe */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={Theme.colors.textTertiary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.input,
                    { color: Theme.colors.textPrimary },
                    errors.password && styles.inputError,
                  ]}
                  placeholder="Mot de passe"
                  placeholderTextColor={Theme.colors.textTertiary}
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={Theme.colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={[styles.errorText, { color: Theme.colors.danger }]}>
                  {errors.password}
                </Text>
              )}
            </View>

            {/* Options */}
            <View style={styles.options}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
                disabled={isLoading}
              >
                <View style={[
                  styles.checkbox,
                  rememberMe && { backgroundColor: Theme.colors.primary },
                ]}>
                  {rememberMe && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color="#FFFFFF"
                    />
                  )}
                </View>
                <Text style={[styles.checkboxLabel, { color: Theme.colors.textSecondary }]}>
                  Se souvenir de moi
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleForgotPassword}
                disabled={isLoading}
              >
                <Text style={[styles.forgotPassword, { color: Theme.colors.primary }]}>
                  Mot de passe oublié?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Erreur générale */}
            {error && (
              <View style={[styles.errorContainer, { backgroundColor: Theme.colors.danger + '10' }]}>
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color={Theme.colors.danger}
                />
                <Text style={[styles.errorText, { color: Theme.colors.danger }]}>
                  {error}
                </Text>
              </View>
            )}

            {/* Bouton de connexion */}
            <Button
              title="Se connecter"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
              variant="primary"
              fullWidth
              style={styles.loginButton}
            />
          </Card>

          {/* Lien vers l'inscription */}
          <View style={styles.registerContainer}>
            <Text style={[styles.registerText, { color: Theme.colors.textSecondary }]}>
              Pas encore de compte?{' '}
            </Text>
            <TouchableOpacity onPress={handleGoToRegister} disabled={isLoading}>
              <Text style={[styles.registerLink, { color: Theme.colors.primary }]}>
                S'inscrire
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.lg,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xxxl,
  },
  title: {
    ...Theme.typography.textStyles.largeTitle,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Theme.spacing.sm,
  },
  subtitle: {
    ...Theme.typography.textStyles.body,
    textAlign: 'center',
  },
  formCard: {
    marginBottom: Theme.spacing.xl,
  },
  inputContainer: {
    marginBottom: Theme.spacing.lg,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: Theme.spacing.md,
    backgroundColor: Theme.colors.inputBackground,
  },
  inputError: {
    borderColor: Theme.colors.danger,
  },
  inputIcon: {
    marginRight: Theme.spacing.sm,
  },
  input: {
    flex: 1,
    ...Theme.typography.textStyles.body,
    paddingVertical: Theme.spacing.md,
    minHeight: 44,
  },
  eyeIcon: {
    padding: Theme.spacing.sm,
  },
  errorText: {
    ...Theme.typography.textStyles.footnote,
    marginTop: Theme.spacing.xs,
    marginLeft: Theme.spacing.sm,
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.sm,
  },
  checkboxLabel: {
    ...Theme.typography.textStyles.callout,
  },
  forgotPassword: {
    ...Theme.typography.textStyles.callout,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.sm,
    borderRadius: 8,
    marginBottom: Theme.spacing.lg,
  },
  loginButton: {
    marginTop: Theme.spacing.md,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    ...Theme.typography.textStyles.body,
  },
  registerLink: {
    ...Theme.typography.textStyles.body,
    fontWeight: '600',
  },
});

export default LoginScreen;
