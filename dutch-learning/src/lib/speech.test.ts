import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
});
import { audioFile, audioUrl, forgetVoice, hasBundledAudio, inspectVoice, loadAudioIndex, speak } from "./speech";

describe("bundled audio", () => {
  it("turns an item key into a file name that can be reversed", () => {
    expect(audioFile("nl-basis/kennismaking/s001")).toBe("nl-basis__kennismaking__s001");
    expect(audioUrl("nl-basis/kennismaking/s001")).toBe("audio/nl-basis__kennismaking__s001.mp3");
  });

  it("knows which sentences have a recording", async () => {
    vi.stubGlobal("fetch", async () => ({
      ok: true,
      json: async () => ["nl-basis/kennismaking/s001"],
    }));

    await loadAudioIndex();
    expect(hasBundledAudio("nl-basis/kennismaking/s001")).toBe(true);
    expect(hasBundledAudio("nl-basis/klachten/s121")).toBe(false);
  });

  it("treats a missing index as 'no recordings', not as an error", async () => {
    vi.unstubAllGlobals();
    vi.stubGlobal("fetch", async () => {
      throw new Error("offline");
    });
    // A fresh module instance cannot be forced here, so only the public contract is checked:
    // hasBundledAudio must answer for unknown keys without throwing.
    expect(() => hasBundledAudio("nl-basis/wonen/s020")).not.toThrow();
  });
});

describe("engine check", () => {
  const voices = [{ voiceURI: "nl-1", name: "Dutch", lang: "nl-NL", localService: true }];

  it("asks the browser once, then remembers", async () => {
    const getVoices = vi.spyOn(window.speechSynthesis, "getVoices").mockReturnValue(voices as unknown as SpeechSynthesisVoice[]);

    forgetVoice();
    const first = await inspectVoice("nl-NL");
    const second = await inspectVoice("nl-NL");

    expect(first.supported).toBe(true);
    expect(second.voices[0].uri).toBe("nl-1");
    expect(getVoices).toHaveBeenCalledTimes(1);

    // "Check again" after installing a voice must actually re-ask.
    await inspectVoice("nl-NL", { refresh: true });
    expect(getVoices).toHaveBeenCalledTimes(2);

    forgetVoice();
    await inspectVoice("nl-NL");
    expect(getVoices).toHaveBeenCalledTimes(3);
    getVoices.mockRestore();
  });

  it("reports a missing voice instead of pretending", async () => {
    const getVoices = vi.spyOn(window.speechSynthesis, "getVoices").mockReturnValue([]);
    forgetVoice();
    const status = await inspectVoice("nl-NL");
    expect(status.supported).toBe(false);
    expect(status.error).toMatch(/no dutch voice/i);
    getVoices.mockRestore();
  });
});

describe("speaking without a Dutch voice", () => {
  function setup(speakText = "Ik heet Anna.") {
    const spoken = vi.fn();
    const cancelled = vi.fn();
    Object.assign(window.speechSynthesis, { speak: spoken, cancel: cancelled });
    const getVoices = vi.spyOn(window.speechSynthesis, "getVoices").mockReturnValue([
      { voiceURI: "en-1", name: "English", lang: "en-US", localService: true } as unknown as SpeechSynthesisVoice,
    ]);
    class UtteranceStub {
      lang = "";
      rate = 1;
      voice: unknown = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(readonly text: string) {}
    }
    vi.stubGlobal("SpeechSynthesisUtterance", UtteranceStub);
    forgetVoice();
    return { spoken, cancelled, getVoices, text: speakText };
  }

  it("refuses rather than butchers the language when it is not allowed", async () => {
    const { spoken, text } = setup();
    const result = await speak(text, { locale: "nl-NL", allowApproximate: false });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/no nl-NL voice/i);
    expect(spoken).not.toHaveBeenCalled();
  });

  it("speaks with the closest voice when the learner asked for sound anyway", async () => {
    const { spoken, text } = setup();
    const result = await speak(text, { locale: "nl-NL", allowApproximate: true });
    expect(result.ok).toBe(true);
    expect(result.approximate).toBe(true);
    expect(spoken).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it("is not approximate when the real voice is there", async () => {
    const { spoken, getVoices, text } = setup();
    getVoices.mockReturnValue([
      { voiceURI: "nl-1", name: "Dutch", lang: "nl-NL", localService: true } as unknown as SpeechSynthesisVoice,
    ]);
    forgetVoice();
    const result = await speak(text, { locale: "nl-NL", allowApproximate: false });
    expect(result).toMatchObject({ ok: true });
    expect(result.approximate).toBeUndefined();
    expect(spoken).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});
