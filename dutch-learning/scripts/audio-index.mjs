#!/usr/bin/env node
// Builds public/audio/index.json from whatever recordings are in public/audio.
// The app reads that index to decide whether it can play a real Dutch voice offline.
import { readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const folder = join(process.cwd(), "public", "audio");
const files = await readdir(folder).catch(() => []);
const keys = files
  .filter((name) => name.endsWith(".mp3") || name.endsWith(".m4a") || name.endsWith(".aac"))
  .map((name) => name.replace(/\.(mp3|m4a|aac)$/, "").split("__").join("/"))
  .sort();

await writeFile(join(folder, "index.json"), `${JSON.stringify(keys, null, 2)}\n`, "utf8");
console.log(`${keys.length} recording${keys.length === 1 ? "" : "s"} indexed`);
