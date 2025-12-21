import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import publicID from '../locales/id/public.json';
import publicEN from '../locales/en/public.json';

const resources = {
  id: {
    translation: publicID
  },
  en: {
    translation: publicEN
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en', // Fallback is English
    lng: 'id', // Default language is Indonesian
    debug: false,

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      checkWhitelist: true,
      excludeCacheFor: ['cimode'],
    },

    supportedLngs: ['id', 'en'],

    interpolation: {
      escapeValue: false
    },

    react: {
      useSuspense: false
    },

    load: 'languageOnly',
  });

export default i18n;
