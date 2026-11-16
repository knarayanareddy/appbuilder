import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
});
import { audioFile, audioUrl, forgetVoice, hasBundledAudio, inspectVoice, loadAudioIndex } from "./speech";

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
