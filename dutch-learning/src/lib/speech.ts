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
  /** Position in the engine's own voice list. Never the position in `SpeechStatus.voices`. */
  index?: number;
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

/** How many of these sentences have a real recording rather than the phone's voice. */
export function countRecorded(keys: string[]): number {
  let count = 0;
  for (const key of keys) if (bundled.has(key)) count += 1;
  return count;
}

export function bundledCount(): number {
  return bundled.size;
}

/**
 * `module/unit/item` → `module__unit__item.mp3`. Double underscore is the separator
 * because a single `_` already appears in ids like `nl_basis`.
 */
export function audioFile(key: string): string {
  return key.split("/").join("__");
}

export function audioUrl(key: string): string {
  return `audio/${audioFile(key)}.mp3`;
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
async function queryVoice(locale: string): Promise<SpeechStatus> {
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
    // Keep the engine's index: passing a filtered index would pick whatever voice
    // happens to sit at that position in the full list, English ones included.
    const matching = voices
      .map((voice, index) => ({ voice, index }))
      .filter(({ voice }) => voice.lang.toLowerCase().startsWith(prefix))
      .map(({ voice, index }) => ({
        uri: voice.voiceURI,
        name: voice.name,
        lang: voice.lang,
        local: voice.localService,
        index,
      }));
    return {
      locale,
      supported: supported.supported || matching.length > 0,
      voices: matching,
      error: supported.supported || matching.length > 0 ? undefined : "Android does not have the Dutch voice installed.",
    };
  } catch (error) {
    return { locale, supported: false, voices: [], error: error instanceof Error ? error.message : String(error) };
  }
}

let cached: { locale: string; at: number; status: SpeechStatus } | null = null;
const TTL_OK = 5 * 60_000;
const TTL_FAIL = 8_000;

/** Forget the engine check — after an install, or when the learner asks again. */
export function forgetVoice(): void {
  cached = null;
}

/**
 * Checking the engine means binding to it, which on Android costs a few hundred
 * milliseconds. Cache a success for minutes and a failure for seconds, so speaking ten
 * sentences in a row is not ten engine handshakes.
 */
export async function inspectVoice(locale: string, options: { refresh?: boolean } = {}): Promise<SpeechStatus> {
  const now = Date.now();
  if (!options.refresh && cached && cached.locale === locale) {
    const ttl = cached.status.supported ? TTL_OK : TTL_FAIL;
    if (now - cached.at < ttl) return cached.status;
  }
  const status = await queryVoice(locale);
  cached = { locale, at: now, status };
  return status;
}

/** Opens Android's "install voice data" flow for the missing language. */
export async function openVoiceInstall(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    await TextToSpeech.openInstall();
    return true;
  } catch {
    // No default engine, or an engine with no install activity: hand over to the
    // system browser so the learner still has a way forward.
    try {
      window.open("https://play.google.com/store/apps/details?id=com.google.android.tts", "_system");
      return true;
    } catch {
      return false;
    }
  }
}

export interface SpeakOptions {
  locale: string;
  rate?: number;
  voiceUri?: string | null;
  /** True when the learner prefers a wrong voice to silence. */
  allowApproximate?: boolean;
}

export interface SpeakResult {
  ok: boolean;
  /** The engine had no voice for the language and spoke with another one. */
  approximate?: boolean;
  error?: string;
}

let speaking = false;
let utteranceRef: SpeechSynthesisUtterance | null = null;

export async function speak(text: string, options: SpeakOptions): Promise<SpeakResult> {
  const rate = options.rate ?? 0.9;

  if (isNative()) {
    try {
      const status = await inspectVoice(options.locale);
      if (!status.supported && !options.allowApproximate) {
        return { ok: false, error: `No ${options.locale} voice on this phone — install it in Android settings.` };
      }
      const chosen = options.voiceUri ? status.voices.find((voice) => voice.uri === options.voiceUri) : undefined;

      // Flush is the plugin's default, so an explicit stop() first only adds a race
      // where the engine is released just as the new utterance is queued.
      if (speaking) {
        try {
          await TextToSpeech.stop();
        } catch {
          /* the engine was not speaking after all */
        }
      }

      speaking = true;
      // With no voice for the language, the engine reads the text in its default
      // voice. That is audibly wrong and still better than a silent button, so it
      // happens only when the learner asked for it, and the caller is told.
      await TextToSpeech.speak({
        text,
        ...(status.supported ? { lang: options.locale } : {}),
        rate,
        pitch: 1,
        volume: 1,
        ...(chosen?.index !== undefined ? { voice: chosen.index } : {}),
        category: "playback",
      });
      return { ok: true, ...(status.supported ? {} : { approximate: true }) };
    } catch (error) {
      speaking = false;
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
  if (!synth || typeof window.SpeechSynthesisUtterance === "undefined") {
    return { ok: false, error: "This browser cannot speak." };
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.locale;
  utterance.rate = rate;
  const available = synth.getVoices();
  const exact =
    available.find((voice) => voice.voiceURI === options.voiceUri) ??
    available.find((voice) => voice.lang.toLowerCase().startsWith(options.locale.slice(0, 2).toLowerCase()));
  if (!exact && !options.allowApproximate) {
    return { ok: false, error: `This device has no ${options.locale} voice.` };
  }
  const chosen = exact ?? available[0];
  if (chosen) utterance.voice = chosen;
  utterance.onend = () => {
    utteranceRef = null;
  };
  utterance.onerror = () => {
    utteranceRef = null;
  };
  synth.cancel();
  // Chrome drops an utterance that nothing references mid-sentence, which sounds
  // exactly like "it spoke two words and stopped".
  utteranceRef = utterance;
  synth.speak(utterance);
  return { ok: true, ...(exact ? {} : { approximate: true }) };
}

export function isSpeaking(): boolean {
  if (isNative()) return speaking;
  return utteranceRef !== null || Boolean(typeof window !== "undefined" && window.speechSynthesis?.speaking);
}

export async function stopSpeaking(): Promise<void> {
  stopAudio();
  speaking = false;
  utteranceRef = null;
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
