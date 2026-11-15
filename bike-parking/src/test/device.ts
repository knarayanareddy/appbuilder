/**
 * jsdom pretends to be a desktop browser, which is exactly what the app sees on a
 * laptop. These helpers let a test play the other part, so both branches of
 * `canUseCameraCapture()` get exercised.
 */
const PHONE_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36";
const COMPUTER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
const IPAD_UA = COMPUTER_UA;

function setDevice(userAgent: string, maxTouchPoints: number): void {
  Object.defineProperty(navigator, "userAgent", { configurable: true, value: userAgent });
  Object.defineProperty(navigator, "maxTouchPoints", { configurable: true, value: maxTouchPoints });
}

/** An Android phone: `capture` is honoured, so both camera and gallery are offered. */
export function pretendPhone(): void {
  setDevice(PHONE_UA, 5);
}

/** A MacBook: `capture` is ignored, so only the file picker is offered. */
export function pretendComputer(): void {
  setDevice(COMPUTER_UA, 0);
}

/** iPadOS reports a Macintosh user agent, but a real Mac has no touch points. */
export function pretendIpad(): void {
  setDevice(IPAD_UA, 5);
}

export function resetDevice(): void {
  delete (navigator as { userAgent?: string }).userAgent;
  delete (navigator as { maxTouchPoints?: number }).maxTouchPoints;
}
