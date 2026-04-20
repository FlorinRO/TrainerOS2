import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { colors } from '../constants/colors';
import Input from '../components/Input';
import Button from '../components/Button';
import { authAPI } from '../services/api';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await authAPI.forgotPassword({ email });
      return data;
    },
    onSuccess: (data: any) => {
      Alert.alert('Email trimis', data?.message || 'Verifică emailul pentru link-ul de resetare.');
    },
    onError: (error: any) => {
      Alert.alert('Eroare', error?.response?.data?.error || 'Nu am putut trimite link-ul.');
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Resetare parolă</Text>
        <Text style={styles.subtitle}>Introdu adresa de email asociată contului tău.</Text>

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
        />

        <Button
          title="Trimite link de resetare"
          onPress={() => mutation.mutate()}
          loading={mutation.isPending}
          disabled={!email.trim()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bg,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center' as const,
    padding: 24,
  },
  title: {
    color: colors.text.primary,
    fontSize: 30,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: 20,
  },
});
