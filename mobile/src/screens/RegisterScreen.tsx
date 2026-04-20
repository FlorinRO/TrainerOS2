import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../constants/colors';
import Button from '../components/Button';
import Input from '../components/Input';
import ScreenShell from '../components/ScreenShell';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const newErrors: any = {};
    
    if (!name) {
      newErrors.name = 'Name is required';
    }
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setSubmitError('');
    setLoading(true);
    try {
      await register(email, password, name);
      navigation.navigate('Login' as never);
    } catch (error: any) {
      setSubmitError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          'Failed to create account'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.panelWrap}>
            <View style={styles.header}>
              <View style={styles.logoRow}>
                <View style={styles.logoBox}>
                  <Text style={styles.logoLetter}>T</Text>
                </View>
                <Text style={styles.brandName}>TrainerOS</Text>
              </View>
              <Text style={styles.title}>Începe Free Trial</Text>
              <Text style={styles.subtitle}>7 zile gratuit. Fără card necesar.</Text>
            </View>

            <View style={styles.formCard}>
              {submitError ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{submitError}</Text>
                </View>
              ) : null}

              <Input
                label="Nume complet"
                value={name}
                onChangeText={setName}
                placeholder="Ion Popescu"
                error={errors.name}
              />

              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="nume@example.com"
                error={errors.email}
              />

              <Input
                label="Parolă"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                placeholder="Minim 6 caractere"
                error={errors.password}
              />

              <Input
                label="Confirmă parola"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={true}
                placeholder="••••••••"
                error={errors.confirmPassword}
              />

              <Input
                label="Cod promoțional (opțional)"
                value={promoCode}
                onChangeText={(value) => setPromoCode(value.toUpperCase())}
                placeholder="ex: LAUNCH2026"
              />

              {promoCode === 'LAUNCH2026' ? (
                <View style={styles.successBanner}>
                  <Text style={styles.successBannerText}>
                    Cod valid! Prima lună: €12.99 în loc de €19.9
                  </Text>
                </View>
              ) : null}

              <Button
                title="Creează Cont Gratuit"
                onPress={handleRegister}
                loading={loading}
                style={styles.button}
              />

              <View style={styles.benefitsCard}>
                <Text style={styles.benefitText}>✓ 7 zile trial gratuit</Text>
                <Text style={styles.benefitText}>✓ Nu e nevoie de card</Text>
                <Text style={styles.benefitText}>✓ Poți anula oricând</Text>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Ai deja cont?</Text>
                <Pressable onPress={() => navigation.navigate('Login' as never)}>
                  <Text style={styles.linkText}>Login</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center' as const,
    padding: 24,
    paddingTop: 28,
    paddingBottom: 28,
  },
  panelWrap: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center' as const,
  },
  header: {
    alignItems: 'center' as const,
    marginBottom: 28,
  },
  logoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 16,
  },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.brand.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  logoLetter: {
    color: colors.text.darkOnAccent,
    fontSize: 24,
    fontWeight: '700' as const,
  },
  brandName: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: '700' as const,
  },
  title: {
    fontSize: 30,
    fontWeight: '700' as const,
    color: colors.text.primary,
    marginBottom: 6,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center' as const,
  },
  formCard: {
    width: '100%',
    borderRadius: 28,
    padding: 20,
    backgroundColor: colors.dark.cardStrong,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  button: {
    marginTop: 8,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.10)',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  errorBannerText: {
    color: colors.error,
    fontSize: 13,
  },
  successBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.30)',
    borderRadius: 14,
    padding: 12,
    marginTop: -4,
    marginBottom: 6,
  },
  successBannerText: {
    color: '#86efac',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  benefitsCard: {
    marginTop: 18,
    backgroundColor: 'rgba(140, 248, 212, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(140, 248, 212, 0.30)',
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  benefitText: {
    color: colors.text.secondary,
    fontSize: 13,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center' as const,
  },
  footerText: {
    color: colors.text.secondary,
    marginBottom: 6,
  },
  linkText: {
    color: colors.brand.primary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
