import { useCallback, useState } from 'react';
import i18n, { setActiveLanguage } from '../i18n';
import { isLanguage, type Language } from '../i18n/resolve';
import { updateSettings } from '../api/profile';

export function useLanguage() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(false);

  const select = useCallback(async (lng: Language) => {
    const previous: Language = isLanguage(i18n.language) ? i18n.language : 'pl';
    if (lng === previous) return;
    setIsPending(true);
    setError(false);
    await setActiveLanguage(lng);
    try {
      await updateSettings({ language: lng });
    } catch {
      await setActiveLanguage(previous);
      setError(true);
    } finally {
      setIsPending(false);
    }
  }, []);

  return { select, isPending, error, clearError: () => setError(false) };
}
