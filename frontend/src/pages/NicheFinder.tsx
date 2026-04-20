import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { nicheAPI } from '@/services/api';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Input from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';

type Mode = 'select' | 'quick' | 'wizard' | 'preset';

interface PresetNicheOption {
  niche: string;
  description: string;
}

interface WizardAnswers {
  targetAudience: string;
  problemSolved: string;
  results: string;
  clientType: string;
  uniquePosition: string;
}

function getResultValue(value: string | undefined, fallback: string): string {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
}

export default function NicheFinder() {
  const [mode, setMode] = useState<Mode>('select');
  const [quickQuery, setQuickQuery] = useState('');
  const [wizardStep, setWizardStep] = useState(1);
  const [presetNiches, setPresetNiches] = useState<PresetNicheOption[]>([]);
  const [wizardAnswers, setWizardAnswers] = useState<WizardAnswers>({
    targetAudience: '',
    problemSolved: '',
    results: '',
    clientType: '',
    uniquePosition: '',
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const quickMutation = useMutation({
    mutationFn: (query: string) => nicheAPI.generateQuick({ query, saveToProfile: true }),
    onSuccess: async () => {
      await refreshUser();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user-me'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }),
      ]);
      console.log('✅ Niche saved successfully!');
      
      // Auto-redirect to Daily Idea after 3 seconds
      setTimeout(() => {
        navigate('/daily-idea');
      }, 3000);
    },
  });

  const wizardMutation = useMutation({
    mutationFn: (answers: WizardAnswers) => nicheAPI.generateWizard({ ...answers, saveToProfile: true }),
    onSuccess: async () => {
      await refreshUser();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user-me'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }),
      ]);
      console.log('✅ Niche saved successfully!');
      
      // Auto-redirect to Daily Idea after 3 seconds
      setTimeout(() => {
        navigate('/daily-idea');
      }, 3000);
    },
  });

  const presetOptionsMutation = useMutation({
    mutationFn: () => nicheAPI.generatePresetOptions(),
    onSuccess: (response) => {
      setPresetNiches(response.data.niches || []);
      setMode('preset');
    },
  });

  const presetSelectionMutation = useMutation({
    mutationFn: (selectedOption: PresetNicheOption) =>
      nicheAPI.savePresetSelection({
        niche: selectedOption.niche,
        description: selectedOption.description,
      }),
    onSuccess: async () => {
      await refreshUser();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user-me'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }),
      ]);
      console.log('✅ Preset niche saved successfully!');

      setTimeout(() => {
        navigate('/daily-idea');
      }, 3000);
    },
  });

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    quickMutation.mutate(quickQuery);
  };

  const handleOpenPresetMode = () => {
    if (presetNiches.length > 0) {
      setMode('preset');
      return;
    }

    presetOptionsMutation.mutate();
  };

  const handlePresetSelect = (selectedOption: PresetNicheOption) => {
    setQuickQuery(selectedOption.niche);
    presetSelectionMutation.mutate(selectedOption);
  };

  const handleWizardNext = () => {
    if (wizardStep < 5) {
      setWizardStep(wizardStep + 1);
    } else {
      wizardMutation.mutate(wizardAnswers);
    }
  };

  const wizardQuestions = [
    {
      step: 1,
      question: 'Cu cine îți place cel mai mult să lucrezi?',
      placeholder: 'Ex: Mame după sarcină care vor să slăbească',
      field: 'targetAudience' as keyof WizardAnswers,
    },
    {
      step: 2,
      question: 'Ce problemă rezolvi cel mai bine?',
      placeholder: 'Ex: Lipsa de energie și kilograme în plus după naștere',
      field: 'problemSolved' as keyof WizardAnswers,
    },
    {
      step: 3,
      question: 'Ce rezultate poți demonstra?',
      placeholder: 'Ex: -10kg în 12 săptămâni fără diete extreme',
      field: 'results' as keyof WizardAnswers,
    },
    {
      step: 4,
      question: 'Ce tip de client vrei să eviți?',
      placeholder: 'Ex: Persoane care caută rezultate instant fără efort',
      field: 'clientType' as keyof WizardAnswers,
    },
    {
      step: 5,
      question: 'De ce te-ar alege pe tine și nu pe alt antrenor?',
      placeholder: 'Ex: Program personalizat care se adaptează stilului de viață de mamă',
      field: 'uniquePosition' as keyof WizardAnswers,
    },
  ];

  if (mode === 'select') {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="console-hero mb-12">
            <div className="console-orb left-[-4rem] top-[-3rem] h-32 w-32 bg-cyan-300/18 animate-float-slow" />
            <div className="console-orb right-[-2rem] top-8 h-24 w-24 bg-emerald-300/18 animate-float-delay" />
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="console-badge">Niche Finder + Niche Builder</span>
            </div>
            <h1 className="mt-2 mb-4 text-4xl font-bold text-white font-display sm:text-5xl">
              Fără nișă clară, <span className="bg-gradient-to-r from-[#8CF8D4] to-[#72CAFF] bg-clip-text text-transparent">postezi degeaba.</span>
            </h1>
            <p className="text-lg text-slate-300/78 max-w-2xl">
              Află exact cui te adresezi, ce problemă rezolvi și cum te poziționezi — în mai puțin
              de 5 minute.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            <Card hover className="cursor-pointer" onClick={() => navigate('/niche-quick')}>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
                <span className="text-3xl">⚡</span>
              </div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-bold text-white font-display">
                "Știu deja nișa mea"
                </h2>
              </div>
              <p className="mb-6 text-slate-300/78">
                Răspunde la 10 întrebări despre clientul tău ideal — AI-ul va crea Niche Builder-ul detaliat și nișa ta.
              </p>
              <div className="console-option mb-4 p-4">
                <p className="text-xs text-slate-300/72">
                  ✓ Demografic (gen, vârstă)<br />
                  ✓ Rutina zilnică completă<br />
                  ✓ Module condiționale personalizate<br />
                  ✓ Niche Builder ultra-detaliat generat de AI
                </p>
              </div>
              <Button variant="primary" className="w-full">
                Spune-mi Nișa Ta →
              </Button>
            </Card>

            <Card hover className="cursor-pointer" onClick={() => navigate('/niche-discover')}>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10">
                <span className="text-3xl">🔍</span>
              </div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-bold text-white font-display">
                "Descoperă Nișa Ta"
                </h2>
              </div>
              <p className="mb-6 text-slate-300/78">
                Ghid complet în 3 faze: AI-ul propune 3 variante de nișă, tu alegi una, apoi rafinăm împreună pentru rezultate maxime.
              </p>
              <div className="console-option mb-4 p-4">
                <p className="text-xs text-slate-300/72">
                  ✓ Faza A: 6 întrebări despre experiența ta<br />
                  ✓ Faza B: AI propune 3 variante de nișă<br />
                  ✓ Faza C: Rafinare cu 5 întrebări detaliate<br />
                  ✓ Nișă + Niche Builder personalizat final
                </p>
              </div>
              <Button variant="outline" className="w-full">
                Află Nișa Ta →
              </Button>
            </Card>

            <Card hover className="cursor-pointer" onClick={handleOpenPresetMode}>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10">
                <span className="text-3xl">🧠</span>
              </div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-bold text-white font-display">
                  Alege o nișă prestabilită
                </h2>
              </div>
              <p className="mb-6 text-slate-300/78">
                Primești 5 nișe fitness generate de AI, în română, gata de ales dintr-un click.
              </p>
              <div className="console-option mb-4 p-4">
                <p className="text-xs text-slate-300/72">
                  ✓ 5 propuneri generate de AI<br />
                  ✓ Nișe relevante pentru fitness coach<br />
                  ✓ Alegi una și o salvăm imediat în profil<br />
                  ✓ Te ducem direct spre Daily Idea
                </p>
              </div>
              <Button variant="outline" className="w-full" isLoading={presetOptionsMutation.isPending}>
                Alege Rapid →
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'preset') {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="outline" size="sm" onClick={() => setMode('select')} className="mb-6">
            ← Înapoi
          </Button>

          <div className="console-hero mb-8">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="console-badge">Preset Niches</span>
            </div>
            <h1 className="mt-2 mb-4 text-4xl font-bold text-white font-display sm:text-5xl">
              Alege o nișă prestabilită și mergi mai departe.
            </h1>
            <p className="max-w-2xl text-lg text-slate-300/78">
              AI-ul ți-a pregătit 5 direcții potrivite pentru un fitness coach. Când dai click pe una, o salvăm ca nișa ta.
            </p>
          </div>

          {presetOptionsMutation.isPending && (
            <Card className="mb-8 text-center">
              <p className="text-slate-300/78">Se generează cele 5 nișe prestabilite...</p>
            </Card>
          )}

          {presetOptionsMutation.isError && (
            <Card className="mb-8 border-red-500/40 bg-red-500/10">
              <p className="text-sm text-red-200">
                Nu am putut genera nișele prestabilite acum. Încearcă din nou.
              </p>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {presetNiches.map((option, index) => (
              <Card key={`${option.niche}-${index}`} className="flex h-full flex-col justify-between">
                <div>
                  <div className="mb-4 inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100">
                    Varianta AI {index + 1}
                  </div>
                  <h2 className="mb-3 text-2xl font-bold text-white font-display">
                    {option.niche}
                  </h2>
                  <p className="mb-6 text-slate-300/78">
                    {option.description}
                  </p>
                </div>
                <Button
                  className="w-full"
                  isLoading={presetSelectionMutation.isPending && quickQuery === option.niche}
                  onClick={() => handlePresetSelect(option)}
                >
                  Alege această nișă →
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'quick') {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="outline" size="sm" onClick={() => setMode('select')} className="mb-6">
            ← Înapoi
          </Button>

          <Card className="console-panel-strong">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
                <span className="text-3xl">⚡</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white font-display">Quick Mode</h1>
                <p className="text-gray-300 text-sm">Introdu nișa ta în câteva cuvinte</p>
              </div>
            </div>

            <form onSubmit={handleQuickSubmit} className="space-y-6">
              <Input
                label="Descrie-ți nișa"
                placeholder='Ex: "Slăbit pentru mame după sarcină"'
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                required
              />

              <Button type="submit" className="w-full" isLoading={quickMutation.isPending}>
                Generează Profil →
              </Button>
            </form>

            {quickMutation.isSuccess && (
              <>
                {/* Success Banner */}
                <div className="mt-6 rounded-[22px] border border-cyan-300/25 bg-cyan-300/12 p-4 text-center">
                  <p className="mb-1 text-lg font-bold text-white">
                    ✅ Nișa ta a fost salvată cu succes!
                  </p>
                  <p className="text-sm text-slate-200">
                    Redirecting în 3 secunde către Daily Idea...
                  </p>
                </div>

                {/* Results */}
                <div className="mt-6 space-y-4">
                  <div className="rounded-[22px] border border-cyan-300/25 bg-cyan-300/10 p-6">
                    <h3 className="mb-2 text-sm font-bold uppercase text-console-accent">Nișa Ta</h3>
                    <p className="text-white text-lg">
                      {getResultValue(
                        quickMutation.data.data.niche,
                        'Nișa nu a fost generată complet.'
                      )}
                    </p>
                  </div>

                  <div className="console-option p-6">
                    <h3 className="mb-2 text-sm font-bold uppercase text-slate-300/72">
                      Client Ideal
                    </h3>
                    <p className="whitespace-pre-line text-white">
                      {getResultValue(
                        quickMutation.data.data.idealClient,
                        'Clientul ideal nu a fost returnat complet. Reîncearcă generarea pentru profilul complet.'
                      )}
                    </p>
                  </div>

                  <div className="console-option p-6">
                    <h3 className="mb-2 text-sm font-bold uppercase text-slate-300/72">
                      Mesaj de Poziționare
                    </h3>
                    <p className="whitespace-pre-line text-white">
                      {getResultValue(
                        quickMutation.data.data.positioning,
                        'Mesajul de poziționare nu a fost returnat complet. Reîncearcă generarea.'
                      )}
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-4 pt-4">
                    <Button onClick={() => navigate('/daily-idea')} className="flex-1">
                      🚀 Generează Prima Idee
                    </Button>
                    <Button onClick={() => navigate('/dashboard')} variant="outline" className="flex-1">
                      📊 Mergi la Dashboard
                    </Button>
                  </div>
                </div>
              </>
            )}

            {quickMutation.isError && (
              <div className="mt-6 bg-red-500/10 border border-red-500 rounded-lg p-4">
                <p className="text-red-500 text-sm">
                  A apărut o eroare. Încearcă din nou.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // Wizard Mode
  const currentQuestion = wizardQuestions[wizardStep - 1];

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="outline" size="sm" onClick={() => setMode('select')} className="mb-6">
          ← Înapoi
        </Button>

        <Card className="console-panel-strong">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
              <span className="text-3xl">🧭</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white font-display">Wizard Mode</h1>
              <p className="text-gray-300 text-sm">
                Întrebare {wizardStep} din 5
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="h-2 w-full rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#8CF8D4,#72CAFF)] transition-all duration-300"
                style={{ width: `${(wizardStep / 5) * 100}%` }}
              />
            </div>
          </div>

          {!wizardMutation.isSuccess ? (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,#8CF8D4,#72CAFF)]">
                    <span className="font-bold text-slate-950">{currentQuestion.step}</span>
                  </div>
                  <h2 className="text-xl font-semibold text-white">
                    {currentQuestion.question}
                  </h2>
                </div>
                <Input
                  placeholder={currentQuestion.placeholder}
                  value={wizardAnswers[currentQuestion.field]}
                  onChange={(e) =>
                    setWizardAnswers({
                      ...wizardAnswers,
                      [currentQuestion.field]: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex gap-4">
                {wizardStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => setWizardStep(wizardStep - 1)}
                    className="flex-1"
                  >
                    ← Înapoi
                  </Button>
                )}
                <Button
                  onClick={handleWizardNext}
                  className="flex-1"
                  isLoading={wizardMutation.isPending}
                  disabled={!wizardAnswers[currentQuestion.field]}
                >
                  {wizardStep === 5 ? 'Finalizează →' : 'Continuă →'}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Success Banner */}
              <div className="mb-6 rounded-[22px] border border-cyan-300/25 bg-cyan-300/12 p-4 text-center">
                <p className="mb-1 text-lg font-bold text-white">
                  ✅ Nișa ta a fost salvată cu succes!
                </p>
                <p className="text-sm text-slate-200">
                  Redirecting în 3 secunde către Daily Idea...
                </p>
              </div>

              {/* Results */}
              <div className="space-y-4">
                <div className="rounded-[22px] border border-cyan-300/25 bg-cyan-300/10 p-6">
                  <h3 className="mb-2 text-sm font-bold uppercase text-console-accent">Nișa Ta</h3>
                  <p className="text-white text-lg">
                    {getResultValue(
                      wizardMutation.data.data.niche,
                      'Nișa nu a fost generată complet.'
                    )}
                  </p>
                </div>

                <div className="console-option p-6">
                  <h3 className="mb-2 text-sm font-bold uppercase text-slate-300/72">Client Ideal</h3>
                  <p className="whitespace-pre-line text-white">
                    {getResultValue(
                      wizardMutation.data.data.idealClient,
                      'Clientul ideal nu a fost returnat complet. Reîncearcă generarea pentru profilul complet.'
                    )}
                  </p>
                </div>

                <div className="console-option p-6">
                  <h3 className="mb-2 text-sm font-bold uppercase text-slate-300/72">
                    Mesaj de Poziționare
                  </h3>
                  <p className="whitespace-pre-line text-white">
                    {getResultValue(
                      wizardMutation.data.data.positioning,
                      'Mesajul de poziționare nu a fost returnat complet. Reîncearcă generarea.'
                    )}
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-4 pt-4">
                  <Button onClick={() => navigate('/daily-idea')} className="flex-1">
                    🚀 Generează Prima Idee
                  </Button>
                  <Button onClick={() => navigate('/dashboard')} variant="outline" className="flex-1">
                    📊 Mergi la Dashboard
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
