import { describe, expect, it, vi } from "vitest";
import { bundledCount, countRecorded, loadAudioIndex } from "./speech";

describe("narration coverage", () => {
  it("counts how many sentences of a module have a real recording", async () => {
    vi.stubGlobal("fetch", async () => ({
      ok: true,
      json: async () => ["nl-basis/boodschappen/s011", "nl-basis/boodschappen/s012"],
    }));

    await loadAudioIndex();

    expect(bundledCount()).toBe(2);
    expect(countRecorded(["nl-basis/boodschappen/s011", "nl-basis/boodschappen/s012", "nl-basis/wonen/s020"])).toBe(2);
    expect(countRecorded([])).toBe(0);
    vi.unstubAllGlobals();
  });
});
