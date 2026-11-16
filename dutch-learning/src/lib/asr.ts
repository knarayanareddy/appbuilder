import { Capacitor, registerPlugin } from "@capacitor/core";

/**
 * Speech recognition, only where it is real: the Android build ships a Dutch Vosk model
 * (39 MB, Apache-2.0) in the APK's assets, and a small local Capacitor plugin unpacks it
 * once, loads it, and listens through the microphone.
 *
 * In a browser — or a build without the model — every call here reports "unsupported" and
 * the drills keep working exactly as before. Speaking is an extra check, never a gate.
 */
interface DutchSpeechPlugin {
  available(): Promise<{ ready: boolean }>;
  prepare(): Promise<void>;
  start(): Promise<{ started: boolean }>;
  stop(): Promise<{ text: string }>;
}

const DutchSpeech = registerPlugin<DutchSpeechPlugin>("DutchSpeech");

export type AsrState = "unsupported" | "idle" | "preparing" | "ready" | "recording";

let state: AsrState = "unsupported";
let probed = false;

export function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  } catch {
    return false;
  }
}

export function asrState(): AsrState {
  return state;
}

/** One probe per app run: does this build carry the model? */
export async function asrStatus(force = false): Promise<AsrState> {
  if (!isNative()) {
    state = "unsupported";
    return state;
  }
  if (probed && !force) return state;
  probed = true;
  try {
    const { ready } = await DutchSpeech.available();
    state = ready ? "ready" : "idle";
  } catch {
    state = "unsupported";
  }
  return state;
}

/**
 * Unpacking 39 MB of assets the first time costs a few seconds; after that the model is
 * in the app's files directory and loads in well under a second.
 */
export async function asrPrepare(): Promise<boolean> {
  if (!isNative()) return false;
  state = "preparing";
  try {
    await DutchSpeech.prepare();
    state = "ready";
    return true;
  } catch {
    state = "unsupported";
    return false;
  }
}

export interface ListenResult {
  heard: string;
  /** False when the microphone or the model refused — the caller must not score that. */
  ok: boolean;
}

/** Prepares the model if needed and opens the microphone. */
export async function asrStart(): Promise<boolean> {
  if (state === "idle" || state === "unsupported") {
    probed = false;
    if (!(await asrStatus(true))) return false;
    if (state === "idle" && !(await asrPrepare())) return false;
  }
  if (state !== "ready") return false;

  try {
    await DutchSpeech.start();
    state = "recording";
    return true;
  } catch {
    state = "ready";
    return false;
  }
}

/** Closes the microphone and returns whatever was heard. */
export async function asrStop(): Promise<ListenResult> {
  if (state !== "recording") return { heard: "", ok: false };
  try {
    const { text } = await DutchSpeech.stop();
    state = "ready";
    return { heard: (text ?? "").trim(), ok: true };
  } catch {
    state = "ready";
    return { heard: "", ok: false };
  }
}

/** Convenience for callers that do not want to drive start/stop themselves. */
export async function asrListen(ms = 5000): Promise<ListenResult> {
  if (!(await asrStart())) return { heard: "", ok: false };
  await new Promise((resolve) => setTimeout(resolve, ms));
  return asrStop();
}
