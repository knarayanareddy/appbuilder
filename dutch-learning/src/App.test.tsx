import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { itemKey } from "./lib/module";
import { configureDb } from "./lib/db";
import { loadSnapshot, saveCards } from "./lib/repo";
import type { CardState } from "./types";

const KEY = itemKey("nl-basis", "kennismaking", "s001");
let counter = 0;

beforeEach(() => {
  counter += 1;
  configureDb({ name: `taal-app-test-${counter}` });
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
