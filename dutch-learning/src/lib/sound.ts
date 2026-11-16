import { Capacitor } from "@capacitor/core";

/**
 * Feedback you can feel. Both channels are optional and both are synthesised: the
 * tones are built with WebAudio at runtime, so there is no audio file in the APK, no
 * download, and no licensing. If a device has no audio context (or the learner turned
 * sound off) every call is a no-op.
 */
let enabled = { sound: true, haptics: true };

export function configureFeedback(next: { sound: boolean; haptics: boolean }): void {
  enabled = next;
}

let context: AudioContext | null = null;

function audio(): AudioContext | null {
  if (!enabled.sound || typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!context) {
    try {
      context = new Ctor();
    } catch {
      return null;
    }
  }
  if (context.state === "suspended") void context.resume().catch(() => undefined);
  return context;
}

function tone(
  frequency: number,
  at: number,
  duration: number,
  options: { type?: OscillatorType; gain?: number } = {},
): void {
  const ctx = audio();
  if (!ctx) return;
  try {
    const oscillator = ctx.createOscillator();
    const amp = ctx.createGain();
    oscillator.type = options.type ?? "sine";
    oscillator.frequency.value = frequency;
    const start = ctx.currentTime + at;
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(options.gain ?? 0.12, start + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(amp);
    amp.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  } catch {
    /* a refused audio context must never break a session */
  }
}

export function playCorrectTone(): void {
  tone(587.33, 0, 0.1);
  tone(880, 0.075, 0.16);
}

export function playWrongTone(): void {
  tone(196, 0, 0.16, { type: "triangle", gain: 0.15 });
  tone(146.83, 0.09, 0.22, { type: "triangle", gain: 0.13 });
}

export function playCompleteTone(): void {
  [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => tone(frequency, index * 0.09, 0.24, { gain: 0.11 }));
}

export function playTapTone(): void {
  tone(392, 0, 0.05, { gain: 0.05 });
}

type HapticKind = "light" | "error" | "success";

async function haptic(kind: HapticKind): Promise<void> {
  if (!enabled.haptics) return;

  try {
    if (Capacitor.isNativePlatform()) {
      const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
      if (kind === "light") {
        await Haptics.impact({ style: ImpactStyle.Light });
      } else {
        await Haptics.notification({ type: kind === "error" ? NotificationType.Error : NotificationType.Success });
      }
      return;
    }
  } catch {
    /* fall through to vibration, then give up */
  }

  try {
    navigator.vibrate?.(kind === "error" ? 28 : kind === "success" ? [12, 40, 18] : 10);
  } catch {
    /* vibration is a nicety */
  }
}

export function feedbackCorrect(): void {
  playCorrectTone();
  void haptic("light");
}

export function feedbackWrong(): void {
  playWrongTone();
  void haptic("error");
}

export function feedbackComplete(): void {
  playCompleteTone();
  void haptic("success");
}

export function feedbackTap(): void {
  playTapTone();
}
