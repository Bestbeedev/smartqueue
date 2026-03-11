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
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../store/authStore';
import { Theme } from '../../theme';
import { RootStackParamList } from '../../navigation/types';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Ionicons } from '@expo/vector-icons';

type RegisterNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

// Types pour le formulaire
interface RegisterFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

// Composant RegisterScreen
export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterNavigationProp>();
  const { register, isLoading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
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

    // Validation nom
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    }

    // Validation email
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'L\'email n\'est pas valide';
    }

    // Validation téléphone (optionnel)
    if (formData.phone && !/^[+]?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Le numéro de téléphone n\'est pas valide';
    }

    // Validation mot de passe
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
    }

    // Validation confirmation mot de passe
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'La confirmation du mot de passe est requise';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    // Validation conditions générales
    if (!agreedToTerms) {
      newErrors.general = 'Vous devez accepter les conditions d\'utilisation';
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
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
      });
    } catch (error) {
      // L'erreur est gérée dans le store
      console.error('Register error:', error);
    }
  };

  // Gérer les changements du formulaire
  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Navigation vers la connexion
  const handleGoToLogin = () => {
    navigation.goBack();
  };

  // Afficher les conditions d'utilisation
  const handleTermsPress = () => {
    Alert.alert(
      'Conditions d\'utilisation',
      'En vous inscrivant, vous acceptez nos conditions d\'utilisation et notre politique de confidentialité.',
      [
        {
          text: 'Fermer',
          style: 'default',
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.content, { backgroundColor: Theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
              Inscription
            </Text>
            <Text style={[styles.subtitle, { color: Theme.colors.textSecondary }]}>
              Créez votre compte pour accéder aux files virtuelles
            </Text>
          </View>

          {/* Formulaire */}
          <Card variant="default" style={styles.formCard}>
            {/* Champ Nom */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={Theme.colors.textTertiary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.input,
                    { color: Theme.colors.textPrimary },
                    errors.name && styles.inputError,
                  ]}
                  placeholder="Nom complet"
                  placeholderTextColor={Theme.colors.textTertiary}
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
              {errors.name && (
                <Text style={[styles.errorText, { color: Theme.colors.danger }]}>
                  {errors.name}
                </Text>
              )}
            </View>

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

            {/* Champ Téléphone */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={Theme.colors.textTertiary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.input,
                    { color: Theme.colors.textPrimary },
                    errors.phone && styles.inputError,
                  ]}
                  placeholder="Numéro de téléphone (optionnel)"
                  placeholderTextColor={Theme.colors.textTertiary}
                  value={formData.phone}
                  onChangeText={(value) => handleInputChange('phone', value)}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
              {errors.phone && (
                <Text style={[styles.errorText, { color: Theme.colors.danger }]}>
                  {errors.phone}
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

            {/* Champ Confirmation Mot de passe */}
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
                    errors.confirmPassword && styles.inputError,
                  ]}
                  placeholder="Confirmer le mot de passe"
                  placeholderTextColor={Theme.colors.textTertiary}
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={Theme.colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={[styles.errorText, { color: Theme.colors.danger }]}>
                  {errors.confirmPassword}
                </Text>
              )}
            </View>

            {/* Conditions d'utilisation */}
            <View style={styles.termsContainer}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
                disabled={isLoading}
              >
                <View style={[
                  styles.checkbox,
                  agreedToTerms && { backgroundColor: Theme.colors.primary },
                ]}>
                  {agreedToTerms && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color="#FFFFFF"
                    />
                  )}
                </View>
              </TouchableOpacity>
              <View style={styles.termsText}>
                <Text style={[styles.termsLabel, { color: Theme.colors.textSecondary }]}>
                  J'accepte les{' '}
                </Text>
                <TouchableOpacity onPress={handleTermsPress} disabled={isLoading}>
                  <Text style={[styles.termsLink, { color: Theme.colors.primary }]}>
                    conditions d'utilisation
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.termsLabel, { color: Theme.colors.textSecondary }]}>
                  {' '}et la{' '}
                </Text>
                <TouchableOpacity onPress={handleTermsPress} disabled={isLoading}>
                  <Text style={[styles.termsLink, { color: Theme.colors.primary }]}>
                    politique de confidentialité
                  </Text>
                </TouchableOpacity>
              </View>
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

            {/* Bouton d'inscription */}
            <Button
              title="S'inscrire"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
              variant="primary"
              fullWidth
              style={styles.registerButton}
            />
          </Card>

          {/* Lien vers la connexion */}
          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: Theme.colors.textSecondary }]}>
              Déjà un compte?{' '}
            </Text>
            <TouchableOpacity onPress={handleGoToLogin} disabled={isLoading}>
              <Text style={[styles.loginLink, { color: Theme.colors.primary }]}>
                Se connecter
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
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
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.xxxl,
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.lg,
  },
  checkboxContainer: {
    marginRight: Theme.spacing.sm,
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsText: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  termsLabel: {
    ...Theme.typography.textStyles.callout,
  },
  termsLink: {
    ...Theme.typography.textStyles.callout,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.sm,
    borderRadius: 8,
    marginBottom: Theme.spacing.lg,
  },
  registerButton: {
    marginTop: Theme.spacing.md,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    ...Theme.typography.textStyles.body,
  },
  loginLink: {
    ...Theme.typography.textStyles.body,
    fontWeight: '600',
  },
});

export default RegisterScreen;
