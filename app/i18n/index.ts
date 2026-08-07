import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { resolveLanguage, type Language } from './resolve';
import enCommon from './locales/en/common.json';
import plCommon from './locales/pl/common.json';
import enSettings from './locales/en/settings.json';
import plSettings from './locales/pl/settings.json';
import enAuth from './locales/en/auth.json';
import plAuth from './locales/pl/auth.json';
import enServer from './locales/en/server.json';
import plServer from './locales/pl/server.json';
import enDashboard from './locales/en/dashboard.json';
import plDashboard from './locales/pl/dashboard.json';
import enLibrary from './locales/en/library.json';
import plLibrary from './locales/pl/library.json';
import enStats from './locales/en/stats.json';
import plStats from './locales/pl/stats.json';
import enSessions from './locales/en/sessions.json';
import plSessions from './locales/pl/sessions.json';
import enGameDetail from './locales/en/gameDetail.json';
import plGameDetail from './locales/pl/gameDetail.json';
import enVoice from './locales/en/voice.json';
import plVoice from './locales/pl/voice.json';
import enTrash from './locales/en/trash.json';
import plTrash from './locales/pl/trash.json';
import enDatetime from './locales/en/datetime.json';
import plDatetime from './locales/pl/datetime.json';
import enReport from './locales/en/report.json';
import plReport from './locales/pl/report.json';
import enOnboarding from './locales/en/onboarding.json';
import plOnboarding from './locales/pl/onboarding.json';
import enAccount from './locales/en/account.json';
import plAccount from './locales/pl/account.json';

export const LANG_STORAGE_KEY = 'gt.lang';

const resources = {
  en: {
    common: enCommon,
    settings: enSettings,
    auth: enAuth,
    server: enServer,
    dashboard: enDashboard,
    library: enLibrary,
    stats: enStats,
    sessions: enSessions,
    gameDetail: enGameDetail,
    voice: enVoice,
    trash: enTrash,
    datetime: enDatetime,
    report: enReport,
    onboarding: enOnboarding,
    account: enAccount,
  },
  pl: {
    common: plCommon,
    settings: plSettings,
    auth: plAuth,
    server: plServer,
    dashboard: plDashboard,
    library: plLibrary,
    stats: plStats,
    sessions: plSessions,
    gameDetail: plGameDetail,
    voice: plVoice,
    trash: plTrash,
    datetime: plDatetime,
    report: plReport,
    onboarding: plOnboarding,
    account: plAccount,
  },
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
  const deviceLocale = getLocales()[0];
  const device = deviceLocale?.languageTag ?? deviceLocale?.languageCode ?? null;
  const lng = resolveLanguage({ cached, navigatorLanguage: device });
  await setActiveLanguage(lng);
  return lng;
}

export default i18n;
