#!/usr/bin/env node
/**
 * Put a build artifact in a Google Drive folder — no rclone, no SDK, just fetch.
 *
 * Why this exists: GitHub's artifact storage is not reachable from every
 * environment (the Arena sandbox, for one), so the APK could not simply be
 * handed to Drive afterwards. Doing it inside the build solves that: the file is
 * local to the runner, and this script sends it straight on.
 *
 * It is deliberately a plain script rather than app code: nothing in this folder
 * ships inside the APK.
 *
 * Environment (all required unless noted):
 *   GDRIVE_CLIENT_ID       OAuth client id (Desktop app) from Google Cloud
 *   GDRIVE_CLIENT_SECRET   its client secret
 *   GDRIVE_REFRESH_TOKEN   refresh token for the drive scope
 *   GDRIVE_FOLDER_ID       target folder id (the part after /folders/ in its URL)
 *   GDRIVE_FILE_NAME       name to give the file (default: bike-lot-app-debug.apk)
 *   GDRIVE_API_BASE        override for tests (default https://www.googleapis.com)
 *   GDRIVE_TOKEN_URL       override for tests (default https://oauth2.googleapis.com/token)
 *
 * Usage:
 *   node scripts/upload-to-drive.mjs path/to/app-debug.apk
 *   node scripts/upload-to-drive.mjs --check     # validate configuration, no network
 */
import { readFile, stat } from "node:fs/promises";
import { basename } from "node:path";
import process from "node:process";

const MIME_APK = "application/vnd.android.package-archive";
const REQUIRED = ["GDRIVE_CLIENT_ID", "GDRIVE_CLIENT_SECRET", "GDRIVE_REFRESH_TOKEN", "GDRIVE_FOLDER_ID"];

const apiBase = () => process.env.GDRIVE_API_BASE || "https://www.googleapis.com";
const tokenUrl = () => process.env.GDRIVE_TOKEN_URL || "https://oauth2.googleapis.com/token";
const fileName = () => process.env.GDRIVE_FILE_NAME || "bike-lot-app-debug.apk";

function missing(name) {
  return !process.env[name] || process.env[name].trim() === "";
}

/** Drive query strings are single-quoted; an apostrophe in a name must be escaped. */
export function escapeQueryValue(value) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export function existingFileQuery(folderId, name) {
  return `name = '${escapeQueryValue(name)}' and '${escapeQueryValue(folderId)}' in parents and trashed = false`;
}

async function accessToken() {
  const body = new URLSearchParams({
    client_id: process.env.GDRIVE_CLIENT_ID,
    client_secret: process.env.GDRIVE_CLIENT_SECRET,
    refresh_token: process.env.GDRIVE_REFRESH_TOKEN,
    grant_type: "refresh_token",
  });

  const response = await fetch(tokenUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(`token exchange failed (${response.status}): ${await response.text()}`);
  }

  const json = await response.json();
  if (!json.access_token) throw new Error("token exchange returned no access_token");
  return json.access_token;
}

async function findExisting(token, name) {
  const params = new URLSearchParams({
    q: existingFileQuery(process.env.GDRIVE_FOLDER_ID, name),
    fields: "files(id,name,modifiedTime)",
    orderBy: "modifiedTime desc",
    pageSize: "1",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });

  const response = await fetch(`${apiBase()}/drive/v3/files?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error(`lookup failed (${response.status}): ${await response.text()}`);

  const json = await response.json();
  return json.files?.[0]?.id ?? null;
}

async function createMetadata(token, name) {
  const response = await fetch(`${apiBase()}/drive/v3/files?supportsAllDrives=true&fields=id`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      parents: [process.env.GDRIVE_FOLDER_ID],
      mimeType: MIME_APK,
    }),
  });

  if (!response.ok) throw new Error(`create failed (${response.status}): ${await response.text()}`);

  const json = await response.json();
  if (!json.id) throw new Error("create returned no file id");
  return json.id;
}

async function uploadBytes(token, fileId, bytes) {
  const response = await fetch(
    `${apiBase()}/upload/drive/v3/files/${fileId}?uploadType=media&supportsAllDrives=true&fields=id,size`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": MIME_APK },
      body: bytes,
    },
  );

  if (!response.ok) throw new Error(`upload failed (${response.status}): ${await response.text()}`);
  return response.json();
}

export async function uploadToDrive(path) {
  const info = await stat(path);
  if (!info.isFile()) throw new Error(`${path} is not a file`);

  const name = fileName();
  const token = await accessToken();

  const existingId = await findExisting(token, name);
  const fileId = existingId ?? (await createMetadata(token, name));

  await uploadBytes(token, fileId, await readFile(path));

  return {
    fileId,
    name,
    replaced: Boolean(existingId),
    bytes: info.size,
    link: `https://drive.google.com/file/d/${fileId}/view`,
  };
}

function checkConfiguration() {
  const absent = REQUIRED.filter(missing);
  console.log(`file name: ${fileName()}`);
  if (absent.length > 0) {
    console.log(`not configured — missing ${absent.join(", ")}`);
    console.log("the build will skip the Drive copy until those exist as a secret/variable");
  } else {
    console.log("configured — the build will also copy the APK to Google Drive");
  }
  return 0;
}

async function main(argv) {
  if (argv.includes("--check")) return checkConfiguration();

  const absent = REQUIRED.filter(missing);
  if (absent.length > 0) {
    console.error(`cannot upload to Google Drive: missing ${absent.join(", ")}`);
    return 1;
  }

  const path = argv.find((argument) => !argument.startsWith("-")) ?? "android/app/build/outputs/apk/debug/app-debug.apk";

  try {
    const result = await uploadToDrive(path);
    console.log(
      `${result.replaced ? "replaced" : "uploaded"} ${basename(path)} ` +
        `(${(result.bytes / 1048576).toFixed(1)} MB) as ${result.name}`,
    );
    console.log(result.link);
    return 0;
  } catch (error) {
    console.error(`Google Drive upload failed: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = await main(process.argv.slice(2));
}
