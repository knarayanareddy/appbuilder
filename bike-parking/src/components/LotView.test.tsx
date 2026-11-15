import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LotView } from "./LotView";
import { testSnapshot } from "@/test/fixtures";

describe("LotView", () => {
  it("summarises how full the lot is", () => {
    const snapshot = testSnapshot();
    render(<LotView snapshot={snapshot} onOpenBike={vi.fn()} onAddBikeAtSlot={vi.fn()} />);

    expect(screen.getByText("2 of 3 places taken")).toBeInTheDocument();
    expect(screen.getByText("1 free")).toBeInTheDocument();
    expect(screen.getByText(/2 bikes on file/)).toBeInTheDocument();
  });

  it("labels every place with the bike standing in it, or as free", () => {
    const snapshot = testSnapshot();
    render(<LotView snapshot={snapshot} onOpenBike={vi.fn()} onAddBikeAtSlot={vi.fn()} />);

    expect(screen.getByRole("button", { name: "A-01, Gazelle" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "A-02, Kids BMX" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "A-03, free" })).toBeInTheDocument();
  });

  it("opens the bike's details, key included, when a taken place is tapped", async () => {
    const user = userEvent.setup();
    const snapshot = testSnapshot();
    const onOpenBike = vi.fn();
    render(<LotView snapshot={snapshot} onOpenBike={onOpenBike} onAddBikeAtSlot={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "A-01, Gazelle" }));

    const sheet = screen.getByRole("dialog", { name: "A-01" });
    expect(within(sheet).getByText("Gazelle")).toBeInTheDocument();
    expect(within(sheet).getByText("Blue Abus")).toBeInTheDocument();
    expect(within(sheet).getByText(/kept at hook 3/)).toBeInTheDocument();
    expect(within(sheet).getByText("road")).toBeInTheDocument();

    await user.click(within(sheet).getByRole("button", { name: /Open Gazelle/i }));
    expect(onOpenBike).toHaveBeenCalledWith(snapshot.bikes[0].id);
  });

  it("offers to put a bike into a free place", async () => {
    const user = userEvent.setup();
    const snapshot = testSnapshot();
    const onAddBikeAtSlot = vi.fn();
    render(<LotView snapshot={snapshot} onOpenBike={vi.fn()} onAddBikeAtSlot={onAddBikeAtSlot} />);

    await user.click(screen.getByRole("button", { name: "A-03, free" }));

    const sheet = screen.getByRole("dialog", { name: "A-03" });
    expect(within(sheet).getByText("This place is empty.")).toBeInTheDocument();

    await user.click(within(sheet).getByRole("button", { name: /Add a bike to A-03/i }));
    expect(onAddBikeAtSlot).toHaveBeenCalledWith(snapshot.slots[2].id);
  });

  it("can show only the free places", async () => {
    const user = userEvent.setup();
    const snapshot = testSnapshot();
    render(<LotView snapshot={snapshot} onOpenBike={vi.fn()} onAddBikeAtSlot={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Free only" }));

    expect(screen.getByRole("button", { name: "A-03, free" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "A-01, Gazelle" })).not.toBeInTheDocument();
  });

  it("filters by zone", async () => {
    const user = userEvent.setup();
    const snapshot = testSnapshot();
    render(<LotView snapshot={snapshot} onOpenBike={vi.fn()} onAddBikeAtSlot={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "A" }));
    expect(screen.getByRole("button", { name: "A-01, Gazelle" })).toBeInTheDocument();
  });

  it("explains itself when the lot has no places yet", () => {
    const snapshot = { ...testSnapshot(), slots: [], bikes: [], keys: [] };
    render(<LotView snapshot={snapshot} onOpenBike={vi.fn()} onAddBikeAtSlot={vi.fn()} />);

    expect(screen.getByText(/No places defined yet/i)).toBeInTheDocument();
  });
});
