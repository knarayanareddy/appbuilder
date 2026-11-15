import { afterEach, describe, expect, it } from "vitest";
import { canUseCameraCapture } from "./device";
import { pretendComputer, pretendIpad, pretendPhone, resetDevice } from "@/test/device";

afterEach(() => {
  resetDevice();
});

describe("canUseCameraCapture", () => {
  it("says yes on an Android phone, where the capture attribute opens the camera", () => {
    pretendPhone();
    expect(canUseCameraCapture()).toBe(true);
  });

  it("says no on a computer, where capture is ignored and both buttons open one dialog", () => {
    pretendComputer();
    expect(canUseCameraCapture()).toBe(false);
  });

  it("says yes on an iPad, which reports a Mac user agent but does have a camera", () => {
    pretendIpad();
    expect(canUseCameraCapture()).toBe(true);
  });

  it("treats an unknown desktop browser as a computer rather than promising a camera", () => {
    // The jsdom default: a real-looking desktop user agent and no touch points.
    expect(canUseCameraCapture()).toBe(false);
  });
});
