import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BikeForm } from "./BikeForm";
import { testSnapshot } from "@/test/fixtures";
import type { BikeDraft } from "@/hooks/useInventory";

describe("BikeForm", () => {
  it("will not save a bike without a name", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<BikeForm snapshot={testSnapshot()} onClose={vi.fn()} onSave={onSave} />);

    const save = screen.getByRole("button", { name: /Save bike/i });
    expect(save).toBeDisabled();

    await user.type(screen.getByLabelText(/Bike name/i), "   ");
    expect(save).toBeDisabled();
  });

  it("saves a long written place without truncating it", async () => {
    const user = userEvent.setup();
    const snapshot = testSnapshot();
    const onSave = vi.fn().mockResolvedValue({});
    render(<BikeForm snapshot={snapshot} onClose={vi.fn()} onSave={onSave} />);

    const place = "Back left corner, behind the blue container — third rack from the wall, top hook.";
    await user.type(screen.getByLabelText(/Bike name/i), "Blue Gazelle");
    await user.type(screen.getByLabelText(/Where is it/i), place);
    await user.click(screen.getByRole("button", { name: /Save bike/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect((onSave.mock.calls[0][0] as BikeDraft).place).toBe(place);
  });

  it("works with no numbered places at all", () => {
    const snapshot = { ...testSnapshot(), slots: [] };
    render(<BikeForm snapshot={snapshot} onClose={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByLabelText(/Where is it/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Numbered place/i)).not.toBeInTheDocument();
  });

  it("saves the name, a free place, a key and tags", async () => {
    const user = userEvent.setup();
    const snapshot = testSnapshot();
    const onSave = vi.fn().mockResolvedValue({});
    const onClose = vi.fn();
    render(<BikeForm snapshot={snapshot} onClose={onClose} onSave={onSave} />);

    await user.type(screen.getByLabelText(/Bike name/i), "Blue Gazelle");

    // A-03 is the only free place in the fixture.
    await user.selectOptions(screen.getByLabelText(/Numbered place/i), snapshot.slots[2].id);

    await user.click(screen.getByRole("button", { name: /Blue Abus/i }));
    await user.click(screen.getByRole("button", { name: /Out riding/i }));

    await user.type(screen.getByLabelText(/Add a tag/i), "holiday bike{Enter}");

    await user.click(screen.getByRole("button", { name: /Save bike/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const draft = onSave.mock.calls[0][0] as BikeDraft;
    expect(draft).toMatchObject({
      name: "Blue Gazelle",
      place: "",
      slotId: snapshot.slots[2].id,
      keyIds: [snapshot.keys[0].id],
      tags: ["holiday bike"],
      status: "out",
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("only offers places that are actually free", () => {
    const snapshot = testSnapshot();
    render(<BikeForm snapshot={snapshot} onClose={vi.fn()} onSave={vi.fn()} />);

    const select = screen.getByLabelText(/Numbered place/i) as HTMLSelectElement;
    const labels = Array.from(select.options).map((option) => option.textContent);

    expect(labels).toContain("A-03 · zone A");
    expect(labels).not.toContain("A-01 · zone A");
    expect(labels[0]).toMatch(/Not assigned/i);
  });

  it("keeps the bike's own place selectable while editing", () => {
    const snapshot = testSnapshot();
    const bike = snapshot.bikes[0]; // Gazelle, in A-01
    render(<BikeForm snapshot={snapshot} bike={bike} onClose={vi.fn()} onSave={vi.fn()} />);

    const select = screen.getByLabelText(/Numbered place/i) as HTMLSelectElement;
    const labels = Array.from(select.options).map((option) => option.textContent);

    expect(labels).toContain("A-01 · zone A");
    expect(labels).toContain("A-03 · zone A");
    expect(select.value).toBe(snapshot.slots[0].id);
  });

  it("starts from the place that was tapped in the lot grid", () => {
    const snapshot = testSnapshot();
    render(
      <BikeForm
        snapshot={snapshot}
        presetSlotId={snapshot.slots[2].id}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    const select = screen.getByLabelText(/Numbered place/i) as HTMLSelectElement;
    expect(select.value).toBe(snapshot.slots[2].id);
  });

  it("can create a new key inline and tick it straight away", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue({});
    const onCreateKey = vi.fn().mockResolvedValue("new-key-id");
    render(
      <BikeForm snapshot={testSnapshot()} onClose={vi.fn()} onSave={onSave} onCreateKey={onCreateKey} />
    );

    await user.type(screen.getByLabelText(/Bike name/i), "Cargo bike");
    await user.type(screen.getByLabelText(/New key label/i), "Spare padlock");
    await user.click(screen.getByRole("button", { name: /Create key/i }));

    expect(onCreateKey).toHaveBeenCalledWith("Spare padlock");

    await user.click(screen.getByRole("button", { name: /Save bike/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect((onSave.mock.calls[0][0] as BikeDraft).keyIds).toEqual(["new-key-id"]);
  });
});
