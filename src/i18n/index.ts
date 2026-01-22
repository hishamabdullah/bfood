import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ar from "./locales/ar.json";
import en from "./locales/en.json";
import ur from "./locales/ur.json";
import hi from "./locales/hi.json";

// الحصول على اللغة المحفوظة أو استخدام العربية كافتراضية
const savedLanguage = localStorage.getItem("language") || "ar";

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
    ur: { translation: ur },
    hi: { translation: hi },
  },
  lng: savedLanguage,
  fallbackLng: "ar",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

export const languages = [
  { code: "ar", name: "العربية", dir: "rtl" },
  { code: "en", name: "English", dir: "ltr" },
  { code: "ur", name: "اردو", dir: "rtl" },
  { code: "hi", name: "हिंदी", dir: "ltr" },
];

export const changeLanguage = (lang: string) => {
  i18n.changeLanguage(lang);
  localStorage.setItem("language", lang);
  
  // تحديث اتجاه الصفحة
  const language = languages.find((l) => l.code === lang);
  document.documentElement.dir = language?.dir || "rtl";
  document.documentElement.lang = lang;
};
