import type { Language } from "@/types";

/**
 * Adding a language later must be a data change, not a code change: the drill engine
 * only needs a TTS locale and the words "my language" are never hardcoded. These are
 * the profiles the picker offers when a module declares a language.
 */
export const LANGUAGES: Language[] = [
  { code: "nl", name: "Dutch", nativeName: "Nederlands", ttsLocale: "nl-NL", flag: "🇳🇱" },
  { code: "es", name: "Spanish", nativeName: "Español", ttsLocale: "es-ES", flag: "🇪🇸" },
  { code: "de", name: "German", nativeName: "Deutsch", ttsLocale: "de-DE", flag: "🇩🇪" },
  { code: "fr", name: "French", nativeName: "Français", ttsLocale: "fr-FR", flag: "🇫🇷" },
  { code: "it", name: "Italian", nativeName: "Italiano", ttsLocale: "it-IT", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", nativeName: "Português", ttsLocale: "pt-PT", flag: "🇵🇹" },
  { code: "ja", name: "Japanese", nativeName: "日本語", ttsLocale: "ja-JP", flag: "🇯🇵" },
];

export function languageFor(code: string): Language {
  return (
    LANGUAGES.find((language) => language.code === code) ?? {
      code,
      name: code.toUpperCase(),
      nativeName: code.toUpperCase(),
      ttsLocale: code,
      flag: "🌍",
    }
  );
}
