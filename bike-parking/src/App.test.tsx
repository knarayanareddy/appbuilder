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
  it("asks for the lot layout before anything else", async () => {
    render(<App />);
    expect(await screen.findByText(/Set up your lot/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create 100 places/i })).toBeEnabled();
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
    expect(await screen.findByText(/1 bike · all on this phone/i)).toBeInTheDocument();
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
