import { useEffect } from 'react';
import i18n, { setActiveLanguage } from '../i18n';
import { isLanguage } from '../i18n/resolve';
import { getProfile } from '../api/profile';

export function useLanguageSync(): void {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await getProfile();
        if (cancelled) return;
        if (isLanguage(profile.language) && profile.language !== i18n.language) {
          await setActiveLanguage(profile.language);
        }
      } catch {
        /* keep cache */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
}
