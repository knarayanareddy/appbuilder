import { describe, expect, it } from "vitest";

import { asrListen, asrStart, asrState, asrStatus, asrStop, isNative } from "./asr";

/**
 * The bridge is only real on Android, so these tests pin the behaviour that matters
 * everywhere else: every call fails loudly and harmlessly. A drill that offered a
 * microphone it could not open would be worse than no microphone at all.
 */
describe("the speech bridge", () => {
  it("reports unsupported where no native plugin exists", async () => {
    expect(isNative()).toBe(false);
    expect(await asrStatus(true)).toBe("unsupported");
    expect(asrState()).toBe("unsupported");
  });

  it("refuses to start rather than pretending to listen", async () => {
    expect(await asrStart()).toBe(false);
    expect(asrState()).toBe("unsupported");
  });

  it("returns no text and ok: false when nothing was recording", async () => {
    expect(await asrStop()).toEqual({ heard: "", ok: false });
  });

  it("gives up instead of hanging when the microphone cannot open", async () => {
    const result = await asrListen(10);

    expect(result.ok).toBe(false);
    expect(result.heard).toBe("");
  });
});
