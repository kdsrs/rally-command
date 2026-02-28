import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "Admin Panel": "Admin Panel",
      "Settings": "Settings",
      "Counter Rally Offset (seconds)": "Counter Rally Offset (seconds)",
      "Ghost Rally Offset (seconds)": "Ghost Rally Offset (seconds)",
      "Counter-Counter Rally Offset (seconds)": "Counter-Counter Rally Offset (seconds)",
      "Second Ghost Rally Offset (seconds)": "Second Ghost Rally Offset (seconds)",
      "Save All Changes": "Save All Changes",
      "Main Rallies": "Main Rallies",
      "Counter Rallies": "Counter Rallies",
      "Ghost Rallies": "Ghost Rallies",
      "Counter-Counter Rallies": "Counter-Counter Rallies",
      "Second Ghost Rallies": "Second Ghost Rallies",
      "Add Leader": "Add {{type}} Leader",
      "RALLY COMMAND": "RALLY COMMAND",
      "READY TO COORDINATE": "READY TO COORDINATE",
      "OPERATION COMPLETE": "OPERATION COMPLETE",
      "OPERATION LIVE": "OPERATION LIVE",
      "INITIATE OPERATION": "INITIATE OPERATION",
      "ABORT": "ABORT",
      "LAUNCH IN": "LAUNCH IN",
      "HIT IN": "HIT IN",
      "Wiki": "Wiki",
      "Documentation": "Documentation",
      "Access Code Required": "Access Code Required",
      "Enter Code": "Enter Code",
      "Submit": "Submit",
      "Edit Wiki": "Edit Wiki",
      "Save Wiki": "Save Wiki",
      "Link copied to clipboard!": "Link copied to clipboard!",
      "STANDBY": "STANDBY",
      "WAITING": "WAITING",
      "GET READY": "GET READY",
      "LAUNCH NOW": "LAUNCH NOW",
      "IN TRANSIT": "IN TRANSIT",
      "HIT TARGET": "HIT TARGET",
      "No leaders assigned": "No leaders assigned"
    }
  },
  fr: {
    translation: {
      "Admin Panel": "Panneau d'administration",
      "Main Rallies": "Attaques principales",
      "Counter Rallies": "Contre-attaques",
      "Ghost Rallies": "Rallies Fantômes",
      "Counter-Counter Rallies": "Contre-contre-attaques",
      "Second Ghost Rallies": "Deuxième Rallies Fantômes",
      "Access Code Required": "Code d'accès requis",
      "Wiki": "Wiki"
    }
  },
  tr: {
    translation: {
      "Admin Panel": "Yönetim Paneli",
      "Main Rallies": "Ana Saldırılar",
      "Counter Rallies": "Karşı Saldırılar",
      "Ghost Rallies": "Hayalet Saldırılar",
      "Counter-Counter Rallies": "Karşı-Karşı Saldırılar",
      "Second Ghost Rallies": "İkinci Hayalet Saldırılar",
      "Access Code Required": "Erişim Kodu Gerekli",
      "Wiki": "Wiki"
    }
  },
  de: {
    translation: {
      "Admin Panel": "Admin-Bereich",
      "Main Rallies": "Hauptangriffe",
      "Counter Rallies": "Gegenangriffe",
      "Ghost Rallies": "Geister-Rallies",
      "Counter-Counter Rallies": "Gegen-Gegenangriffe",
      "Second Ghost Rallies": "Zweite Geister-Rallies",
      "Access Code Required": "Zugangscode erforderlich",
      "Wiki": "Wiki"
    }
  },
  sv: {
    translation: {
      "Admin Panel": "Administrationspanel",
      "Main Rallies": "Huvudattacker",
      "Counter Rallies": "Motattacker",
      "Ghost Rallies": "Spök-rallies",
      "Counter-Counter Rallies": "Mot-motattacker",
      "Second Ghost Rallies": "Andra Spök-rallies",
      "Access Code Required": "Åtkomstkod krävs",
      "Wiki": "Wiki"
    }
  },
  es: {
    translation: {
      "Admin Panel": "Panel de Administración",
      "Main Rallies": "Ataques Principales",
      "Counter Rallies": "Contraataques",
      "Ghost Rallies": "Rallies Fantasma",
      "Counter-Counter Rallies": "Contra-Contraataques",
      "Second Ghost Rallies": "Segundos Rallies Fantasma",
      "Access Code Required": "Se requiere código de acceso",
      "Wiki": "Wiki"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;