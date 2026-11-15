import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "fake-indexeddb/auto";

// Vitest runs with `globals: false`, so Testing Library cannot register its own
// auto-cleanup — do it explicitly or the DOM accumulates between tests.
afterEach(() => {
  cleanup();
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
