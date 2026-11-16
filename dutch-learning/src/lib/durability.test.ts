import { beforeEach, describe, expect, it } from "vitest";

import { configureDb } from "./db";
import { backupAge, backupIsStale, formatBytes, probeStorage } from "./durability";

let counter = 0;

beforeEach(() => {
  counter += 1;
  configureDb({ name: `taal-durability-test-${counter}` });
});

describe("the storage probe", () => {
  it("proves a round trip when the phone keeps data", async () => {
    const probe = await probeStorage();

    expect(probe.ok).toBe(true);
    expect(probe.error).toBeNull();
  });

  it("reports a refusal instead of pretending the write worked", async () => {
    const probe = await probeStorage({
      write: () => Promise.reject(new Error("QuotaExceededError: storage is full")),
      read: () => Promise.resolve(undefined),
    });

    expect(probe.ok).toBe(false);
    expect(probe.error).toMatch(/storage is full/);
  });

  it("reports a store that writes one thing and reads back another", async () => {
    const probe = await probeStorage({
      write: () => Promise.resolve(),
      read: () => Promise.resolve("something else" as unknown as never),
    });

    expect(probe.ok).toBe(false);
    expect(probe.error).toMatch(/read something else back/);
  });
});

describe("sizes and ages", () => {
  it("formats the small numbers this app actually makes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(48 * 1024)).toBe("48 KB");
    expect(formatBytes(4.8 * 1024 * 1024)).toBe("4.8 MB");
    expect(formatBytes(null)).toBe("unknown");
    expect(formatBytes(-1)).toBe("unknown");
  });

  it("says how long ago the last backup was", () => {
    const now = Date.UTC(2026, 10, 15);

    expect(backupAge(null, now)).toBe("never");
    expect(backupAge(0, now)).toBe("never");
    expect(backupAge(now - 3_600_000, now)).toBe("today");
    expect(backupAge(now - 86_400_000, now)).toBe("yesterday");
    expect(backupAge(now - 3 * 86_400_000, now)).toBe("3 days ago");
    expect(backupAge(now - 45 * 86_400_000, now)).toBe("a month ago");
    expect(backupAge(now - 70 * 86_400_000, now)).toBe("2 months ago");
  });

  it("only nags about a backup once there is real work to lose", () => {
    const now = Date.UTC(2026, 10, 15);

    expect(backupIsStale(null, now, 40)).toBe(false);
    expect(backupIsStale(null, now, 400)).toBe(true);
    expect(backupIsStale(now - 5 * 86_400_000, now, 400)).toBe(false);
    expect(backupIsStale(now - 40 * 86_400_000, now, 400)).toBe(true);
  });
});
