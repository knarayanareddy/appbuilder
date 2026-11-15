import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { configureDb } from "@/lib/idb";
import { loadSnapshot } from "@/lib/repo";

let counter = 0;

beforeEach(() => {
  counter += 1;
  configureDb({ name: `bike-lot-app-test-${counter}` });
});

describe("App — first run", () => {
  it("offers numbered places or plain words, and defaults to numbered", async () => {
    render(<App />);
    expect(await screen.findByText(/How do you want to record places/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create 100 places/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Skip numbering/i })).toBeEnabled();
  });

  it("creates the places and stores them on the device", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: /Create 100 places/i }));

    expect(await screen.findByText("0 of 100 places taken")).toBeInTheDocument();

    const stored = await loadSnapshot();
    expect(stored.slots).toHaveLength(100);
    expect(stored.settings.lotConfiguredAt).toBeGreaterThan(0);
  });

  it("refuses a layout it cannot understand", async () => {
    const user = userEvent.setup();
    render(<App />);

    const field = await screen.findByLabelText(/Zones and places/i);
    await user.clear(field);
    await user.type(field, "plenty of room");

    expect(await screen.findByText(/Use ZONE=COUNT/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create/i })).toBeDisabled();
  });
});

describe("App — recording bikes", () => {
  async function setUpLot(places = "A=2, B=2") {
    const user = userEvent.setup();
    const view = render(<App />);
    const field = await screen.findByLabelText(/Zones and places/i);
    await user.clear(field);
    await user.type(field, places);
    await user.click(screen.getByRole("button", { name: /Create \d+ places/i }));
    await screen.findByText(/places taken/);
    return { user, view };
  }

  it("adds a bike into the exact place that was tapped", async () => {
    const { user } = await setUpLot();

    await user.click(screen.getByRole("button", { name: "A-02, free" }));
    await user.click(screen.getByRole("button", { name: /Add a bike to A-02/i }));

    await user.type(screen.getByLabelText(/Bike name/i), "Blue Gazelle");
    await user.click(screen.getByRole("button", { name: /Blue Abus|Save bike/i }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(await screen.findByRole("button", { name: "A-02, Blue Gazelle" })).toBeInTheDocument();
    expect(screen.getByText("1 of 4 places taken")).toBeInTheDocument();
  });

  it("remembers everything after the app is closed and reopened", async () => {
    const { user, view } = await setUpLot("A=2");

    await user.click(screen.getByRole("button", { name: /Bikes/i }));
    await user.click(await screen.findByRole("button", { name: /Add the first bike/i }));
    await user.type(screen.getByLabelText(/Bike name/i), "Cargo bike");
    await user.click(screen.getByRole("button", { name: /Save bike/i }));
    await screen.findByText("Cargo bike");

    view.unmount();

    // Fresh mount: no onboarding, data straight from the local database.
    render(<App />);
    expect(await screen.findByText(/1 bike · 0 items · on this phone/i)).toBeInTheDocument();
    expect(screen.queryByText(/Set up your lot/i)).not.toBeInTheDocument();
    expect(screen.getByText("0 of 2 places taken")).toBeInTheDocument();
  });

  it("never nags about backups before there is anything to lose", async () => {
    await setUpLot("A=1");
    expect(screen.queryByText(/Not backed up recently/i)).not.toBeInTheDocument();
  });

  it("nags once there are bikes and no backup", async () => {
    const { user } = await setUpLot("A=1");

    await user.click(screen.getByRole("button", { name: /Bikes/i }));
    await user.click(await screen.findByRole("button", { name: /Add the first bike/i }));
    await user.type(screen.getByLabelText(/Bike name/i), "Cargo bike");
    await user.click(screen.getByRole("button", { name: /Save bike/i }));

    expect(await screen.findByText(/Not backed up recently/i)).toBeInTheDocument();
  });
});

describe("App — bike details", () => {
  it("moves a bike's status without touching its place", async () => {
    const user = userEvent.setup();
    render(<App />);

    const field = await screen.findByLabelText(/Zones and places/i);
    await user.clear(field);
    await user.type(field, "A=1");
    await user.click(screen.getByRole("button", { name: /Create 1 place/i }));

    await user.click(await screen.findByRole("button", { name: "A-01, free" }));
    await user.click(screen.getByRole("button", { name: /Add a bike to A-01/i }));
    await user.type(screen.getByLabelText(/Bike name/i), "Town bike");
    await user.click(screen.getByRole("button", { name: /Save bike/i }));

    // Tapping the cell opens the place card; from there the bike's own page.
    await user.click(await screen.findByRole("button", { name: "A-01, Town bike" }));
    await user.click(await screen.findByRole("button", { name: /Open Town bike/i }));
    await user.click(await screen.findByRole("button", { name: /Out riding/i }));

    await waitFor(async () => {
      const stored = await loadSnapshot();
      expect(stored.bikes[0].status).toBe("out");
      expect(stored.bikes[0].slotId).not.toBeNull();
    });
  });
});

describe("App — places in your own words", () => {
  async function skipNumbering() {
    const user = userEvent.setup();
    const view = render(<App />);
    await user.click(await screen.findByRole("button", { name: /Skip numbering/i }));
    await screen.findByText(/No bikes yet/i);
    return { user, view };
  }

  async function addBike(
    user: ReturnType<typeof userEvent.setup>,
    fields: { name: string; place?: string; notes?: string }
  ) {
    await user.click(screen.getByRole("button", { name: /Add the first bike|Add bike/i }));
    await user.type(screen.getByLabelText(/Bike name/i), fields.name);
    if (fields.place) {
      await user.type(screen.getByLabelText(/Where is it/i), fields.place);
    }
    if (fields.notes) {
      await user.type(screen.getByLabelText(/Notes/i), fields.notes);
    }
    await user.click(screen.getByRole("button", { name: /Save bike/i }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  }

  it("never asks for a numbered layout", async () => {
    await skipNumbering();

    const stored = await loadSnapshot();
    expect(stored.slots).toHaveLength(0);
    expect(stored.settings.lotConfiguredAt).toBeGreaterThan(0);
  });

  it("records a long written place and shows it back verbatim", async () => {
    const { user } = await skipNumbering();

    const place = "Back left corner, behind the blue container — third rack from the wall, top hook.";
    await addBike(user, { name: "Blue Gazelle", place });

    expect(await screen.findByText(place)).toBeInTheDocument();

    const stored = await loadSnapshot();
    expect(stored.bikes[0].place).toBe(place);
    expect(stored.bikes[0].slotId).toBeNull();
  });

  it("finds a bike by name, by tag and by a word in the notes", async () => {
    const { user } = await skipNumbering();

    await addBike(user, {
      name: "Cargo bike",
      place: "By the door",
      notes: "front brake squeals badly",
    });
    await addBike(user, { name: "Kids BMX", place: "Under the stairs", notes: "flat rear tyre" });

    await user.click(screen.getByRole("button", { name: /Bikes/i }));

    const search = screen.getByLabelText(/Search bikes/i);

    await user.type(search, "cargo");
    expect(screen.getByRole("button", { name: /Cargo bike/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Kids BMX/ })).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "squeals");
    expect(screen.getByRole("button", { name: /Cargo bike/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Kids BMX/ })).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "flat tyre");
    expect(screen.getByRole("button", { name: /Kids BMX/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cargo bike/ })).not.toBeInTheDocument();
  });

  it("keeps everything after a reload, with no numbered places involved", async () => {
    const { user, view } = await skipNumbering();
    await addBike(user, { name: "Town bike", place: "Left wall, hook 4" });
    view.unmount();

    render(<App />);
    expect(await screen.findByText(/1 bike · 0 items · on this phone/i)).toBeInTheDocument();
    expect(screen.getByText("Left wall, hook 4")).toBeInTheDocument();
  });
});

describe("App — other items", () => {
  async function startOnItems() {
    const user = userEvent.setup();
    const view = render(<App />);
    await user.click(await screen.findByRole("button", { name: /Skip numbering/i }));
    await user.click(await screen.findByRole("button", { name: "Items" }));
    await screen.findByText(/Nothing but bikes yet/i);
    return { user, view };
  }

  async function addItem(
    user: ReturnType<typeof userEvent.setup>,
    fields: { name: string; place?: string; tag?: string; notes?: string }
  ) {
    await user.click(screen.getByRole("button", { name: /Add the first item|Add item/i }));
    await user.type(screen.getByLabelText(/Item name/i), fields.name);
    if (fields.place) await user.type(screen.getByLabelText(/Where is it/i), fields.place);
    if (fields.tag) await user.type(screen.getByLabelText(/Add a tag/i), `${fields.tag}{Enter}`);
    if (fields.notes) await user.type(screen.getByLabelText(/Notes/i), fields.notes);
    await user.click(screen.getByRole("button", { name: /Save item/i }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  }

  it("records a laptop with a place, a tag and notes", async () => {
    const { user } = await startOnItems();

    await addItem(user, {
      name: "MacBook Pro 14",
      place: "Top shelf of the metal cupboard, grey sleeve",
      tag: "laptop",
      notes: "charger lives in the side pocket",
    });

    expect(screen.getByText("MacBook Pro 14")).toBeInTheDocument();
    expect(screen.getByText(/Top shelf of the metal cupboard/)).toBeInTheDocument();

    const stored = await loadSnapshot();
    expect(stored.items).toHaveLength(1);
    expect(stored.items[0]).toMatchObject({
      name: "MacBook Pro 14",
      place: "Top shelf of the metal cupboard, grey sleeve",
      tags: ["laptop"],
      notes: "charger lives in the side pocket",
    });
  });

  it("finds an item by a word from the notes, and by a tag", async () => {
    const { user } = await startOnItems();

    await addItem(user, { name: "MacBook Pro 14", notes: "charger is in the side pocket", tag: "laptop" });
    await addItem(user, { name: "Spray paint can", tag: "paint" });

    const search = screen.getByLabelText(/Search items/i);

    await user.type(search, "pocket");
    expect(screen.getByText("MacBook Pro 14")).toBeInTheDocument();
    expect(screen.queryByText("Spray paint can")).not.toBeInTheDocument();

    await user.clear(search);
    await user.click(screen.getByRole("button", { name: "#paint" }));
    expect(screen.getByText("Spray paint can")).toBeInTheDocument();
    expect(screen.queryByText("MacBook Pro 14")).not.toBeInTheDocument();
  });

  it("keeps items and bikes in separate lists", async () => {
    const { user } = await startOnItems();
    await addItem(user, { name: "Headphones", place: "Desk drawer" });

    await user.click(screen.getByRole("button", { name: "Bikes" }));
    expect(screen.queryByText("Headphones")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Items" }));
    expect(screen.getByText("Headphones")).toBeInTheDocument();
  });

  it("still has the items after a reload", async () => {
    const { user, view } = await startOnItems();
    await addItem(user, { name: "Headphones", place: "Desk drawer, left" });
    view.unmount();

    render(<App />);
    expect(await screen.findByText(/0 bikes · 1 item · on this phone/i)).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Items" }));
    expect(await screen.findByText("Headphones")).toBeInTheDocument();
  });
});
