export type Language = 'pl' | 'en';
export const SUPPORTED_LANGUAGES: Language[] = ['pl', 'en'];

const INTL_LOCALE: Record<Language, string> = {
  pl: 'pl-PL',
  en: 'en-GB',
};

export function isLanguage(value: unknown): value is Language {
  return SUPPORTED_LANGUAGES.includes(value as Language);
}

export function intlLocale(language: unknown): string {
  return INTL_LOCALE[isLanguage(language) ? language : 'en'];
}

export function resolveLanguage(input: {
  profileLanguage?: string | null;
  cached?: string | null;
  navigatorLanguage?: string | null;
}): Language {
  const { profileLanguage, cached, navigatorLanguage } = input;
  if (isLanguage(profileLanguage)) return profileLanguage;
  if (isLanguage(cached)) return cached;
  if ((navigatorLanguage ?? '').toLowerCase().startsWith('pl')) return 'pl';
  return 'en';
}
