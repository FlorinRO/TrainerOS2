import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import Button from '@/components/Button';
import Card from '@/components/Card';

interface BrandVoiceData {
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

const totalSteps = 8;

export default function ContentPreferences() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<BrandVoiceData>({
    perception: [],
    naturalStyle: '',
    neverDo: [],
    principles: [],
    customPrinciple: '',
    ctaStyle: '',
    brandWords: [],
    frequentPhrases: '',
    humorTone: '',
  });

  const preferencesQuery = useQuery({
    queryKey: ['content-preferences'],
    queryFn: async () => {
      const { data } = await api.get('/niche/content-preferences');
      return data;
    },
  });

  useEffect(() => {
    const payload = preferencesQuery.data?.contentPreferences?.brandVoice;
    if (!payload) return;
    setFormData({
      perception: payload.perception || [],
      naturalStyle: payload.naturalStyle || '',
      neverDo: payload.neverDo || [],
      principles: payload.principles || [],
      customPrinciple: payload.customPrinciple || '',
      ctaStyle: payload.ctaStyle || '',
      brandWords: payload.brandWords || [],
      frequentPhrases: payload.frequentPhrases || '',
      humorTone: payload.humorTone || '',
    });
  }, [preferencesQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (data: BrandVoiceData) => {
      return api.post('/niche/content-preferences', {
        type: 'brand-voice',
        version: 1,
        completedAt: new Date().toISOString(),
        brandVoice: data,
      });
    },
    onSuccess: () => {
      const hasContentCreation = !!preferencesQuery.data?.contentPreferences?.contentCreation;
      void queryClient.invalidateQueries({ queryKey: ['content-preferences'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      void queryClient.invalidateQueries({ queryKey: ['user-me'] });
      navigate(hasContentCreation ? '/dashboard' : '/cum-vrei-sa-creezi-content?setupFlow=1');
    },
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const toggleArray = (field: keyof BrandVoiceData, value: string, max: number) => {
    const current = formData[field] as string[];
    if (current.includes(value)) {
      setFormData({ ...formData, [field]: current.filter((v) => v !== value) });
      setError(null);
      return;
    }
    if (current.length >= max) {
      setError(`Poți selecta maxim ${max} opțiuni la această întrebare.`);
      return;
    }
    setFormData({ ...formData, [field]: [...current, value] });
    setError(null);
  };

  const canGoNext = () => {
    switch (step) {
      case 1:
        return formData.perception.length >= 1 && formData.perception.length <= 2;
      case 2:
        return !!formData.naturalStyle;
      case 3:
        return formData.neverDo.length >= 1 && formData.neverDo.length <= 2;
      case 4:
        return formData.principles.length >= 1 && formData.principles.length <= 2;
      case 5:
        return !!formData.ctaStyle;
      case 6:
        return formData.brandWords.length === 3;
      case 7:
        return true;
      case 8:
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = () => {
    if (!canGoNext()) {
      setError('Completează întrebarea curentă înainte să continui.');
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-dark-400 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">
              Întrebare {step} din {totalSteps}
            </span>
            <span className="text-sm text-brand-500 font-semibold">Durată: 2–3 minute</span>
          </div>
          <div className="w-full bg-dark-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-3 font-display">Brand Voice</h1>
          <p className="text-gray-300 text-lg">
            Setează stilul tău o singură dată. De acum, toate scripturile sună ca tine.
          </p>
        </div>

        <Card>
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white font-display">
                BV1) Cum vrei să fii perceput când cineva îți vede contentul?
              </h2>
              <p className="text-gray-400 text-sm">Alege maxim 2.</p>
              {[
                'Direct și clar',
                'Prietenos și cald',
                'Funny și relatable',
                'Serios și autoritar',
                'Calm și educativ',
                'Energic și “pushy” (pozitiv)',
              ].map((option) => (
                <button
                  key={option}
                  onClick={() => toggleArray('perception', option, 2)}
                  className={`w-full text-left px-6 py-4 rounded-lg border-2 transition-all ${
                    formData.perception.includes(option)
                      ? 'border-brand-500 bg-brand-500/10 text-white'
                      : 'border-dark-200 hover:border-dark-100 text-gray-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white font-display">BV2) Cum vorbești, natural?</h2>
              {[
                'Simplu, pe înțelesul tuturor',
                'Mix: simplu + un pic tehnic',
                'Mai tehnic (pentru oameni deja avansați)',
              ].map((option) => (
                <button
                  key={option}
                  onClick={() => setFormData({ ...formData, naturalStyle: option })}
                  className={`w-full text-left px-6 py-4 rounded-lg border-2 transition-all ${
                    formData.naturalStyle === option
                      ? 'border-brand-500 bg-brand-500/10 text-white'
                      : 'border-dark-200 hover:border-dark-100 text-gray-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white font-display">
                BV3) Ce NU vrei să faci niciodată în content?
              </h2>
              <p className="text-gray-400 text-sm">Alege maxim 2.</p>
              {[
                'Rușinare / motivare toxică',
                'Promisiuni rapide',
                'Extreme',
                'Prea tehnic / rigid',
                'Clickbait',
              ].map((option) => (
                <button
                  key={option}
                  onClick={() => toggleArray('neverDo', option, 2)}
                  className={`w-full text-left px-6 py-4 rounded-lg border-2 transition-all ${
                    formData.neverDo.includes(option)
                      ? 'border-brand-500 bg-brand-500/10 text-white'
                      : 'border-dark-200 hover:border-dark-100 text-gray-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white font-display">
                BV4) Ce principiu vrei să repeți constant în contentul tău?
              </h2>
              <p className="text-gray-400 text-sm">Alege maxim 2.</p>
              {[
                'Consistență > perfecțiune',
                'Simplitate > programe complicate',
                'Tehnică > greutăți mari',
                'Obiceiuri > dietă extremă',
                'Sănătate & performanță > doar estetic',
              ].map((option) => (
                <button
                  key={option}
                  onClick={() => toggleArray('principles', option, 2)}
                  className={`w-full text-left px-6 py-4 rounded-lg border-2 transition-all ${
                    formData.principles.includes(option)
                      ? 'border-brand-500 bg-brand-500/10 text-white'
                      : 'border-dark-200 hover:border-dark-100 text-gray-300'
                  }`}
                >
                  {option}
                </button>
              ))}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Supapă: Scrie principiul tău (opțional, 1 rând)
                </label>
                <input
                  type="text"
                  value={formData.customPrinciple}
                  onChange={(e) => setFormData({ ...formData, customPrinciple: e.target.value })}
                  placeholder="Ex: progres mic, zilnic"
                  className="w-full px-4 py-3 bg-dark-300 border border-dark-200 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white font-display">
                BV5) Care e stilul tău de call-to-action?
              </h2>
              {[
                'Soft (comentariu / întrebare)',
                'Direct (scrie-mi X / trimite mesaj)',
                'Educațional (salvează / share)',
                'Mix',
              ].map((option) => (
                <button
                  key={option}
                  onClick={() => setFormData({ ...formData, ctaStyle: option })}
                  className={`w-full text-left px-6 py-4 rounded-lg border-2 transition-all ${
                    formData.ctaStyle === option
                      ? 'border-brand-500 bg-brand-500/10 text-white'
                      : 'border-dark-200 hover:border-dark-100 text-gray-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white font-display">
                BV6) Alege 3 cuvinte care descriu cel mai bine brandul tău
              </h2>
              <p className="text-gray-400 text-sm">Alege exact 3.</p>
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
                <button
                  key={option}
                  onClick={() => toggleArray('brandWords', option, 3)}
                  className={`w-full text-left px-6 py-4 rounded-lg border-2 transition-all ${
                    formData.brandWords.includes(option)
                      ? 'border-brand-500 bg-brand-500/10 text-white'
                      : 'border-dark-200 hover:border-dark-100 text-gray-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {step === 7 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white font-display">
                BV7) Ce expresii folosești des în mod natural?
              </h2>
              <p className="text-gray-400 text-sm">Opțional, 1–3 exemple.</p>
              <input
                type="text"
                value={formData.frequentPhrases}
                onChange={(e) => setFormData({ ...formData, frequentPhrases: e.target.value })}
                placeholder='Ex: "pe scurt", "nu complica", "începem de aici"'
                className="w-full px-4 py-3 bg-dark-300 border border-dark-200 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          {step === 8 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white font-display">
                BV8) Ce nuanță vrei să aibă umorul tău (dacă folosești)?
              </h2>
              <p className="text-gray-400 text-sm">Opțional.</p>
              {[
                'Deloc',
                'Subtil / ironic light',
                'Relatable (POV, situații)',
                'Direct și mai provocator (fără jigniri)',
              ].map((option) => (
                <button
                  key={option}
                  onClick={() => setFormData({ ...formData, humorTone: option })}
                  className={`w-full text-left px-6 py-4 rounded-lg border-2 transition-all ${
                    formData.humorTone === option
                      ? 'border-brand-500 bg-brand-500/10 text-white'
                      : 'border-dark-200 hover:border-dark-100 text-gray-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 rounded-lg border border-red-500 bg-red-500/10 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-dark-200">
            <Button
              variant="outline"
              onClick={() => {
                setStep(step - 1);
                setError(null);
              }}
              disabled={step === 1}
            >
              ← Înapoi
            </Button>

            {step < totalSteps ? (
              <Button
                onClick={() => {
                  if (!canGoNext()) {
                    setError('Completează întrebarea curentă înainte să continui.');
                    return;
                  }
                  setError(null);
                  setStep(step + 1);
                }}
                disabled={!canGoNext()}
              >
                Următorul →
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Se salvează...' : '✓ Salvează Brand Voice'}
              </Button>
            )}
          </div>
        </Card>

        {saveMutation.isError && (
          <Card className="mt-4 bg-red-500/10 border-red-500/50">
            <p className="text-red-400">
              {(saveMutation.error as any)?.response?.data?.error || 'A apărut o eroare la salvare.'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
