import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ItemsView } from "./ItemsView";
import { itemsSnapshot, wordsSnapshot } from "@/test/fixtures";
import type { ItemDraft } from "@/hooks/useInventory";
import type { InventorySnapshot } from "@/types";

function setup(overrides: { snapshot?: InventorySnapshot } = {}) {
  const onSaveItem = vi.fn().mockResolvedValue({});
  const onDeleteItem = vi.fn().mockResolvedValue({});
  const snapshot = overrides.snapshot ?? itemsSnapshot();
  render(<ItemsView snapshot={snapshot} onSaveItem={onSaveItem} onDeleteItem={onDeleteItem} />);
  return { snapshot, onSaveItem, onDeleteItem };
}

describe("ItemsView", () => {
  it("lists every item with the place it is stored", () => {
    setup();

    expect(screen.getByText("MacBook Pro 14")).toBeInTheDocument();
    expect(screen.getByText(/Top shelf of the metal cupboard/)).toBeInTheDocument();
    expect(screen.getByText("Spray paint can (black)")).toBeInTheDocument();
    // an item with no place says so rather than showing nothing
    expect(screen.getByText("Place not recorded")).toBeInTheDocument();
  });

  it("finds an item by name", async () => {
    const user = userEvent.setup();
    setup();

    await user.type(screen.getByLabelText(/Search items/i), "macbook");

    expect(screen.getByText("MacBook Pro 14")).toBeInTheDocument();
    expect(screen.queryByText("Spray paint can (black)")).not.toBeInTheDocument();
  });

  it("finds an item by a word in the notes", async () => {
    const user = userEvent.setup();
    setup();

    await user.type(screen.getByLabelText(/Search items/i), "side pocket");

    expect(screen.getByText("MacBook Pro 14")).toBeInTheDocument();
    expect(screen.queryByText("Headphones")).not.toBeInTheDocument();
  });

  it("finds an item by a word from its place description", async () => {
    const user = userEvent.setup();
    setup();

    await user.type(screen.getByLabelText(/Search items/i), "crate");

    expect(screen.getByText("Spray paint can (black)")).toBeInTheDocument();
    expect(screen.queryByText("MacBook Pro 14")).not.toBeInTheDocument();
  });

  it("filters by tag", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "#paint" }));

    expect(screen.getByText("Spray paint can (black)")).toBeInTheDocument();
    expect(screen.queryByText("MacBook Pro 14")).not.toBeInTheDocument();
  });

  it("says plainly when nothing matches", async () => {
    const user = userEvent.setup();
    setup();

    await user.type(screen.getByLabelText(/Search items/i), "spaceship");
    expect(screen.getByText(/Nothing matches/i)).toBeInTheDocument();
  });

  it("adds an item with a name, a long place, tags and notes", async () => {
    const user = userEvent.setup();
    const props = setup({ snapshot: { ...wordsSnapshot(), items: [] } });

    await user.click(screen.getByRole("button", { name: /Add the first item/i }));

    const place = "Bottom drawer of the desk, under the spare cables — wrapped in the grey cloth.";
    await user.type(screen.getByLabelText(/Item name/i), "MacBook charger");
    await user.type(screen.getByLabelText(/Where is it/i), place);
    await user.type(screen.getByLabelText(/Add a tag/i), "charger{Enter}");
    await user.type(screen.getByLabelText(/Notes/i), "the 96W one");
    await user.click(screen.getByRole("button", { name: /Save item/i }));

    await waitFor(() => expect(props.onSaveItem).toHaveBeenCalledTimes(1));
    expect(props.onSaveItem.mock.calls[0][0]).toMatchObject({
      name: "MacBook charger",
      place,
      tags: ["charger"],
      notes: "the 96W one",
    } satisfies Partial<ItemDraft>);
  });

  it("edits an existing item", async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole("button", { name: "Edit Headphones" }));
    const sheet = screen.getByRole("dialog", { name: "Edit Headphones" });

    const name = within(sheet).getByLabelText(/Item name/i);
    await user.clear(name);
    await user.type(name, "Noise-cancelling headphones");
    await user.click(within(sheet).getByRole("button", { name: /Save changes/i }));

    await waitFor(() => expect(props.onSaveItem).toHaveBeenCalled());
    expect(props.onSaveItem.mock.calls[0][0]).toMatchObject({ name: "Noise-cancelling headphones" });
  });

  it("needs two taps to delete an item", async () => {
    const user = userEvent.setup();
    const snapshot = itemsSnapshot();
    const props = setup({ snapshot });

    await user.click(screen.getByRole("button", { name: "Edit Headphones" }));
    const sheet = screen.getByRole("dialog", { name: "Edit Headphones" });

    await user.click(within(sheet).getByRole("button", { name: /^Delete item$/i }));
    expect(props.onDeleteItem).not.toHaveBeenCalled();

    await user.click(within(sheet).getByRole("button", { name: /Confirm delete item/i }));
    expect(props.onDeleteItem).toHaveBeenCalledWith(snapshot.items[2].id);
  });

  it("invites the first item when there are none", () => {
    setup({ snapshot: { ...wordsSnapshot(), items: [] } });
    expect(screen.getByText(/Nothing but bikes yet/i)).toBeInTheDocument();
  });
});
