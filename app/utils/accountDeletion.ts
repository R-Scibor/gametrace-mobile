import axios from 'axios';
import i18n from '../i18n';
import { intlLocale } from '../i18n/resolve';
import type { DeletionStatus, PendingDeletion } from '../types/api';

export function daysUntil(iso: string): number {
  return Math.ceil((Date.parse(iso) - Date.now()) / 86_400_000);
}

export function daysLeftUntil(purgeAt: string, fallback: number): number {
  const days = daysUntil(purgeAt);
  if (Number.isNaN(days)) return fallback;
  return Math.max(1, days);
}

/** First finite `grace_days` wins. A scheduled payload outranks `/health`. */
export function graceDaysFrom(
  ...sources: Array<{ grace_days?: number | null } | null | undefined>
): number | null {
  for (const source of sources) {
    const days = source?.grace_days;
    if (typeof days === 'number' && Number.isFinite(days)) return days;
  }
  return null;
}

export const isDeletionStatus = (value: unknown): value is DeletionStatus =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as DeletionStatus).purge_at === 'string' &&
  typeof (value as DeletionStatus).deletion_requested_at === 'string' &&
  typeof (value as DeletionStatus).days_left === 'number';

export function formatPurgeDateOnly(iso: string): string {
  return new Date(iso).toLocaleDateString(intlLocale(i18n.language), {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function pendingDeletionFromError(err: unknown): PendingDeletion | null {
  if (!axios.isAxiosError(err)) return null;
  if (err.response?.status !== 403) return null;

  const detail = (err.response.data as { detail?: unknown } | undefined)?.detail;
  if (typeof detail !== 'object' || detail === null) return null;
  if ((detail as { detail?: unknown }).detail !== 'Account scheduled for deletion') return null;
  if (!isDeletionStatus(detail)) return null;

  const { deletion_requested_at, purge_at, days_left, grace_days } = detail;
  return {
    deletion_requested_at,
    purge_at,
    days_left,
    ...(typeof grace_days === 'number' ? { grace_days } : {}),
  };
}
