import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../constants/colors';
import { nutritionAPI } from '../services/api';

type MealsPerDayType = '3' | '3+1' | '4' | '5' | 'custom';
type MacroDistributionType =
  | 'equal'
  | 'around-workout'
  | 'more-evening-carbs'
  | 'low-carb-breakfast'
  | 'custom';
type WorkProgram = 'fixed' | 'shifts' | 'flexible' | 'mostly-home';
type PlanStyle =
  | 'exact-grams'
  | 'macros-plus-examples'
  | 'flexible-template'
  | 'full-day-with-alternatives';
type MealLocation = 'home' | 'office' | 'delivery' | 'canteen' | 'on-the-go';
type CookingLevel = 'daily' | 'meal-prep' | 'rare' | 'almost-never';
type FoodBudget = 'low' | 'medium' | 'high';
type DietaryRestriction =
  | 'lactose-free'
  | 'gluten-free'
  | 'vegetarian'
  | 'vegan'
  | 'intermittent-fasting'
  | 'religious-fasting'
  | 'allergies';
type ClientSex = 'male' | 'female' | 'other';
type ActivityLevel = 'sedentary' | 'lightly-active' | 'moderately-active' | 'very-active' | 'athlete';
type PreferredEatingStyle =
  | 'anything'
  | 'high-protein'
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'mediterranean';
type ObjectiveType = 'lose-weight' | 'maintain' | 'gain-muscle' | 'recomposition' | 'performance';

interface NutritionMealFood {
  food: string;
  grams: number;
  protein: number;
  fat: number;
  carbs: number;
  calories: number;
  notes?: string;
}

interface NutritionMeal {
  name: string;
  time: string;
  targetMacros: {
    protein: number;
    fat: number;
    carbs: number;
    calories: number;
  };
  foods: NutritionMealFood[];
}

interface NutritionResult {
  message?: string;
  emailedTo?: string;
  pdfUrl?: string;
  filename?: string;
  reportPreview?: {
    title: string;
    summary: string;
    calorieTarget: number;
    macroSummary: string;
    mealsPerDay: number;
  };
}

const ARC_WIDTH = 144;
const ARC_HEIGHT = 78;
const TIME_OPTIONS = [
  '05:00',
  '06:00',
  '07:00',
  '08:00',
  '10:00',
  '12:00',
  '14:00',
  '16:00',
  '18:00',
  '20:00',
  '22:00',
  '23:00',
];

const formatValidationError = (raw: any): string => {
  if (!raw) return 'Nu am putut genera planul.';
  if (typeof raw === 'string') return raw;

  if (Array.isArray(raw)) {
    const formatted = raw
      .map((item) => formatValidationError(item))
      .filter((item) => !!item && item !== 'Nu am putut genera planul.');
    return formatted.length ? formatted.join(' | ') : 'Nu am putut genera planul.';
  }

  if (typeof raw === 'object') {
    if (Array.isArray(raw.details)) {
      const details = raw.details
        .map((item: any) => {
          if (typeof item === 'string') return item;
          if (item?.field && item?.message) return `${item.field}: ${item.message}`;
          if (item?.property && item?.message) return `${item.property}: ${item.message}`;
          if (item?.property && item?.constraints && typeof item.constraints === 'object') {
            return `${item.property}: ${Object.values(item.constraints).join(', ')}`;
          }
          return formatValidationError(item);
        })
        .filter(Boolean);
      if (details.length) return details.join(' | ');
    }

    if (Array.isArray(raw.message)) {
      const msg = raw.message.map((m: any) => formatValidationError(m)).filter(Boolean);
      if (msg.length) return msg.join(' | ');
    }

    if (typeof raw.error === 'string' && raw.error.trim()) return raw.error;
    if (typeof raw.message === 'string' && raw.message.trim()) return raw.message;
  }

  return 'Nu am putut genera planul.';
};

function useLoopingPulse(value: Animated.Value, duration: number) {
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [duration, value]);
}

function SectionHeader({
  index,
  title,
  description,
}: {
  index: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionBadge}>
        <Text style={styles.sectionBadgeText}>{index}</Text>
      </View>
      <View style={styles.sectionHeaderTextWrap}>
        <Text style={styles.sectionEyebrow}>SECTIUNE {index}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionDescription}>{description}</Text>
      </View>
    </View>
  );
}

function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <View style={styles.fieldLabelWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

function GlassInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric';
  hint?: string;
}) {
  return (
    <View style={styles.inputBlock}>
      <FieldLabel label={label} hint={hint} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholderTextColor="rgba(196, 211, 227, 0.45)"
        style={[styles.glassInput, multiline && styles.glassInputMultiline]}
      />
    </View>
  );
}

function BiometricGauge({
  label,
  accent,
  value,
  onChangeText,
  unit,
  max,
}: {
  label: string;
  accent: string;
  value: string;
  onChangeText: (value: string) => void;
  unit: string;
  max: number;
}) {
  const cleanValue = Number(value.replace(',', '.').replace(/[^\d.]/g, '').trim()) || 0;
  const progress = Math.max(0, Math.min(cleanValue / max, 1));
  const progressAnim = useRef(new Animated.Value(progress)).current;
  const countAnim = useRef(new Animated.Value(cleanValue)).current;
  const [displayValue, setDisplayValue] = useState(cleanValue);

  useEffect(() => {
    const listener = countAnim.addListener(({ value: animatedValue }) => {
      setDisplayValue(Math.round(animatedValue));
    });

    return () => {
      countAnim.removeListener(listener);
    };
  }, [countAnim]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(countAnim, {
        toValue: cleanValue,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [cleanValue, countAnim, progress, progressAnim]);

  const sweepWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [14, ARC_WIDTH - 10],
  });

  const glowOpacity = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 1],
  });

  return (
    <View style={styles.gaugeCard}>
      <Text style={styles.gaugeLabel}>{label}</Text>
      <View style={styles.arcadeWrap}>
        <View style={styles.arcClip}>
          <View style={styles.arcTrack} />
          <Animated.View
            style={[
              styles.arcSweep,
              {
                width: sweepWidth,
                backgroundColor: accent,
                opacity: glowOpacity,
                shadowColor: accent,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.arcSweepAura,
              {
                width: sweepWidth,
                backgroundColor: `${accent}33`,
              },
            ]}
          />
        </View>

        <View style={styles.gaugeCenter}>
          <Text style={[styles.gaugeValue, { color: accent }]}>{displayValue}</Text>
          <Text style={styles.gaugeUnit}>{unit}</Text>
        </View>
      </View>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor="rgba(196, 211, 227, 0.45)"
        style={[styles.glassInput, styles.gaugeInput]}
      />
    </View>
  );
}

function SelectCard({
  label,
  description,
  active,
  onPress,
}: {
  label: string;
  description?: string;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(active ? 1.02 : 1)).current;
  const glow = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: active ? 1.02 : 1,
        useNativeDriver: true,
        speed: 18,
        bounciness: 8,
      }),
      Animated.timing(glow, {
        toValue: active ? 1 : 0,
        duration: 220,
        useNativeDriver: false,
      }),
    ]).start();
  }, [active, glow, scale]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        Animated.spring(scale, {
          toValue: active ? 1.03 : 1.015,
          useNativeDriver: true,
          speed: 22,
          bounciness: 8,
        }).start();
      }}
      onPressOut={() => {
        Animated.spring(scale, {
          toValue: active ? 1.02 : 1,
          useNativeDriver: true,
          speed: 18,
          bounciness: 6,
        }).start();
      }}
      style={styles.selectCardPressable}
    >
      <Animated.View
        style={[
          styles.selectCard,
          active && styles.selectCardActive,
          {
            transform: [{ scale }],
            shadowOpacity: glow.interpolate({
              inputRange: [0, 1],
              outputRange: [0.08, 0.32],
            }),
          },
        ]}
      >
        <View style={styles.selectCardTop}>
          <Text style={[styles.selectCardTitle, active && styles.selectCardTitleActive]}>{label}</Text>
          <Animated.View style={[styles.checkBadge, active ? styles.checkBadgeActive : null, { opacity: glow }]}>
            <Text style={styles.checkBadgeText}>✓</Text>
          </Animated.View>
        </View>
        {description ? (
          <Text style={[styles.selectCardDescription, active && styles.selectCardDescriptionActive]}>
            {description}
          </Text>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

function ChoiceGroup<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string;
  value: T;
  options: Array<{ value: T; label: string; description?: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.choiceBlock}>
      <FieldLabel label={label} hint={hint} />
      <View style={styles.cardsGrid}>
        {options.map((option) => (
          <SelectCard
            key={option.value}
            label={option.label}
            description={option.description}
            active={option.value === value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
    </View>
  );
}

function MultiChoiceGroup<T extends string>({
  label,
  hint,
  values,
  options,
  onToggle,
}: {
  label: string;
  hint?: string;
  values: T[];
  options: Array<{ value: T; label: string; description?: string }>;
  onToggle: (value: T) => void;
}) {
  return (
    <View style={styles.choiceBlock}>
      <FieldLabel label={label} hint={hint} />
      <View style={styles.cardsGrid}>
        {options.map((option) => (
          <SelectCard
            key={option.value}
            label={option.label}
            description={option.description}
            active={values.includes(option.value)}
            onPress={() => onToggle(option.value)}
          />
        ))}
      </View>
    </View>
  );
}

function TimeDial({
  label,
  value,
  accent,
  onChange,
}: {
  label: string;
  value: string;
  accent: string;
  onChange: (value: string) => void;
}) {
  const rotation = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  const selectedIndex = Math.max(TIME_OPTIONS.indexOf(value), 0);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(rotation, {
        toValue: selectedIndex,
        speed: 14,
        bounciness: 6,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [pulse, rotation, selectedIndex]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, TIME_OPTIONS.length - 1],
    outputRange: ['0deg', '330deg'],
  });

  return (
    <View style={styles.timeDialBlock}>
      <FieldLabel label={label} hint="Dial digital cu selectie rapida sau editare manuala." />
      <View style={styles.timeDialWrap}>
        <Animated.View
          style={[
            styles.timeDialOrb,
            {
              borderColor: `${accent}77`,
              shadowColor: accent,
              transform: [{ rotate: rotateInterpolate }],
            },
          ]}
        >
          {TIME_OPTIONS.map((option, index) => {
            const angle = (Math.PI * 2 * index) / TIME_OPTIONS.length - Math.PI / 2;
            const x = Math.cos(angle) * 98;
            const y = Math.sin(angle) * 98;
            const active = option === value;

            return (
              <Pressable
                key={option}
                onPress={() => onChange(option)}
                style={[
                  styles.timeMarker,
                  {
                    left: 122 + x,
                    top: 122 + y,
                    backgroundColor: active ? `${accent}33` : 'rgba(255,255,255,0.03)',
                    borderColor: active ? accent : 'rgba(163, 184, 204, 0.16)',
                  },
                ]}
              >
                <Text style={[styles.timeMarkerText, active && { color: accent }]}>{option}</Text>
              </Pressable>
            );
          })}

          <Animated.View
            style={[
              styles.timeDialCore,
              {
                borderColor: `${accent}66`,
                shadowColor: accent,
                transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) }],
              },
            ]}
          >
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="07:00"
              placeholderTextColor="rgba(196, 211, 227, 0.4)"
              style={[styles.timeDialInput, { color: accent }]}
            />
            <Text style={styles.timeDialHint}>SYNCED TIME</Text>
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}

function IdleNeuralState() {
  const pulse = useRef(new Animated.Value(0)).current;
  useLoopingPulse(pulse, 1400);

  const nodes = [
    { top: 38, left: 62 },
    { top: 88, left: 136 },
    { top: 148, left: 82 },
    { top: 118, left: 196 },
    { top: 188, left: 154 },
    { top: 210, left: 54 },
  ];

  return (
    <View style={styles.idleWrap}>
      <View style={styles.neuralNetwork}>
        <View style={[styles.neuralLine, { top: 74, left: 78, width: 78, transform: [{ rotate: '30deg' }] }]} />
        <View style={[styles.neuralLine, { top: 124, left: 102, width: 72, transform: [{ rotate: '-28deg' }] }]} />
        <View style={[styles.neuralLine, { top: 160, left: 70, width: 106, transform: [{ rotate: '18deg' }] }]} />
        <View style={[styles.neuralLine, { top: 180, left: 60, width: 90, transform: [{ rotate: '-38deg' }] }]} />
        {nodes.map((node, index) => (
          <Animated.View
            key={`${node.top}-${node.left}-${index}`}
            style={[
              styles.neuralNode,
              {
                top: node.top,
                left: node.left,
                opacity: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.45, 1],
                }),
                transform: [
                  {
                    scale: pulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.18],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
      <Text style={styles.idleTitle}>Pregateste-te de optimizare.</Text>
      <Text style={styles.idleSubtitle}>Completeaza datele. Consola AI va redacta raportul nutritional, va genera PDF-ul si il va trimite automat.</Text>
    </View>
  );
}

function GeneratingState() {
  const pulse = useRef(new Animated.Value(0)).current;
  useLoopingPulse(pulse, 900);

  return (
    <View style={styles.generatingWrap}>
      <Animated.View
        style={[
          styles.generatingRing,
          {
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.95] }),
            transform: [
              {
                scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.06] }),
              },
            ],
          },
        ]}
      />
      <ActivityIndicator size="large" color="#7fffd4" />
      <Text style={styles.generatingTitle}>AI biometrica redacteaza raportul</Text>
      <Text style={styles.generatingSubtitle}>Scaneaza brief-ul, compune continutul PDF-ului si pregateste livrarea prin email.</Text>
    </View>
  );
}

function MealCard({
  meal,
  alternatives,
  index,
}: {
  meal: NutritionMeal;
  alternatives: string[];
  index: number;
}) {
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 420,
      delay: index * 100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance, index]);

  return (
    <Animated.View
      style={[
        styles.mealCard,
        {
          opacity: entrance,
          transform: [
            {
              translateY: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [22, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.mealCardHeader}>
        <View>
          <Text style={styles.mealCardEyebrow}>{meal.time}</Text>
          <Text style={styles.mealCardTitle}>{meal.name}</Text>
        </View>
        <View style={styles.mealMacroBadge}>
          <Text style={styles.mealMacroBadgeText}>{meal.targetMacros.calories} kcal</Text>
        </View>
      </View>

      <Text style={styles.mealTargetText}>
        Target: P {meal.targetMacros.protein}g | F {meal.targetMacros.fat}g | C {meal.targetMacros.carbs}g
      </Text>

      {meal.foods.map((food, foodIndex) => (
        <View key={`${meal.name}-${food.food}-${foodIndex}`} style={styles.foodRow}>
          <View style={styles.foodRowTextWrap}>
            <Text style={styles.foodName}>{food.food}</Text>
            <Text style={styles.foodMeta}>
              {food.grams}g | P {food.protein} | F {food.fat} | C {food.carbs} | {food.calories} kcal
            </Text>
          </View>
          {food.notes ? <Text style={styles.foodNote}>{food.notes}</Text> : null}
        </View>
      ))}

      {alternatives.length ? (
        <View style={styles.alternativeBox}>
          <Text style={styles.alternativeTitle}>Alternative</Text>
          {alternatives.map((option, optionIndex) => (
            <Text key={`${option}-${optionIndex}`} style={styles.alternativeText}>
              {optionIndex + 1}. {option}
            </Text>
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
}

export default function ClientNutritionScreen() {
  const { user } = useAuth();
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 1100;

  const [calories, setCalories] = useState('2100');
  const [protein, setProtein] = useState('160');
  const [fat, setFat] = useState('70');
  const [carbs, setCarbs] = useState('220');

  const [mealsPerDayType, setMealsPerDayType] = useState<MealsPerDayType>('3+1');
  const [customMealsPerDay, setCustomMealsPerDay] = useState('');
  const [macroDistributionType, setMacroDistributionType] =
    useState<MacroDistributionType>('around-workout');
  const [customMacroDistribution, setCustomMacroDistribution] = useState('');

  const [wakeUpTime, setWakeUpTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('23:00');
  const [hasTraining, setHasTraining] = useState(true);
  const [trainingTime, setTrainingTime] = useState('18:00');
  const [workProgram, setWorkProgram] = useState<WorkProgram>('fixed');

  const [mealLocations, setMealLocations] = useState<MealLocation[]>(['home']);
  const [cookingLevel, setCookingLevel] = useState<CookingLevel>('daily');
  const [foodBudget, setFoodBudget] = useState<FoodBudget>('medium');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<DietaryRestriction[]>([]);
  const [allergiesDetails, setAllergiesDetails] = useState('');
  const [planStyle, setPlanStyle] = useState<PlanStyle>('macros-plus-examples');
  const [excludedFoods, setExcludedFoods] = useState('');
  const [clientName, setClientName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<ClientSex>('male');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderately-active');
  const [preferredEatingStyle, setPreferredEatingStyle] = useState<PreferredEatingStyle>('anything');
  const [objective, setObjective] = useState<ObjectiveType>('lose-weight');
  const [goalWeightKg, setGoalWeightKg] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [lastPayload, setLastPayload] = useState<Record<string, unknown> | null>(null);

  const scanAnim = useRef(new Animated.Value(0)).current;
  const panelAnim = useRef(new Animated.Value(0)).current;
  const buttonPlasma = useRef(new Animated.Value(0)).current;
  const backgroundDrift = useRef(new Animated.Value(0)).current;

  const particleSeeds = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        left: (index * 67) % Math.max(width, 360),
        top: ((index * 129) % Math.max(height, 720)) + 20,
        size: 2 + (index % 3),
        duration: 4200 + index * 170,
        delay: index * 90,
      })),
    [height, width]
  );

  const particleAnims = useMemo(
    () => particleSeeds.map(() => new Animated.Value(0)),
    [particleSeeds]
  );

  useEffect(() => {
    const plasmaLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPlasma, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(buttonPlasma, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const driftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(backgroundDrift, {
          toValue: 1,
          duration: 7000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(backgroundDrift, {
          toValue: 0,
          duration: 7000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    plasmaLoop.start();
    driftLoop.start();

    const particleLoops = particleAnims.map((anim, index) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(particleSeeds[index].delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: particleSeeds[index].duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: particleSeeds[index].duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );

      loop.start();
      return loop;
    });

    return () => {
      plasmaLoop.stop();
      driftLoop.stop();
      particleLoops.forEach((loop) => loop.stop());
    };
  }, [backgroundDrift, buttonPlasma, particleAnims, particleSeeds]);

  const parseNumber = (value: string) => Number(value.replace(',', '.').trim());
  const isValidTime = (value: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value.trim());

  const baseMacrosValid =
    parseNumber(calories) >= 800 &&
    parseNumber(protein) > 0 &&
    parseNumber(fat) > 0 &&
    parseNumber(carbs) > 0;

  const customMealsValid =
    mealsPerDayType !== 'custom' ||
    (Number.isInteger(parseNumber(customMealsPerDay)) && parseNumber(customMealsPerDay) > 0);
  const customMacroValid =
    macroDistributionType !== 'custom' || customMacroDistribution.trim().length > 0;
  const scheduleValid =
    isValidTime(wakeUpTime) &&
    isValidTime(sleepTime) &&
    (!hasTraining || isValidTime(trainingTime));
  const restrictionsValid =
    !dietaryRestrictions.includes('allergies') || allergiesDetails.trim().length > 0;
  const mealLocationsValid = mealLocations.length > 0;
  const profileValid =
    clientName.trim().length >= 2 &&
    parseNumber(age) >= 14 &&
    parseNumber(weightKg) >= 30 &&
    parseNumber(heightCm) >= 120;

  const generateMutation = useMutation({
    mutationFn: async () => {
      const payload: Parameters<typeof nutritionAPI.generateReport>[0] = {
        clientName: clientName.trim(),
        age: parseNumber(age),
        sex,
        weightKg: parseNumber(weightKg),
        heightCm: parseNumber(heightCm),
        activityLevel,
        preferredEatingStyle,
        objective,
        goalWeightKg: goalWeightKg.trim() ? parseNumber(goalWeightKg) : undefined,
        targetDate: targetDate.trim() || undefined,
        clientNotes: clientNotes.trim() || undefined,
        calories: parseNumber(calories),
        proteinGrams: parseNumber(protein),
        fatGrams: parseNumber(fat),
        carbsGrams: parseNumber(carbs),
        mealsPerDayType,
        customMealsPerDay:
          mealsPerDayType === 'custom' ? parseNumber(customMealsPerDay) : undefined,
        macroDistributionType,
        customMacroDistribution:
          macroDistributionType === 'custom' ? customMacroDistribution.trim() : undefined,
        wakeUpTime: wakeUpTime.trim(),
        sleepTime: sleepTime.trim(),
        hasTraining,
        trainingTime: hasTraining ? trainingTime.trim() : undefined,
        workProgram,
        mealLocations,
        cookingLevel,
        foodBudget,
        dietaryRestrictions,
        allergiesDetails: dietaryRestrictions.includes('allergies')
          ? allergiesDetails.trim()
          : undefined,
        excludedFoodsAndPreferences: excludedFoods.trim() || undefined,
        planStyle,
      };

      setLastPayload(payload);
      const { data } = await nutritionAPI.generateReport(payload);
      return data as NutritionResult;
    },
    onMutate: () => {
      panelAnim.setValue(0);
    },
    onSuccess: () => {
      Animated.timing(panelAnim, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
  });

  const canGenerate =
    baseMacrosValid &&
    customMealsValid &&
    customMacroValid &&
    scheduleValid &&
    restrictionsValid &&
    mealLocationsValid &&
    profileValid;

  const backendError = (generateMutation.error as any)?.response?.data;
  const backendErrorText = formatValidationError(backendError);
  const result = generateMutation.data;
  const deliveryEmail = result?.emailedTo || user?.email;

  const toggleItem = <T extends string,>(value: T, current: T[], setState: (items: T[]) => void) => {
    if (current.includes(value)) {
      setState(current.filter((item) => item !== value));
      return;
    }
    setState([...current, value]);
  };

  const handleGenerate = () => {
    setValidationError(null);

    if (!baseMacrosValid) {
      setValidationError('Caloriile trebuie sa fie cel putin 800, iar macro-urile trebuie completate cu valori pozitive.');
      return;
    }

    if (!customMealsValid) {
      setValidationError('Pentru optiunea custom, introdu un numar intreg de mese mai mare ca 0.');
      return;
    }

    if (!customMacroValid) {
      setValidationError('Completeaza distributia personalizata a macro-urilor.');
      return;
    }

    if (!scheduleValid) {
      setValidationError('Orele trebuie sa respecte formatul HH:mm.');
      return;
    }

    if (!mealLocationsValid) {
      setValidationError('Selecteaza cel putin un context de masa.');
      return;
    }

    if (!profileValid) {
      setValidationError('Completeaza profilul clientului: nume, varsta, greutate si inaltime.');
      return;
    }

    if (!restrictionsValid) {
      setValidationError('Daca selectezi alergii, completeaza si detaliile.');
      return;
    }

    scanAnim.setValue(0);
    Animated.timing(scanAnim, {
      toValue: 1,
      duration: 950,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      scanAnim.setValue(0);
    });

    generateMutation.mutate();
  };

  const handleOpenPdf = async () => {
    if (!result?.pdfUrl) return;
    await Linking.openURL(result.pdfUrl);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.backgroundBase} />
      <Animated.View
        style={[
          styles.backgroundAuraMint,
          {
            transform: [
              {
                translateY: backgroundDrift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-24, 24],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.backgroundAuraBlue,
          {
            transform: [
              {
                translateX: backgroundDrift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [26, -18],
                }),
              },
            ],
          },
        ]}
      />

      {particleSeeds.map((particle, index) => (
        <Animated.View
          key={`particle-${index}`}
          style={[
            styles.particle,
            {
              width: particle.size,
              height: particle.size,
              left: particle.left,
              top: particle.top,
              opacity: particleAnims[index].interpolate({
                inputRange: [0, 1],
                outputRange: [0.15, 0.7],
              }),
              transform: [
                {
                  translateY: particleAnims[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, -12],
                  }),
                },
              ],
            },
          ]}
        />
      ))}

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.heroHeader}>
          <Text style={styles.eyebrow}>TRAINEROS NUTRITION ENGINE</Text>
          <Text style={styles.title}>TrainerOS Nutrition Console</Text>
          <Text style={styles.subtitle}>
            Configurezi brief-ul clientului, iar TrainerOS redactează raportul nutrițional, generează PDF-ul și îl livrează automat pe email.
          </Text>
        </View>

        <View style={[styles.mainGrid, isDesktop && styles.mainGridDesktop]}>
          <View style={[styles.leftRail, isDesktop && styles.leftRailDesktop]}>
            <View style={styles.glassPanel}>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.scanBeam,
                  {
                    opacity: scanAnim.interpolate({
                      inputRange: [0, 0.05, 0.9, 1],
                      outputRange: [0, 0.75, 0.45, 0],
                    }),
                    transform: [
                      {
                        translateY: scanAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-50, 1180],
                        }),
                      },
                    ],
                  },
                ]}
              />

              <SectionHeader
                index="1"
                title="Ținte macro și setup metabolic"
                description="Completezi țintele zilnice și structura de bază a planului care vor apărea în raportul PDF."
              />

              <View style={styles.gaugesGrid}>
                <BiometricGauge
                  label="Calorii"
                  accent="#8CF8D4"
                  value={calories}
                  onChangeText={setCalories}
                  unit="kcal"
                  max={4000}
                />
                <BiometricGauge
                  label="Proteina"
                  accent="#56B6FF"
                  value={protein}
                  onChangeText={setProtein}
                  unit="g"
                  max={320}
                />
                <BiometricGauge
                  label="Grasimi"
                  accent="#F7D35B"
                  value={fat}
                  onChangeText={setFat}
                  unit="g"
                  max={180}
                />
                <BiometricGauge
                  label="Carbohidrati"
                  accent="#FF6A8A"
                  value={carbs}
                  onChangeText={setCarbs}
                  unit="g"
                  max={500}
                />
              </View>

              <ChoiceGroup
               label="Numar mese pe zi"
                hint="Cardurile reactive inlocuiesc radio button-urile clasice."
                value={mealsPerDayType}
                onChange={(value) => setMealsPerDayType(value)}
                options={[
                  { value: '3', label: '3 mese', description: 'Structura compacta si usor de urmarit.' },
                  { value: '3+1', label: '3 + 1 gustare', description: 'Flux echilibrat pentru clienti activi.' },
                  { value: '4', label: '4 mese', description: 'Distribuire mai omogena a energiei.' },
                  { value: '5', label: '5 mese', description: 'Cadenta mai frecventa pe parcursul zilei.' },
                  { value: 'custom', label: 'Custom', description: 'Defineste manual numarul de interventii alimentare.' },
                ]}
              />

              {mealsPerDayType === 'custom' ? (
                <GlassInput
                  label="Numar mese personalizat"
                  value={customMealsPerDay}
                  onChangeText={setCustomMealsPerDay}
                  placeholder="Ex: 6"
                  keyboardType="numeric"
                />
              ) : null}

              <SectionHeader
                index="2"
                title="Arhitectura meselor"
                description="Alegi distribuția macro-urilor și numărul de mese exact ca în frontend, pentru un output clar și executabil."
              />

              <ChoiceGroup
                label="Strategie de distributie"
                value={macroDistributionType}
                onChange={(value) => setMacroDistributionType(value)}
                options={[
                  { value: 'equal', label: 'Egal', description: 'Macro-uri distribuite relativ uniform.' },
                  {
                    value: 'around-workout',
                    label: 'Around workout',
                    description: 'Mai multi carbo in jurul antrenamentului.',
                  },
                  {
                    value: 'more-evening-carbs',
                    label: 'Carbo seara',
                    description: 'Sustine apetitul si complianța in partea a doua a zilei.',
                  },
                  {
                    value: 'low-carb-breakfast',
                    label: 'Mic dejun low-carb',
                    description: 'Pornire controlata si incarcatura mai tarzie.',
                  },
                  {
                    value: 'custom',
                    label: 'Distribuire custom',
                    description: 'Descrie logică exacta dorita de client.',
                  },
                ]}
              />

              {macroDistributionType === 'custom' ? (
                <GlassInput
                  label="Instructiune custom"
                  value={customMacroDistribution}
                  onChangeText={setCustomMacroDistribution}
                  placeholder="Ex: 20% dimineata, 50% in jurul antrenamentului, 30% seara"
                  multiline
                />
              ) : null}

              <SectionHeader
                index="3"
                title="Program client"
                description="Orele de trezire, somn și antrenament calibrează timingul nutrițional folosit în raport."
              />

              <View style={[styles.timeGrid, isDesktop && styles.timeGridDesktop]}>
                <TimeDial label="Trezire" value={wakeUpTime} accent="#8CF8D4" onChange={setWakeUpTime} />
                <TimeDial label="Culcare" value={sleepTime} accent="#7AA2FF" onChange={setSleepTime} />
                {hasTraining ? (
                  <TimeDial
                    label="Antrenament"
                    value={trainingTime}
                    accent="#FF6A8A"
                    onChange={setTrainingTime}
                  />
                ) : null}
              </View>

              <ChoiceGroup
                label="Antrenament"
                value={hasTraining ? 'yes' : 'no'}
                onChange={(value) => setHasTraining(value === 'yes')}
                options={[
                  { value: 'yes', label: 'Se antreneaza', description: 'Planul va ancora nutrientii in jurul sesiunii.' },
                  { value: 'no', label: 'Fara antrenament', description: 'Plan mai liniar, fara ferestre dedicate.' },
                ]}
              />

              <ChoiceGroup
                label="Program de lucru"
                value={workProgram}
                onChange={(value) => setWorkProgram(value)}
                options={[
                  { value: 'fixed', label: 'Program fix', description: 'Ritm zilnic predictibil.' },
                  { value: 'shifts', label: 'Ture', description: 'Necesita flexibilitate si ancore mobile.' },
                  { value: 'flexible', label: 'Flexibil', description: 'Ferestre de masa mai elastice.' },
                  { value: 'mostly-home', label: 'Majoritar acasa', description: 'Control mai bun asupra prepararii.' },
                ]}
              />

              <SectionHeader
                index="4"
                title="Context alimentar și restricții"
                description="Definiți unde mănâncă, cum gătește și ce restricții are clientul pentru un plan realist."
              />

              <MultiChoiceGroup
                label="Locatii de masa"
                hint="Selecteaza unul sau mai multe contexte."
                values={mealLocations}
                onToggle={(value) => toggleItem(value, mealLocations, setMealLocations)}
                options={[
                  { value: 'home', label: 'Acasa', description: 'Control total asupra prepararii.' },
                  { value: 'office', label: 'Birou', description: 'Portii usor de transportat.' },
                  { value: 'delivery', label: 'Delivery', description: 'Alternative usor de comandat.' },
                  { value: 'canteen', label: 'Cantina', description: 'Alegere din optiuni limitate.' },
                  { value: 'on-the-go', label: 'Pe fuga', description: 'Consum rapid, fara mult prep.' },
                ]}
              />

              <ChoiceGroup
                label="Nivel de gatit"
                value={cookingLevel}
                onChange={(value) => setCookingLevel(value)}
                options={[
                  { value: 'daily', label: 'Gateste zilnic', description: 'Poate sustine preparate proaspete.' },
                  { value: 'meal-prep', label: 'Meal prep', description: 'Preferinta pentru batch cooking.' },
                  { value: 'rare', label: 'Rar', description: 'Simplificare si shortcut-uri.' },
                  { value: 'almost-never', label: 'Aproape deloc', description: 'Accent pe optiuni gata facute.' },
                ]}
              />

              <ChoiceGroup
                label="Buget alimentar"
                value={foodBudget}
                onChange={(value) => setFoodBudget(value)}
                options={[
                  { value: 'low', label: 'Low', description: 'Optimizat pentru cost si accesibilitate.' },
                  { value: 'medium', label: 'Medium', description: 'Mix echilibrat de cost si varietate.' },
                  { value: 'high', label: 'High', description: 'Mai multa libertate de selectie.' },
                ]}
              />

              <MultiChoiceGroup
                label="Restrictii dietare"
                values={dietaryRestrictions}
                onToggle={(value) => toggleItem(value, dietaryRestrictions, setDietaryRestrictions)}
                options={[
                  { value: 'lactose-free', label: 'Fara lactoza' },
                  { value: 'gluten-free', label: 'Fara gluten' },
                  { value: 'vegetarian', label: 'Vegetarian' },
                  { value: 'vegan', label: 'Vegan' },
                  { value: 'intermittent-fasting', label: 'Fasting' },
                  { value: 'religious-fasting', label: 'Post religios' },
                  { value: 'allergies', label: 'Alergii' },
                ]}
              />

              {dietaryRestrictions.includes('allergies') ? (
                <GlassInput
                  label="Detalii alergii"
                  value={allergiesDetails}
                  onChangeText={setAllergiesDetails}
                  placeholder="Ex: arahide, crustacee, ou"
                  multiline
                />
              ) : null}

              <SectionHeader
                index="5"
                title="Stilul final al planului"
                description="Controlezi formatul livrabilului: de la gramaje exacte până la template-uri flexibile cu alternative."
              />

              <ChoiceGroup
                label="Formatul planului"
                value={planStyle}
                onChange={(value) => setPlanStyle(value)}
                options={[
                  { value: 'exact-grams', label: 'Gramaje exacte', description: 'Precizie maxima pe fiecare aliment.' },
                  {
                    value: 'macros-plus-examples',
                    label: 'Macro + exemple',
                    description: 'Echilibru intre control si flexibilitate.',
                  },
                  {
                    value: 'flexible-template',
                    label: 'Template flexibil',
                    description: 'Liste interschimbabile si executie usoara.',
                  },
                  {
                    value: 'full-day-with-alternatives',
                    label: 'Zi completa + alternative',
                    description: 'Plan extins, cu back-up pentru aderenta.',
                  },
                ]}
              />

              <GlassInput
                label="Alimente excluse / preferinte"
                value={excludedFoods}
                onChangeText={setExcludedFoods}
                placeholder="Ex: fara peste, prefera pui, iaurt grecesc, legume la cuptor"
                multiline
              />

              <SectionHeader
                index="6"
                title="Profil client pentru PDF"
                description="Flux unic ca pe web: brief complet, raport PDF generat și trimis automat pe email."
              />

              <GlassInput
                label="Nume client"
                value={clientName}
                onChangeText={setClientName}
                placeholder="Ex: Andrei Popescu"
              />

              <View style={styles.dualInputRow}>
                <View style={styles.dualInputCell}>
                  <GlassInput
                    label="Varsta"
                    value={age}
                    onChangeText={setAge}
                    placeholder="32"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.dualInputCell}>
                  <GlassInput
                    label="Sex"
                    value={sex}
                    onChangeText={setSex as (value: string) => void}
                    placeholder="male"
                  />
                </View>
              </View>

              <View style={styles.dualInputRow}>
                <View style={styles.dualInputCell}>
                  <GlassInput
                    label="Greutate (kg)"
                    value={weightKg}
                    onChangeText={setWeightKg}
                    placeholder="81"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.dualInputCell}>
                  <GlassInput
                    label="Inaltime (cm)"
                    value={heightCm}
                    onChangeText={setHeightCm}
                    placeholder="176"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <GlassInput
                label="Nivel activitate"
                value={activityLevel}
                onChangeText={setActivityLevel as (value: string) => void}
                placeholder="moderately-active"
              />

              <GlassInput
                label="Stil alimentar preferat"
                value={preferredEatingStyle}
                onChangeText={setPreferredEatingStyle as (value: string) => void}
                placeholder="anything"
              />

              <GlassInput
                label="Obiectiv"
                value={objective}
                onChangeText={setObjective as (value: string) => void}
                placeholder="lose-weight"
              />

              <View style={styles.dualInputRow}>
                <View style={styles.dualInputCell}>
                  <GlassInput
                    label="Greutate tinta"
                    value={goalWeightKg}
                    onChangeText={setGoalWeightKg}
                    placeholder="72"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.dualInputCell}>
                  <GlassInput
                    label="Data tinta"
                    value={targetDate}
                    onChangeText={setTargetDate}
                    placeholder="2026-06-30"
                  />
                </View>
              </View>

              <GlassInput
                label="Observatii client"
                value={clientNotes}
                onChangeText={setClientNotes}
                placeholder="Ex: prefera mese reci la pranz, lucreaza pe teren, foame mare seara"
                multiline
              />

              <Pressable
                onPress={handleGenerate}
                disabled={!canGenerate || generateMutation.isPending}
                style={({ pressed }) => [
                  styles.generateButton,
                  (!canGenerate || generateMutation.isPending) && styles.generateButtonDisabled,
                  pressed && canGenerate && !generateMutation.isPending && styles.generateButtonPressed,
                ]}
              >
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.generateButtonPlasma,
                    {
                      opacity: buttonPlasma.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.55, 0.95],
                      }),
                      transform: [
                        {
                          translateX: buttonPlasma.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-40, 48],
                          }),
                        },
                        {
                          scale: buttonPlasma.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.08],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <View style={styles.generateButtonInner}>
                  <Text style={styles.generateButtonEyebrow}>ENERGY SURGE</Text>
                  <Text style={styles.generateButtonText}>
                    {generateMutation.isPending ? 'Generez PDF-ul...' : 'Generează și trimite raportul PDF'}
                  </Text>
                  <Text style={styles.generateButtonHint}>
                    Scanare biometrică, redactare raport, compunere PDF și livrare automată pe email.
                  </Text>
                </View>
              </Pressable>

              {validationError ? <Text style={styles.errorText}>{validationError}</Text> : null}

              {generateMutation.isError && !validationError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{backendErrorText}</Text>
                  <Text style={styles.debugText}>Payload: {JSON.stringify(lastPayload)}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <Animated.View
            style={[
              styles.rightRail,
              isDesktop && styles.rightRailDesktop,
              result && {
                opacity: panelAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
                transform: [
                  {
                    translateY: panelAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [18, 0],
                    }),
                  },
                  {
                    scale: panelAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.985, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.glassPanel}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultEyebrow}>REPORT DELIVERY</Text>
                <Text style={styles.resultTitle}>Livrare raport PDF</Text>
              </View>

              {!result && !generateMutation.isPending ? <IdleNeuralState /> : null}
              {generateMutation.isPending ? <GeneratingState /> : null}

              {result ? (
                <View style={styles.resultContent}>
                  {result.message ? (
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryTitle}>Status livrare</Text>
                      <Text style={styles.summaryText}>{result.message}</Text>
                    </View>
                  ) : null}

                  {result.reportPreview ? (
                    <View style={styles.totalGrid}>
                      <View style={styles.totalChip}>
                        <Text style={styles.totalChipValue}>{result.reportPreview.calorieTarget}</Text>
                        <Text style={styles.totalChipLabel}>kcal target</Text>
                      </View>
                      <View style={styles.totalChip}>
                        <Text style={styles.totalChipValue}>{result.reportPreview.mealsPerDay}</Text>
                        <Text style={styles.totalChipLabel}>mese / zi</Text>
                      </View>
                    </View>
                  ) : null}

                  {result.reportPreview?.title ? (
                    <View style={styles.metaPanel}>
                      <Text style={styles.metaPanelTitle}>Preview raport</Text>
                      <Text style={styles.metaPanelText}>{result.reportPreview.title}</Text>
                      <Text style={styles.metaPanelText}>{result.reportPreview.summary}</Text>
                    </View>
                  ) : null}

                  {result.reportPreview?.macroSummary || deliveryEmail || result.pdfUrl ? (
                    <View style={styles.metaPanel}>
                      <Text style={styles.metaPanelTitle}>Livrare și sumare</Text>
                      {result.reportPreview?.macroSummary ? (
                        <Text style={styles.metaPanelText}>{result.reportPreview.macroSummary}</Text>
                      ) : null}
                      {deliveryEmail ? (
                        <Text style={styles.metaPanelText}>Trimis la: {deliveryEmail}</Text>
                      ) : null}
                      <Text style={styles.metaPanelSubtle}>
                        PDF-ul este trimis prin email și poate fi deschis direct și din aplicație.
                      </Text>
                    </View>
                  ) : null}

                  {result.pdfUrl ? (
                    <Pressable style={styles.openPdfButton} onPress={handleOpenPdf}>
                      <Text style={styles.openPdfButtonText}>Deschide PDF-ul</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  backgroundBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#12171E',
  },
  backgroundAuraMint: {
    position: 'absolute',
    top: -120,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(44, 255, 205, 0.10)',
  },
  backgroundAuraBlue: {
    position: 'absolute',
    right: -60,
    top: 150,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(55, 110, 255, 0.12)',
  },
  particle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(185, 245, 234, 0.9)',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 44,
  },
  heroHeader: {
    marginBottom: 18,
  },
  eyebrow: {
    color: '#8CF8D4',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.8,
    marginBottom: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    marginBottom: 10,
  },
  subtitle: {
    color: 'rgba(226, 232, 240, 0.8)',
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 860,
  },
  mainGrid: {
    gap: 18,
  },
  mainGridDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  leftRail: {
    gap: 18,
  },
  leftRailDesktop: {
    flex: 1.12,
  },
  rightRail: {
    gap: 18,
  },
  rightRailDesktop: {
    flex: 0.88,
  },
  glassPanel: {
    overflow: 'hidden',
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(122, 255, 224, 0.35)',
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    shadowColor: '#8CF8D4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 10,
  },
  scanBeam: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(127, 255, 212, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(127, 255, 212, 0.4)',
    shadowColor: '#8CF8D4',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  sectionBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(140, 248, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(140, 248, 212, 0.3)',
  },
  sectionBadgeText: {
    color: '#8CF8D4',
    fontSize: 14,
    fontWeight: '800',
  },
  sectionHeaderTextWrap: {
    flex: 1,
  },
  sectionEyebrow: {
    color: 'rgba(140, 248, 212, 0.72)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.2,
    marginBottom: 5,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  sectionDescription: {
    color: 'rgba(203, 213, 225, 0.82)',
    fontSize: 13,
    lineHeight: 21,
  },
  gaugesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  gaugeCard: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 148,
    padding: 12,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  gaugeLabel: {
    color: 'rgba(226, 232, 240, 0.92)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  arcadeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 118,
    marginBottom: 8,
  },
  arcClip: {
    width: ARC_WIDTH,
    height: ARC_HEIGHT,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  arcTrack: {
    position: 'absolute',
    bottom: 0,
    width: ARC_WIDTH,
    height: ARC_WIDTH,
    borderRadius: ARC_WIDTH / 2,
    borderWidth: 11,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'transparent',
  },
  arcSweep: {
    position: 'absolute',
    bottom: 10,
    height: 10,
    borderRadius: 999,
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 8,
  },
  arcSweepAura: {
    position: 'absolute',
    bottom: 4,
    height: 22,
    borderRadius: 999,
  },
  gaugeCenter: {
    position: 'absolute',
    bottom: 6,
    alignItems: 'center',
  },
  gaugeValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  gaugeUnit: {
    color: 'rgba(148, 163, 184, 0.92)',
    fontSize: 11,
    letterSpacing: 1.8,
    marginTop: 3,
  },
  gaugeInput: {
    minHeight: 46,
    textAlign: 'center',
  },
  fieldLabelWrap: {
    marginBottom: 8,
  },
  fieldLabel: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  fieldHint: {
    color: 'rgba(148, 163, 184, 0.85)',
    fontSize: 12,
    lineHeight: 18,
  },
  inputBlock: {
    marginBottom: 14,
  },
  dualInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dualInputCell: {
    flex: 1,
  },
  glassInput: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(130, 158, 184, 0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    color: '#FFFFFF',
    fontSize: 15,
  },
  glassInputMultiline: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  choiceBlock: {
    marginBottom: 16,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  selectCardPressable: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 146,
  },
  selectCard: {
    minHeight: 94,
    borderRadius: 20,
    padding: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.035)',
    shadowColor: '#6EE7FF',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
  },
  selectCardActive: {
    borderColor: '#6EE7FF',
    backgroundColor: 'rgba(31, 225, 255, 0.12)',
  },
  selectCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  selectCardTitle: {
    flex: 1,
    color: 'rgba(226, 232, 240, 0.78)',
    fontSize: 14,
    fontWeight: '700',
    paddingRight: 10,
  },
  selectCardTitleActive: {
    color: '#FFFFFF',
  },
  selectCardDescription: {
    color: 'rgba(148, 163, 184, 0.78)',
    fontSize: 12,
    lineHeight: 18,
  },
  selectCardDescriptionActive: {
    color: 'rgba(226, 232, 240, 0.95)',
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  checkBadgeActive: {
    borderColor: '#6EE7FF',
    backgroundColor: 'rgba(110, 231, 255, 0.18)',
  },
  checkBadgeText: {
    color: '#E6FFFD',
    fontSize: 12,
    fontWeight: '800',
  },
  timeGrid: {
    gap: 12,
    marginBottom: 14,
  },
  timeGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timeDialBlock: {
    flexGrow: 1,
    minWidth: 280,
  },
  timeDialWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 286,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
  },
  timeDialOrb: {
    width: 282,
    height: 282,
    borderRadius: 141,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
  },
  timeMarker: {
    position: 'absolute',
    marginLeft: -28,
    marginTop: -14,
    minWidth: 56,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 1,
  },
  timeMarkerText: {
    color: 'rgba(226, 232, 240, 0.78)',
    fontSize: 10,
    fontWeight: '700',
  },
  timeDialCore: {
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 15, 24, 0.88)',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
  },
  timeDialInput: {
    width: 90,
    textAlign: 'center',
    fontSize: 23,
    fontWeight: '800',
  },
  timeDialHint: {
    color: 'rgba(148, 163, 184, 0.8)',
    fontSize: 9,
    letterSpacing: 1.6,
    marginTop: 2,
  },
  generateButton: {
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 255, 0.45)',
    backgroundColor: 'rgba(11, 22, 38, 0.9)',
    shadowColor: '#6EE7FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.32,
    shadowRadius: 18,
    elevation: 10,
  },
  generateButtonDisabled: {
    opacity: 0.45,
  },
  generateButtonPressed: {
    transform: [{ scale: 0.99 }],
  },
  generateButtonPlasma: {
    position: 'absolute',
    top: -24,
    left: 20,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(124, 255, 233, 0.42)',
  },
  generateButtonInner: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: 'rgba(5, 10, 18, 0.48)',
  },
  generateButtonEyebrow: {
    color: '#8CF8D4',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.4,
    marginBottom: 5,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  generateButtonHint: {
    color: 'rgba(226, 232, 240, 0.82)',
    fontSize: 13,
    lineHeight: 19,
  },
  errorBox: {
    marginTop: 8,
  },
  errorText: {
    color: '#FF879D',
    fontSize: 13,
    lineHeight: 19,
  },
  debugText: {
    color: 'rgba(148, 163, 184, 0.72)',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },
  resultHeader: {
    marginBottom: 14,
  },
  resultEyebrow: {
    color: '#8CF8D4',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.4,
    marginBottom: 6,
  },
  resultTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  idleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 34,
  },
  neuralNetwork: {
    width: 270,
    height: 270,
    position: 'relative',
    marginBottom: 16,
  },
  neuralLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(132, 255, 222, 0.26)',
  },
  neuralNode: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#8CF8D4',
    shadowColor: '#8CF8D4',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  idleTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  idleSubtitle: {
    color: 'rgba(203, 213, 225, 0.82)',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  generatingWrap: {
    minHeight: 340,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  generatingRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(140, 248, 212, 0.35)',
    backgroundColor: 'rgba(140, 248, 212, 0.08)',
  },
  generatingTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  generatingSubtitle: {
    color: 'rgba(203, 213, 225, 0.82)',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 360,
  },
  resultContent: {
    gap: 12,
  },
  summaryCard: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 255, 0.18)',
  },
  summaryTitle: {
    color: '#8CF8D4',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  summaryText: {
    color: '#F8FAFC',
    fontSize: 14,
    lineHeight: 22,
  },
  totalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  totalChip: {
    flexGrow: 1,
    minWidth: 120,
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  totalChipValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  totalChipLabel: {
    color: 'rgba(148, 163, 184, 0.88)',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  mealCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  mealCardEyebrow: {
    color: '#8CF8D4',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginBottom: 4,
  },
  mealCardTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  mealMacroBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(140, 248, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(140, 248, 212, 0.24)',
    alignSelf: 'flex-start',
  },
  mealMacroBadgeText: {
    color: '#8CF8D4',
    fontSize: 12,
    fontWeight: '700',
  },
  mealTargetText: {
    color: 'rgba(203, 213, 225, 0.9)',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  foodRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  foodRowTextWrap: {
    gap: 4,
  },
  foodName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  foodMeta: {
    color: 'rgba(148, 163, 184, 0.88)',
    fontSize: 12,
    lineHeight: 18,
  },
  foodNote: {
    color: '#8CF8D4',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  alternativeBox: {
    marginTop: 8,
    borderRadius: 18,
    padding: 12,
    backgroundColor: 'rgba(110, 231, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 255, 0.16)',
  },
  alternativeTitle: {
    color: '#E0FDFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  alternativeText: {
    color: 'rgba(226, 232, 240, 0.94)',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
  metaPanel: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  metaPanelTitle: {
    color: '#8CF8D4',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  metaPanelText: {
    color: '#F8FAFC',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 6,
  },
  metaPanelSubtle: {
    color: 'rgba(148, 163, 184, 0.88)',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  openPdfButton: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(114, 202, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(114, 202, 255, 0.24)',
  },
  openPdfButtonText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
});
