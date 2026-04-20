import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/colors';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { contentAPI } from '../services/api';

interface BrandVoiceForm {
  perception: string[];
  naturalStyle: string;
  neverDo: string[];
  principles: string[];
  customPrinciple: string;
  ctaStyle: string;
  brandWords: string[];
  frequentPhrases: string;
  humorTone: string;
}

const TOTAL_STEPS = 8;

const DEFAULT_FORM: BrandVoiceForm = {
  perception: [],
  naturalStyle: '',
  neverDo: [],
  principles: [],
  customPrinciple: '',
  ctaStyle: '',
  brandWords: [],
  frequentPhrases: '',
  humorTone: '',
};

const isObject = (value: unknown): value is Record<string, any> =>
  typeof value === 'object' && value !== null;

const sanitizeBrandVoice = (raw: unknown): BrandVoiceForm => {
  if (!isObject(raw)) return DEFAULT_FORM;

  return {
    perception: Array.isArray(raw.perception)
      ? raw.perception.filter((item) => typeof item === 'string')
      : [],
    naturalStyle: typeof raw.naturalStyle === 'string' ? raw.naturalStyle : '',
    neverDo: Array.isArray(raw.neverDo)
      ? raw.neverDo.filter((item) => typeof item === 'string')
      : [],
    principles: Array.isArray(raw.principles)
      ? raw.principles.filter((item) => typeof item === 'string')
      : [],
    customPrinciple:
      typeof raw.customPrinciple === 'string' ? raw.customPrinciple : '',
    ctaStyle: typeof raw.ctaStyle === 'string' ? raw.ctaStyle : '',
    brandWords: Array.isArray(raw.brandWords)
      ? raw.brandWords.filter((item) => typeof item === 'string')
      : [],
    frequentPhrases:
      typeof raw.frequentPhrases === 'string' ? raw.frequentPhrases : '',
    humorTone: typeof raw.humorTone === 'string' ? raw.humorTone : '',
  };
};

export default function ContentPreferencesScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<BrandVoiceForm>(DEFAULT_FORM);

  const { data: existingPreferences, isLoading: isLoadingExisting } = useQuery({
    queryKey: ['content-preferences'],
    queryFn: async () => {
      const { data } = await contentAPI.getPreferences();
      return data?.contentPreferences;
    },
  });

  useEffect(() => {
    if (existingPreferences === undefined) return;
    const payload = isObject(existingPreferences)
      ? existingPreferences.brandVoice
      : null;
    setFormData(sanitizeBrandVoice(payload));
  }, [existingPreferences]);

  const saveMutation = useMutation({
    mutationFn: (data: BrandVoiceForm) =>
      contentAPI.savePreferences({
        type: 'brand-voice',
        version: 1,
        completedAt: new Date().toISOString(),
        brandVoice: data,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      await queryClient.invalidateQueries({ queryKey: ['content-preferences'] });
      Alert.alert('Succes', 'Brand Voice salvat cu succes.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error || 'Nu am putut salva Brand Voice.';
      Alert.alert('Eroare', message);
    },
  });

  const completionPercent = useMemo(
    () => Math.round((step / TOTAL_STEPS) * 100),
    [step]
  );

  const toggleWithLimit = (
    field: 'perception' | 'neverDo' | 'principles' | 'brandWords',
    value: string,
    max: number
  ) => {
    const current = formData[field];
    if (current.includes(value)) {
      setFormData({ ...formData, [field]: current.filter((v) => v !== value) });
      return;
    }
    if (current.length >= max) {
      Alert.alert('Limită', `Poți selecta maxim ${max} opțiuni.`);
      return;
    }
    setFormData({ ...formData, [field]: [...current, value] });
  };

  const canGoNext = () => {
    if (step === 1) return formData.perception.length >= 1;
    if (step === 2) return !!formData.naturalStyle;
    if (step === 3) return formData.neverDo.length >= 1;
    if (step === 4) return formData.principles.length >= 1;
    if (step === 5) return !!formData.ctaStyle;
    if (step === 6) return formData.brandWords.length === 3;
    return true;
  };

  const handleNext = () => {
    if (!canGoNext()) {
      Alert.alert('Validare', 'Te rog completează întrebarea curentă.');
      return;
    }
    setStep((prev) => Math.min(TOTAL_STEPS, prev + 1));
  };

  const handleSubmit = () => {
    if (!canGoNext()) {
      Alert.alert('Validare', 'Te rog completează întrebarea curentă.');
      return;
    }
    saveMutation.mutate(formData);
  };

  const SelectOption = ({
    label,
    selected,
    onPress,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.optionCard, selected && styles.optionCardActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.optionText, selected && styles.optionTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.progressHeader}>
        <View style={styles.progressMetaRow}>
          <Text style={styles.progressStepText}>
            Întrebare {step} din {TOTAL_STEPS}
          </Text>
          <Text style={styles.progressPercentText}>Durată: 2-3 minute</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${completionPercent}%` }]} />
        </View>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Brand Voice</Text>
        <Text style={styles.subtitle}>
          Setează stilul tău o singură dată. De acum, toate scripturile sună ca tine.
        </Text>
      </View>

      <Card style={styles.card}>
        {isLoadingExisting && (
          <Text style={styles.loadingText}>Se încarcă Brand Voice existent...</Text>
        )}

        {!isLoadingExisting && step === 1 && (
          <View>
            <Text style={styles.questionTitle}>
              BV1) Cum vrei să fii perceput când cineva îți vede contentul?
            </Text>
            <Text style={styles.hint}>Alege maxim 2.</Text>
            {[
              'Direct și clar',
              'Prietenos și cald',
              'Funny și relatable',
              'Serios și autoritar',
              'Calm și educativ',
              'Energic și “pushy” (pozitiv)',
            ].map((option) => (
              <SelectOption
                key={option}
                label={option}
                selected={formData.perception.includes(option)}
                onPress={() => toggleWithLimit('perception', option, 2)}
              />
            ))}
          </View>
        )}

        {!isLoadingExisting && step === 2 && (
          <View>
            <Text style={styles.questionTitle}>BV2) Cum vorbești, natural?</Text>
            {[
              'Simplu, pe înțelesul tuturor',
              'Mix: simplu + un pic tehnic',
              'Mai tehnic (pentru oameni deja avansați)',
            ].map((option) => (
              <SelectOption
                key={option}
                label={option}
                selected={formData.naturalStyle === option}
                onPress={() => setFormData({ ...formData, naturalStyle: option })}
              />
            ))}
          </View>
        )}

        {!isLoadingExisting && step === 3 && (
          <View>
            <Text style={styles.questionTitle}>
              BV3) Ce NU vrei să faci niciodată în content?
            </Text>
            <Text style={styles.hint}>Alege maxim 2.</Text>
            {[
              'Rușinare / motivare toxică',
              'Promisiuni rapide',
              'Extreme',
              'Prea tehnic / rigid',
              'Clickbait',
            ].map((option) => (
              <SelectOption
                key={option}
                label={option}
                selected={formData.neverDo.includes(option)}
                onPress={() => toggleWithLimit('neverDo', option, 2)}
              />
            ))}
          </View>
        )}

        {!isLoadingExisting && step === 4 && (
          <View>
            <Text style={styles.questionTitle}>
              BV4) Ce principiu vrei să repeți constant în contentul tău?
            </Text>
            <Text style={styles.hint}>Alege maxim 2.</Text>
            {[
              'Consistență > perfecțiune',
              'Simplitate > programe complicate',
              'Tehnică > greutăți mari',
              'Obiceiuri > dietă extremă',
              'Sănătate & performanță > doar estetic',
            ].map((option) => (
              <SelectOption
                key={option}
                label={option}
                selected={formData.principles.includes(option)}
                onPress={() => toggleWithLimit('principles', option, 2)}
              />
            ))}
            <Input
              label="Supapă: Scrie principiul tău (opțional, 1 rând)"
              value={formData.customPrinciple}
              onChangeText={(text) => setFormData({ ...formData, customPrinciple: text })}
              placeholder="Ex: progres mic, zilnic"
              maxLength={120}
            />
          </View>
        )}

        {!isLoadingExisting && step === 5 && (
          <View>
            <Text style={styles.questionTitle}>
              BV5) Care e stilul tău de “call-to-action”?
            </Text>
            {[
              'Soft (comentariu / întrebare)',
              'Direct (scrie-mi X / trimite mesaj)',
              'Educațional (salvează / share)',
              'Mix',
            ].map((option) => (
              <SelectOption
                key={option}
                label={option}
                selected={formData.ctaStyle === option}
                onPress={() => setFormData({ ...formData, ctaStyle: option })}
              />
            ))}
          </View>
        )}

        {!isLoadingExisting && step === 6 && (
          <View>
            <Text style={styles.questionTitle}>
              BV6) Alege 3 cuvinte care descriu cel mai bine brandul tău
            </Text>
            <Text style={styles.hint}>Alege exact 3.</Text>
            {[
              'Clar',
              'Calm',
              'Funny',
              'Empatic',
              'Disciplinat',
              'Științific',
              'Simplu',
              'Motivațional',
              'Elegant',
              'No bullshit',
            ].map((option) => (
              <SelectOption
                key={option}
                label={option}
                selected={formData.brandWords.includes(option)}
                onPress={() => toggleWithLimit('brandWords', option, 3)}
              />
            ))}
          </View>
        )}

        {!isLoadingExisting && step === 7 && (
          <View>
            <Text style={styles.questionTitle}>
              BV7) Ce expresii folosești des în mod natural?
            </Text>
            <Text style={styles.hint}>Opțional, 1-3 exemple.</Text>
            <Input
              value={formData.frequentPhrases}
              onChangeText={(text) => setFormData({ ...formData, frequentPhrases: text })}
              placeholder='Ex: "pe scurt", "nu complica", "începem de aici"'
              maxLength={180}
            />
          </View>
        )}

        {!isLoadingExisting && step === 8 && (
          <View>
            <Text style={styles.questionTitle}>
              BV8) Ce nuanță vrei să aibă umorul tău (dacă folosești)?
            </Text>
            <Text style={styles.hint}>Opțional.</Text>
            {[
              'Deloc',
              'Subtil / ironic light',
              'Relatable (POV, situații)',
              'Direct și mai provocator (fără jigniri)',
            ].map((option) => (
              <SelectOption
                key={option}
                label={option}
                selected={formData.humorTone === option}
                onPress={() => setFormData({ ...formData, humorTone: option })}
              />
            ))}
          </View>
        )}

        <View style={styles.actionsRow}>
          <Button
            title="Înapoi"
            variant="outline"
            onPress={() => setStep((prev) => Math.max(1, prev - 1))}
            disabled={step === 1 || saveMutation.isPending}
            style={styles.actionButton}
          />

          {step < TOTAL_STEPS ? (
            <Button
              title="Următorul"
              onPress={handleNext}
              disabled={saveMutation.isPending}
              style={styles.actionButton}
            />
          ) : (
            <Button
              title={saveMutation.isPending ? 'Se salvează...' : 'Salvează Brand Voice'}
              onPress={handleSubmit}
              loading={saveMutation.isPending}
              style={styles.actionButton}
            />
          )}
        </View>
      </Card>
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
  progressHeader: {
    marginBottom: 18,
  },
  progressMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressStepText: {
    color: colors.text.secondary,
    fontSize: 13,
  },
  progressPercentText: {
    color: colors.brand.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  progressBarTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.dark.border,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.brand.primary,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    color: colors.text.primary,
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    marginBottom: 20,
  },
  loadingText: {
    color: colors.text.secondary,
    marginBottom: 8,
  },
  questionTitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  hint: {
    color: colors.text.secondary,
    fontSize: 13,
    marginBottom: 10,
  },
  optionCard: {
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    backgroundColor: colors.dark.bg,
  },
  optionCardActive: {
    borderColor: colors.brand.primary,
    backgroundColor: `${colors.brand.primary}22`,
  },
  optionText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  optionTextActive: {
    color: colors.brand.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    minWidth: 130,
  },
});
