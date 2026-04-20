import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { colors } from '../constants/colors';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { nicheAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface FormData {
  gender: 'femei' | 'barbati' | 'ambele' | '';
  ageRanges: string[];
  customAgeRange: string;
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
  mainReasons: string[];
  primaryReason: string;
  whatDoesntWork: string[];
  otherDoesntWork: string;
  emotionalBlock: string;
  emotionalBlockCustom: string;
  whatTheyDontWant: string[];
  otherDontWant: string;
  sportRelationship: string;
  sportRelationshipSpecific: string;
  desiredFeelings: string[];
  differentiation: string;
  internalObjections: string[];
}

interface GeneratedNicheResult {
  niche: string;
  idealClient: string;
  positioning: string;
}

const TOTAL_STEPS = 12;

export default function NicheQuickScreen() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    gender: '',
    ageRanges: [],
    customAgeRange: '',
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
    mainReasons: [],
    primaryReason: '',
    whatDoesntWork: [],
    otherDoesntWork: '',
    emotionalBlock: '',
    emotionalBlockCustom: '',
    whatTheyDontWant: [],
    otherDontWant: '',
    sportRelationship: '',
    sportRelationshipSpecific: '',
    desiredFeelings: [],
    differentiation: '',
    internalObjections: [],
  });

  const showKidsModule = useMemo(
    () => formData.definingSituations.includes('Au copii'),
    [formData.definingSituations]
  );
  const showActiveModule = useMemo(
    () => formData.definingSituations.includes('Sunt deja activi / merg la sală'),
    [formData.definingSituations]
  );
  const showPhysicalJobModule = useMemo(
    () =>
      formData.definingSituations.includes('Au un job foarte solicitant fizic') ||
      formData.definingSituations.includes('Lucrează în ture / program neregulat'),
    [formData.definingSituations]
  );
  const showPainModule = useMemo(
    () => formData.definingSituations.includes('Au dureri / limitări fizice'),
    [formData.definingSituations]
  );

  const mutation = useMutation({
    mutationFn: () =>
      nicheAPI.generateQuickICP({
        ...formData,
        gender: formData.gender as 'femei' | 'barbati' | 'ambele',
        jobType: formData.jobType || undefined,
        sittingTime: formData.sittingTime || undefined,
        saveToProfile: true,
      }),
    onSuccess: async () => {
      await refreshUser();
      await queryClient.invalidateQueries({ queryKey: ['user-me'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      Alert.alert('Succes', 'Nișa a fost salvată automat în cont.');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Nu am putut salva nișa.';
      Alert.alert('Eroare', message);
    },
  });

  const toggleArray = (field: keyof FormData, value: string) => {
    const current = formData[field] as string[];
    if (current.includes(value)) {
      setFormData({ ...formData, [field]: current.filter((item) => item !== value) });
      return;
    }
    setFormData({ ...formData, [field]: [...current, value] });
  };

  const handleSubmit = () => {
    if (!formData.gender || formData.ageRanges.length === 0 || !formData.differentiation.trim()) {
      Alert.alert('Validare', 'Te rog completează câmpurile obligatorii');
      return;
    }
    mutation.mutate();
  };

  const isNextDisabled =
    (step === 1 && !formData.gender) ||
    (step === 2 && formData.ageRanges.length === 0) ||
    (step === 11 && !formData.differentiation.trim());
  const generatedResult = mutation.data?.data as GeneratedNicheResult | undefined;

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
    disabled,
  }: {
    label: string;
    checked: boolean;
    onPress: () => void;
    disabled?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.optionItem,
        checked && styles.optionItemActive,
        disabled && styles.optionItemDisabled,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <View style={[styles.checkbox, checked && styles.checkboxActive]} />
      <Text style={[styles.optionText, checked && styles.optionTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Spune-mi Nișa Ta</Text>
        <Text style={styles.subtitle}>
          Descrie clientul tău ideal - AI-ul va crea Niche Builder-ul complet
        </Text>
      </View>

      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Pas {step} din {TOTAL_STEPS}
        </Text>
      </View>

      <Card style={styles.card}>
        {step === 1 && (
          <View>
            <Text style={styles.sectionTitle}>1⃣ Cu ce tip de persoane vrei să lucrezi?</Text>
            {[
              { value: 'barbati', label: 'Bărbați' },
              { value: 'femei', label: 'Femei' },
              { value: 'ambele', label: 'Ambele' },
            ].map((option) => (
              <RadioOption
                key={option.value}
                label={option.label}
                checked={formData.gender === option.value}
                onPress={() => setFormData({ ...formData, gender: option.value as FormData['gender'] })}
              />
            ))}
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.sectionTitle}>2⃣ Ce vârstă au, în general?</Text>
            {['18–25', '25–35', '35–45', '45+'].map((age) => (
              <CheckboxOption
                key={age}
                label={age}
                checked={formData.ageRanges.includes(age)}
                onPress={() => toggleArray('ageRanges', age)}
              />
            ))}
            <Input
              label="Spune-mi alt interval de vârstă (opțional)"
              value={formData.customAgeRange}
              onChangeText={(value) => setFormData({ ...formData, customAgeRange: value })}
              placeholder="ex: 30-40"
            />
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.sectionTitle}>
              Cum arată, în general, o zi obișnuită pentru clientul tău ideal:
            </Text>
            <Input
              label="Ora de trezire"
              value={formData.wakeUpTime}
              onChangeText={(value) => setFormData({ ...formData, wakeUpTime: value })}
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
                checked={formData.jobType === option.value}
                onPress={() => setFormData({ ...formData, jobType: option.value as FormData['jobType'] })}
              />
            ))}

            <Text style={styles.subLabel}>Timp petrecut jos</Text>
            {['<4h', '4-6h', '6-8h', '8h+'].map((time) => (
              <RadioOption
                key={time}
                label={time}
                checked={formData.sittingTime === time}
                onPress={() => setFormData({ ...formData, sittingTime: time as FormData['sittingTime'] })}
              />
            ))}

            <Text style={styles.subLabel}>Dimineața:</Text>
            {['mănâncă acasă', 'cafea pe stomacul gol', 'snack rapid / patiserie'].map((option) => (
              <CheckboxOption
                key={option}
                label={option}
                checked={formData.morning.includes(option)}
                onPress={() => toggleArray('morning', option)}
              />
            ))}

            <Text style={styles.subLabel}>Prânz:</Text>
            {['gătit', 'comandă', 'mănâncă pe fugă'].map((option) => (
              <CheckboxOption
                key={option}
                label={option}
                checked={formData.lunch.includes(option)}
                onPress={() => toggleArray('lunch', option)}
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
                checked={formData.evening.includes(option)}
                onPress={() => toggleArray('evening', option)}
              />
            ))}
          </View>
        )}

        {step === 4 && (
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
                checked={formData.definingSituations.includes(situation)}
                onPress={() => toggleArray('definingSituations', situation)}
              />
            ))}
          </View>
        )}

        {step === 5 && (
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
                    checked={formData.kidsImpact.includes(impact)}
                    onPress={() => toggleArray('kidsImpact', impact)}
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
                    checked={formData.activeStatus.includes(status)}
                    onPress={() => toggleArray('activeStatus', status)}
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
                    checked={formData.physicalJobIssue.includes(issue)}
                    onPress={() => toggleArray('physicalJobIssue', issue)}
                  />
                ))}
              </View>
            )}

            {showPainModule && (
              <View style={[styles.moduleCard, styles.painModule]}>
                <Text style={styles.moduleTitle}>Unde apar cel mai des?</Text>
                {[
                  'spate',
                  'genunchi',
                  'umeri',
                  'șolduri',
                  'istoric de accidentare',
                  'se tem să nu agraveze',
                ].map((detail) => (
                  <CheckboxOption
                    key={detail}
                    label={detail}
                    checked={formData.painDetails.includes(detail)}
                    onPress={() => toggleArray('painDetails', detail)}
                  />
                ))}
              </View>
            )}

            <Input
              label="Mai e ceva specific la stilul lor de viață care contează? (opțional)"
              value={formData.lifestyleSpecific}
              onChangeText={(value) => setFormData({ ...formData, lifestyleSpecific: value })}
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

        {step === 6 && (
          <View>
            <Text style={styles.sectionTitle}>4⃣ Pentru ce motiv te caută cel mai des?</Text>
            <Text style={styles.hint}>Poți alege mai multe:</Text>
            {[
              'Slăbit',
              'Tonifiere / estetic',
              'Energie / stare generală',
              'Disciplină / consecvență',
              'Dureri / disconfort',
            ].map((reason) => (
              <CheckboxOption
                key={reason}
                label={reason}
                checked={formData.mainReasons.includes(reason)}
                onPress={() => toggleArray('mainReasons', reason)}
              />
            ))}

            {formData.mainReasons.length > 1 && (
              <View style={styles.primaryReasonWrap}>
                <Text style={styles.subLabel}>Dacă ar fi să alegi UNUL principal?</Text>
                {formData.mainReasons.map((reason) => (
                  <RadioOption
                    key={reason}
                    label={reason}
                    checked={formData.primaryReason === reason}
                    onPress={() => setFormData({ ...formData, primaryReason: reason })}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {step === 7 && (
          <View>
            <Text style={styles.sectionTitle}>5⃣ Ce NU funcționează pentru ei acum?</Text>
            {[
              'Încep bine și se opresc',
              'Nu au energie după muncă',
              'Mănâncă ok câteva zile, apoi scapă controlul',
              'Nu văd rezultate și se demotivează',
            ].map((issue) => (
              <CheckboxOption
                key={issue}
                label={issue}
                checked={formData.whatDoesntWork.includes(issue)}
                onPress={() => toggleArray('whatDoesntWork', issue)}
              />
            ))}
            <Input
              label="Alt lucru care apare des la ei? (opțional)"
              value={formData.otherDoesntWork}
              onChangeText={(value) => setFormData({ ...formData, otherDoesntWork: value })}
              placeholder="ex: nu știu să gătească sănătos..."
            />
          </View>
        )}

        {step === 8 && (
          <View>
            <Text style={styles.sectionTitle}>6⃣ Ce îi blochează CU ADEVĂRAT?</Text>
            <Text style={styles.hint}>Care afirmație sună cel mai mult ca ei?</Text>
            {[
              '„Știu ce ar trebui să fac, dar nu mă țin"',
              '„Simt că m-am lăsat"',
              '„Am mai încercat și m-am oprit"',
              '„Nu mai am energie pentru mine"',
            ].map((block) => (
              <RadioOption
                key={block}
                label={block}
                checked={formData.emotionalBlock === block}
                onPress={() => setFormData({ ...formData, emotionalBlock: block })}
              />
            ))}
            <Input
              label="Dacă ai spune asta în cuvintele tale? (opțional)"
              value={formData.emotionalBlockCustom}
              onChangeText={(value) => setFormData({ ...formData, emotionalBlockCustom: value })}
              placeholder="ex: simt că nu mai am timp pentru mine..."
            />
          </View>
        )}

        {step === 9 && (
          <View>
            <Text style={styles.sectionTitle}>7⃣ Ce NU vor sub nicio formă?</Text>
            {[
              'Diete extreme',
              'Antrenamente prea complicate',
              'Fitness fake / promisiuni exagerate',
              'Limbaj prea tehnic',
            ].map((dontWant) => (
              <CheckboxOption
                key={dontWant}
                label={dontWant}
                checked={formData.whatTheyDontWant.includes(dontWant)}
                onPress={() => toggleArray('whatTheyDontWant', dontWant)}
              />
            ))}
            <Input
              label="Alt lucru care îi respinge din start? (opțional)"
              value={formData.otherDontWant}
              onChangeText={(value) => setFormData({ ...formData, otherDontWant: value })}
              placeholder="ex: tone de story-uri pe zi..."
            />
          </View>
        )}

        {step === 10 && (
          <View>
            <Text style={styles.sectionTitle}>8⃣ Cum e relația lor cu sportul?</Text>
            {[
              'Începători',
              'Intermitenți',
              'Activi, dar fără rezultate',
              'Au mai făcut sport, dar s-au lăsat',
            ].map((relationship) => (
              <RadioOption
                key={relationship}
                label={relationship}
                checked={formData.sportRelationship === relationship}
                onPress={() => setFormData({ ...formData, sportRelationship: relationship })}
              />
            ))}
            <Input
              label="Ce e specific la relația lor cu sportul? (opțional)"
              value={formData.sportRelationshipSpecific}
              onChangeText={(value) => setFormData({ ...formData, sportRelationshipSpecific: value })}
              placeholder="ex: au făcut sală înainte, dar nu cardio..."
            />

            <View style={styles.stepDivider} />
            <Text style={styles.sectionTitle}>9⃣ Cum vrei TU să se simtă când te urmăresc?</Text>
            <Text style={styles.hint}>Alege maxim 2:</Text>
            {['Înțeleși', 'Motivați', 'Liniștiți', 'Provocați', '„Pot și eu"'].map((feeling) => {
              const checked = formData.desiredFeelings.includes(feeling);
              const disabled = !checked && formData.desiredFeelings.length >= 2;
              return (
                <CheckboxOption
                  key={feeling}
                  label={feeling}
                  checked={checked}
                  disabled={disabled}
                  onPress={() => {
                    if (checked) {
                      toggleArray('desiredFeelings', feeling);
                    } else if (formData.desiredFeelings.length < 2) {
                      toggleArray('desiredFeelings', feeling);
                    }
                  }}
                />
              );
            })}
          </View>
        )}

        {step === 11 && (
          <View>
            <Text style={styles.sectionTitle}>
              🔵 1⃣ De ce te-ar alege pe tine și nu pe alt antrenor?
            </Text>
            <Text style={styles.hint}>Răspuns scurt, clar (maxim 2 rânduri).</Text>
            <Input
              value={formData.differentiation}
              onChangeText={(value) => setFormData({ ...formData, differentiation: value })}
              placeholder="ex: Simplific procesul pentru oameni ocupați și construiesc un plan realist."
              multiline
              numberOfLines={2}
              maxLength={220}
              style={styles.twoRowsInput}
            />
          </View>
        )}

        {step === 12 && (
          <View>
            <Text style={styles.sectionTitle}>
              2⃣ Ce îi face să ezite chiar și când știu că ar trebui să înceapă?
            </Text>
            <Text style={styles.hint}>Alege maxim 2:</Text>
            {[
              'Frica de eșec',
              'Frica de judecată',
              'Au mai încercat și au eșuat',
              'Se simt copleșiți',
              'Nu cred că pot',
            ].map((objection) => {
              const checked = formData.internalObjections.includes(objection);
              const disabled = !checked && formData.internalObjections.length >= 2;
              return (
                <CheckboxOption
                  key={objection}
                  label={objection}
                  checked={checked}
                  disabled={disabled}
                  onPress={() => {
                    if (checked) {
                      toggleArray('internalObjections', objection);
                    } else if (formData.internalObjections.length < 2) {
                      toggleArray('internalObjections', objection);
                    }
                  }}
                />
              );
            })}
          </View>
        )}

        <View style={styles.navRow}>
          {step > 1 && (
            <Button title="Înapoi" variant="secondary" onPress={() => setStep(step - 1)} style={styles.navButton} />
          )}
          {step < TOTAL_STEPS ? (
            <Button
              title="Continuă"
              variant="primary"
              disabled={isNextDisabled}
              onPress={() => setStep(step + 1)}
              style={{ ...styles.navButton, ...styles.nextButton }}
            />
          ) : (
            <Button
              title={mutation.isPending ? 'Generez Niche Builder...' : 'Generează Niche Builder →'}
              variant="primary"
              loading={mutation.isPending}
              onPress={handleSubmit}
              style={{ ...styles.navButton, ...styles.nextButton }}
            />
          )}
        </View>

        {mutation.isError && (
          <Text style={styles.errorText}>
            Eroare: {(mutation.error as any)?.response?.data?.error || 'Ceva nu a mers bine'}
          </Text>
        )}
      </Card>

      {generatedResult && (
        <Card style={styles.card}>
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
        </Card>
      )}
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
  hint: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 12,
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
  optionItemDisabled: {
    opacity: 0.5,
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
  primaryReasonWrap: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  stepDivider: {
    height: 1,
    backgroundColor: colors.dark.border,
    marginVertical: 14,
  },
  twoRowsInput: {
    minHeight: 72,
    textAlignVertical: 'top' as const,
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
