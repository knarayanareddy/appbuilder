import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyTheme, resolveTheme } from "./theme";

beforeEach(() => {
  delete document.documentElement.dataset.theme;
  document.head.innerHTML = '<meta name="theme-color" content="" />';
});

describe("theme", () => {
  it("paints the document and the browser chrome", () => {
    applyTheme("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute("content")).toBe("#f4f6fd");

    applyTheme("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("follows the system when asked, and keeps following it", () => {
    let matches = true;
    const listeners: Array<() => void> = [];
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        get matches() {
          return matches;
        },
        addEventListener: (_: string, listener: () => void) => listeners.push(listener),
        removeEventListener: vi.fn(),
      })),
    );

    expect(resolveTheme("system")).toBe("light");
    const stop = applyTheme("system");
    expect(document.documentElement.dataset.theme).toBe("light");

    matches = false;
    listeners.forEach((listener) => listener());
    expect(document.documentElement.dataset.theme).toBe("dark");

    stop();
    vi.unstubAllGlobals();
  });
});
