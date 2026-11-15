import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "fake-indexeddb/auto";

// Vitest runs with `globals: false`, so Testing Library cannot register its own
// auto-cleanup — do it explicitly or the DOM accumulates between tests.
afterEach(() => {
  cleanup();
});

// jsdom never decodes images: an <img> with a src neither loads nor errors, so
// the downscaler would sit until its decode deadline. Fail immediately instead —
// the fallback path (keep the original bytes) is what we want to exercise.
class ImmediateErrorImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  width = 0;
  height = 0;
  set src(_value: string) {
    setTimeout(() => this.onerror?.(), 0);
  }
}
Object.defineProperty(globalThis, "Image", {
  writable: true,
  value: ImmediateErrorImage,
});

// jsdom ships neither of these; the app and the tests both need them.
if (typeof URL.createObjectURL !== "function") {
  Object.defineProperty(URL, "createObjectURL", {
    writable: true,
    value: () => "blob:test-object-url",
  });
}
if (typeof URL.revokeObjectURL !== "function") {
  Object.defineProperty(URL, "revokeObjectURL", {
    writable: true,
    value: () => undefined,
  });
}
