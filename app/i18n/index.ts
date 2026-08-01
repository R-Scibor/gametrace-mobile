import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { resolveLanguage, type Language } from './resolve';
import enCommon from './locales/en/common.json';
import plCommon from './locales/pl/common.json';

export const LANG_STORAGE_KEY = 'gt.lang';

const resources = {
  en: { common: enCommon },
  pl: { common: plCommon },
};

// Init with temporary en; hydrateLanguage sets real lng before UI mounts.
if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: ['pl', 'en'],
    defaultNS: 'common',
    resources,
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
    saveMissing: false,
  });
}

export async function getCachedLanguage(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LANG_STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function setActiveLanguage(lng: Language): Promise<void> {
  await i18n.changeLanguage(lng);
  try {
    await AsyncStorage.setItem(LANG_STORAGE_KEY, lng);
  } catch {
    /* ignore */
  }
}

export async function hydrateLanguage(): Promise<Language> {
  const cached = await getCachedLanguage();
  const device = getLocales()[0]?.languageTag ?? getLocales()[0]?.languageCode ?? null;
  const lng = resolveLanguage({ cached, navigatorLanguage: device });
  await setActiveLanguage(lng);
  return lng;
}

export default i18n;
