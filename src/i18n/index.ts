import { invoke } from "@tauri-apps/api/core";
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import commonEn from './locales/en-US/common.json';
import sidebarEn from './locales/en-US/sidebar.json';
import settingsEn from './locales/en-US/settings.json';
import summaryEn from './locales/en-US/summary.json';
import searchEn from './locales/en-US/search.json';
import timelineEn from './locales/en-US/timeline.json';
import trayEn from './locales/en-US/tray.json';

import commonZh from './locales/zh-CN/common.json';
import sidebarZh from './locales/zh-CN/sidebar.json';
import settingsZh from './locales/zh-CN/settings.json';
import summaryZh from './locales/zh-CN/summary.json';
import searchZh from './locales/zh-CN/search.json';
import timelineZh from './locales/zh-CN/timeline.json';
import trayZh from './locales/zh-CN/tray.json';

// Define resources
export const defaultNS = 'common';
export const resources = {
  'en-US': {
    common: commonEn,
    sidebar: sidebarEn,
    settings: settingsEn,
    summary: summaryEn,
    search: searchEn,
    timeline: timelineEn,
    tray: trayEn,
  },
  'zh-CN': {
    common: commonZh,
    sidebar: sidebarZh,
    settings: settingsZh,
    summary: summaryZh,
    search: searchZh,
    timeline: timelineZh,
    tray: trayZh,
  },
} as const;

i18n
  // Detects user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // Init i18next
  .init({
    debug: import.meta.env.DEV, // Enable debug in dev mode
    fallbackLng: 'en-US',
    defaultNS,
    resources,
    interpolation: {
      escapeValue: false, // React already safe from XSS
    },
    detection: {
      // Order of language detection
      order: ['localStorage', 'navigator'],
      // Keys to lookup language from
      lookupLocalStorage: 'i18nextLng',
      // Cache user language on
      caches: ['localStorage'],
    },
  });

// Listen for language changes and update system tray
i18n.on('languageChanged', (lng) => {
  const translations = i18n.getResourceBundle(lng, 'tray');
  if (translations) {
    invoke('update_tray_menu', { translations })
      .catch((err) => console.error('Failed to update tray menu:', err));
  }
});

// Initial update
const initialTranslations = i18n.getResourceBundle(i18n.language, 'tray');
if (initialTranslations) {
    invoke('update_tray_menu', { translations: initialTranslations })
      .catch((err) => console.error('Failed to initial update tray menu:', err));
}

export default i18n;
