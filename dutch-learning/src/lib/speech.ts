import { Capacitor } from "@capacitor/core";
import { TextToSpeech } from "@capacitor-community/text-to-speech";

/**
 * Audio has two sources, and the app prefers the one that cannot sound wrong:
 *
 * 1. A bundled recording (`public/audio/<key>.mp3`), played offline. This is a real
 *    Dutch voice, so pronunciation does not depend on the phone.
 * 2. The phone's own text-to-speech engine.
 *
 * Source 2 has a trap: if the Dutch voice data is not installed, Android happily
 * reads Dutch words with an *English* voice — technically "speaking", completely
 * wrong. So the engine is checked before it is trusted, and the app can open the
 * system's install dialog for the missing voice instead of butchering the sentence.
 */
export interface VoiceInfo {
  uri: string;
  name: string;
  lang: string;
  local: boolean;
}

export interface SpeechStatus {
  locale: string;
  supported: boolean;
  voices: VoiceInfo[];
  error?: string;
}

let bundled = new Set<string>();
let indexPromise: Promise<Set<string>> | null = null;
let audio: HTMLAudioElement | null = null;

/**
 * The build pipeline drops recordings into `public/audio/` and lists them in
 * `audio/index.json`. No index means no recordings, which is not an error.
 */
export function loadAudioIndex(): Promise<Set<string>> {
  if (!indexPromise) {
    indexPromise = fetch("audio/index.json")
      .then((response) => (response.ok ? response.json() : []))
      .then((keys: unknown) => {
        bundled = new Set(Array.isArray(keys) ? keys.filter((key): key is string => typeof key === "string") : []);
        return bundled;
      })
      .catch(() => {
        bundled = new Set();
        return bundled;
      });
  }
  return indexPromise;
}

export function hasBundledAudio(key: string): boolean {
  return bundled.has(key);
}

export function audioUrl(key: string): string {
  return `audio/${key.replace(/[^a-zA-Z0-9._-]+/g, "_")}.mp3`;
}

export function stopAudio(): void {
  if (audio) {
    audio.pause();
    audio = null;
  }
}

export async function playBundled(key: string, rate = 1): Promise<boolean> {
  if (!bundled.has(key)) return false;
  try {
    stopAudio();
    audio = new Audio(audioUrl(key));
    audio.playbackRate = rate;
    await audio.play();
    return true;
  } catch {
    audio = null;
    return false;
  }
}

export function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

function webVoices(locale: string): VoiceInfo[] {
  const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
  if (!synth || typeof synth.getVoices !== "function") return [];
  const prefix = locale.slice(0, 2).toLowerCase();
  return synth.getVoices().map((voice) => ({
    uri: voice.voiceURI,
    name: voice.name,
    lang: voice.lang,
    local: voice.localService,
  })).filter((voice) => voice.lang.toLowerCase().startsWith(prefix));
}

/** What can this device actually do in the language being learned? */
export async function inspectVoice(locale: string): Promise<SpeechStatus> {
  const prefix = locale.slice(0, 2).toLowerCase();

  if (!isNative()) {
    const voices = webVoices(locale);
    return {
      locale,
      supported: voices.length > 0,
      voices,
      error: voices.length > 0 ? undefined : "This browser has no Dutch voice installed.",
    };
  }

  try {
    const supported = await TextToSpeech.isLanguageSupported({ lang: locale });
    const { voices } = await TextToSpeech.getSupportedVoices();
    const matching = voices
      .filter((voice) => voice.lang.toLowerCase().startsWith(prefix))
      .map((voice) => ({ uri: voice.voiceURI, name: voice.name, lang: voice.lang, local: voice.localService }));
    return {
      locale,
      supported: supported.supported || matching.length > 0,
      voices: matching,
      error: supported.supported ? undefined : "Android does not have the Dutch voice installed.",
    };
  } catch (error) {
    return { locale, supported: false, voices: [], error: error instanceof Error ? error.message : String(error) };
  }
}

/** Opens Android's "install voice data" flow for the missing language. */
export async function openVoiceInstall(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    await TextToSpeech.openInstall();
    return true;
  } catch {
    return false;
  }
}

export interface SpeakOptions {
  locale: string;
  rate?: number;
  voiceUri?: string | null;
}

export async function speak(text: string, options: SpeakOptions): Promise<{ ok: boolean; error?: string }> {
  const rate = options.rate ?? 0.9;

  try {
    if (isNative()) {
      const status = await inspectVoice(options.locale);
      if (!status.supported) {
        return { ok: false, error: `No ${options.locale} voice on this phone — install it in Android settings.` };
      }
      const index = status.voices.findIndex((voice) => voice.uri === options.voiceUri);
      await TextToSpeech.stop();
      await TextToSpeech.speak({
        text,
        lang: options.locale,
        rate,
        pitch: 1,
        volume: 1,
        ...(index >= 0 ? { voice: index } : {}),
        ...(isNative() ? { category: "playback" } : {}),
      });
      return { ok: true };
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }

  const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
  if (!synth || typeof window.SpeechSynthesisUtterance === "undefined") {
    return { ok: false, error: "This browser cannot speak." };
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.locale;
  utterance.rate = rate;
  const available = synth.getVoices();
  const chosen =
    available.find((voice) => voice.voiceURI === options.voiceUri) ??
    available.find((voice) => voice.lang.toLowerCase().startsWith(options.locale.slice(0, 2).toLowerCase()));
  if (chosen) utterance.voice = chosen;
  synth.cancel();
  synth.speak(utterance);
  return { ok: true };
}

export async function stopSpeaking(): Promise<void> {
  stopAudio();
  try {
    if (isNative()) {
      await TextToSpeech.stop();
      return;
    }
    window.speechSynthesis?.cancel();
  } catch {
    /* stopping a voice that is not speaking is not an error worth surfacing */
  }
}
