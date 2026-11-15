import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { SENTENCES } from "./lib/content";
import { configureDb } from "./lib/db";
import { loadSnapshot, saveCards } from "./lib/repo";
import type { CardState } from "./types";

let counter = 0;

beforeEach(() => {
  counter += 1;
  configureDb({ name: `taal-app-test-${counter}` });
});

describe("App", () => {
  it("opens on today with the day's cards counted", async () => {
    render(<App />);

    expect(await screen.findByRole("button", { name: /Start · 6 cards/ })).toBeEnabled();
    expect(screen.getByText("new today")).toBeInTheDocument();
  });

  it("runs a first session and records the new sentence", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: /Start · 6 cards/ }));

    // A sentence nobody has seen starts as reading, not as a test.
    expect(await screen.findByText("Read and listen")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show meaning" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByText("2/6")).toBeInTheDocument();

    await waitFor(async () => {
      const snapshot = await loadSnapshot();
      expect(snapshot.cards).toHaveLength(1);
      expect(snapshot.cards[0].stage).toBe(1);
      expect(snapshot.attempts[0].kind).toBe("study");
    });
  });

  it("marks a typed gap-fill and moves the card forward", async () => {
    const seeded: CardState = {
      sentenceId: SENTENCES[0].id,
      stage: 1,
      stability: 3,
      difficulty: 5,
      due: Date.now() - 1000,
      reps: 2,
      lapses: 0,
      lastReview: Date.now() - 86_400_000,
    };
    await saveCards([seeded]);

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: /Start ·/ }));
    expect(await screen.findByText("Fill the gap")).toBeInTheDocument();

    // SENTENCES[0] is "Ik heet Anna." — the gap is the longest word.
    await user.type(screen.getByLabelText("Answer"), "heet");
    await user.click(screen.getByRole("button", { name: "Check" }));

    expect(await screen.findByText("Goed zo.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(async () => {
      const snapshot = await loadSnapshot();
      const updated = snapshot.cards.find((card) => card.sentenceId === SENTENCES[0].id)!;
      expect(updated.stage).toBe(2);
      expect(snapshot.attempts.some((attempt) => attempt.kind === "cloze" && attempt.correct)).toBe(true);
    });
  });

  it("lets a typo be overridden without pretending it was perfect", async () => {
    await saveCards([
      {
        sentenceId: SENTENCES[0].id,
        stage: 1,
        stability: 3,
        difficulty: 5,
        due: Date.now() - 1000,
        reps: 2,
        lapses: 0,
        lastReview: Date.now() - 86_400_000,
      },
    ]);

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: /Start ·/ }));
    await user.type(await screen.findByLabelText("Answer"), "heett");
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(await screen.findByText(/Almost — that counts\./)).toBeInTheDocument();
  });

  it("shows progress and settings tabs", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Progress" }));
    expect(await screen.findByText("This week")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Settings" }));
    expect(await screen.findByText("New sentences per day")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "More new sentences" }));
    await waitFor(async () => expect((await loadSnapshot()).settings.dailyNew).toBe(7));
  });
});
