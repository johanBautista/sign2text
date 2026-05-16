import { createI18n } from "vue-i18n";
import es from "./locales/es.js";
import en from "./locales/en.js";

const MESSAGES = {
  es,
  en,
};

const i18n = createI18n({
  locale: "es", // idioma por defecto
  fallbackLocale: "en", // idioma de respaldo
  messages: MESSAGES,
  legacy: false, // usa Composition API
  globalInjection: true, // permite usar $t en templates
});

export default i18n;
