import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import Button from '@/components/Button';
import Card from '@/components/Card';

interface FormData {
  gender: 'femei' | 'barbati' | 'ambele' | '';
  ageRanges: string[];
  wakeUpTime: string;
  jobType: 'sedentar' | 'activ' | 'mixt' | '';
  sittingTime: '<4h' | '4-6h' | '6-8h' | '8h+' | '';
  morning: string[];
  lunch: string[];
  evening: string[];
  definingSituations: string[];
  notes: string;
}

export default function ICPDay() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    gender: '',
    ageRanges: [],
    wakeUpTime: '',
    jobType: '',
    sittingTime: '',
    morning: [],
    lunch: [],
    evening: [],
    definingSituations: [],
    notes: '',
  });

  const generateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return api.post('/niche/generate/icp-day', data);
    },
    onSuccess: () => {
      navigate('/dashboard');
    },
  });

  const toggleArray = (field: keyof FormData, value: string) => {
    const current = formData[field] as string[];
    if (current.includes(value)) {
      setFormData({ ...formData, [field]: current.filter((v) => v !== value) });
    } else {
      setFormData({ ...formData, [field]: [...current, value] });
    }
  };

  const handleSubmit = () => {
    if (!formData.gender || formData.ageRanges.length === 0) {
      alert('Te rog completează toate câmpurile obligatorii');
      return;
    }
    generateMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-dark-400 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 font-display">
            Spune-mi Nișa Ta
          </h1>
          <p className="text-gray-300">
            Descrie ziua tipică a clientului tău ideal — AI-ul va crea Niche Builder-ul complet
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                  s === step
                    ? 'bg-brand-500 text-white'
                    : s < step
                      ? 'bg-brand-500/30 text-brand-500'
                      : 'bg-dark-300 text-gray-500'
                }`}
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        <Card>
          {/* Step 1: Basic Demographics */}
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">
                  Cu ce tip de persoane vrei să lucrezi?
                </h2>
                <div className="space-y-3">
                  {[
                    { value: 'femei', label: 'Femei' },
                    { value: 'barbati', label: 'Bărbați' },
                    { value: 'ambele', label: 'Ambele' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 p-4 bg-dark-300 rounded-lg cursor-pointer hover:bg-dark-200"
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={option.value}
                        checked={formData.gender === option.value}
                        onChange={(e) =>
                          setFormData({ ...formData, gender: e.target.value as any })
                        }
                        className="w-5 h-5"
                      />
                      <span className="text-white">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-4">Ce vârstă au, în general?</h2>
                <div className="space-y-3">
                  {['18–25', '25–35', '35–45', '45+'].map((age) => (
                    <label
                      key={age}
                      className="flex items-center gap-3 p-4 bg-dark-300 rounded-lg cursor-pointer hover:bg-dark-200"
                    >
                      <input
                        type="checkbox"
                        checked={formData.ageRanges.includes(age)}
                        onChange={() => toggleArray('ageRanges', age)}
                        className="w-5 h-5"
                      />
                      <span className="text-white">{age}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Daily Routine */}
          {step === 2 && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                Cum arată, în general, o zi obișnuită pentru clientul tău ideal:
              </h2>

              <div>
                <label className="block text-gray-300 mb-2">Ora de trezire (opțional)</label>
                <input
                  type="text"
                  value={formData.wakeUpTime}
                  onChange={(e) => setFormData({ ...formData, wakeUpTime: e.target.value })}
                  className="w-full bg-dark-300 text-white rounded-lg p-3"
                  placeholder="ex: 06:30"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Tip de job</label>
                <div className="space-y-2">
                  {[
                    { value: 'sedentar', label: 'Sedentar' },
                    { value: 'activ', label: 'Activ' },
                    { value: 'mixt', label: 'Mixt' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 p-3 bg-dark-300 rounded-lg cursor-pointer hover:bg-dark-200"
                    >
                      <input
                        type="radio"
                        name="jobType"
                        value={option.value}
                        checked={formData.jobType === option.value}
                        onChange={(e) =>
                          setFormData({ ...formData, jobType: e.target.value as any })
                        }
                        className="w-5 h-5"
                      />
                      <span className="text-white">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Timp petrecut jos</label>
                <div className="space-y-2">
                  {['<4h', '4-6h', '6-8h', '8h+'].map((time) => (
                    <label
                      key={time}
                      className="flex items-center gap-3 p-3 bg-dark-300 rounded-lg cursor-pointer hover:bg-dark-200"
                    >
                      <input
                        type="radio"
                        name="sittingTime"
                        value={time}
                        checked={formData.sittingTime === time}
                        onChange={(e) =>
                          setFormData({ ...formData, sittingTime: e.target.value as any })
                        }
                        className="w-5 h-5"
                      />
                      <span className="text-white">{time}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Dimineața:</label>
                <div className="space-y-2">
                  {[
                    'mănâncă acasă',
                    'cafea pe stomacul gol',
                    'snack rapid / patiserie',
                  ].map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-3 p-3 bg-dark-300 rounded-lg cursor-pointer hover:bg-dark-200"
                    >
                      <input
                        type="checkbox"
                        checked={formData.morning.includes(option)}
                        onChange={() => toggleArray('morning', option)}
                        className="w-5 h-5"
                      />
                      <span className="text-white text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Prânz:</label>
                <div className="space-y-2">
                  {['gătit', 'comandă', 'mănâncă pe fugă'].map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-3 p-3 bg-dark-300 rounded-lg cursor-pointer hover:bg-dark-200"
                    >
                      <input
                        type="checkbox"
                        checked={formData.lunch.includes(option)}
                        onChange={() => toggleArray('lunch', option)}
                        className="w-5 h-5"
                      />
                      <span className="text-white text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Seara:</label>
                <div className="space-y-2">
                  {[
                    'prea obosiți pentru sală',
                    'au timp, dar fără energie',
                    'se antrenează rar',
                  ].map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-3 p-3 bg-dark-300 rounded-lg cursor-pointer hover:bg-dark-200"
                    >
                      <input
                        type="checkbox"
                        checked={formData.evening.includes(option)}
                        onChange={() => toggleArray('evening', option)}
                        className="w-5 h-5"
                      />
                      <span className="text-white text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Defining Situations */}
          {step === 3 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">
                  Există una sau mai multe situații care îi definesc clar?
                </h2>
                <div className="space-y-3">
                  {[
                    'Au copii',
                    'Sunt deja activi / merg la sală',
                    'Au un job foarte solicitant fizic',
                    'Lucrează în ture / program neregulat',
                    'Au dureri / limitări fizice',
                  ].map((situation) => (
                    <label
                      key={situation}
                      className="flex items-center gap-3 p-4 bg-dark-300 rounded-lg cursor-pointer hover:bg-dark-200"
                    >
                      <input
                        type="checkbox"
                        checked={formData.definingSituations.includes(situation)}
                        onChange={() => toggleArray('definingSituations', situation)}
                        className="w-5 h-5"
                      />
                      <span className="text-white">{situation}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">
                  Note suplimentare (opțional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-dark-300 text-white rounded-lg p-3 min-h-[100px]"
                  placeholder="Alte detalii despre clientul tău ideal..."
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <Button variant="secondary" onClick={() => setStep(step - 1)}>
                Înapoi
              </Button>
            )}
            {step < 3 ? (
              <Button
                variant="primary"
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && (!formData.gender || formData.ageRanges.length === 0))
                }
                className="ml-auto"
              >
                Continuă
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={generateMutation.isPending}
                className="ml-auto"
              >
                {generateMutation.isPending ? 'Generez Niche Builder...' : 'Generează Niche Builder'}
              </Button>
            )}
          </div>

          {generateMutation.isError && (
            <p className="text-red-500 mt-4">
              Eroare: {(generateMutation.error as any)?.response?.data?.error || 'Ceva nu a mers bine'}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
