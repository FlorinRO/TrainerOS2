import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import Button from '@/components/Button';
import Card from '@/components/Card';

interface ContentCreationData {
  filmingLocation: string;
  naturalContentTypes: string[];
  otherNaturalFormat: string;
  deliveryStyles: string[];
}

const totalSteps = 3;

const filmingLocationOptions = [
  'Acasă',
  'La sală',
  'Ambele (în funcție de zi)',
];

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

export default function ContentCreationPreferences() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ContentCreationData>({
    filmingLocation: '',
    naturalContentTypes: [],
    otherNaturalFormat: '',
    deliveryStyles: [],
  });

  const preferencesQuery = useQuery({
    queryKey: ['content-preferences'],
    queryFn: async () => {
      const { data } = await api.get('/niche/content-preferences');
      return data;
    },
  });

  useEffect(() => {
    const payload = preferencesQuery.data?.contentPreferences?.contentCreation;
    if (!payload) return;
    setFormData({
      filmingLocation: payload.filmingLocation || '',
      naturalContentTypes: payload.naturalContentTypes || [],
      otherNaturalFormat: payload.otherNaturalFormat || '',
      deliveryStyles: payload.deliveryStyles || [],
    });
  }, [preferencesQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (data: ContentCreationData) => {
      return api.post('/niche/content-preferences', {
        type: 'content-creation',
        version: 1,
        completedAt: new Date().toISOString(),
        contentCreation: data,
      });
    },
    onSuccess: () => {
      try {
        sessionStorage.setItem('traineros:setup-completed', '1');
      } catch {
        // Ignore sessionStorage write issues.
      }
      void queryClient.invalidateQueries({ queryKey: ['content-preferences'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      void queryClient.invalidateQueries({ queryKey: ['user-me'] });
      navigate('/dashboard');
    },
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const toggleMulti = (field: 'naturalContentTypes' | 'deliveryStyles', value: string) => {
    const current = formData[field];
    const updated = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    setFormData({ ...formData, [field]: updated });
    setError(null);
  };

  const canGoNext = () => {
    if (step === 1) return !!formData.filmingLocation;
    if (step === 2) return formData.naturalContentTypes.length > 0;
    if (step === 3) return formData.deliveryStyles.length > 0;
    return true;
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
            <span className="text-sm text-brand-500 font-semibold">Durată: 1–2 minute</span>
          </div>
          <div className="w-full bg-dark-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-3 font-display">
            Cum vrei să creezi content?
          </h1>
          <p className="text-gray-300 text-lg">
            Răspunsurile tale devin context global pentru Daily Idea.
          </p>
        </div>

        <Card>
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white font-display">
                1) Unde îți este cel mai ușor / natural să filmezi content?
              </h2>
              <p className="text-gray-400 text-sm">Tip răspuns: single-select</p>
              {filmingLocationOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setFormData({ ...formData, filmingLocation: option });
                    setError(null);
                  }}
                  className={`w-full text-left px-6 py-4 rounded-lg border-2 transition-all ${
                    formData.filmingLocation === option
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
              <h2 className="text-xl font-bold text-white font-display">
                2) Ce tip de content îți vine CEL MAI natural să faci?
              </h2>
              <p className="text-gray-400 text-sm">Tip răspuns: multi-select</p>
              {naturalContentTypeOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => toggleMulti('naturalContentTypes', option)}
                  className={`w-full text-left px-6 py-4 rounded-lg border-2 transition-all ${
                    formData.naturalContentTypes.includes(option)
                      ? 'border-brand-500 bg-brand-500/10 text-white'
                      : 'border-dark-200 hover:border-dark-100 text-gray-300'
                  }`}
                >
                  {option}
                </button>
              ))}

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Alt format care te reprezintă? (opțional)
                </label>
                <input
                  type="text"
                  value={formData.otherNaturalFormat}
                  onChange={(e) => setFormData({ ...formData, otherNaturalFormat: e.target.value })}
                  placeholder="Scrie aici..."
                  className="w-full px-4 py-3 bg-dark-300 border border-dark-200 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white font-display">
                3) Când te gândești la content, ce ți se potrivește MAI MULT?
              </h2>
              <p className="text-gray-400 text-sm">Tip răspuns: multi-select</p>
              {deliveryStyleOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => toggleMulti('deliveryStyles', option)}
                  className={`w-full text-left px-6 py-4 rounded-lg border-2 transition-all ${
                    formData.deliveryStyles.includes(option)
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
                {saveMutation.isPending ? 'Se salvează...' : '✓ Salvează preferințele'}
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
