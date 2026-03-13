import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../store/authStore';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { Ionicons } from '@expo/vector-icons';

interface RegisterFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  general?: string;
}

export const RegisterScreen: React.FC = () => {
  const { register, isLoading, error, clearError } = useAuth();
  const { AlertComponent, showInfo, showError, showSuccess } = useCustomAlert();
  const { isLoading: googleLoading, handleGoogleRegister } = useGoogleAuth();
  
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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
  }, [fadeAnim, slideAnim]);

  React.useEffect(() => {
    if (error) {
      clearError();
    }
  }, [formData, error, clearError]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'L\'email n\'est pas valide';
    }

    if (formData.phone && !/^[+]?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Le numéro de téléphone n\'est pas valide';
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (!agreedToTerms) {
      newErrors.general = 'Vous devez accepter les conditions d\'utilisation';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
        password_confirmation: formData.password,
      });
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Register error:', error);
    }
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleGoToLogin = () => {
    router.push('/login');
  };

  const handleGoogleRegisterPress = async () => {
    const result = await handleGoogleRegister(formData.phone || undefined);
    if (result.success) {
      showSuccess('Succès', 'Inscription Google réussie !');
      router.replace('/(tabs)');
    } else if (result.error) {
      showError('Erreur', result.error);
    }
  };

  // const handleTermsPress = () => {
  //   showInfo(
  //     'Conditions d\'utilisation',
  //     'En vous inscrivant, vous acceptez nos conditions d\'utilisation et notre politique de confidentialité.'
  //   );
  // };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleGoToLogin}
            >
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>
              Rejoignez VQS pour la gestion des files d&apos;attente virtuelles{'\n'}
              et le suivi des tickets en temps réel.
            </Text>
          </View>

          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Nom complet"
                placeholderTextColor="#9CA3AF"
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Numéro de téléphone"
                placeholderTextColor="#9CA3AF"
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                keyboardType="phone-pad"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor="#9CA3AF"
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
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              disabled={isLoading}
            >
              <View style={[
                styles.checkbox,
                agreedToTerms && styles.checkboxChecked,
              ]}>
                {agreedToTerms && (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.termsText}>
                J&apos;accepte les <Text style={styles.termsLink}>Conditions d&apos;utilisation</Text> et la{' '}
                <Text style={styles.termsLink}>Politique de confidentialité</Text>
              </Text>
            </TouchableOpacity>

            {errors.general && <Text style={styles.errorText}>{errors.general}</Text>}

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
                <Text style={styles.errorContainerText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.createButton, isLoading && styles.createButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <Text style={styles.createButtonText}>Création...</Text>
              ) : (
                <Text style={styles.createButtonText}>Créer un compte</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Ou s&apos;inscrire avec</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.googleButton, googleLoading && styles.googleButtonLoading]}
              onPress={handleGoogleRegisterPress}
              activeOpacity={0.8}
              disabled={googleLoading || isLoading}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color="#4285F4" />
              ) : (
                <>
                  <View style={styles.googleIconContainer}>
                    <Ionicons name="logo-google" size={18} color="#4285F4" />
                  </View>
                  <Text style={styles.googleButtonText}>S&apos;inscrire avec Google</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Vous avez déjà un compte ? </Text>
              <TouchableOpacity onPress={handleGoToLogin} disabled={isLoading}>
                <Text style={styles.loginLink}>Se connecter</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>

          {AlertComponent}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  termsLink: {
    color: '#2563EB',
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorContainerText: {
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 8,
    flex: 1,
  },
  createButton: {
    backgroundColor: '#60A5FA',
    borderRadius: 25,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 14,
    color: '#6B7280',
    marginHorizontal: 12,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 25,
    height: 48,
    backgroundColor: '#FFFFFF',
    marginBottom: 24,
  },
  googleButtonLoading: {
    opacity: 0.7,
  },
  googleIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginLink: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
});

export default RegisterScreen;
