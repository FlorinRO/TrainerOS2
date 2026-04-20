import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('ro-RO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function getScoreColor(score: number): string {
  if (score >= 75) return 'text-brand-500';
  if (score >= 50) return 'text-yellow-500';
  return 'text-red-500';
}

export function getScoreBarColor(score: number): string {
  if (score >= 75) return 'bg-brand-500';
  if (score >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
