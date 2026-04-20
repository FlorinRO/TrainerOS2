import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';

interface SetupOnboardingModalProps {
  isOpen: boolean;
  hasNiche: boolean;
  hasBrandVoice: boolean;
  hasContentCreationPreferences: boolean;
  onClose: () => void;
}

type SetupStep = {
  key: 'niche' | 'brandVoice' | 'contentCreation';
  title: string;
  description: string;
  path: string;
};

const setupSteps: SetupStep[] = [
  {
    key: 'niche',
    title: '1) Setează nișa',
    description: 'Completează Niche Finder ca să avem context clar pentru toate generările.',
    path: '/niche-finder',
  },
  {
    key: 'brandVoice',
    title: '2) Configurează Brand Voice',
    description: 'Stabilește tonul și stilul tău pentru scripturi care sună ca tine.',
    path: '/content-preferences',
  },
  {
    key: 'contentCreation',
    title: '3) Cum vrei să creezi content',
    description: 'Alege formatul tău de livrare ca ideile să fie ușor de executat.',
    path: '/cum-vrei-sa-creezi-content',
  },
];

export default function SetupOnboardingModal({
  isOpen,
  hasNiche,
  hasBrandVoice,
  hasContentCreationPreferences,
  onClose,
}: SetupOnboardingModalProps) {
  const navigate = useNavigate();

  const status = useMemo(
    () => ({
      niche: hasNiche,
      brandVoice: hasBrandVoice,
      contentCreation: hasContentCreationPreferences,
    }),
    [hasNiche, hasBrandVoice, hasContentCreationPreferences]
  );

  const nextStep = useMemo(
    () => setupSteps.find((step) => !status[step.key]),
    [status]
  );

  if (!isOpen || !nextStep) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-brand-500/40 bg-dark-300 shadow-2xl shadow-black/40">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-brand-500 text-sm font-semibold">Onboarding Setup</p>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Închide onboarding"
            >
              ✕
            </button>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3">
            Înainte să începi, setează contul în 3 pași
          </h2>
          <p className="text-gray-300 mb-6">
            Parcurge pașii în ordine ca TrainerOS să personalizeze corect ideile și strategiile.
          </p>

          <div className="space-y-3 mb-8">
            {setupSteps.map((step) => {
              const completed = status[step.key];
              const active = step.key === nextStep.key;
              return (
                <div
                  key={step.key}
                  className={`rounded-lg border p-4 ${
                    completed
                      ? 'border-green-500/40 bg-green-500/10'
                      : active
                        ? 'border-brand-500/50 bg-brand-500/10'
                        : 'border-dark-200 bg-dark-400/60'
                  }`}
                >
                  <p className="text-white font-semibold">{step.title}</p>
                  <p className="text-gray-300 text-sm mt-1">{step.description}</p>
                  <p className="text-xs mt-2 font-semibold">
                    {completed ? (
                      <span className="text-green-400">Completat</span>
                    ) : active ? (
                      <span className="text-brand-500">Pas curent</span>
                    ) : (
                      <span className="text-gray-500">Blocat până termini pasul anterior</span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Închide
            </Button>
            <Button onClick={() => navigate(nextStep.path)}>
              Continuă cu: {nextStep.title} →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
