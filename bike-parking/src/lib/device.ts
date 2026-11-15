/**
 * A `capture` attribute on a file input is honoured only on phones and tablets.
 * Chrome/Firefox/Safari on a laptop or desktop **ignore it**, so `<input capture>`
 * and `<input>` open the very same file dialog — two buttons that do one thing.
 *
 * That is exactly what happens on a MacBook, and it is not a bug we can fix from
 * the page: there is no browser API that opens a webcam from a file input. So the
 * app asks who it is running on, and offers "take a photo" only where taking a
 * photo is possible.
 */
const MOBILE_USER_AGENT = /Android|iPhone|iPad|iPod|Mobile|Silk|Kindle/i;

export function canUseCameraCapture(): boolean {
  if (typeof navigator === "undefined") return false;

  if (MOBILE_USER_AGENT.test(navigator.userAgent ?? "")) return true;

  // iPadOS 13+ reports a Macintosh user agent; a real Mac has no touch points,
  // while an iPad reports several.
  return (navigator.maxTouchPoints ?? 0) > 1;
}
