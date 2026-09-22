import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en';

export const SUPPORTED_LANGUAGES = ['en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const LANGUAGE_STORAGE_KEY = 'devpilotx_language';

// Resolution order: explicit user override (localStorage) → OS/browser locale → English.
// Only locales that ship a catalogue are honoured; anything else falls back to English
// so the UI never renders raw keys.
export const resolveInitialLanguage = (): SupportedLanguage => {
  let override = '';
  try {
    override = localStorage.getItem(LANGUAGE_STORAGE_KEY) || '';
  } catch {
    // localStorage unavailable (e.g. hardened/privacy mode): fall through.
  }
  const candidate = (
    override || (typeof navigator !== 'undefined' ? navigator.language : 'en') || 'en'
  )
    .slice(0, 2)
    .toLowerCase();
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(candidate)
    ? (candidate as SupportedLanguage)
    : 'en';
};

export const setLanguage = (language: SupportedLanguage): void => {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Non-fatal: the choice simply will not persist.
  }
  void i18n.changeLanguage(language);
};

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: resolveInitialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false
});

export default i18n;
