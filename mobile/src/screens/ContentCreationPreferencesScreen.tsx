import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/colors';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { contentAPI } from '../services/api';

interface ContentCreationData {
  filmingLocation: string;
  naturalContentTypes: string[];
  otherNaturalFormat: string;
  deliveryStyles: string[];
}

const totalSteps = 3;

const filmingLocationOptions = ['Acasă', 'La sală', 'Ambele (în funcție de zi)'];
const naturalContentTypeOptions = [
  'Educațional – nutriție',
  'Educațional – exerciții / antrenamente',
  'Relatable / funny',
  'Story / experiență personală',
];
const deliveryStyleOptions = [
  'Vorbit direct la cameră',
  'Voice-over peste video',
  'Text + B-roll (fără vorbit)',
  'Mix, în funcție de zi',
];

const DEFAULT_FORM: ContentCreationData = {
  filmingLocation: '',
  naturalContentTypes: [],
  otherNaturalFormat: '',
  deliveryStyles: [],
};

export default function ContentCreationPreferencesScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ContentCreationData>(DEFAULT_FORM);

  const preferencesQuery = useQuery({
    queryKey: ['content-preferences'],
    queryFn: async () => {
      const { data } = await contentAPI.getPreferences();
      return data?.contentPreferences;
    },
  });

  useEffect(() => {
    const payload = preferencesQuery.data?.contentCreation;
    if (!payload) return;
    setFormData({
      filmingLocation: payload.filmingLocation || '',
      naturalContentTypes: Array.isArray(payload.naturalContentTypes)
        ? payload.naturalContentTypes
        : [],
      otherNaturalFormat: payload.otherNaturalFormat || '',
      deliveryStyles: Array.isArray(payload.deliveryStyles)
        ? payload.deliveryStyles
        : [],
    });
  }, [preferencesQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (data: ContentCreationData) =>
      contentAPI.savePreferences({
        type: 'content-creation',
        version: 1,
        completedAt: new Date().toISOString(),
        contentCreation: data,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      await queryClient.invalidateQueries({ queryKey: ['content-preferences'] });
      Alert.alert('Succes', 'Preferințele au fost salvate.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert(
        'Eroare',
        error?.response?.data?.error || 'Nu am putut salva preferințele.'
      );
    },
  });

  const toggleMulti = (field: 'naturalContentTypes' | 'deliveryStyles', value: string) => {
    const current = formData[field];
    const updated = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    setFormData({ ...formData, [field]: updated });
  };

  const canGoNext = () => {
    if (step === 1) return !!formData.filmingLocation;
    if (step === 2) return formData.naturalContentTypes.length > 0;
    if (step === 3) return formData.deliveryStyles.length > 0;
    return true;
  };

  const handleContinue = () => {
    if (!canGoNext()) {
      Alert.alert('Validare', 'Completează întrebarea curentă.');
      return;
    }
    setStep((prev) => Math.min(totalSteps, prev + 1));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.stepText}>
          Întrebare {step} din {totalSteps}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` }]} />
        </View>
        <Text style={styles.title}>Cum vrei să creezi content?</Text>
      </View>

      <Card>
        {step === 1 ? (
          <View>
            <Text style={styles.questionTitle}>
              1) Unde îți este cel mai ușor să filmezi content?
            </Text>
            {filmingLocationOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.option,
                  formData.filmingLocation === option && styles.optionActive,
                ]}
                onPress={() => setFormData({ ...formData, filmingLocation: option })}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {step === 2 ? (
          <View>
            <Text style={styles.questionTitle}>
              2) Ce tip de content îți vine cel mai natural?
            </Text>
            {naturalContentTypeOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.option,
                  formData.naturalContentTypes.includes(option) && styles.optionActive,
                ]}
                onPress={() => toggleMulti('naturalContentTypes', option)}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}

            <Input
              label="Alt format (opțional)"
              value={formData.otherNaturalFormat}
              onChangeText={(value) =>
                setFormData({ ...formData, otherNaturalFormat: value })
              }
              placeholder="Scrie aici"
            />
          </View>
        ) : null}

        {step === 3 ? (
          <View>
            <Text style={styles.questionTitle}>
              3) Ce stil de livrare ți se potrivește mai mult?
            </Text>
            {deliveryStyleOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.option,
                  formData.deliveryStyles.includes(option) && styles.optionActive,
                ]}
                onPress={() => toggleMulti('deliveryStyles', option)}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <View style={styles.actionsRow}>
          <Button
            title="Înapoi"
            variant="outline"
            disabled={step === 1}
            onPress={() => setStep((prev) => Math.max(1, prev - 1))}
          />

          {step < totalSteps ? (
            <Button title="Următorul" onPress={handleContinue} disabled={!canGoNext()} />
          ) : (
            <Button
              title="Salvează"
              onPress={() => saveMutation.mutate(formData)}
              loading={saveMutation.isPending}
              disabled={!canGoNext()}
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
  header: {
    marginBottom: 16,
  },
  stepText: {
    color: colors.text.secondary,
    marginBottom: 6,
  },
  progressTrack: {
    height: 8,
    borderRadius: 8,
    backgroundColor: colors.dark.border,
    overflow: 'hidden' as const,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.brand.primary,
  },
  title: {
    color: colors.text.primary,
    fontSize: 26,
    fontWeight: '700' as const,
  },
  questionTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  option: {
    padding: 14,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 10,
    backgroundColor: colors.dark.bg,
    marginBottom: 10,
  },
  optionActive: {
    borderColor: colors.brand.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  optionText: {
    color: colors.text.primary,
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: 12,
    gap: 10,
  },
});
