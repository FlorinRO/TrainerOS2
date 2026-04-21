export type GenerationHistorySection =
  | 'daily-idea'
  | 'idea-structurer'
  | 'niche-quick'
  | 'niche-quick-icp'
  | 'niche-wizard'
  | 'niche-discover'
  | 'niche-icp-day'
  | 'niche-variants'
  | 'niche-preset-options'
  | 'email-marketing'
  | 'content-review'
  | 'nutrition-plan'
  | 'nutrition-report'
  | 'chat';

export interface GenerationPromptContext {
  recentOutputs?: string[];
  duplicateAttempt?: number;
}

interface GenerationHistoryEntry {
  fingerprint: string;
  preview: string;
  createdAt: number;
}

interface GenerateUniqueResultOptions<T> {
  userId: string;
  section: GenerationHistorySection;
  generate: (context: GenerationPromptContext) => Promise<T>;
  persistentValues?: unknown[];
  maxAttempts?: number;
}

const MAX_HISTORY_ENTRIES = 12;
const DEFAULT_MAX_ATTEMPTS = 3;
const generationHistoryStore = new Map<string, GenerationHistoryEntry[]>();

function buildHistoryKey(userId: string, section: GenerationHistorySection): string {
  return `${userId}:${section}`;
}

function normalizeFingerprintString(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function serializeForFingerprint(value: unknown): string {
  if (typeof value === 'string') {
    return JSON.stringify(normalizeFingerprintString(value));
  }

  if (typeof value === 'number' || typeof value === 'boolean' || value == null) {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => serializeForFingerprint(item)).join(',')}]`;
  }

  if (typeof value === 'object') {
    const source = value as Record<string, unknown>;
    return `{${Object.keys(source)
      .sort((left, right) => left.localeCompare(right))
      .map((key) => `${JSON.stringify(key)}:${serializeForFingerprint(source[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(String(value));
}

function hashFingerprint(input: string): string {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16);
}

function collectTextFragments(value: unknown): string[] {
  if (typeof value === 'string') {
    const normalized = value.replace(/\s+/g, ' ').trim();
    return normalized ? [normalized] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectTextFragments(item));
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  return Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !['id', 'createdAt', 'updatedAt', 'date', 'groupId'].includes(key))
    .flatMap(([, nested]) => collectTextFragments(nested));
}

export function buildGenerationPreview(value: unknown, maxLength = 320): string {
  const combined = collectTextFragments(value)
    .filter(Boolean)
    .join(' | ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!combined) {
    return '[empty output]';
  }

  return combined.length > maxLength ? `${combined.slice(0, maxLength - 3)}...` : combined;
}

export function buildGenerationFingerprint(value: unknown): string {
  return hashFingerprint(serializeForFingerprint(value));
}

function getHistoryEntries(
  userId: string,
  section: GenerationHistorySection
): GenerationHistoryEntry[] {
  return generationHistoryStore.get(buildHistoryKey(userId, section)) || [];
}

function setHistoryEntries(
  userId: string,
  section: GenerationHistorySection,
  entries: GenerationHistoryEntry[]
): void {
  generationHistoryStore.set(
    buildHistoryKey(userId, section),
    entries
      .sort((left, right) => right.createdAt - left.createdAt)
      .slice(0, MAX_HISTORY_ENTRIES)
  );
}

export function rememberGeneratedValue(
  userId: string,
  section: GenerationHistorySection,
  value: unknown
): void {
  const fingerprint = buildGenerationFingerprint(value);
  const preview = buildGenerationPreview(value);
  const current = getHistoryEntries(userId, section);

  if (current.some((entry) => entry.fingerprint === fingerprint)) {
    return;
  }

  setHistoryEntries(userId, section, [
    {
      fingerprint,
      preview,
      createdAt: Date.now(),
    },
    ...current,
  ]);
}

export function seedGenerationHistory(
  userId: string,
  section: GenerationHistorySection,
  values: unknown[]
): void {
  values.forEach((value) => rememberGeneratedValue(userId, section, value));
}

export function getRecentGenerationPreviews(
  userId: string,
  section: GenerationHistorySection,
  limit = 4
): string[] {
  return getHistoryEntries(userId, section)
    .slice(0, limit)
    .map((entry) => entry.preview)
    .filter(Boolean);
}

function buildDuplicateRetryInstruction(attempt: number): string {
  if (attempt <= 0) {
    return '';
  }

  return [
    'ATENTIE:',
    'Aceasta este o regenerare dupa o coliziune cu un output recent.',
    'Nu parafraza varianta anterioara.',
    'Schimba explicit hook-ul/titlul, unghiul principal, exemplul concret, ordinea ideilor si concluzia finala.',
    'Daca exista CTA sau rezumat, schimba si formularea lor clar, nu doar 1-2 cuvinte.',
  ].join('\n');
}

export function buildAntiRepeatPromptSection(context?: GenerationPromptContext): string {
  const recentOutputs = Array.isArray(context?.recentOutputs)
    ? context.recentOutputs.map((item) => item.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 4)
    : [];
  const duplicateAttempt = Number(context?.duplicateAttempt || 0);
  const retryInstruction = buildDuplicateRetryInstruction(duplicateAttempt);

  if (recentOutputs.length === 0 && !retryInstruction) {
    return '';
  }

  const lines = ['ANTI-REPETITIE (OBLIGATORIU):'];

  if (recentOutputs.length > 0) {
    lines.push('Nu repeta exact sau foarte apropiat aceste output-uri recente:');
    recentOutputs.forEach((output, index) => {
      lines.push(`${index + 1}. ${output}`);
    });
  }

  if (retryInstruction) {
    lines.push(retryInstruction);
  }

  lines.push('Output-ul nou trebuie sa fie diferit semantic si diferit ca wording fata de exemplele de mai sus.');

  return lines.join('\n');
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function buildVariationSentence(section: GenerationHistorySection, attempt: number): string {
  const variants: Record<GenerationHistorySection, string[]> = {
    'daily-idea': [
      'Pastreaza ideea de baza, dar muta accentul pe un pas mai usor de aplicat chiar din aceasta saptamana.',
      'Adauga un unghi mai practic si mai imediat, astfel incat omul sa stie exact de unde incepe.',
      'Schimba directia spre o concluzie mai clara si mai actionabila, fara sa reiei aceeasi formulare.',
    ],
    'idea-structurer': [
      'Varianta aceasta pune accent mai clar pe aplicarea imediata, nu doar pe explicatie.',
      'Aici mesajul este inchis mai practic, astfel incat concluzia sa ramana mai usor de retinut.',
      'Textul capata un unghi ceva mai direct si mai usor de pus in practica imediat.',
    ],
    'niche-quick': [
      'Varianta aceasta muta accentul pe diferentiere si pe contextul real al clientului ideal.',
      'Aici mesajul este formulat mai clar in jurul promisiunii centrale si al situatiei concrete a clientului.',
      'Aceasta formulare impinge pozitionarea spre claritate si aplicabilitate, nu doar descriere.',
    ],
    'niche-quick-icp': [
      'Profilul acesta accentueaza mai clar rutina reala si blocajele care apar zi de zi.',
      'Varianta muta focusul spre tensiunea dintre intentie si viata reala a clientului ideal.',
      'Formularea aceasta scoate mai puternic in fata contextul, nu doar rezultatul dorit.',
    ],
    'niche-wizard': [
      'Aici directia este ceva mai clara pe problema centrala si pe motivul pentru care clientul te-ar alege.',
      'Varianta aceasta condenseaza mesajul in jurul diferentei reale pe care o produci.',
      'Pozitionarea este mutata mai mult spre claritate si rezultat sustenabil.',
    ],
    'niche-discover': [
      'Aceasta varianta rafineaza mesajul in jurul blocajului dominant si al ritmului real de viata.',
      'Aici promisiunea este formulata ceva mai clar pentru contextul concret al clientului ideal.',
      'Varianta aceasta pune mai mult accent pe cum arata progresul in viata reala, nu in teorie.',
    ],
    'niche-icp-day': [
      'In aceasta varianta, rutina zilnica este legata mai clar de punctele de frustrare si de deciziile mici din fiecare zi.',
      'Textul scoate mai bine in fata unde se rupe consecventa in programul real al clientului.',
      'Profilul acesta pune accent pe senzatia de presiune zilnica si pe nevoia de claritate practica.',
    ],
    'niche-variants': [
      'Varianta aceasta impinge descrierea spre unghiul de mesaj, nu doar spre eticheta nisei.',
      'Aici directia este ceva mai aplicata si mai usor de comunicat in content si oferta.',
      'Descrierea accentueaza mai clar problema centrala si tipul de promisiune transmis.',
    ],
    'niche-preset-options': [
      'Optiunea aceasta este formulata cu un unghi ceva mai clar pentru selectie rapida.',
      'Descrierea muta accentul pe contextul real si pe rezultatul usor de inteles.',
      'Aici formularea este ceva mai practica si mai usor de ales dintr-un click.',
    ],
    'email-marketing': [
      'Varianta aceasta schimba accentul spre claritate practica si un pas mai usor de facut acum.',
      'Aici emailul inchide mai direct discutia cu un unghi ceva mai aplicat si mai specific.',
      'Mesajul este mutat spre o promisiune mai concreta si mai usor de actionat.',
    ],
    'content-review': [
      'Varianta aceasta accentueaza mai clar prioritatea imediata si impactul ei asupra conversiei.',
      'Aici rezumatul inchide mai ferm ce merita schimbat mai intai si de ce.',
      'Formularea pune mai mult accent pe pasul urmator, nu doar pe diagnostic.',
    ],
    'nutrition-plan': [
      'Varianta aceasta favorizeaza un ritm mai usor de sustinut in zile aglomerate.',
      'Aici planul este orientat mai clar spre executie practica si rotatie mai simpla a meselor.',
      'Mesajul muta accentul pe aderenta si pe decizii usor de repetat.',
    ],
    'nutrition-report': [
      'Varianta aceasta pune mai mult accent pe executie si pe cum arata consistenta in viata reala.',
      'Aici concluziile sunt formulate ceva mai practic, pentru implementare usoara de la o saptamana la alta.',
      'Textul accentueaza mai clar partea de ajustare si aderenta pe termen lung.',
    ],
    'chat': [
      'Iti raspund dintr-un unghi diferit, mai practic si mai usor de executat imediat.',
      'Formulez raspunsul dintr-o directie noua, cu accent mai clar pe pasii urmatori.',
      'Variez explicatia astfel incat sa primesti o perspectiva diferita, nu doar aceeasi idee reformulata.',
    ],
  };

  const options = variants[section];
  return options[attempt % options.length];
}

function appendSentence(target: string, sentence: string): string {
  const normalized = target.trim();
  if (!normalized) {
    return sentence;
  }

  if (normalized.includes(sentence)) {
    return normalized;
  }

  return `${normalized} ${sentence}`.trim();
}

export function forceDistinctGenerationValue<T>(
  section: GenerationHistorySection,
  value: T,
  attempt: number
): T {
  const sentence = buildVariationSentence(section, attempt);

  if (typeof value === 'string') {
    return appendSentence(value, sentence) as T;
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const clone = cloneValue(value) as any;

  if (clone.reasoning && typeof clone.reasoning === 'string') {
    clone.reasoning = appendSentence(clone.reasoning, sentence);
    return clone as T;
  }

  if (clone.summary && typeof clone.summary === 'string') {
    clone.summary = appendSentence(clone.summary, sentence);
    return clone as T;
  }

  if (clone.executiveSummary && typeof clone.executiveSummary === 'string') {
    clone.executiveSummary = appendSentence(clone.executiveSummary, sentence);
    return clone as T;
  }

  if (clone.positioning && typeof clone.positioning === 'string') {
    clone.positioning = appendSentence(clone.positioning, sentence);
    return clone as T;
  }

  if (clone.icpProfile && typeof clone.icpProfile === 'string') {
    clone.icpProfile = appendSentence(clone.icpProfile, sentence);
    return clone as T;
  }

  if (clone.body && typeof clone.body === 'string') {
    clone.body = appendSentence(clone.body, sentence);
    return clone as T;
  }

  if (clone.previewText && typeof clone.previewText === 'string') {
    clone.previewText = appendSentence(clone.previewText, sentence);
    return clone as T;
  }

  if (clone.mainIdea && typeof clone.mainIdea === 'string') {
    clone.mainIdea = appendSentence(clone.mainIdea, sentence);
    return clone as T;
  }

  if (Array.isArray(clone.script) && clone.script.length > 0) {
    const lastEntry = clone.script[clone.script.length - 1];
    if (typeof lastEntry === 'string') {
      clone.script[clone.script.length - 1] = appendSentence(lastEntry, sentence);
      return clone as T;
    }

    if (lastEntry && typeof lastEntry === 'object' && typeof lastEntry.text === 'string') {
      lastEntry.text = appendSentence(lastEntry.text, sentence);
      return clone as T;
    }
  }

  if (Array.isArray(clone.suggestions) && clone.suggestions[0] && typeof clone.suggestions[0].text === 'string') {
    clone.suggestions[0].text = appendSentence(clone.suggestions[0].text, sentence);
    return clone as T;
  }

  if (Array.isArray(clone.prepTips) && typeof clone.prepTips[0] === 'string') {
    clone.prepTips[0] = appendSentence(clone.prepTips[0], sentence);
    return clone as T;
  }

  if (Array.isArray(clone.paragraphs) && typeof clone.paragraphs[0] === 'string') {
    clone.paragraphs[0] = appendSentence(clone.paragraphs[0], sentence);
    return clone as T;
  }

  return clone as T;
}

export async function generateUniqueResult<T>({
  userId,
  section,
  generate,
  persistentValues = [],
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
}: GenerateUniqueResultOptions<T>): Promise<T> {
  seedGenerationHistory(userId, section, persistentValues);

  let recentFingerprints = new Set(
    getHistoryEntries(userId, section).map((entry) => entry.fingerprint)
  );
  let recentPreviews = getRecentGenerationPreviews(userId, section, 4);
  let lastCandidate: T | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = await generate({
      recentOutputs: recentPreviews,
      duplicateAttempt: attempt,
    });
    const fingerprint = buildGenerationFingerprint(candidate);

    lastCandidate = candidate;

    if (!recentFingerprints.has(fingerprint)) {
      rememberGeneratedValue(userId, section, candidate);
      return candidate;
    }

    console.warn(
      `[anti-repeat] Duplicate output detected for ${section} and user ${userId} on attempt ${attempt + 1}.`
    );

    recentFingerprints = new Set([...recentFingerprints, fingerprint]);
    recentPreviews = [
      buildGenerationPreview(candidate),
      ...recentPreviews,
    ].filter(Boolean).slice(0, 4);
  }

  if (lastCandidate === null) {
    throw new Error(`Failed to generate a result for ${section}.`);
  }

  let diversifiedCandidate = lastCandidate;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    diversifiedCandidate = forceDistinctGenerationValue(section, diversifiedCandidate, attempt);
    const diversifiedFingerprint = buildGenerationFingerprint(diversifiedCandidate);

    if (!recentFingerprints.has(diversifiedFingerprint)) {
      rememberGeneratedValue(userId, section, diversifiedCandidate);
      return diversifiedCandidate;
    }
  }

  rememberGeneratedValue(userId, section, diversifiedCandidate);
  return diversifiedCandidate;
}
