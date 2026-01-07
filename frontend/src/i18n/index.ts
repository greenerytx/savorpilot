import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from './locales/en/common.json';
import enNavigation from './locales/en/navigation.json';
import enAuth from './locales/en/auth.json';
import enSettings from './locales/en/settings.json';
import enRecipes from './locales/en/recipes.json';
import enNotifications from './locales/en/notifications.json';
import enSharing from './locales/en/sharing.json';
import enInstagram from './locales/en/instagram.json';
import enCollections from './locales/en/collections.json';
import enHome from './locales/en/home.json';

import arCommon from './locales/ar/common.json';
import arNavigation from './locales/ar/navigation.json';
import arAuth from './locales/ar/auth.json';
import arSettings from './locales/ar/settings.json';
import arRecipes from './locales/ar/recipes.json';
import arNotifications from './locales/ar/notifications.json';
import arSharing from './locales/ar/sharing.json';
import arInstagram from './locales/ar/instagram.json';
import arCollections from './locales/ar/collections.json';
import arHome from './locales/ar/home.json';

const resources = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    auth: enAuth,
    settings: enSettings,
    recipes: enRecipes,
    notifications: enNotifications,
    sharing: enSharing,
    instagram: enInstagram,
    collections: enCollections,
    home: enHome,
  },
  ar: {
    common: arCommon,
    navigation: arNavigation,
    auth: arAuth,
    settings: arSettings,
    recipes: arRecipes,
    notifications: arNotifications,
    sharing: arSharing,
    instagram: arInstagram,
    collections: arCollections,
    home: arHome,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar'],
    ns: ['common', 'navigation', 'auth', 'settings', 'recipes', 'notifications', 'sharing', 'instagram', 'collections', 'home'],
    defaultNS: 'common',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Update document direction when language changes
i18n.on('languageChanged', (lng) => {
  const dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
});

// Set initial direction
const currentLng = i18n.language || 'en';
document.documentElement.dir = currentLng === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = currentLng;

export default i18n;
