import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { nutritionAPI } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

type MealsPerDayType = '3' | '3+1' | '4' | '5' | 'custom';
type MacroDistributionType = 'equal' | 'around-workout' | 'more-evening-carbs' | 'low-carb-breakfast' | 'custom';
type WorkProgram = 'fixed' | 'shifts' | 'flexible' | 'mostly-home';
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
type PlanStyle = 'exact-grams' | 'macros-plus-examples' | 'flexible-template' | 'full-day-with-alternatives';
type ClientSex = 'male' | 'female' | 'other';
type ActivityLevel = 'sedentary' | 'lightly-active' | 'moderately-active' | 'very-active' | 'athlete';
type PreferredEatingStyle = 'anything' | 'high-protein' | 'vegetarian' | 'vegan' | 'pescatarian' | 'mediterranean';
type ObjectiveType = 'lose-weight' | 'maintain' | 'gain-muscle' | 'recomposition' | 'performance';

interface NutritionReportResponse {
  message: string;
  emailedTo: string;
  pdfUrl: string;
  filename: string;
  reportPreview: {
    title: string;
    summary: string;
    calorieTarget: number;
    macroSummary: string;
    mealsPerDay: number;
  };
}

const mealLocationOptions: Array<{ value: MealLocation; label: string; description: string }> = [
  { value: 'home', label: 'Acasă', description: 'Control complet al ingredientelor și pregătirii.' },
  { value: 'office', label: 'Birou', description: 'Porții transportabile și timing previzibil.' },
  { value: 'delivery', label: 'Delivery', description: 'Opțiuni ușor de comandat și repetat.' },
  { value: 'canteen', label: 'Cantină', description: 'Decizii rapide în meniu limitat.' },
  { value: 'on-the-go', label: 'Pe drum', description: 'Execuție rapidă pentru zile haotice.' },
];

const restrictionOptions: Array<{ value: DietaryRestriction; label: string; description: string }> = [
  { value: 'lactose-free', label: 'Fără lactoză', description: 'Elimină sursele cu lactoză.' },
  { value: 'gluten-free', label: 'Fără gluten', description: 'Evită cerealele cu gluten.' },
  { value: 'vegetarian', label: 'Vegetarian', description: 'Fără carne, cu opțiuni lacto-ovo.' },
  { value: 'vegan', label: 'Vegan', description: 'Exclusiv surse vegetale.' },
  { value: 'intermittent-fasting', label: 'Fasting', description: 'Fereastră de alimentație limitată.' },
  { value: 'religious-fasting', label: 'Post religios', description: 'Respectă perioadele și restricțiile specifice.' },
  { value: 'allergies', label: 'Alergii', description: 'Necesită detalii precise în brief.' },
];

const timeOptions = ['05:00', '06:00', '07:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '23:00'];

function useAnimatedNumber(target: number) {
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    let frame = 0;
    const startValue = display;
    const startTime = performance.now();
    const duration = 360;

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startValue + (target - startValue) * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return display;
}

function SectionTitle({ index, title, description }: { index: string; title: string; description?: string }) {
  return (
    <div className="mb-5 flex items-start gap-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#8CF8D455] bg-[#8CF8D418] text-sm font-bold text-[#8CF8D4] shadow-[0_0_25px_rgba(140,248,212,0.18)]">
        {index}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#8CF8D4CC]">Secțiunea {index}</div>
        <h2 className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-2xl font-semibold text-transparent">
          {title}
        </h2>
        {description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-300/78">{description}</p> : null}
      </div>
    </div>
  );
}

function GlassInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-100">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[108px] w-full rounded-[20px] border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none transition focus:border-[#8CF8D488] focus:shadow-[0_0_0_1px_rgba(140,248,212,0.18),0_0_25px_rgba(110,231,255,0.12)]"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-12 w-full rounded-[18px] border border-white/10 bg-black/35 px-4 text-sm text-white outline-none transition focus:border-[#8CF8D488] focus:shadow-[0_0_0_1px_rgba(140,248,212,0.18),0_0_25px_rgba(110,231,255,0.12)]"
        />
      )}
    </label>
  );
}

function GaugeArc({
  label,
  accent,
  value,
  max,
  unit,
  onChange,
}: {
  label: string;
  accent: string;
  value: string;
  max: number;
  unit: string;
  onChange: (value: string) => void;
}) {
  const numericValue = Number(value) || 0;
  const progress = Math.max(0, Math.min(numericValue / max, 1));
  const circumference = Math.PI * 58;
  const offset = circumference * (1 - progress);
  const display = useAnimatedNumber(numericValue);

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300/80">{label}</div>
      <div className="relative flex h-[146px] items-center justify-center">
        <svg width="156" height="100" viewBox="0 0 156 100" className="absolute top-1">
          <path d="M20 80 A58 58 0 0 1 136 80" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="11" strokeLinecap="round" />
          <path
            d="M20 80 A58 58 0 0 1 136 80"
            fill="none"
            stroke={accent}
            strokeWidth="11"
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
              transition: 'stroke-dashoffset 340ms cubic-bezier(0.22,1,0.36,1)',
              filter: `drop-shadow(0 0 14px ${accent})`,
            }}
          />
        </svg>
        <div className="absolute bottom-4 flex flex-col items-center">
          <div className="text-[30px] font-semibold tracking-tight" style={{ color: accent }}>
            {display}
          </div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">{unit}</div>
        </div>
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-2xl border border-white/10 bg-black/35 px-4 text-center text-sm text-white outline-none transition focus:border-[#8CF8D488] focus:shadow-[0_0_0_1px_rgba(140,248,212,0.18),0_0_25px_rgba(110,231,255,0.12)]"
      />
    </div>
  );
}

function SelectCard({
  label,
  description,
  active,
  onClick,
}: {
  label: string;
  description?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative min-h-[104px] rounded-[22px] border px-4 py-4 text-left transition duration-300 ${
        active
          ? 'scale-[1.02] border-cyan-300/70 bg-cyan-300/[0.12] shadow-[0_0_26px_rgba(110,231,255,0.14)]'
          : 'border-white/10 bg-white/[0.035] hover:border-cyan-200/35 hover:bg-white/[0.055]'
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-4">
        <span className={`text-sm font-semibold ${active ? 'text-white' : 'text-white/70'}`}>{label}</span>
        <span
          className={`grid h-6 w-6 place-items-center rounded-full border text-[11px] transition ${
            active
              ? 'border-cyan-300/70 bg-cyan-300/20 text-cyan-100 shadow-[0_0_16px_rgba(110,231,255,0.18)]'
              : 'border-white/12 bg-white/[0.03] text-transparent'
          }`}
        >
          ✓
        </span>
      </div>
      {description ? <p className={`text-xs leading-5 ${active ? 'text-slate-100/90' : 'text-slate-400/80'}`}>{description}</p> : null}
    </button>
  );
}

function TimeDial({
  label,
  value,
  onChange,
  accent,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  accent: string;
}) {
  const [hovered, setHovered] = useState(value);
  const active = hovered || value;
  const selectedIndex = Math.max(timeOptions.indexOf(active), 0);
  const rotation = selectedIndex * 30;

  return (
    <div className="rounded-[26px] border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-2 text-sm font-medium text-slate-100">{label}</div>
      <div className="relative flex items-center justify-center py-3">
        <div
          className="relative h-[270px] w-[270px] rounded-full border border-white/10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),rgba(255,255,255,0.01))]"
          style={{
            boxShadow: `0 0 0 1px ${accent}22, 0 0 35px ${accent}15`,
          }}
        >
          <div
            className="absolute left-1/2 top-1/2 h-[108px] w-[2px] -translate-x-1/2 -translate-y-full origin-bottom rounded-full"
            style={{
              background: `linear-gradient(180deg, ${accent}, transparent)`,
              transform: `translate(-50%, -100%) rotate(${rotation}deg)`,
              transition: 'transform 420ms cubic-bezier(0.22,1,0.36,1)',
              boxShadow: `0 0 16px ${accent}`,
            }}
          />
          <div
            className="absolute left-1/2 top-1/2 h-[14px] w-[14px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: accent,
              boxShadow: `0 0 18px ${accent}`,
            }}
          />
          {timeOptions.map((option, index) => {
            const angle = (Math.PI * 2 * index) / timeOptions.length - Math.PI / 2;
            const x = Math.cos(angle) * 104;
            const y = Math.sin(angle) * 104;
            const isActive = option === value;
            return (
              <button
                key={option}
                type="button"
                onMouseEnter={() => setHovered(option)}
                onMouseLeave={() => setHovered(value)}
                onClick={() => onChange(option)}
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-1 text-[10px] font-semibold tracking-[0.14em] transition ${
                  isActive ? 'text-white' : 'text-slate-300/80'
                }`}
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                  borderColor: isActive ? `${accent}aa` : 'rgba(255,255,255,0.12)',
                  background: isActive ? `${accent}20` : 'rgba(255,255,255,0.03)',
                  boxShadow: isActive ? `0 0 18px ${accent}35` : 'none',
                }}
              >
                {option}
              </button>
            );
          })}
          <div
            className="absolute left-1/2 top-1/2 grid h-[118px] w-[118px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border bg-[#09121d]/90 backdrop-blur-xl"
            style={{ borderColor: `${accent}77`, boxShadow: `0 0 26px ${accent}20` }}
          >
            <div className="text-center">
              <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-[88px] bg-transparent text-center text-[26px] font-semibold tracking-tight text-white outline-none"
              />
              <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Synced time</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NeuralIdle() {
  const nodes = [
    { top: 34, left: 92 },
    { top: 88, left: 182 },
    { top: 146, left: 106 },
    { top: 130, left: 250 },
    { top: 210, left: 190 },
    { top: 224, left: 72 },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="relative mb-6 h-[290px] w-[320px]">
        <span className="absolute left-[108px] top-[66px] h-px w-[88px] rotate-[28deg] bg-cyan-200/25" />
        <span className="absolute left-[134px] top-[126px] h-px w-[95px] rotate-[-20deg] bg-cyan-200/25" />
        <span className="absolute left-[110px] top-[180px] h-px w-[110px] rotate-[20deg] bg-cyan-200/25" />
        <span className="absolute left-[78px] top-[196px] h-px w-[92px] -rotate-[36deg] bg-cyan-200/25" />
        {nodes.map((node, index) => (
          <span
            key={`${node.top}-${node.left}-${index}`}
            className="absolute h-3 w-3 animate-pulse rounded-full bg-[#8CF8D4] shadow-[0_0_18px_rgba(140,248,212,0.5)]"
            style={{ top: node.top, left: node.left, animationDelay: `${index * 0.12}s` }}
          />
        ))}
      </div>
      <h3 className="text-[22px] font-semibold text-white">Pregătește-te de optimizare. Completează datele.</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-300/78">
        Consola AI rămâne activă, pulsează discret și așteaptă brief-ul biometric pentru a porni secvența de generare.
      </p>
    </div>
  );
}

export default function ClientNutrition() {
  const { user } = useAuth();

  const [calories, setCalories] = useState('2100');
  const [proteinGrams, setProteinGrams] = useState('160');
  const [fatGrams, setFatGrams] = useState('70');
  const [carbsGrams, setCarbsGrams] = useState('220');
  const [mealsPerDayType, setMealsPerDayType] = useState<MealsPerDayType>('3+1');
  const [customMealsPerDay, setCustomMealsPerDay] = useState('');
  const [macroDistributionType, setMacroDistributionType] = useState<MacroDistributionType>('around-workout');
  const [customMacroDistribution, setCustomMacroDistribution] = useState('');
  const [wakeUpTime, setWakeUpTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('23:00');
  const [hasTraining, setHasTraining] = useState(true);
  const [trainingTime, setTrainingTime] = useState('18:00');
  const [workProgram, setWorkProgram] = useState<WorkProgram | ''>('');
  const [mealLocations, setMealLocations] = useState<MealLocation[]>(['home']);
  const [cookingLevel, setCookingLevel] = useState<CookingLevel>('daily');
  const [foodBudget, setFoodBudget] = useState<FoodBudget>('medium');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<DietaryRestriction[]>([]);
  const [allergiesDetails, setAllergiesDetails] = useState('');
  const [excludedFoodsAndPreferences, setExcludedFoodsAndPreferences] = useState('');
  const [planStyle, setPlanStyle] = useState<PlanStyle>('macros-plus-examples');
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [scanActive, setScanActive] = useState(false);

  const mealsPreview = useMemo(() => {
    if (mealsPerDayType === 'custom') return customMealsPerDay ? Number(customMealsPerDay) : 0;
    if (mealsPerDayType === '3+1') return 4;
    return Number(mealsPerDayType);
  }, [customMealsPerDay, mealsPerDayType]);

  const particleSeeds = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        left: `${(index * 6.1 + 3) % 100}%`,
        top: `${(index * 9.4 + 7) % 100}%`,
        delay: `${index * 0.17}s`,
        duration: `${4.2 + index * 0.18}s`,
      })),
    []
  );

  const toggleArrayValue = <T extends string,>(value: T, current: T[], setValue: (items: T[]) => void) => {
    if (current.includes(value)) {
      setValue(current.filter((item) => item !== value));
      return;
    }
    setValue([...current, value]);
  };

  const buildPayload = () => {
    setSubmitError(null);

    const requiredNumbers = [
      { label: 'calorii', value: calories },
      { label: 'proteină', value: proteinGrams },
      { label: 'grăsimi', value: fatGrams },
      { label: 'carbohidrați', value: carbsGrams },
      { label: 'vârstă', value: age },
      { label: 'greutate', value: weightKg },
      { label: 'înălțime', value: heightCm },
    ];

    const invalidFields = requiredNumbers
      .filter((field) => field.value.trim() === '' || Number.isNaN(Number(field.value)))
      .map((field) => field.label);

    if (!clientName.trim()) {
      throw new Error('Completează numele clientului.');
    }

    if (invalidFields.length) {
      throw new Error(`Completează corect câmpurile: ${invalidFields.join(', ')}.`);
    }

    if (mealLocations.length === 0) {
      throw new Error('Selectează cel puțin un context unde mănâncă clientul.');
    }

    if (mealsPerDayType === 'custom' && !customMealsPerDay) {
      throw new Error('Completează numărul personalizat de mese.');
    }

    if (macroDistributionType === 'custom' && !customMacroDistribution.trim()) {
      throw new Error('Completează distribuția personalizată a macro-urilor.');
    }

    if (hasTraining && !trainingTime) {
      throw new Error('Completează ora antrenamentului sau selectează că nu se antrenează.');
    }

    if (dietaryRestrictions.includes('allergies') && !allergiesDetails.trim()) {
      throw new Error('Completează alergiile dacă ai selectat opțiunea "Alergii".');
    }

    return {
      clientName: clientName.trim(),
      age: Number(age),
      sex,
      weightKg: Number(weightKg),
      heightCm: Number(heightCm),
      activityLevel,
      preferredEatingStyle,
      objective,
      goalWeightKg: goalWeightKg ? Number(goalWeightKg) : undefined,
      targetDate: targetDate || undefined,
      clientNotes: clientNotes.trim() || undefined,
      calories: Number(calories),
      proteinGrams: Number(proteinGrams),
      fatGrams: Number(fatGrams),
      carbsGrams: Number(carbsGrams),
      mealsPerDayType,
      customMealsPerDay: mealsPerDayType === 'custom' ? Number(customMealsPerDay) : undefined,
      macroDistributionType,
      customMacroDistribution: macroDistributionType === 'custom' ? customMacroDistribution.trim() : undefined,
      wakeUpTime,
      sleepTime,
      hasTraining,
      trainingTime: hasTraining ? trainingTime : undefined,
      workProgram: workProgram || undefined,
      mealLocations,
      cookingLevel,
      foodBudget,
      dietaryRestrictions,
      allergiesDetails: dietaryRestrictions.includes('allergies') ? allergiesDetails.trim() : undefined,
      excludedFoodsAndPreferences: excludedFoodsAndPreferences.trim() || undefined,
      planStyle,
    };
  };

  const reportMutation = useMutation({
    mutationFn: async () => {
      const { data } = await nutritionAPI.generateReport(buildPayload());
      return data as NutritionReportResponse;
    },
    onMutate: () => {
      setScanActive(true);
      window.setTimeout(() => setScanActive(false), 1100);
    },
    onError: (error: any) => {
      setSubmitError(error?.response?.data?.error || error?.message || 'Nu am putut genera raportul PDF.');
    },
  });

  const reportResult = reportMutation.data;

  const resultCards = reportResult
    ? [
        { title: 'Status livrare', body: reportResult.message },
        { title: 'Titlu raport', body: reportResult.reportPreview.title },
        { title: 'Rezumat', body: reportResult.reportPreview.summary },
        { title: 'Macro summary', body: reportResult.reportPreview.macroSummary },
      ]
    : [];

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#0D1117] py-10 text-white"
      style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
    >
      <style>{`
        @keyframes particleFloat {
          0%, 100% { transform: translate3d(0, 0, 0); opacity: .18; }
          50% { transform: translate3d(0, -18px, 0); opacity: .72; }
        }
        @keyframes dataPulse {
          0%, 100% { opacity: .55; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }
        @keyframes resultRise {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ctaPlasma {
          0%, 100% { transform: translateX(-12%) scale(1); opacity: .5; }
          50% { transform: translateX(14%) scale(1.08); opacity: .95; }
        }
      `}</style>

      <div className="absolute inset-0 bg-[linear-gradient(140deg,#1A1A1A_0%,#11161E_38%,#0D1117_100%)]" />
      <div className="absolute -left-24 top-[-110px] h-[360px] w-[360px] rounded-full bg-[#8CF8D4]/10 blur-3xl" />
      <div className="absolute right-[-90px] top-[140px] h-[420px] w-[420px] rounded-full bg-[#5B8CFF]/12 blur-3xl" />
      {particleSeeds.map((particle, index) => (
        <span
          key={`${particle.left}-${particle.top}-${index}`}
          className="absolute h-1 w-1 rounded-full bg-[#c6fff0]"
          style={{
            left: particle.left,
            top: particle.top,
            animation: `particleFloat ${particle.duration} ease-in-out ${particle.delay} infinite`,
          }}
        />
      ))}

      <div className="relative mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#8CF8D444] bg-[#8CF8D418] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8CF8D4]">
            TrainerOS Nutrition Console
          </div>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">
            Nutritie
          </h1>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.16fr_0.84fr]">
          <div className="relative overflow-hidden rounded-[32px] border border-[#8CF8D455] bg-black/40 p-5 shadow-[0_0_0_1px_rgba(140,248,212,0.08),0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            {scanActive && <div className="pointer-events-none absolute inset-x-4 top-0 h-14 animate-[resultRise_0.9s_ease] rounded-2xl border border-[#8CF8D466] bg-[#8CF8D41A] shadow-[0_0_35px_rgba(140,248,212,0.28)]" />}

            <SectionTitle
              index="1"
              title="Goal"
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <GaugeArc label="Calorii" accent="#8CF8D4" value={calories} onChange={setCalories} max={4200} unit="kcal" />
              <GaugeArc label="Proteine" accent="#56B6FF" value={proteinGrams} onChange={setProteinGrams} max={320} unit="g" />
              <GaugeArc label="Grăsimi" accent="#F6D365" value={fatGrams} onChange={setFatGrams} max={180} unit="g" />
              <GaugeArc label="Carbo" accent="#FF6A8A" value={carbsGrams} onChange={setCarbsGrams} max={500} unit="g" />
            </div>

            <div className="mt-10">
              <SectionTitle
                index="2"
                title="Distribuție și ritm nutrițional"
              />

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {[
                  { value: '3', label: '3 mese', description: 'Cadru compact pentru clienți disciplinați.' },
                  { value: '3+1', label: '3 + 1 gustare', description: 'Flux echilibrat pentru aderență.' },
                  { value: '4', label: '4 mese', description: 'Distribuție mai uniformă a energiei.' },
                  { value: '5', label: '5 mese', description: 'Intervenții frecvente și ritm activ.' },
                  { value: 'custom', label: 'Custom', description: 'Număr personalizat de puncte de alimentare.' },
                ].map((option) => (
                  <SelectCard
                    key={option.value}
                    label={option.label}
                    description={option.description}
                    active={mealsPerDayType === option.value}
                    onClick={() => setMealsPerDayType(option.value as MealsPerDayType)}
                  />
                ))}
              </div>

              {mealsPerDayType === 'custom' && (
                <div className="mt-4">
                  <GlassInput label="Număr mese personalizat" value={customMealsPerDay} onChange={setCustomMealsPerDay} placeholder="Ex: 6" type="number" />
                </div>
              )}

              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {[
                  { value: 'equal', label: 'Distribuție egală', description: 'Macro-uri relativ echilibrate la fiecare masă.' },
                  { value: 'around-workout', label: 'Around workout', description: 'Mai mulți carbo înainte și după antrenament.' },
                  { value: 'more-evening-carbs', label: 'Carbo seara', description: 'Încărcare energetică mai târziu în zi.' },
                  { value: 'low-carb-breakfast', label: 'Low-carb breakfast', description: 'Pornire controlată dimineața.' },
                  { value: 'custom', label: 'Distribuție custom', description: 'Regulă personalizată pentru acest client.' },
                ].map((option) => (
                  <SelectCard
                    key={option.value}
                    label={option.label}
                    description={option.description}
                    active={macroDistributionType === option.value}
                    onClick={() => setMacroDistributionType(option.value as MacroDistributionType)}
                  />
                ))}
              </div>

              {macroDistributionType === 'custom' && (
                <div className="mt-4">
                  <GlassInput
                    label="Instrucțiune custom pentru macro-uri"
                    value={customMacroDistribution}
                    onChange={setCustomMacroDistribution}
                    placeholder="Ex: 20% dimineața, 50% pre/post-workout, 30% seara"
                    multiline
                  />
                </div>
              )}
            </div>

            <div className="mt-10">
              <SectionTitle
                index="3"
                title="Program client"
              />

              <div className="grid gap-4 xl:grid-cols-3">
                <TimeDial label="Trezire" value={wakeUpTime} onChange={setWakeUpTime} accent="#8CF8D4" />
                <TimeDial label="Culcare" value={sleepTime} onChange={setSleepTime} accent="#79A7FF" />
                {hasTraining ? <TimeDial label="Antrenament" value={trainingTime} onChange={setTrainingTime} accent="#FF6A8A" /> : null}
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <SelectCard
                  label="Se antrenează"
                  active={hasTraining}
                  onClick={() => {
                    setHasTraining(true);
                    if (!trainingTime) setTrainingTime('18:00');
                  }}
                />
                <SelectCard
                  label="Fără antrenament"
                  active={!hasTraining}
                  onClick={() => {
                    setHasTraining(false);
                    setTrainingTime('');
                  }}
                />
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { value: 'fixed', label: 'Program fix', description: 'Orar previzibil și ușor de mapat.' },
                  { value: 'shifts', label: 'Ture', description: 'Program în schimburi' },
                  { value: 'flexible', label: 'Flexibil', description: 'Program fluid și adaptabil.' },
                  { value: 'mostly-home', label: 'Majoritar acasă', description: 'Control ridicat asupra meselor.' },
                ].map((option) => (
                  <SelectCard
                    key={option.value}
                    label={option.label}
                    description={option.description}
                    active={workProgram === option.value}
                    onClick={() => setWorkProgram(option.value as WorkProgram)}
                  />
                ))}
              </div>
            </div>

            <div className="mt-10">
              <SectionTitle
                index="4"
                title="Context alimentar și restricții"
              />

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {mealLocationOptions.map((option) => (
                  <SelectCard
                    key={option.value}
                    label={option.label}
                    description={
                      option.value === 'delivery'
                        ? 'Mese gata preparate, oriunde ai fi'
                        : option.description
                    }
                    active={mealLocations.includes(option.value)}
                    onClick={() => toggleArrayValue(option.value, mealLocations, setMealLocations)}
                  />
                ))}
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { value: 'daily', label: 'Gătit zilnic', description: 'Pregătire proaspătă și flexibilă.' },
                  { value: 'meal-prep', label: 'Meal prep', description: 'Mese pregătite în avans' },
                  { value: 'rare', label: 'Gătit rar', description: 'Mai puțin timp pentru bucătărie.' },
                  { value: 'almost-never', label: 'Aproape deloc', description: 'Accent pe soluții gata făcute.' },
                ].map((option) => (
                  <SelectCard
                    key={option.value}
                    label={option.label}
                    description={option.description}
                    active={cookingLevel === option.value}
                    onClick={() => setCookingLevel(option.value as CookingLevel)}
                  />
                ))}
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {[
                  { value: 'low', label: 'Buget low', description: 'Prioritizează costul și simplitatea.' },
                  { value: 'medium', label: 'Buget medium', description: 'Echilibru între cost și varietate.' },
                  { value: 'high', label: 'Buget high', description: 'Mai multă libertate de selecție.' },
                ].map((option) => (
                  <SelectCard
                    key={option.value}
                    label={option.label}
                    description={option.description}
                    active={foodBudget === option.value}
                    onClick={() => setFoodBudget(option.value as FoodBudget)}
                  />
                ))}
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {restrictionOptions.map((option) => (
                  <SelectCard
                    key={option.value}
                    label={option.label}
                    description={option.description}
                    active={dietaryRestrictions.includes(option.value)}
                    onClick={() => toggleArrayValue(option.value, dietaryRestrictions, setDietaryRestrictions)}
                  />
                ))}
              </div>

              {dietaryRestrictions.includes('allergies') && (
                <div className="mt-4">
                  <GlassInput label="Detalii alergii" value={allergiesDetails} onChange={setAllergiesDetails} placeholder="Ex: arahide, crustacee, ou" multiline />
                </div>
              )}
            </div>

            <div className="mt-10">
              <SectionTitle
                index="5"
                title="Profil raport și output final"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <GlassInput label="Nume client" value={clientName} onChange={setClientName} placeholder="Ex: Andrei Popescu" />
                <GlassInput label="Vârstă" value={age} onChange={setAge} placeholder="32" type="number" />
                <GlassInput label="Greutate (kg)" value={weightKg} onChange={setWeightKg} placeholder="81" type="number" />
                <GlassInput label="Înălțime (cm)" value={heightCm} onChange={setHeightCm} placeholder="176" type="number" />
                <GlassInput label="Greutate țintă" value={goalWeightKg} onChange={setGoalWeightKg} placeholder="72" type="number" />
                <GlassInput label="Dată țintă" value={targetDate} onChange={setTargetDate} placeholder="2026-07-01" type="date" />
              </div>

              <div className="mt-6">
                <div className="mb-2 text-sm font-medium text-slate-100">Sex</div>
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    { value: 'male', label: 'Masculin' },
                    { value: 'female', label: 'Feminin' },
                    { value: 'other', label: 'Altul' },
                  ].map((option) => (
                    <SelectCard
                      key={option.value}
                      label={option.label}
                      active={sex === option.value}
                      onClick={() => setSex(option.value as ClientSex)}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-2 text-sm font-medium text-slate-100">Nivel activitate</div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  {[
                    { value: 'sedentary', label: 'Sedentar' },
                    { value: 'lightly-active', label: 'Ușor activ' },
                    { value: 'moderately-active', label: 'Moderat activ' },
                    { value: 'very-active', label: 'Foarte activ' },
                    { value: 'athlete', label: 'Atlet' },
                  ].map((option) => (
                    <SelectCard
                      key={option.value}
                      label={option.label}
                      active={activityLevel === option.value}
                      onClick={() => setActivityLevel(option.value as ActivityLevel)}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-2 text-sm font-medium text-slate-100">Stil alimentar</div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {[
                    { value: 'anything', label: 'Fără preferințe' },
                    { value: 'high-protein', label: 'High protein' },
                    { value: 'vegetarian', label: 'Vegetarian' },
                    { value: 'vegan', label: 'Vegan' },
                    { value: 'pescatarian', label: 'Pescatarian' },
                    { value: 'mediterranean', label: 'Mediteranean' },
                  ].map((option) => (
                    <SelectCard
                      key={option.value}
                      label={option.label}
                      active={preferredEatingStyle === option.value}
                      onClick={() => setPreferredEatingStyle(option.value as PreferredEatingStyle)}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-2 text-sm font-medium text-slate-100">Obiectiv</div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  {[
                    { value: 'lose-weight', label: 'Slăbire' },
                    { value: 'maintain', label: 'Menținere' },
                    { value: 'gain-muscle', label: 'Masă musculară' },
                    { value: 'recomposition', label: 'Recompoziție' },
                    { value: 'performance', label: 'Performanță' },
                  ].map((option) => (
                    <SelectCard
                      key={option.value}
                      label={option.label}
                      active={objective === option.value}
                      onClick={() => setObjective(option.value as ObjectiveType)}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { value: 'exact-grams', label: 'Gramaje exacte', description: 'Precizie ridicată pe fiecare aliment.' },
                  { value: 'macros-plus-examples', label: 'Macro + exemple', description: 'Format echilibrat pentru client.' },
                  { value: 'flexible-template', label: 'Template flexibil', description: 'Mai multă adaptabilitate la execuție.' },
                  { value: 'full-day-with-alternatives', label: 'Zi completă + alternative', description: 'Raport extins și mai bogat.' },
                ].map((option) => (
                  <SelectCard
                    key={option.value}
                    label={option.label}
                    description={option.description}
                    active={planStyle === option.value}
                    onClick={() => setPlanStyle(option.value as PlanStyle)}
                  />
                ))}
              </div>

              <div className="mt-4 grid gap-4">
                <GlassInput
                  label="Alimente excluse / preferințe"
                  value={excludedFoodsAndPreferences}
                  onChange={setExcludedFoodsAndPreferences}
                  placeholder="Ex: fără pește, preferă pui, iaurt grecesc, legume la cuptor"
                  multiline
                />
                <GlassInput
                  label="Observații client"
                  value={clientNotes}
                  onChange={setClientNotes}
                  placeholder="Ex: lucrează pe teren, preferă mese reci la prânz, foame mare seara"
                  multiline
                />
              </div>
            </div>

            <div className="mt-8 rounded-[22px] border border-[#8CF8D433] bg-[#8CF8D414] px-5 py-4 text-sm text-slate-100/85">
              Raportul PDF se generează în română și se livrează automat către <span className="font-semibold text-white">{user?.email || 'emailul contului'}</span>.
            </div>

            {submitError && (
              <div className="mt-4 rounded-[20px] border border-rose-400/40 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
                {submitError}
              </div>
            )}

            <button
              type="button"
              onClick={() => reportMutation.mutate()}
              disabled={reportMutation.isPending}
              className="group relative mt-6 w-full overflow-hidden rounded-[24px] border border-cyan-300/50 bg-[#08121f] p-[1px] text-left transition hover:shadow-[0_0_35px_rgba(110,231,255,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="relative overflow-hidden rounded-[23px] bg-[linear-gradient(135deg,rgba(10,19,31,0.96),rgba(6,12,18,0.92))] px-6 py-5">
                <div
                  className="absolute inset-y-[-20%] left-[-18%] w-[40%] rounded-full bg-[#8CF8D455] blur-2xl"
                  style={{ animation: 'ctaPlasma 4.8s ease-in-out infinite' }}
                />
                <div
                  className="absolute inset-y-[-18%] right-[-18%] w-[36%] rounded-full bg-[#56B6FF33] blur-2xl"
                  style={{ animation: 'ctaPlasma 5.4s ease-in-out infinite reverse' }}
                />
                <div className="relative">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#8CF8D4]">Energy surge</div>
                  <div className="mt-1 text-[28px] font-semibold leading-tight text-white">
                    {reportMutation.isPending ? 'Generez raportul...' : `Generează raportul PDF (${mealsPreview || 0} mese)`}
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-300/82">
                    Hover intensifică glow-ul, iar click-ul pornește scanarea biometriei, compunerea PDF-ului și secvența de livrare.
                  </div>
                </div>
              </div>
            </button>
          </div>

          <div
            className={`rounded-[32px] border border-[#8CF8D455] bg-black/40 p-5 shadow-[0_0_0_1px_rgba(140,248,212,0.08),0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl transition duration-500 ${
              reportResult ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-100'
            }`}
          >
            <div className="mb-5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#8CF8D4CC]">AI Result Panel</div>
              <h2 className="mt-1 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-2xl font-semibold text-transparent">
                Vizualizare AI și livrare
              </h2>
            </div>

            {!reportResult && !reportMutation.isPending ? <NeuralIdle /> : null}

            {reportMutation.isPending && (
              <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
                <div className="relative mb-6 h-40 w-40 rounded-full border border-[#8CF8D444] bg-[#8CF8D414]">
                  <div className="absolute inset-5 rounded-full border border-cyan-300/35" style={{ animation: 'dataPulse 1.15s ease-in-out infinite' }} />
                  <div className="absolute inset-0 rounded-full border border-white/10" style={{ animation: 'dataPulse 1.15s ease-in-out 0.18s infinite' }} />
                </div>
                <h3 className="text-[22px] font-semibold text-white">Secvență de generare activă</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-300/78">
                  Scanarea laser a parcurs brief-ul, motorul AI redactează raportul și pregătește livrarea PDF-ului.
                </p>
              </div>
            )}

            {reportResult && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5" style={{ animation: 'resultRise .45s ease both' }}>
                    <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Email target</div>
                    <div className="mt-2 text-lg font-semibold text-white">{reportResult.emailedTo}</div>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5" style={{ animation: 'resultRise .45s ease .08s both' }}>
                    <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Mese / zi</div>
                    <div className="mt-2 text-lg font-semibold text-white">{reportResult.reportPreview.mealsPerDay}</div>
                  </div>
                </div>

                {resultCards.map((card, index) => (
                  <div
                    key={card.title}
                    className="rounded-[24px] border border-white/10 bg-white/[0.045] p-5"
                    style={{ animation: `resultRise .42s ease ${0.14 + index * 0.1}s both` }}
                  >
                    <div className="mb-2 text-[10px] uppercase tracking-[0.28em] text-[#8CF8D4CC]">{card.title}</div>
                    <div className="text-sm leading-7 text-slate-100/88">{card.body}</div>
                  </div>
                ))}

                <div
                  className="grid gap-4 sm:grid-cols-2"
                  style={{ animation: 'resultRise .45s ease .54s both' }}
                >
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5">
                    <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Calorie target</div>
                    <div className="mt-2 text-[30px] font-semibold text-white">{reportResult.reportPreview.calorieTarget}</div>
                  </div>
                  <a
                    href={reportResult.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-[22px] border border-cyan-300/55 bg-cyan-300/[0.12] p-5 transition hover:bg-cyan-300/[0.18] hover:shadow-[0_0_24px_rgba(110,231,255,0.18)]"
                  >
                    <div className="text-[10px] uppercase tracking-[0.28em] text-cyan-100/90">Download PDF</div>
                    <div className="mt-2 text-lg font-semibold text-white">Descarcă raportul generat</div>
                    <div className="mt-2 text-sm text-slate-100/82">{reportResult.filename}</div>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
