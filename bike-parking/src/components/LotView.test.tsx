import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LotView } from "./LotView";
import { testSnapshot, wordsSnapshot } from "@/test/fixtures";
import type { InventorySnapshot } from "@/types";

function renderLot(snapshot: InventorySnapshot) {
  const props = {
    snapshot,
    onOpenBike: vi.fn(),
    onAddBikeAtSlot: vi.fn(),
    onAddBike: vi.fn(),
  };
  render(<LotView {...props} />);
  return props;
}

describe("LotView — numbered places", () => {
  it("summarises how full the lot is", () => {
    renderLot(testSnapshot());
    expect(screen.getByText("2 of 3 places taken")).toBeInTheDocument();
    expect(screen.getByText("1 free")).toBeInTheDocument();
  });

  it("labels every place with the bike standing in it, or as free", () => {
    renderLot(testSnapshot());
    expect(screen.getByRole("button", { name: "A-01, Gazelle" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "A-02, Kids BMX" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "A-03, free" })).toBeInTheDocument();
  });

  it("shows the bike's written description, key included, when a taken place is tapped", async () => {
    const user = userEvent.setup();
    const snapshot = testSnapshot();
    const props = renderLot(snapshot);

    await user.click(screen.getByRole("button", { name: "A-01, Gazelle" }));

    const sheet = screen.getByRole("dialog", { name: "A-01" });
    expect(within(sheet).getByText("Gazelle")).toBeInTheDocument();
    expect(within(sheet).getByText(/behind the blue container/i)).toBeInTheDocument();
    expect(within(sheet).getByText("Blue Abus")).toBeInTheDocument();
    expect(within(sheet).getByText(/kept at hook 3/)).toBeInTheDocument();

    await user.click(within(sheet).getByRole("button", { name: /Open Gazelle/i }));
    expect(props.onOpenBike).toHaveBeenCalledWith(snapshot.bikes[0].id);
  });

  it("offers to put a bike into a free place", async () => {
    const user = userEvent.setup();
    const snapshot = testSnapshot();
    const props = renderLot(snapshot);

    await user.click(screen.getByRole("button", { name: "A-03, free" }));
    const sheet = screen.getByRole("dialog", { name: "A-03" });
    expect(within(sheet).getByText("This place is empty.")).toBeInTheDocument();

    await user.click(within(sheet).getByRole("button", { name: /Add a bike to A-03/i }));
    expect(props.onAddBikeAtSlot).toHaveBeenCalledWith(snapshot.slots[2].id);
  });

  it("can show only the free places", async () => {
    const user = userEvent.setup();
    renderLot(testSnapshot());

    await user.click(screen.getByRole("button", { name: "Free only" }));

    expect(screen.getByRole("button", { name: "A-03, free" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "A-01, Gazelle" })).not.toBeInTheDocument();
  });

  it("filters the grid by search text", async () => {
    const user = userEvent.setup();
    renderLot(testSnapshot());

    await user.type(screen.getByLabelText(/Search bikes/i), "kids");

    expect(screen.getByRole("button", { name: "A-02, Kids BMX" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "A-01, Gazelle" })).not.toBeInTheDocument();
  });

  it("lets a bike be added without any place", async () => {
    const user = userEvent.setup();
    const props = renderLot(testSnapshot());

    await user.click(screen.getByRole("button", { name: /Add bike without a place/i }));
    expect(props.onAddBike).toHaveBeenCalled();
  });
});

describe("LotView — places written in words", () => {
  it("groups bikes under the description you wrote, verbatim and unabridged", () => {
    const snapshot = wordsSnapshot();
    renderLot(snapshot);

    expect(screen.getByText(/Back left corner, behind the blue container/)).toBeInTheDocument();
    expect(screen.getByText("By the door, under the stairs")).toBeInTheDocument();
    // the bike with no description is grouped honestly
    expect(screen.getByText("Not placed yet")).toBeInTheDocument();
  });

  it("says how many bikes still have no place", () => {
    renderLot(wordsSnapshot());
    expect(screen.getByText(/3 bikes · 1 still without a place/)).toBeInTheDocument();
  });

  it("opens a bike when its row is tapped", async () => {
    const user = userEvent.setup();
    const snapshot = wordsSnapshot();
    const props = renderLot(snapshot);

    await user.click(screen.getByRole("button", { name: /Gazelle/ }));
    expect(props.onOpenBike).toHaveBeenCalledWith(snapshot.bikes[0].id);
  });

  it("finds a bike by name", async () => {
    const user = userEvent.setup();
    renderLot(wordsSnapshot());

    await user.type(screen.getByLabelText(/Search bikes/i), "cargo");

    expect(screen.getByRole("button", { name: /Cargo bike/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Gazelle/ })).not.toBeInTheDocument();
  });

  it("finds a bike by a tag", async () => {
    const user = userEvent.setup();
    renderLot(wordsSnapshot());

    await user.type(screen.getByLabelText(/Search bikes/i), "kids");

    expect(screen.getByRole("button", { name: /Kids BMX/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Gazelle/ })).not.toBeInTheDocument();
  });

  it("finds a bike by a word from the notes", async () => {
    const user = userEvent.setup();
    renderLot(wordsSnapshot());

    await user.type(screen.getByLabelText(/Search bikes/i), "tyre");

    expect(screen.getByRole("button", { name: /Cargo bike/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Kids BMX/ })).not.toBeInTheDocument();
  });

  it("finds a bike by a word from its place description", async () => {
    const user = userEvent.setup();
    renderLot(wordsSnapshot());

    await user.type(screen.getByLabelText(/Search bikes/i), "container");

    expect(screen.getByRole("button", { name: /Gazelle/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cargo bike/ })).not.toBeInTheDocument();
  });

  it("explains itself when nothing matches", async () => {
    const user = userEvent.setup();
    renderLot(wordsSnapshot());

    await user.type(screen.getByLabelText(/Search bikes/i), "spaceship");

    expect(screen.getByText(/Nothing matches/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Clear the search/i }));
    expect(screen.getByRole("button", { name: /Gazelle/ })).toBeInTheDocument();
  });

  it("invites the first bike when there are none", () => {
    renderLot({ ...wordsSnapshot(), bikes: [], keys: [] });
    expect(screen.getByText(/No bikes yet/i)).toBeInTheDocument();
  });
});
