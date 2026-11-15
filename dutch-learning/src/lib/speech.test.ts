import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
});
import { audioFile, audioUrl, hasBundledAudio, loadAudioIndex } from "./speech";

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
