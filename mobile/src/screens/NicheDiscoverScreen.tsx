import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { colors } from '../constants/colors';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { nicheAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface PhaseAData {
  genderPreference: string[];
  ageRanges: string[];
  customAgeRange: string;
  valueSituations: string[];
  valueSituationsOther: string;
  commonProblems: string[];
  commonProblemsCustom: string;
  primaryOutcome: string;
  primaryOutcomeDetail: string;
  avoidContent: string[];
  avoidContentOther: string;
}

interface PhaseCData {
  awarenessLevel: string;
  identityStory: string;
  emotionalBlock: string;
  emotionalBlockCustom: string;
  dominantGoals: string[];
  primaryGoal: string;
  wakeUpTime: string;
  jobType: 'sedentar' | 'activ' | 'mixt' | '';
  sittingTime: '<4h' | '4-6h' | '6-8h' | '8h+' | '';
  morning: string[];
  lunch: string[];
  evening: string[];
  definingSituations: string[];
  kidsImpact: string[];
  activeStatus: string[];
  physicalJobIssue: string[];
  painDetails: string[];
  lifestyleSpecific: string;
}

interface NicheVariant {
  id: number;
  title: string;
  description: string;
}

interface GeneratedNicheResult {
  niche: string;
  idealClient: string;
  positioning: string;
}

export default function NicheDiscoverScreen() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const [phase, setPhase] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [stepA, setStepA] = useState(1);
  const [stepC, setStepC] = useState(1);
  const [phaseAError, setPhaseAError] = useState<string | null>(null);
  const [phaseCError, setPhaseCError] = useState<string | null>(null);

  const [phaseAData, setPhaseAData] = useState<PhaseAData>({
    genderPreference: [],
    ageRanges: [],
    customAgeRange: '',
    valueSituations: [],
    valueSituationsOther: '',
    commonProblems: [],
    commonProblemsCustom: '',
    primaryOutcome: '',
    primaryOutcomeDetail: '',
    avoidContent: [],
    avoidContentOther: '',
  });

  const [nicheVariants, setNicheVariants] = useState<NicheVariant[]>([
    { id: 1, title: 'Varianta 1', description: 'Loading...' },
    { id: 2, title: 'Varianta 2', description: 'Loading...' },
    { id: 3, title: 'Varianta 3', description: 'Loading...' },
  ]);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [generatedResult, setGeneratedResult] = useState<GeneratedNicheResult | null>(null);

  const [phaseCData, setPhaseCData] = useState<PhaseCData>({
    awarenessLevel: '',
    identityStory: '',
    emotionalBlock: '',
    emotionalBlockCustom: '',
    dominantGoals: [],
    primaryGoal: '',
    wakeUpTime: '',
    jobType: '',
    sittingTime: '',
    morning: [],
    lunch: [],
    evening: [],
    definingSituations: [],
    kidsImpact: [],
    activeStatus: [],
    physicalJobIssue: [],
    painDetails: [],
    lifestyleSpecific: '',
  });

  const normalizeText = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const mapGenderPreference = (prefs: string[]) => {
    const normalized = prefs.map(normalizeText);
    const hasWomen = normalized.some((value) => value.includes('femei'));
    const hasMen = normalized.some((value) => value.includes('barbati'));
    const hasBoth = normalized.some((value) => value.includes('ambele'));
    if (hasBoth || (hasWomen && hasMen)) return 'ambele';
    if (hasWomen) return 'femei';
    if (hasMen) return 'barbati';
    return '';
  };

  const buildPhaseAPayload = (data: PhaseAData) => {
    const ageRanges = [...data.ageRanges];
    const customAge = data.customAgeRange.trim();
    if (customAge) ageRanges.push(customAge);

    const valueSituations = [...data.valueSituations];
    const valueOther = data.valueSituationsOther.trim();
    if (valueOther) valueSituations.push(valueOther);

    const commonProblems = [...data.commonProblems];
    const commonCustom = data.commonProblemsCustom.trim();
    if (commonCustom) commonProblems.push(commonCustom);

    const avoidContent = [...data.avoidContent];
    const avoidOther = data.avoidContentOther.trim();
    if (avoidOther) avoidContent.push(avoidOther);

    const primaryOutcomeBase = data.primaryOutcome.trim() || data.primaryOutcomeDetail.trim();
    const primaryOutcomeDetail = data.primaryOutcomeDetail.trim();
    const primaryOutcome =
      primaryOutcomeBase && primaryOutcomeDetail && data.primaryOutcome.trim()
        ? `${data.primaryOutcome.trim()} (${primaryOutcomeDetail})`
        : primaryOutcomeBase;

    return {
      gender: (mapGenderPreference(data.genderPreference) || 'ambele') as 'femei' | 'barbati' | 'ambele',
      ageRanges,
      valueSituations,
      commonProblems,
      primaryOutcome,
      avoidContent,
    };
  };

  const toggleArrayA = (field: keyof PhaseAData, value: string) => {
    const current = phaseAData[field] as string[];
    if (current.includes(value)) {
      setPhaseAData({ ...phaseAData, [field]: current.filter((v) => v !== value) });
      return;
    }
    setPhaseAData({ ...phaseAData, [field]: [...current, value] });
  };

  const toggleArrayC = (field: keyof PhaseCData, value: string) => {
    const current = phaseCData[field] as string[];
    if (current.includes(value)) {
      setPhaseCData({ ...phaseCData, [field]: current.filter((v) => v !== value) });
      return;
    }
    setPhaseCData({ ...phaseCData, [field]: [...current, value] });
  };

  const extractVariants = (response: any): NicheVariant[] =>
    (Array.isArray(response?.data?.variants) ? response.data.variants : [])
      .map((variant: { variant?: string; title?: string; description?: string }, index: number) => ({
        id: index + 1,
        title: (variant.variant || variant.title || '').trim() || `Varianta ${index + 1}`,
        description: (variant.description || '').trim(),
      }))
      .filter((variant: NicheVariant) => variant.title.length > 0)
      .slice(0, 3);

  const variantsMutation = useMutation({
    mutationFn: () => nicheAPI.generateVariants(buildPhaseAPayload(phaseAData)),
    onSuccess: (response) => {
      const mapped = extractVariants(response);
      if (!mapped.length) {
        setPhaseAError('Nu am primit variante valide. Încearcă din nou.');
        return;
      }
      setSelectedVariant(null);
      setNicheVariants(mapped);
      setPhase('B');
    },
    onError: (error: any) => {
      Alert.alert('Eroare', error?.response?.data?.error || 'Ceva nu a mers bine');
    },
  });

  const generateMutation = useMutation({
    mutationFn: (data: any) => nicheAPI.generateDiscover({ ...data, saveToProfile: true }),
    onSuccess: async (response) => {
      await refreshUser();
      await queryClient.invalidateQueries({ queryKey: ['user-me'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setGeneratedResult(response.data);
      setPhase('D');
      Alert.alert('Succes', 'Nișa a fost salvată automat în cont.');
    },
    onError: (error: any) => {
      Alert.alert('Eroare', error?.response?.data?.error || 'Ceva nu a mers bine');
    },
  });

  const handlePhaseAComplete = () => {
    const payload = buildPhaseAPayload(phaseAData);
    if (!payload.gender) {
      setPhaseAError('Selectează cu cine rezonezi cel mai mult (femei, bărbați sau ambele).');
      return;
    }
    if (!payload.ageRanges.length) {
      setPhaseAError('Selectează cel puțin un interval de vârstă.');
      return;
    }
    if (!payload.valueSituations.length) {
      setPhaseAError('Selectează cel puțin o situație unde aduci valoare.');
      return;
    }
    if (!payload.commonProblems.length) {
      setPhaseAError('Selectează cel puțin o problemă comună.');
      return;
    }
    if (!payload.primaryOutcome || payload.primaryOutcome.length < 2) {
      setPhaseAError('Alege un obiectiv principal sau completează câmpul opțional.');
      return;
    }
    setPhaseAError(null);
    setGeneratedResult(null);
    variantsMutation.mutate();
  };

  const handleSelectVariant = () => {
    if (selectedVariant === null) {
      Alert.alert('Validare', 'Alege o variantă');
      return;
    }
    setPhase('C');
    setStepC(1);
    setPhaseCError(null);
  };

  const handlePhaseCNext = () => {
    if (stepC === 1 && !phaseCData.awarenessLevel) {
      setPhaseCError('Selectează nivelul dominant de awareness.');
      return;
    }
    if (stepC === 2 && !phaseCData.identityStory) {
      setPhaseCError('Selectează povestea dominantă de identitate.');
      return;
    }
    if (stepC === 4 && phaseCData.dominantGoals.length === 0) {
      setPhaseCError('Selectează cel puțin un obiectiv dominant.');
      return;
    }
    setPhaseCError(null);
    setStepC(stepC + 1);
  };

  const handleSubmit = () => {
    if (selectedVariant === null) {
      Alert.alert('Validare', 'Alege o variantă');
      return;
    }

    const phaseAPayload = buildPhaseAPayload(phaseAData);
    const selected = nicheVariants[selectedVariant - 1];
    if (!phaseCData.awarenessLevel) {
      setPhaseCError('Selectează nivelul dominant de awareness.');
      return;
    }
    if (!phaseCData.identityStory) {
      setPhaseCError('Selectează povestea dominantă de identitate.');
      return;
    }
    if (phaseCData.dominantGoals.length === 0) {
      setPhaseCError('Selectează cel puțin un obiectiv dominant.');
      return;
    }

    const clientStatement =
      phaseCData.identityStory.trim() ||
      phaseCData.emotionalBlockCustom.trim() ||
      phaseCData.emotionalBlock.trim();
    const primaryGoal = phaseCData.primaryGoal.trim() || phaseCData.dominantGoals[0] || '';

    const notesParts: string[] = [];
    if (phaseCData.kidsImpact.length) notesParts.push(`Impact copii: ${phaseCData.kidsImpact.join(', ')}`);
    if (phaseCData.activeStatus.length) notesParts.push(`Status activ: ${phaseCData.activeStatus.join(', ')}`);
    if (phaseCData.physicalJobIssue.length) notesParts.push(`Job fizic: ${phaseCData.physicalJobIssue.join(', ')}`);
    if (phaseCData.painDetails.length) notesParts.push(`Dureri/limitări: ${phaseCData.painDetails.join(', ')}`);
    if (phaseCData.lifestyleSpecific.trim()) notesParts.push(`Lifestyle: ${phaseCData.lifestyleSpecific.trim()}`);

    const payload = {
      ...phaseAPayload,
      selectedNiche: selected?.title || '',
      awarenessLevel: phaseCData.awarenessLevel,
      identityStory: phaseCData.identityStory,
      clientStatement,
      dominantGoals: phaseCData.dominantGoals,
      primaryGoal,
      wakeUpTime: phaseCData.wakeUpTime || undefined,
      jobType: phaseCData.jobType || undefined,
      sittingTime: phaseCData.sittingTime || undefined,
      morning: phaseCData.morning,
      lunch: phaseCData.lunch,
      evening: phaseCData.evening,
      definingSituations: phaseCData.definingSituations,
      notes: notesParts.length ? notesParts.join('\n') : undefined,
    };

    generateMutation.mutate(payload);
  };

  const showKidsModule = useMemo(
    () => phaseCData.definingSituations.includes('Au copii'),
    [phaseCData.definingSituations]
  );
  const showActiveModule = useMemo(
    () => phaseCData.definingSituations.includes('Sunt deja activi / merg la sală'),
    [phaseCData.definingSituations]
  );
  const showPhysicalJobModule = useMemo(
    () =>
      phaseCData.definingSituations.includes('Au un job foarte solicitant fizic') ||
      phaseCData.definingSituations.includes('Lucrează în ture / program neregulat'),
    [phaseCData.definingSituations]
  );
  const showPainModule = useMemo(
    () => phaseCData.definingSituations.includes('Au dureri / limitări fizice'),
    [phaseCData.definingSituations]
  );

  const RadioOption = ({
    label,
    checked,
    onPress,
  }: {
    label: string;
    checked: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.optionItem, checked && styles.optionItemActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.radio, checked && styles.radioActive]} />
      <Text style={[styles.optionText, checked && styles.optionTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const CheckboxOption = ({
    label,
    checked,
    onPress,
  }: {
    label: string;
    checked: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.optionItem, checked && styles.optionItemActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.checkbox, checked && styles.checkboxActive]} />
      <Text style={[styles.optionText, checked && styles.optionTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const PhaseIndicator = () => (
      <View style={styles.phaseIndicatorWrap}>
      <View style={[styles.phaseNodeWrap, phase === 'A' ? styles.phaseActive : phase === 'B' || phase === 'C' || phase === 'D' ? styles.phaseDone : styles.phaseIdle]}>
        <View style={[styles.phaseNode, phase === 'A' ? styles.phaseNodeActive : phase === 'B' || phase === 'C' || phase === 'D' ? styles.phaseNodeDone : styles.phaseNodeIdle]}>
          <Text style={styles.phaseNodeText}>A</Text>
        </View>
        <Text style={styles.phaseLabel}>Descoperire</Text>
      </View>
      <View style={styles.phaseLine} />
      <View style={[styles.phaseNodeWrap, phase === 'B' ? styles.phaseActive : phase === 'C' || phase === 'D' ? styles.phaseDone : styles.phaseIdle]}>
        <View style={[styles.phaseNode, phase === 'B' ? styles.phaseNodeActive : phase === 'C' || phase === 'D' ? styles.phaseNodeDone : styles.phaseNodeIdle]}>
          <Text style={styles.phaseNodeText}>B</Text>
        </View>
        <Text style={styles.phaseLabel}>Propunere</Text>
      </View>
      <View style={styles.phaseLine} />
      <View style={[styles.phaseNodeWrap, phase === 'C' || phase === 'D' ? styles.phaseActive : styles.phaseIdle]}>
        <View style={[styles.phaseNode, phase === 'C' || phase === 'D' ? styles.phaseNodeActive : styles.phaseNodeIdle]}>
          <Text style={styles.phaseNodeText}>C</Text>
        </View>
        <Text style={styles.phaseLabel}>Rafinare</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Află Nișa Ta</Text>
        <Text style={styles.subtitle}>Descoperă direcția perfectă pentru tine - pas cu pas</Text>
      </View>

      <PhaseIndicator />

      {phase === 'A' && (
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${(stepA / 6) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>Faza A - Pas {stepA} din 6</Text>
        </View>
      )}

      {phase === 'C' && (
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${(stepC / 7) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>Faza C - Pas {stepC} din 7</Text>
        </View>
      )}

      <Card style={styles.card}>
        {phase === 'A' && (
          <View>
            {phaseAError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{phaseAError}</Text>
              </View>
            )}

            {stepA === 1 && (
              <View>
                <Text style={styles.sectionTitle}>
                  A1. Cu ce tip de oameni simți că rezonezi cel mai natural când lucrezi?
                </Text>
                {['Femei', 'Bărbați', 'Rezonez la fel cu ambele'].map((option) => (
                  <CheckboxOption
                    key={option}
                    label={option}
                    checked={phaseAData.genderPreference.includes(option)}
                    onPress={() => toggleArrayA('genderPreference', option)}
                  />
                ))}
              </View>
            )}

            {stepA === 2 && (
              <View>
                <Text style={styles.sectionTitle}>
                  A2. Când lucrurile merg bine cu clienții tăi, cam ce vârstă au?
                </Text>
                {['18–25', '25–35', '35–45', '45+'].map((age) => (
                  <CheckboxOption
                    key={age}
                    label={age}
                    checked={phaseAData.ageRanges.includes(age)}
                    onPress={() => toggleArrayA('ageRanges', age)}
                  />
                ))}
                <Input
                  label="Alt interval de vârstă (opțional)"
                  value={phaseAData.customAgeRange}
                  onChangeText={(value) => setPhaseAData({ ...phaseAData, customAgeRange: value })}
                  placeholder="ex: 30-40"
                />
              </View>
            )}

            {stepA === 3 && (
              <View>
                <Text style={styles.sectionTitle}>
                  A3. În ce situații simți că aduci cea mai mare valoare ca antrenor?
                </Text>
                {[
                  'Când oamenii sunt ocupați și dezorganizați',
                  'Când vor estetic, dar nu se țin',
                  'Când sunt la început și au nevoie de ghidaj',
                  'Când știu ce să facă, dar nu au structură',
                  'Când au dureri sau limitări și le e frică să înceapă',
                ].map((situation) => (
                  <CheckboxOption
                    key={situation}
                    label={situation}
                    checked={phaseAData.valueSituations.includes(situation)}
                    onPress={() => toggleArrayA('valueSituations', situation)}
                  />
                ))}
                <Input
                  label="Alt tip de situație în care te simți foarte util? (opțional)"
                  value={phaseAData.valueSituationsOther}
                  onChangeText={(value) => setPhaseAData({ ...phaseAData, valueSituationsOther: value })}
                  placeholder="ex: când au încercat multe și nimic nu a funcționat..."
                />
              </View>
            )}

            {stepA === 4 && (
              <View>
                <Text style={styles.sectionTitle}>
                  A4. Ce problemă explici cel mai des oamenilor, aproape zilnic?
                </Text>
                {[
                  'Lipsa de consecvență',
                  'Lipsa de energie',
                  'Confuzia (nu știu ce să fac)',
                  'Alimentația haotică',
                  'Frica / rușinea de sală',
                ].map((problem) => (
                  <CheckboxOption
                    key={problem}
                    label={problem}
                    checked={phaseAData.commonProblems.includes(problem)}
                    onPress={() => toggleArrayA('commonProblems', problem)}
                  />
                ))}
                <Input
                  label="Cum o spui tu, pe scurt? (opțional)"
                  value={phaseAData.commonProblemsCustom}
                  onChangeText={(value) => setPhaseAData({ ...phaseAData, commonProblemsCustom: value })}
                  placeholder="ex: nu știu cum să își organizeze mesele..."
                />
              </View>
            )}

            {stepA === 5 && (
              <View>
                <Text style={styles.sectionTitle}>
                  A5. Dacă ai putea rezolva UN singur lucru pentru oameni în următoarele 2-3 luni, care ar fi?
                </Text>
                {[
                  'Să se țină constant',
                  'Să slăbească',
                  'Să se tonifieze / să arate mai bine',
                  'Să aibă mai multă energie',
                  'Să scape de dureri',
                ].map((outcome) => (
                  <RadioOption
                    key={outcome}
                    label={outcome}
                    checked={phaseAData.primaryOutcome === outcome}
                    onPress={() => setPhaseAData({ ...phaseAData, primaryOutcome: outcome })}
                  />
                ))}
                <Input
                  label="Ce ar însemna «rezolvat» pentru tine? (opțional)"
                  value={phaseAData.primaryOutcomeDetail}
                  onChangeText={(value) => setPhaseAData({ ...phaseAData, primaryOutcomeDetail: value })}
                  placeholder="ex: să nu mai sară peste mese..."
                />
              </View>
            )}

            {stepA === 6 && (
              <View>
                <Text style={styles.sectionTitle}>
                  A6. Ce tip de content NU vrei să faci, chiar dacă ar prinde?
                </Text>
                {[
                  'Promisiuni rapide / rezultate peste noapte',
                  'Motivare agresivă / rușinare',
                  'Conținut extrem (dietă, antrenamente)',
                  'Prea tehnic / rigid',
                  'Prea soft, fără rezultate reale',
                ].map((content) => (
                  <CheckboxOption
                    key={content}
                    label={content}
                    checked={phaseAData.avoidContent.includes(content)}
                    onPress={() => toggleArrayA('avoidContent', content)}
                  />
                ))}
                <Input
                  label="Alt lucru care nu te reprezintă? (opțional)"
                  value={phaseAData.avoidContentOther}
                  onChangeText={(value) => setPhaseAData({ ...phaseAData, avoidContentOther: value })}
                  placeholder="ex: postări cu muzică puternică..."
                />
              </View>
            )}
          </View>
        )}

        {phase === 'B' && (
          <View>
            <Text style={styles.sectionTitle}>
              Pe baza răspunsurilor tale, asta pare direcția cea mai potrivită pentru tine acum:
            </Text>
            <Text style={styles.helperText}>
              Alege varianta care crezi că se potrivește cel mai bine pentru tine. Nu e o decizie finală. Hai să o rafinăm rapid ca să pot crea content foarte precis.
            </Text>

            {variantsMutation.isPending && (
              <View style={styles.loadingWrap}>
                <Text style={styles.helperText}>Generez cele 3 variante de nișă...</Text>
              </View>
            )}

            {!variantsMutation.isPending && nicheVariants.map((variant) => (
              <TouchableOpacity
                key={variant.id}
                style={[
                  styles.variantCard,
                  selectedVariant === variant.id && styles.variantCardActive,
                ]}
                onPress={() => setSelectedVariant(variant.id)}
                activeOpacity={0.8}
              >
                <View style={styles.variantRow}>
                  <View style={[styles.radio, selectedVariant === variant.id && styles.radioActive]} />
                  <View style={styles.variantTextWrap}>
                    <Text style={styles.variantTitle}>{variant.title}</Text>
                    <Text style={styles.variantDescription}>{variant.description}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {phase === 'C' && (
          <View>
            {phaseCError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{phaseCError}</Text>
              </View>
            )}

            {stepC === 1 && (
              <View>
                <Text style={styles.sectionTitle}>C1. Cât de conștienți sunt de problema lor?</Text>
                {[
                  'Știu ce greșesc, dar nu aplică',
                  'Știu că au o problemă, dar nu știu soluția',
                  'Cred că fac bine, dar nu au rezultate',
                  'Nu știu exact unde greșesc',
                ].map((option) => (
                  <RadioOption
                    key={option}
                    label={option}
                    checked={phaseCData.awarenessLevel === option}
                    onPress={() => setPhaseCData({ ...phaseCData, awarenessLevel: option })}
                  />
                ))}
              </View>
            )}

            {stepC === 2 && (
              <View>
                <Text style={styles.sectionTitle}>
                  C2. Ce poveste își spun despre ei când vine vorba de fitness?
                </Text>
                {[
                  'Nu sunt disciplinat.',
                  'Nu am voință.',
                  'Nu am timp pentru mine.',
                  'Nu sunt genul care reușește.',
                  'Mă las mereu.',
                ].map((story) => (
                  <RadioOption
                    key={story}
                    label={`„${story}”`}
                    checked={phaseCData.identityStory === story}
                    onPress={() => setPhaseCData({ ...phaseCData, identityStory: story })}
                  />
                ))}
              </View>
            )}

            {stepC === 3 && (
              <View>
                <Text style={styles.sectionTitle}>C3. Care afirmație sună CEL MAI mult ca ei?</Text>
                {[
                  '„Știu ce ar trebui să fac, dar nu mă țin."',
                  '„Simt că m-am lăsat."',
                  '„Am mai încercat și m-am oprit."',
                  '„Nu mai am energie pentru mine."',
                ].map((statement) => (
                  <RadioOption
                    key={statement}
                    label={statement}
                    checked={phaseCData.emotionalBlock === statement}
                    onPress={() => setPhaseCData({ ...phaseCData, emotionalBlock: statement })}
                  />
                ))}
                <Input
                  label="Spune asta în cuvintele tale. (opțional)"
                  value={phaseCData.emotionalBlockCustom}
                  onChangeText={(value) => setPhaseCData({ ...phaseCData, emotionalBlockCustom: value })}
                  placeholder="ex: simt că nu mai am timp pentru mine..."
                />
              </View>
            )}

            {stepC === 4 && (
              <View>
                <Text style={styles.sectionTitle}>C4. Te caută pentru: (poți alege mai multe)</Text>
                {[
                  'Slăbit',
                  'Tonifiere / estetic',
                  'Energie',
                  'Disciplină / consecvență',
                  'Dureri / disconfort',
                ].map((goal) => (
                  <CheckboxOption
                    key={goal}
                    label={goal}
                    checked={phaseCData.dominantGoals.includes(goal)}
                    onPress={() => toggleArrayC('dominantGoals', goal)}
                  />
                ))}

                {phaseCData.dominantGoals.length > 1 && (
                  <View style={styles.primaryBlock}>
                    <Text style={styles.subLabel}>Dacă ar fi să alegi UNUL principal acum?</Text>
                    {phaseCData.dominantGoals.map((goal) => (
                      <RadioOption
                        key={goal}
                        label={goal}
                        checked={phaseCData.primaryGoal === goal}
                        onPress={() => setPhaseCData({ ...phaseCData, primaryGoal: goal })}
                      />
                    ))}
                  </View>
                )}
              </View>
            )}

            {stepC === 5 && (
              <View>
                <Text style={styles.sectionTitle}>
                  Cum arată, în general, o zi obișnuită pentru clientul tău ideal:
                </Text>
                <Input
                  label="Ora de trezire"
                  value={phaseCData.wakeUpTime}
                  onChangeText={(value) => setPhaseCData({ ...phaseCData, wakeUpTime: value })}
                  placeholder="ex: 06:30"
                />

                <Text style={styles.subLabel}>Tip de job</Text>
                {[
                  { value: 'sedentar', label: 'Sedentar' },
                  { value: 'activ', label: 'Activ' },
                  { value: 'mixt', label: 'Mixt' },
                ].map((option) => (
                  <RadioOption
                    key={option.value}
                    label={option.label}
                    checked={phaseCData.jobType === option.value}
                    onPress={() => setPhaseCData({ ...phaseCData, jobType: option.value as PhaseCData['jobType'] })}
                  />
                ))}

                <Text style={styles.subLabel}>Timp petrecut jos</Text>
                {['<4h', '4-6h', '6-8h', '8h+'].map((time) => (
                  <RadioOption
                    key={time}
                    label={time}
                    checked={phaseCData.sittingTime === time}
                    onPress={() => setPhaseCData({ ...phaseCData, sittingTime: time as PhaseCData['sittingTime'] })}
                  />
                ))}

                <Text style={styles.subLabel}>Dimineața:</Text>
                {['mănâncă acasă', 'cafea pe stomacul gol', 'snack rapid / patiserie'].map((option) => (
                  <CheckboxOption
                    key={option}
                    label={option}
                    checked={phaseCData.morning.includes(option)}
                    onPress={() => toggleArrayC('morning', option)}
                  />
                ))}

                <Text style={styles.subLabel}>Prânz:</Text>
                {['gătit', 'comandă', 'mănâncă pe fugă'].map((option) => (
                  <CheckboxOption
                    key={option}
                    label={option}
                    checked={phaseCData.lunch.includes(option)}
                    onPress={() => toggleArrayC('lunch', option)}
                  />
                ))}

                <Text style={styles.subLabel}>Seara:</Text>
                {[
                  'prea obosiți pentru sală',
                  'au timp, dar fără energie',
                  'se antrenează rar',
                ].map((option) => (
                  <CheckboxOption
                    key={option}
                    label={option}
                    checked={phaseCData.evening.includes(option)}
                    onPress={() => toggleArrayC('evening', option)}
                  />
                ))}
              </View>
            )}

            {stepC === 6 && (
              <View>
                <Text style={styles.sectionTitle}>
                  Există una sau mai multe situații care îi definesc clar?
                </Text>
                {[
                  'Au copii',
                  'Sunt deja activi / merg la sală',
                  'Au un job foarte solicitant fizic',
                  'Lucrează în ture / program neregulat',
                  'Au dureri / limitări fizice',
                  'Niciuna dintre cele de mai sus',
                ].map((situation) => (
                  <CheckboxOption
                    key={situation}
                    label={situation}
                    checked={phaseCData.definingSituations.includes(situation)}
                    onPress={() => toggleArrayC('definingSituations', situation)}
                  />
                ))}
              </View>
            )}

            {stepC === 7 && (
              <View>
                <Text style={styles.sectionTitle}>Mai multe detalii despre situația lor</Text>

                {showKidsModule && (
                  <View style={[styles.moduleCard, styles.kidsModule]}>
                    <Text style={styles.moduleTitle}>Cum le influențează copiii programul?</Text>
                    {[
                      'se trezesc foarte devreme',
                      'mesele sunt haotice',
                      'timpul pentru ei e seara târziu',
                      'oboseala e principalul obstacol',
                    ].map((impact) => (
                      <CheckboxOption
                        key={impact}
                        label={impact}
                        checked={phaseCData.kidsImpact.includes(impact)}
                        onPress={() => toggleArrayC('kidsImpact', impact)}
                      />
                    ))}
                  </View>
                )}

                {showActiveModule && (
                  <View style={[styles.moduleCard, styles.activeModule]}>
                    <Text style={styles.moduleTitle}>Cum se raportează la sport acum?</Text>
                    {[
                      'merg constant, dar fără rezultate',
                      'merg haotic',
                      'știu exercițiile, dar nu structura',
                      'se plafonează ușor',
                    ].map((status) => (
                      <CheckboxOption
                        key={status}
                        label={status}
                        checked={phaseCData.activeStatus.includes(status)}
                        onPress={() => toggleArrayC('activeStatus', status)}
                      />
                    ))}
                  </View>
                )}

                {showPhysicalJobModule && (
                  <View style={[styles.moduleCard, styles.jobModule]}>
                    <Text style={styles.moduleTitle}>Care e cea mai mare problemă pentru ei?</Text>
                    {[
                      'oboseală cronică',
                      'dureri',
                      'program imprevizibil',
                      'alimentație dezorganizată',
                    ].map((issue) => (
                      <CheckboxOption
                        key={issue}
                        label={issue}
                        checked={phaseCData.physicalJobIssue.includes(issue)}
                        onPress={() => toggleArrayC('physicalJobIssue', issue)}
                      />
                    ))}
                  </View>
                )}

                {showPainModule && (
                  <View style={[styles.moduleCard, styles.painModule]}>
                    <Text style={styles.moduleTitle}>Unde apar cel mai des?</Text>
                    {['spate', 'genunchi', 'umeri', 'șolduri'].map((detail) => (
                      <CheckboxOption
                        key={detail}
                        label={detail}
                        checked={phaseCData.painDetails.includes(detail)}
                        onPress={() => toggleArrayC('painDetails', detail)}
                      />
                    ))}
                  </View>
                )}

                <Input
                  label="Mai e ceva specific la stilul lor de viață care contează? (opțional)"
                  value={phaseCData.lifestyleSpecific}
                  onChangeText={(value) => setPhaseCData({ ...phaseCData, lifestyleSpecific: value })}
                  placeholder="ex: lucrează remote, călătoresc des..."
                />

                {!showKidsModule && !showActiveModule && !showPhysicalJobModule && !showPainModule && (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>Nu ai selectat nicio situație specifică la pasul anterior.</Text>
                    <Text style={styles.emptyText}>Poți continua mai departe.</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {phase === 'D' && generatedResult && (
          <View>
            <View style={styles.previewBanner}>
              <Text style={styles.previewBannerText}>
                Niche Builder generat și salvat automat în cont.
              </Text>
            </View>

            <View style={styles.resultBlock}>
              <Text style={styles.resultLabel}>NIȘA</Text>
              <Text style={styles.resultText}>{generatedResult.niche}</Text>
            </View>

            <View style={styles.resultBlock}>
              <Text style={styles.resultLabel}>CLIENT IDEAL</Text>
              <Text style={styles.resultText}>{generatedResult.idealClient}</Text>
            </View>

            <View style={styles.resultBlock}>
              <Text style={styles.resultLabel}>POZIȚIONARE</Text>
              <Text style={styles.resultText}>{generatedResult.positioning}</Text>
            </View>
          </View>
        )}

        <View style={styles.navRow}>
          {phase === 'A' && stepA > 1 && (
            <Button title="Înapoi" variant="secondary" onPress={() => setStepA(stepA - 1)} style={styles.navButton} />
          )}
          {phase === 'C' && stepC > 1 && (
            <Button
              title="Înapoi"
              variant="secondary"
              onPress={() => {
                setPhaseCError(null);
                setStepC(stepC - 1);
              }}
              style={styles.navButton}
            />
          )}
          {phase === 'B' && (
            <Button title="Înapoi la Faza A" variant="secondary" onPress={() => setPhase('A')} style={styles.navButton} />
          )}

          {phase === 'A' && stepA < 6 && (
            <Button title="Continuă" variant="primary" onPress={() => setStepA(stepA + 1)} style={{ ...styles.navButton, ...styles.nextButton }} />
          )}
          {phase === 'A' && stepA === 6 && (
            <Button
              title={variantsMutation.isPending ? 'Generez variante...' : 'Generează Variante →'}
              variant="primary"
              loading={variantsMutation.isPending}
              onPress={handlePhaseAComplete}
              style={{ ...styles.navButton, ...styles.nextButton }}
            />
          )}
          {phase === 'B' && (
            <Button
              title="Continuă cu Această Variantă →"
              variant="primary"
              disabled={selectedVariant === null}
              onPress={handleSelectVariant}
              style={{ ...styles.navButton, ...styles.nextButton }}
            />
          )}
          {phase === 'C' && stepC < 7 && (
            <Button title="Continuă" variant="primary" onPress={handlePhaseCNext} style={{ ...styles.navButton, ...styles.nextButton }} />
          )}
          {phase === 'C' && stepC === 7 && (
            <Button
              title={generateMutation.isPending ? 'Generez Niche Builder Final...' : 'Generează Niche Builder →'}
              variant="primary"
              loading={generateMutation.isPending}
              onPress={handleSubmit}
              style={{ ...styles.navButton, ...styles.nextButton }}
            />
          )}
          {phase === 'D' && (
            <Button title="Reia Quizul" variant="secondary" onPress={() => setPhase('A')} style={styles.navButton} />
          )}
        </View>

        {variantsMutation.isError && (
          <Text style={styles.errorText}>
            Eroare la generare variante: {(variantsMutation.error as any)?.response?.data?.error || 'Ceva nu a mers bine'}
          </Text>
        )}
        {generateMutation.isError && (
          <Text style={styles.errorText}>
            Eroare: {(generateMutation.error as any)?.response?.data?.error || 'Ceva nu a mers bine'}
          </Text>
        )}
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
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold' as const,
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  phaseIndicatorWrap: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 14,
  },
  phaseNodeWrap: {
    alignItems: 'center' as const,
  },
  phaseNode: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  phaseNodeText: {
    color: colors.text.primary,
    fontWeight: '700' as const,
  },
  phaseNodeActive: {
    borderColor: colors.brand.primary,
    backgroundColor: `${colors.brand.primary}22`,
  },
  phaseNodeDone: {
    borderColor: '#16a34a',
    backgroundColor: 'rgba(22,163,74,0.20)',
  },
  phaseNodeIdle: {
    borderColor: colors.text.muted,
    backgroundColor: 'transparent',
  },
  phaseLabel: {
    marginTop: 6,
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  phaseLine: {
    width: 32,
    height: 1,
    backgroundColor: colors.text.muted,
    marginHorizontal: 6,
  },
  phaseActive: {},
  phaseDone: {},
  phaseIdle: {},
  progressWrap: {
    marginBottom: 14,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: colors.dark.bgLight,
    borderRadius: 100,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.brand.primary,
  },
  progressText: {
    textAlign: 'center' as const,
    marginTop: 8,
    color: colors.text.muted,
    fontSize: 12,
  },
  card: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '700' as const,
    color: colors.text.primary,
    marginBottom: 12,
  },
  subLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
    marginTop: 6,
  },
  optionItem: {
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 8,
    backgroundColor: colors.dark.bg,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  optionItemActive: {
    borderColor: colors.brand.primary,
    backgroundColor: `${colors.brand.primary}22`,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.dark.border,
    marginRight: 12,
  },
  radioActive: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primary,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.dark.border,
    marginRight: 12,
  },
  checkboxActive: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primary,
  },
  optionText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '600' as const,
    flex: 1,
  },
  optionTextActive: {
    color: colors.brand.primary,
  },
  errorBanner: {
    borderWidth: 1,
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239,68,68,0.10)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  errorBannerText: {
    color: '#fca5a5',
    fontSize: 13,
  },
  helperText: {
    color: colors.text.secondary,
    marginBottom: 14,
    lineHeight: 20,
  },
  loadingWrap: {
    paddingVertical: 20,
  },
  variantCard: {
    borderWidth: 2,
    borderColor: colors.dark.border,
    backgroundColor: colors.dark.bgLight,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  variantCardActive: {
    borderColor: colors.brand.primary,
    backgroundColor: `${colors.brand.primary}1a`,
  },
  variantRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
  },
  variantTextWrap: {
    flex: 1,
  },
  variantTitle: {
    color: colors.text.primary,
    fontSize: 19,
    fontWeight: '700' as const,
    marginBottom: 6,
  },
  variantDescription: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  moduleCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text.primary,
    marginBottom: 10,
  },
  kidsModule: {
    borderColor: '#ca8a04',
    backgroundColor: 'rgba(234,179,8,0.10)',
  },
  activeModule: {
    borderColor: '#2563eb',
    backgroundColor: 'rgba(37,99,235,0.10)',
  },
  jobModule: {
    borderColor: '#7c3aed',
    backgroundColor: 'rgba(124,58,237,0.10)',
  },
  painModule: {
    borderColor: '#dc2626',
    backgroundColor: 'rgba(220,38,38,0.10)',
  },
  emptyBox: {
    paddingVertical: 10,
  },
  emptyText: {
    textAlign: 'center' as const,
    color: colors.text.secondary,
    marginBottom: 3,
  },
  primaryBlock: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  navRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 8,
  },
  navButton: {
    minWidth: 120,
  },
  nextButton: {
    marginLeft: 'auto' as const,
  },
  errorText: {
    color: colors.error,
    marginTop: 12,
  },
  previewBanner: {
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.35)',
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  previewBannerText: {
    color: '#a7f3d0',
    fontSize: 13,
    lineHeight: 18,
  },
  resultBlock: {
    borderWidth: 1,
    borderColor: colors.dark.border,
    backgroundColor: colors.dark.bg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  resultLabel: {
    color: colors.text.muted,
    fontSize: 11,
    fontWeight: '700' as const,
    marginBottom: 6,
  },
  resultText: {
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
  },
});
