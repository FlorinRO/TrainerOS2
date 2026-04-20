import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authAPI, ideaAPI } from '@/services/api';
import Card from '@/components/Card';
import Button from '@/components/Button';

interface StructuredIdeaResponse {
  mainIdea: string;
  hooks: string[];
  script: { sectionTitle: string; text: string }[];
  cta: string;
  ctaStyleApplied: string;
  improvements: string[];
}

const DEFAULT_IMPROVEMENTS = [
  'Mesaj clarificat',
  'Redundanță eliminată',
  'Structură adăugată',
  'Ton adaptat la nișă',
];

const DEFAULT_SECTION_TITLES = [
  'PARTEA 1 – Context',
  'PARTEA 2 – Explicație clară',
  'PARTEA 3 – Exemplu / aplicație',
  'PARTEA 4 – Principiu final',
];

function normalizeTextValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function collectStructuredIdeaText(value: unknown): string[] {
  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized ? [normalized] : [];
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => collectStructuredIdeaText(item))
      .filter(Boolean);
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  const source = value as Record<string, unknown>;
  const preferredKeys = [
    'text',
    'content',
    'body',
    'scriptText',
    'description',
    'sectionContent',
    'copy',
    'paragraph',
    'paragraphs',
    'value',
    'contentText',
    'script',
    'details',
  ];

  for (const key of preferredKeys) {
    const extracted = collectStructuredIdeaText(source[key]);
    if (extracted.length > 0) {
      return extracted;
    }
  }

  return Object.entries(source)
    .filter(([key]) => !['sectionTitle', 'title', 'heading', 'name', 'label'].includes(key))
    .flatMap(([, nestedValue]) => collectStructuredIdeaText(nestedValue))
    .filter(Boolean);
}

function normalizeStructuredIdeaTitle(value: unknown): string {
  if (!value || typeof value !== 'object') {
    return '';
  }

  const source = value as Record<string, unknown>;
  return (
    normalizeTextValue(source.sectionTitle) ||
    normalizeTextValue(source.title) ||
    normalizeTextValue(source.heading) ||
    normalizeTextValue(source.name) ||
    normalizeTextValue(source.label)
  );
}

function normalizeSectionText(section: Record<string, unknown>): string {
  return collectStructuredIdeaText(section).join('\n\n').trim();
}

function normalizeStructuredIdeaResponse(value: unknown): StructuredIdeaResponse | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const source = value as Record<string, unknown>;
  const hooks = Array.isArray(source.hooks)
    ? source.hooks.map((hook) => normalizeTextValue(hook)).filter(Boolean)
    : [];
  const rawScript = Array.isArray(source.script)
    ? source.script
    : source.script && typeof source.script === 'object'
      ? Object.values(source.script as Record<string, unknown>)
      : [];
  const improvements = Array.isArray(source.improvements)
    ? source.improvements.map((item) => normalizeTextValue(item)).filter(Boolean)
    : [];
  const normalizedScript = rawScript.length
    ? rawScript.map((section, index) => {
        const part = section && typeof section === 'object' ? (section as Record<string, unknown>) : {};

        return {
          sectionTitle: normalizeStructuredIdeaTitle(part) || DEFAULT_SECTION_TITLES[index] || `PARTEA ${index + 1}`,
          text: normalizeSectionText(part),
        };
      })
    : DEFAULT_SECTION_TITLES.map((title) => ({
        sectionTitle: title,
        text: '',
      }));

  return {
    mainIdea: normalizeTextValue(source.mainIdea),
    hooks: hooks.length > 0 ? hooks : ['', ''],
    script: normalizedScript,
    cta: normalizeTextValue(source.cta),
    ctaStyleApplied: normalizeTextValue(source.ctaStyleApplied),
    improvements: improvements.length > 0 ? improvements : DEFAULT_IMPROVEMENTS,
  };
}

export default function IdeaStructurer() {
  const [ideaText, setIdeaText] = useState('');

  const { data: userData } = useQuery({
    queryKey: ['user-me'],
    queryFn: async () => {
      const { data } = await authAPI.me();
      return data.user;
    },
  });

  const structureMutation = useMutation({
    mutationFn: (text: string) => ideaAPI.structure({ ideaText: text }),
  });

  const hasNiche = !!userData?.niche;
  const result = normalizeStructuredIdeaResponse(structureMutation.data?.data);
  const hasVisibleResult = !!(
    result &&
    (result.mainIdea ||
      result.hooks.some(Boolean) ||
      result.script.some((part) => part.text) ||
      result.cta ||
      result.improvements.length)
  );

  return (
    <div className="min-h-screen bg-dark-400 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2 font-display">
            Ai deja ideea? Pune-o aici.
          </h1>
          <p className="text-gray-300 mb-6">📝 Scrie ideea ta, exact cum îți vine.</p>

          {!hasNiche ? (
            <div className="bg-brand-500/10 border border-brand-500/40 rounded-lg p-4">
              <p className="text-gray-200 mb-3">
                Ca să adaptăm corect la nișa ta, completează întâi Niche Finder.
              </p>
              <Link to="/niche-finder">
                <Button>🎯 Mergi la Niche Finder</Button>
              </Link>
            </div>
          ) : (
            <>
              <textarea
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
                placeholder="Ex: Vreau să vorbesc despre de ce oamenii renunță după 2 săptămâni și cum pot face procesul mai simplu..."
                className="w-full min-h-[220px] p-4 rounded-lg bg-dark-300 border border-dark-100 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />

              <div className="mt-4 flex justify-end">
                <Button
                  onClick={() => structureMutation.mutate(ideaText)}
                  isLoading={structureMutation.isPending}
                  disabled={!ideaText.trim() || ideaText.trim().length < 10}
                >
                  ➡ Structurează
                </Button>
              </div>
            </>
          )}
        </Card>

        {structureMutation.isError && (
          <Card className="mb-6 bg-red-500/10 border-red-500/50">
            <p className="text-red-400">
              {(structureMutation.error as any)?.response?.data?.message ||
                (structureMutation.error as any)?.response?.data?.error ||
                'Nu am putut structura ideea.'}
            </p>
          </Card>
        )}

        {structureMutation.isSuccess && !hasVisibleResult && (
          <Card className="mb-6 bg-yellow-500/10 border-yellow-500/40">
            <p className="text-yellow-200">
              Răspunsul a venit incomplet. Încearcă din nou; pagina nu mai cade, dar rezultatul nu a putut fi afișat.
            </p>
          </Card>
        )}

        {hasVisibleResult && result && (
          <div className="space-y-6">
            <Card>
              <h2 className="text-white font-bold mb-3">Ideea principală</h2>
              <p className="text-gray-200">{result.mainIdea}</p>
            </Card>

            <Card>
              <h2 className="text-white font-bold mb-3">Hook (2 variante)</h2>
              <div className="space-y-2">
                {result.hooks.map((hook, idx) => (
                  <div key={idx} className="bg-dark-300 rounded-lg p-3 text-gray-100">
                    {idx + 1}. {hook}
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="text-white font-bold mb-3">Script structurat</h2>
              <div className="space-y-4">
                {result.script.map((part, idx) => (
                  <div key={`${part.sectionTitle}-${idx}`} className="bg-dark-300 rounded-lg p-4">
                    <h3 className="text-brand-500 font-semibold mb-2">{part.sectionTitle}</h3>
                    <p className="text-gray-200 whitespace-pre-wrap">{part.text}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="text-white font-bold mb-2">CTA adaptat</h2>
              <p className="text-gray-400 text-sm mb-3">Stil aplicat: {result.ctaStyleApplied}</p>
              <p className="text-gray-100">{result.cta}</p>
            </Card>

            <Card>
              <h2 className="text-white font-bold mb-3">Ce a fost îmbunătățit</h2>
              <ul className="space-y-2">
                {result.improvements.map((item, idx) => (
                  <li key={idx} className="text-gray-200">
                    • {item}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
