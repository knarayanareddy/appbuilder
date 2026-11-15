import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { KeysView } from "./KeysView";
import { testSnapshot } from "@/test/fixtures";

function setup(overrides: Partial<Parameters<typeof KeysView>[0]> = {}) {
  const props = {
    snapshot: testSnapshot(),
    onOpenBike: vi.fn(),
    onSaveKey: vi.fn().mockResolvedValue({}),
    onDeleteKey: vi.fn().mockResolvedValue({}),
    onSetKeyOnBike: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
  render(<KeysView {...props} />);
  return props;
}

describe("KeysView", () => {
  it("shows where each key is kept and every bike it opens", () => {
    setup();

    expect(screen.getByText("Blue Abus")).toBeInTheDocument();
    expect(screen.getByText(/kept at hook 3/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gazelle · A-01" })).toBeInTheDocument();
    // Kids BMX is on both keys, so it is listed under each of them.
    expect(screen.getAllByRole("button", { name: "Kids BMX · A-02" })).toHaveLength(2);
  });

  it("answers the other direction: this key fits these bikes", async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole("button", { name: /Gazelle · A-01/i }));
    expect(props.onOpenBike).toHaveBeenCalledWith(props.snapshot.bikes[0].id);
  });

  it("lets a key be attached to or detached from a bike", async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole("button", { name: /Edit key Blue Abus/i }));
    const sheet = screen.getByRole("dialog", { name: "Edit key" });

    // Both fixture bikes are on the blue key already.
    expect(within(sheet).getAllByText("fits")).toHaveLength(2);

    const gazelleRow = within(sheet).getByRole("button", { name: /Gazelle/ });
    await user.click(gazelleRow);

    expect(props.onSetKeyOnBike).toHaveBeenCalledWith(
      props.snapshot.bikes[0].id,
      props.snapshot.keys[0].id,
      false
    );
  });

  it("saves a new key with the place it is kept", async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole("button", { name: /Add key/i }));
    const sheet = screen.getByRole("dialog", { name: /Add a key/i });

    await user.type(within(sheet).getByLabelText(/Key label/i), "Yellow Kryptonite");
    await user.type(within(sheet).getByLabelText(/Where is it kept/i), "car glovebox");
    await user.click(within(sheet).getByRole("button", { name: /^Add key$/i }));

    expect(props.onSaveKey).toHaveBeenCalledWith({
      id: undefined,
      label: "Yellow Kryptonite",
      keptAt: "car glovebox",
      note: "",
    });
  });

  it("requires two taps before deleting a key", async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole("button", { name: /Edit key Red chain/i }));
    const sheet = screen.getByRole("dialog", { name: "Edit key" });

    await user.click(within(sheet).getByRole("button", { name: /^Delete key$/i }));
    expect(props.onDeleteKey).not.toHaveBeenCalled();

    await user.click(within(sheet).getByRole("button", { name: /Confirm delete key/i }));
    expect(props.onDeleteKey).toHaveBeenCalledWith(props.snapshot.keys[1].id);
  });

  it("invites the first key when none exist", () => {
    setup({ snapshot: { ...testSnapshot(), keys: [], bikes: [] } });
    expect(screen.getByText(/No keys yet/i)).toBeInTheDocument();
  });
});
