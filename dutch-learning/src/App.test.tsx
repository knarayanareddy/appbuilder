import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { itemKey } from "./lib/module";
import { configureDb } from "./lib/db";
import { loadSnapshot, saveCards, saveSettings } from "./lib/repo";
import { DEFAULT_SETTINGS, type CardState } from "./types";

const KEY = itemKey("nl-basis", "kennismaking", "s001");
let counter = 0;

beforeEach(async () => {
  counter += 1;
  configureDb({ name: `taal-app-test-${counter}` });
  // Most tests start from an app that has already been introduced.
  await saveSettings({ ...DEFAULT_SETTINGS, onboarded: true });
});

function card(overrides: Partial<CardState> = {}): CardState {
  return {
    itemId: KEY,
    stage: 1,
    stability: 3,
    difficulty: 5,
    due: Date.now() - 1000,
    reps: 2,
    lapses: 0,
    lastReview: Date.now() - 86_400_000,
    ...overrides,
  };
}

describe("App", () => {
  it("opens on today's plan with every way in", async () => {
    render(<App />);

    expect(await screen.findByRole("button", { name: /Continue ·/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Practise more" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quiz me" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mistakes" })).toBeInTheDocument();
    expect(screen.getByText("Kennismaking")).toBeInTheDocument();
  });

  it("runs a first session, teaches, then records the sentence", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: /Continue ·/ }));

    expect(await screen.findByText("Read and listen")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show meaning" }));
    expect(await screen.findByText("My name is Anna.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByText("2/10")).toBeInTheDocument();

    await waitFor(async () => {
      const snapshot = await loadSnapshot();
      expect(snapshot.cards).toHaveLength(1);
      expect(snapshot.cards[0].itemId).toBe(KEY);
      expect(snapshot.cards[0].stage).toBe(1);
      expect(snapshot.attempts[0].kind).toBe("study");
    });
  });

  it("marks a typed gap-fill and moves the card up a rung", async () => {
    await saveCards([card()]);
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: /Continue ·/ }));
    expect(await screen.findByText("Fill the gap")).toBeInTheDocument();

    // "Ik heet Anna." — the gap is the longest word.
    await user.type(screen.getByLabelText("Answer"), "heet");
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(await screen.findByText("Goed zo.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(async () => {
      const snapshot = await loadSnapshot();
      const updated = snapshot.cards.find((entry) => entry.itemId === KEY)!;
      expect(updated.stage).toBe(2);
    });
  });

  it("accepts a typo without pretending it was perfect", async () => {
    await saveCards([card()]);
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: /Continue ·/ }));
    await user.type(await screen.findByLabelText("Answer"), "heett");
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(await screen.findByText(/Almost — that counts\./)).toBeInTheDocument();
  });

  it("offers a multiple choice card at the choosing rung", async () => {
    await saveCards([card({ stage: 2 })]);
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: /Continue ·/ }));
    expect(await screen.findByText("What does it mean?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "My name is Anna." }));
    expect(await screen.findByText("Goed zo.")).toBeInTheDocument();
  });

  it("keeps the daily pace editable and shows the built-in module", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Settings" }));
    expect(await screen.findByText("New sentences in the daily session")).toBeInTheDocument();
    expect(screen.getByText("Nederlands voor Delft")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "More new sentences" }));
    await waitFor(async () => expect((await loadSnapshot()).settings.dailyNew).toBe(11));
  });

  it("lists every sentence in Words", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Words" }));
    expect(await screen.findByText("Ik heet Anna.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Search sentences"), "huisarts");
    await waitFor(() => expect(screen.getByText("Ik wil graag een afspraak met de huisarts.")).toBeInTheDocument());
  });
});

describe("first run", () => {
  it("welcomes a new learner, asks how much Dutch they have, and starts", async () => {
    counter += 1;
    configureDb({ name: `taal-onboarding-${counter}` });

    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole("button", { name: "Get started" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Get started" }));

    await user.click(screen.getByRole("button", { name: /Ik red me/ }));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // The third screen checks the voice, then offers the placement check or a plain start.
    await user.click(await screen.findByRole("button", { name: "Start from the beginning" }));

    await waitFor(async () => {
      const snapshot = await loadSnapshot();
      expect(snapshot.settings.onboarded).toBe(true);
      expect(snapshot.settings.dailyNew).toBe(12);
    });
    expect(await screen.findByRole("button", { name: /Continue ·/ })).toBeInTheDocument();
  });

  it("can skip the intro from the first screen", async () => {
    counter += 1;
    configureDb({ name: `taal-onboarding-skip-${counter}` });

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Skip" }));
    await waitFor(async () => expect((await loadSnapshot()).settings.onboarded).toBe(true));
  });
});

describe("look and feel", () => {
  it("switches theme and remembers it", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Settings" }));
    await user.click(await screen.findByRole("button", { name: "Light" }));

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("light"));
    expect((await loadSnapshot()).settings.theme).toBe("light");

    await user.click(screen.getByRole("button", { name: "Dark" }));
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
  });

  it("offers a wrong voice rather than silence, and remembers the choice", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Settings" }));

    // jsdom has no Dutch voice, so the card lands on the "missing" state.
    const fallback = await screen.findByRole("switch", { name: "English voice as a last resort" });
    expect(fallback).toHaveAttribute("aria-checked", "true");
    await user.click(fallback);
    await waitFor(async () => expect((await loadSnapshot()).settings.approximateVoice).toBe(false));
  });

  it("turns sound and haptics off and on", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Settings" }));

    // The voice card states coverage instead of implying every sentence is recorded.
    expect(await screen.findByText(/Recorded narration/)).toBeInTheDocument();

    const sound = await screen.findByRole("switch", { name: "Sound" });
    expect(sound).toHaveAttribute("aria-checked", "true");
    await user.click(sound);
    await waitFor(async () => expect((await loadSnapshot()).settings.sound).toBe(false));

    const haptics = screen.getByRole("switch", { name: "Haptics" });
    await user.click(haptics);
    await waitFor(async () => expect((await loadSnapshot()).settings.haptics).toBe(false));
  });
});

describe("flashcards", () => {
  it("flips through a deck and grades itself honestly", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Flashcards" }));
    expect(await screen.findByText("Ik heet Anna.")).toBeInTheDocument();
    // The English stays hidden until it is asked for: this is recall, not reading.
    expect(screen.queryByText("My name is Anna.")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show answer" }));
    expect(await screen.findByText("My name is Anna.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Good" }));

    await waitFor(async () => {
      const snapshot = await loadSnapshot();
      expect(snapshot.attempts).toHaveLength(1);
      expect(snapshot.attempts[0]).toMatchObject({ correct: true, kind: "study" });
      expect(snapshot.cards).toHaveLength(1);
    });

    // The deck moved on by itself; no second tap to advance.
    expect(await screen.findByText("Hoe gaat het met je?")).toBeInTheDocument();
  });
});
