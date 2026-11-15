import { Capacitor } from "@capacitor/core";
import { TextToSpeech } from "@capacitor-community/text-to-speech";

/**
 * Audio comes from the phone's own Dutch voice. In the APK that is Android's
 * TextToSpeech engine (works offline once the nl-NL voice is installed, which it is
 * on essentially every Android phone); in a desktop browser it falls back to
 * speechSynthesis. Nothing is downloaded and no sentence audio is shipped in the APK.
 */
let lastError: string | null = null;

export function lastSpeechError(): string | null {
  return lastError;
}

export function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

function webSpeak(text: string, rate: number): boolean {
  const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
  if (!synth || typeof window.SpeechSynthesisUtterance === "undefined") return false;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "nl-NL";
  utterance.rate = rate;
  const dutch = synth.getVoices().find((voice) => voice.lang.toLowerCase().startsWith("nl"));
  if (dutch) utterance.voice = dutch;
  synth.cancel();
  synth.speak(utterance);
  return true;
}

export async function speakDutch(text: string, rate = 0.9): Promise<boolean> {
  try {
    if (isNative()) {
      await TextToSpeech.stop();
      await TextToSpeech.speak({
        text,
        lang: "nl-NL",
        rate,
        pitch: 1,
        volume: 1,
        category: "playback",
      });
      lastError = null;
      return true;
    }
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
  }

  if (webSpeak(text, rate)) {
    lastError = null;
    return true;
  }

  lastError = lastError ?? "No Dutch voice available on this device.";
  return false;
}

export async function stopSpeaking(): Promise<void> {
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
