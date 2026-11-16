import type { Theme } from "@/types";

/**
 * Theme lives on `<html data-theme>` so the whole palette switches with one attribute;
 * "system" follows the OS and keeps following it while the app is open.
 */
const THEME_COLOR = { dark: "#000000", light: "#f2f2f7" } as const;

export function resolveTheme(theme: Theme): "dark" | "light" {
  if (theme !== "system") return theme;
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function applyTheme(theme: Theme): () => void {
  if (typeof document === "undefined") return () => undefined;

  const paint = () => {
    const resolved = resolveTheme(theme);
    document.documentElement.dataset.theme = resolved;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[resolved]);
  };

  paint();

  if (theme !== "system" || typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => undefined;
  }

  const media = window.matchMedia("(prefers-color-scheme: light)");
  const listener = () => paint();
  media.addEventListener?.("change", listener);
  return () => media.removeEventListener?.("change", listener);
}
