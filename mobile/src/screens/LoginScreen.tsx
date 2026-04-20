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

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setSubmitError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      setSubmitError(error.response?.data?.message || 'Invalid email or password');
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
              <Text style={styles.title}>Bine ai revenit</Text>
              <Text style={styles.subtitle}>Loghează-te în contul tău</Text>
            </View>

            <View style={styles.formCard}>
              {submitError ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{submitError}</Text>
                </View>
              ) : null}

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
                placeholder="••••••••"
                error={errors.password}
              />

              <View style={styles.inlineLinks}>
                <Text style={styles.keepSignedText}>Ține-mă minte</Text>
                <Pressable onPress={() => navigation.navigate('ForgotPassword' as never)}>
                  <Text style={styles.linkText}>Ai uitat parola?</Text>
                </Pressable>
              </View>

              <Button
                title="Login"
                onPress={handleLogin}
                loading={loading}
                style={styles.button}
              />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Nu ai cont?</Text>
                <Pressable onPress={() => navigation.navigate('Register' as never)}>
                  <Text style={styles.linkText}>Înregistrează-te gratuit</Text>
                </Pressable>
              </View>

              <View style={styles.utilityLinks}>
                <Pressable onPress={() => navigation.navigate('ActivateAccount' as never)}>
                  <Text style={styles.utilityLinkText}>Activează contul</Text>
                </Pressable>
                <Pressable onPress={() => navigation.navigate('ResetPassword' as never)}>
                  <Text style={styles.utilityLinkText}>Reset cu token</Text>
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
  inlineLinks: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 6,
  },
  keepSignedText: {
    color: colors.text.secondary,
    fontSize: 13,
  },
  footer: {
    marginTop: 20,
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
  utilityLinks: {
    marginTop: 18,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    gap: 10,
  },
  utilityLinkText: {
    color: colors.text.muted,
    fontSize: 13,
  },
});
