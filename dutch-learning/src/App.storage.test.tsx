import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import App from "@/App";

/**
 * The old failure mode was a spinner forever: `loadSnapshot()` rejected and nothing
 * caught it. A learner must never be left guessing whether their progress is safe.
 */
describe("when the phone refuses to open storage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("says what happened and offers a retry instead of spinning", async () => {
    vi.spyOn(indexedDB, "open").mockImplementation(() => {
      throw new Error("storage is blocked");
    });

    render(<App />);

    expect(await screen.findByText(/cannot open its storage/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /try again/i })).toBeTruthy();
    expect(screen.queryByText(/opening your sentences/i)).toBeNull();
  });
});
