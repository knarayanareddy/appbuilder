import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ItemsView } from "./ItemsView";
import { itemsSnapshot, wordsSnapshot } from "@/test/fixtures";
import { pretendComputer, pretendPhone, resetDevice } from "@/test/device";
import type { ItemDraft } from "@/hooks/useInventory";
import type { InventorySnapshot } from "@/types";

afterEach(() => {
  resetDevice();
});

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

  it("shows the pictures an item already has, with a way to remove one", async () => {
    const snapshot = itemsSnapshot();
    snapshot.items[0] = { ...snapshot.items[0], photoIds: ["p1", "p2"] };
    setup({ snapshot });

    await screen.findByText("MacBook Pro 14");
    expect(screen.getByText("2 photos")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Edit MacBook Pro 14/i }));
    const sheet = screen.getByRole("dialog", { name: /Edit MacBook Pro 14/i });
    expect(within(sheet).getAllByRole("button", { name: /Remove photo/i })).toHaveLength(2);
  });

  it("attaches a photo taken with the camera on a phone", async () => {
    pretendPhone();
    const user = userEvent.setup();
    const props = setup({ snapshot: { ...wordsSnapshot(), items: [] } });

    await user.click(screen.getByRole("button", { name: /Add the first item/i }));
    await user.type(screen.getByLabelText(/Item name/i), "Headphones");

    // Both routes are real on a phone: one opens the camera, one the gallery.
    expect(screen.getByRole("button", { name: /Take photo/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /From gallery/i })).toBeInTheDocument();

    const camera = screen.getByLabelText(/Item photo camera input/i);
    expect(camera).toHaveAttribute("capture", "environment");

    const file = new File(["fake bytes"], "headphones.jpg", { type: "image/jpeg" });
    fireEvent.change(camera, { target: { files: [file] } });

    await user.click(screen.getByRole("button", { name: /Save item/i }));

    await waitFor(() => expect(props.onSaveItem).toHaveBeenCalled());
    const draft = props.onSaveItem.mock.calls[0][0] as ItemDraft;
    expect(draft.newPhotos).toHaveLength(1);
    expect(draft.photoIds).toEqual([]);
  });

  it("offers one picker on a computer, where a capture input would open the same dialog", async () => {
    pretendComputer();
    const user = userEvent.setup();
    const props = setup({ snapshot: { ...wordsSnapshot(), items: [] } });

    await user.click(screen.getByRole("button", { name: /Add the first item/i }));
    await user.type(screen.getByLabelText(/Item name/i), "Headphones");

    expect(screen.getByRole("button", { name: /Add photo/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Take photo/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /From gallery/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Item photo camera input/i)).not.toBeInTheDocument();
    expect(screen.getByText(/works on the phone/i)).toBeInTheDocument();

    const file = new File(["fake bytes"], "headphones.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText(/Item photo gallery input/i), { target: { files: [file] } });

    await user.click(screen.getByRole("button", { name: /Save item/i }));

    await waitFor(() => expect(props.onSaveItem).toHaveBeenCalled());
    const draft = props.onSaveItem.mock.calls[0][0] as ItemDraft;
    expect(draft.newPhotos).toHaveLength(1);
  });

  it("drops a removed photo from the saved list", async () => {
    const user = userEvent.setup();
    const snapshot = itemsSnapshot();
    snapshot.items[0] = { ...snapshot.items[0], photoIds: ["p1", "p2"] };
    const props = setup({ snapshot });

    await user.click(screen.getByRole("button", { name: /Edit MacBook Pro 14/i }));
    const sheet = screen.getByRole("dialog", { name: /Edit MacBook Pro 14/i });

    await user.click(within(sheet).getAllByRole("button", { name: /Remove photo/i })[0]);
    await user.click(within(sheet).getByRole("button", { name: /Save changes/i }));

    await waitFor(() => expect(props.onSaveItem).toHaveBeenCalled());
    expect((props.onSaveItem.mock.calls[0][0] as ItemDraft).photoIds).toEqual(["p2"]);
  });

  it("says when the photo limit is reached", async () => {
    const user = userEvent.setup();
    const snapshot = itemsSnapshot();
    snapshot.items[0] = { ...snapshot.items[0], photoIds: ["a", "b", "c", "d", "e", "f"] };
    setup({ snapshot });

    await user.click(screen.getByRole("button", { name: /Edit MacBook Pro 14/i }));
    const sheet = screen.getByRole("dialog", { name: /Edit MacBook Pro 14/i });

    expect(within(sheet).getByText(/maximum of 6 photos/i)).toBeInTheDocument();
  });

  it("invites the first item when there are none", () => {
    setup({ snapshot: { ...wordsSnapshot(), items: [] } });
    expect(screen.getByText(/Nothing but bikes yet/i)).toBeInTheDocument();
  });
});
