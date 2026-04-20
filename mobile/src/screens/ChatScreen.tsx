import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { colors } from '../constants/colors';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { chatAPI } from '../services/api';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const starterMessage: ChatMessage = {
  id: 'starter',
  role: 'assistant',
  content:
    'Sunt TrainerOS. Te ajut strict cu marketing fitness: ofertă, poziționare, mesaje de vânzare, funnel și content care convertește.',
};

export default function ChatScreen() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([starterMessage]);

  const chatHistory = useMemo(
    () =>
      messages
        .filter((msg) => msg.id !== 'starter')
        .map((msg) => ({ role: msg.role, content: msg.content })),
    [messages]
  );

  const sendMutation = useMutation({
    mutationFn: async (question: string) => {
      const { data } = await chatAPI.stream({
        message: question,
        history: chatHistory,
      });
      return typeof data === 'string' ? data : '';
    },
    onSuccess: (responseText, question) => {
      setMessages((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: 'user', content: question },
        {
          id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          role: 'assistant',
          content: responseText?.trim() || 'Nu am primit răspuns. Încearcă din nou.',
        },
      ]);
      setInput('');
    },
  });

  const handleSend = () => {
    const question = input.trim();
    if (!question || sendMutation.isPending) return;
    Keyboard.dismiss();
    sendMutation.mutate(question);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>TrainerOS Chat</Text>
        <Text style={styles.subtitle}>Asistent AI pentru marketing fitness și content.</Text>

        <Card style={styles.chatCard}>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            renderItem={({ item }) => (
              <View
                style={[
                  styles.bubble,
                  item.role === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text style={styles.bubbleText}>{item.content}</Text>
              </View>
            )}
          />
        </Card>

        {sendMutation.isError ? (
          <Text style={styles.errorText}>
            {(sendMutation.error as any)?.response?.data?.message ||
              (sendMutation.error as any)?.response?.data?.error ||
              'Nu am putut trimite mesajul.'}
          </Text>
        ) : null}

        <Input
          label="Mesaj"
          value={input}
          onChangeText={setInput}
          placeholder="Scrie mesajul tău..."
          multiline
          numberOfLines={3}
          style={styles.input}
        />

        <Button
          title={sendMutation.isPending ? 'Se trimite...' : 'Trimite'}
          onPress={handleSend}
          loading={sendMutation.isPending}
          disabled={!input.trim()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bg,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: 12,
  },
  chatCard: {
    flex: 1,
    marginBottom: 12,
  },
  messagesList: {
    gap: 10,
  },
  bubble: {
    borderRadius: 12,
    padding: 12,
    maxWidth: '92%',
  },
  userBubble: {
    alignSelf: 'flex-end' as const,
    backgroundColor: colors.brand.primary,
  },
  assistantBubble: {
    alignSelf: 'flex-start' as const,
    backgroundColor: colors.dark.bg,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  bubbleText: {
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  errorText: {
    color: colors.error,
    marginBottom: 8,
    fontSize: 13,
  },
});
