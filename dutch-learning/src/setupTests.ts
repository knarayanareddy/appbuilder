import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "fake-indexeddb/auto";

// Vitest runs with `globals: false`, so Testing Library cannot register its own cleanup.
afterEach(() => {
  cleanup();
});

// jsdom has no voice stack; the app degrades to "no sound" and must not crash.
Object.defineProperty(window, "speechSynthesis", {
  writable: true,
  value: {
    speak: () => undefined,
    cancel: () => undefined,
    getVoices: () => [],
  },
});
