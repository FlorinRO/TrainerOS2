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

export default function ActivateAccountScreen() {
  const [token, setToken] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await authAPI.activateAccount({ token });
      return data;
    },
    onSuccess: (data: any) => {
      Alert.alert('Cont activat', data?.message || 'Contul a fost activat cu succes.');
      setToken('');
    },
    onError: (error: any) => {
      Alert.alert('Eroare', error?.response?.data?.error || 'Nu am putut activa contul.');
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Activează contul</Text>
        <Text style={styles.subtitle}>Introdu token-ul primit pe email.</Text>

        <Input
          label="Activation token"
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          placeholder="token"
        />

        <Button
          title="Activează"
          onPress={() => mutation.mutate()}
          loading={mutation.isPending}
          disabled={!token.trim()}
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
