import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  isLocale,
  readLocale,
  saveLocale,
  translate,
  type Locale,
  type Translator,
} from "./core";

type LanguageContextValue = { locale: Locale; setLocale: (locale: Locale) => void; t: Translator };
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // SSR and the first hydration render always agree. Preference is read only
  // after mounting; a server render never touches shared language state.
  const [locale, updateLocale] = useState<Locale>(DEFAULT_LOCALE);
  useEffect(() => {
    try {
      updateLocale(readLocale(window.localStorage));
    } catch {
      /* Storage can be disabled. */
    }
    const sync = (event: StorageEvent) => {
      if (event.key === LOCALE_STORAGE_KEY)
        updateLocale(isLocale(event.newValue) ? event.newValue : DEFAULT_LOCALE);
      else if (event.key === null) updateLocale(DEFAULT_LOCALE);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const setLocale = useCallback((next: Locale) => {
    if (!isLocale(next)) return;
    updateLocale(next);
    try {
      saveLocale(next, window.localStorage);
    } catch {
      /* The active session still switches. */
    }
  }, []);
  const t = useCallback<Translator>(
    (message, values) => translate(message, locale, values),
    [locale],
  );
  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n(): LanguageContextValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useI18n must be used inside LanguageProvider");
  return value;
}
