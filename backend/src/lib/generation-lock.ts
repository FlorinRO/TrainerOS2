export type GenerationSection =
  | 'daily-idea'
  | 'idea-structurer'
  | 'niche'
  | 'email-marketing'
  | 'content-review'
  | 'nutrition'
  | 'chat';

const activeGenerationLocks = new Set<string>();

function buildGenerationLockKey(userId: string, section: GenerationSection): string {
  return `${userId}:${section}`;
}

export function acquireGenerationLock(
  userId: string,
  section: GenerationSection
): string | null {
  const key = buildGenerationLockKey(userId, section);
  if (activeGenerationLocks.has(key)) {
    return null;
  }

  activeGenerationLocks.add(key);
  return key;
}

export function releaseGenerationLock(key: string): void {
  activeGenerationLocks.delete(key);
}

export function buildGenerationConflictPayload(section: GenerationSection): {
  error: string;
  message: string;
} {
  switch (section) {
    case 'daily-idea':
      return {
        error: 'Generation already in progress',
        message: 'Există deja o generare Daily Idea în curs. Așteaptă finalizarea ei înainte să pornești alta.',
      };
    case 'idea-structurer':
      return {
        error: 'Generation already in progress',
        message: 'Există deja o structurare de idee în curs. Așteaptă finalizarea ei înainte să pornești alta.',
      };
    case 'niche':
      return {
        error: 'Generation already in progress',
        message: 'Există deja o generare în Niche Finder în curs. Așteaptă finalizarea ei înainte să pornești alta.',
      };
    case 'email-marketing':
      return {
        error: 'Generation already in progress',
        message: 'Există deja o generare de email în curs. Așteaptă finalizarea ei înainte să pornești alta.',
      };
    case 'content-review':
      return {
        error: 'Generation already in progress',
        message: 'Există deja un Content Review în curs. Așteaptă finalizarea lui înainte să pornești altul.',
      };
    case 'nutrition':
      return {
        error: 'Generation already in progress',
        message: 'Există deja o generare de nutriție în curs. Așteaptă finalizarea ei înainte să pornești alta.',
      };
    case 'chat':
      return {
        error: 'Generation already in progress',
        message: 'Există deja un răspuns în curs în chat. Așteaptă finalizarea lui înainte să trimiți alt mesaj.',
      };
    default:
      return {
        error: 'Generation already in progress',
        message: 'Există deja o generare în curs. Așteaptă finalizarea ei înainte să pornești alta.',
      };
  }
}
