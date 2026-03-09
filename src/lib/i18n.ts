import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  lng: 'id', // bahasa awal
  fallbackLng: 'id',
  interpolation: { escapeValue: false },
  resources: {
    en: { common: {} }, // kita pakai labels manual dulu saja
    id: { common: {} }
  }
});

export default i18n;