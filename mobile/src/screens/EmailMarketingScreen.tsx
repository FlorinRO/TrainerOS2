import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { colors } from '../constants/colors';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { emailAPI } from '../services/api';

type Objective = 'lead-magnet' | 'nurture' | 'sales' | 'reengagement';
type EmailType = 'single' | 'welcome' | 'promo' | 'newsletter';
type Tone = 'direct' | 'empathetic' | 'authoritative' | 'friendly';
type Language = 'ro' | 'en';

interface EmailResult {
  subjectOptions: string[];
  previewText: string;
  body: string;
  cta: string;
  angles: string[];
}

function SelectRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: T; text: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.selectWrapper}>
      <Text style={styles.selectLabel}>{label}</Text>
      <View style={styles.optionRow}>
        {options.map((opt) => (
          <Button
            key={opt.value}
            title={opt.text}
            variant={value === opt.value ? 'primary' : 'outline'}
            onPress={() => onChange(opt.value)}
            style={styles.optionButton}
            textStyle={styles.optionButtonText}
          />
        ))}
      </View>
    </View>
  );
}

export default function EmailMarketingScreen() {
  const [topic, setTopic] = useState('');
  const [objective, setObjective] = useState<Objective>('nurture');
  const [emailType, setEmailType] = useState<EmailType>('single');
  const [tone, setTone] = useState<Tone>('friendly');
  const [language, setLanguage] = useState<Language>('ro');
  const [offer, setOffer] = useState('');
  const [audiencePain, setAudiencePain] = useState('');
  const [ctaGoal, setCtaGoal] = useState('');

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await emailAPI.generate({
        topic,
        objective,
        emailType,
        tone,
        language,
        offer: offer.trim() || undefined,
        audiencePain: audiencePain.trim() || undefined,
        ctaGoal: ctaGoal.trim() || undefined,
      });
      return data as EmailResult;
    },
  });

  const result = generateMutation.data;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>EMAIL MARKETING AI</Text>
      <Text style={styles.title}>Generează emailuri care convertesc</Text>
      <Text style={styles.subtitle}>
        TrainerOS folosește automat contextul tău global (nișă, ICP, poziționare și preferințe)
        pentru a crea emailuri relevante pentru business-ul tău fitness.
      </Text>

      <Card style={styles.card}>
        <Text style={styles.formTitle}>Email</Text>

        <Input
          label="Subiect email"
          value={topic}
          onChangeText={setTopic}
          placeholder="Ex: De ce mamele după sarcină nu slăbesc deși mănâncă puțin"
        />

        <SelectRow
          label="Obiectiv"
          value={objective}
          onChange={(value) => setObjective(value as Objective)}
          options={[
            { value: 'nurture', text: 'Încălzire lead-uri' },
            { value: 'lead-magnet', text: 'Lead magnet' },
            { value: 'sales', text: 'Vânzare' },
            { value: 'reengagement', text: 'Reactivare' },
          ]}
        />

        <SelectRow
          label="Tip email"
          value={emailType}
          onChange={(value) => setEmailType(value as EmailType)}
          options={[
            { value: 'single', text: 'Email unic' },
            { value: 'welcome', text: 'Bun venit' },
            { value: 'promo', text: 'Promoțional' },
            { value: 'newsletter', text: 'Newsletter' },
          ]}
        />

        <SelectRow
          label="Ton"
          value={tone}
          onChange={(value) => setTone(value as Tone)}
          options={[
            { value: 'friendly', text: 'Prietenos' },
            { value: 'empathetic', text: 'Empatic' },
            { value: 'authoritative', text: 'Autoritar' },
            { value: 'direct', text: 'Direct' },
          ]}
        />

        <SelectRow
          label="Limbă"
          value={language}
          onChange={(value) => setLanguage(value as Language)}
          options={[
            { value: 'ro', text: 'Română' },
            { value: 'en', text: 'English' },
          ]}
        />

        <Input
          label="Ofertă (opțional)"
          value={offer}
          onChangeText={setOffer}
          placeholder="Ex: Program 12 săptămâni pentru mame"
        />

        <Input
          label="Pain point audiență (opțional)"
          value={audiencePain}
          onChangeText={setAudiencePain}
          placeholder="Ex: nu au timp, energie scăzută, lipsă consistență"
        />

        <Input
          label="Scop CTA (opțional)"
          value={ctaGoal}
          onChangeText={setCtaGoal}
          placeholder="Ex: răspuns în email / DM keyword / booking call"
        />

        <Button
          title="Generează Email →"
          onPress={() => generateMutation.mutate()}
          loading={generateMutation.isPending}
          disabled={topic.trim().length < 5}
        />

        {generateMutation.isError ? (
          <Text style={styles.errorText}>
            {(generateMutation.error as any)?.response?.data?.error || 'Nu am putut genera emailul.'}
          </Text>
        ) : null}
      </Card>

      {result ? (
        <Card>
          <Text style={styles.resultTitle}>Output</Text>

          <Text style={styles.blockTitle}>Subject options</Text>
          {result.subjectOptions?.map((subject, idx) => (
            <Text key={`${subject}-${idx}`} style={styles.resultText}>
              {idx + 1}. {subject}
            </Text>
          ))}

          <Text style={styles.blockTitle}>Preview text</Text>
          <Text style={styles.resultText}>{result.previewText}</Text>

          <Text style={styles.blockTitle}>Email body</Text>
          <Text style={styles.resultText}>{result.body}</Text>

          <Text style={styles.blockTitle}>CTA</Text>
          <Text style={styles.resultText}>{result.cta}</Text>

          <Text style={styles.blockTitle}>Angles</Text>
          {result.angles?.map((angle, idx) => (
            <Text key={`${angle}-${idx}`} style={styles.resultText}>• {angle}</Text>
          ))}
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bg,
  },
  content: {
    padding: 20,
  },
  eyebrow: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '700' as const,
    marginBottom: 6,
    letterSpacing: 0.7,
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
    marginBottom: 14,
  },
  card: {
    marginBottom: 14,
  },
  formTitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  selectWrapper: {
    marginBottom: 12,
  },
  selectLabel: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  optionButton: {
    minHeight: 36,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  optionButtonText: {
    fontSize: 12,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: 10,
  },
  resultTitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  blockTitle: {
    color: colors.brand.primary,
    fontSize: 13,
    fontWeight: '700' as const,
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  resultText: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
