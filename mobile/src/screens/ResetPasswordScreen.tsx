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

export default function ResetPasswordScreen() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await authAPI.resetPassword({ token, password });
      return data;
    },
    onSuccess: (data: any) => {
      Alert.alert('Parolă actualizată', data?.message || 'Parola a fost resetată cu succes.');
      setToken('');
      setPassword('');
      setConfirmPassword('');
    },
    onError: (error: any) => {
      Alert.alert('Eroare', error?.response?.data?.error || 'Nu am putut reseta parola.');
    },
  });

  const canSubmit =
    token.trim().length > 0 && password.length >= 6 && confirmPassword === password;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Setează parolă nouă</Text>
        <Text style={styles.subtitle}>Introdu token-ul din email și parola nouă.</Text>

        <Input
          label="Reset token"
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          placeholder="token"
        />

        <Input
          label="Parolă nouă"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="minimum 6 caractere"
        />

        <Input
          label="Confirmă parola"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          placeholder="repetă parola"
          error={confirmPassword && confirmPassword !== password ? 'Parolele nu coincid' : undefined}
        />

        <Button
          title="Resetează parola"
          onPress={() => mutation.mutate()}
          loading={mutation.isPending}
          disabled={!canSubmit}
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
