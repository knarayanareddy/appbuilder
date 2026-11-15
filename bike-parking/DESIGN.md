# Bike Lot Tracker — feasibility notes & proposed design

> Status: **built.** This file is the "comment on it" answer in durable form, kept as the
> record of *why* the app is shaped the way it is. The decisions you made are in section 8;
> run instructions and the data-storage contract are in [README.md](./README.md).
>
> This folder is deliberately self-contained (own `package.json`, own build, no imports
> from the root ProCam app) so the two apps cannot contaminate each other.

---

## 1. Verdict

**Yes, this can be built, and it is a good fit for this repo.** Nothing in the feature list
needs a server, an account, or an internet connection: name, location, key, photo of the bike,
photo of the spot — all of that is local data plus local camera input.

But there is one thing that decides whether this app is a joy or a disaster, and it is **not**
the features. It is **where the data lives**. Get that wrong and the app works perfectly for
three months and then eats your entire inventory in one "Clear browsing data" tap. Section 4
is the important part of this document; section 2 is the easy part.

v1 is built in this folder: lot grid with place codes, bikes with two photos and tags, keys
as records, search, and a backup/restore round-trip — 85 tests, strict TypeScript, single-file
build, and a GitHub Actions job that produces the debug APK.

---

## 2. What is trivially easy

| Feature | Difficulty | Notes |
|---|---|---|
| Add / edit / delete a bike record | Trivial | Form + list, persisted locally |
| Free-text "where is it stored" | Trivial | …but see 3.2, free text is the weak version |
| Photo of the bike / photo of the spot | Easy | `<input type="file" accept="image/*" capture="environment">` opens the phone camera directly. Works offline, no permission prompts, no native plugin. On a desktop browser `capture` is ignored — see 12. |
| Search by name | Trivial | 60 records is nothing |
| Which key unlocks it | Easy, *if* modelled properly | A key usually opens several bikes — model keys as their own entity, not a text field |
| Works offline | Easy | It is a local page; there is nothing to fetch |
| Installable on Android home screen | Easy | PWA manifest; icon, splash, standalone window, no browser chrome |

## 3. The parts that actually need thinking

### 3.1 The lot model is the whole app

Your stated problem is "I cannot remember where the individual bikes are." A list with a
photo achieves that. A **map of the lot with occupancy** does something better: it shows
you what is *free*, which is the question you ask when a new bike arrives, and it lets you
answer "whose bike is in slot C-7?" by tapping a cell instead of scrolling.

So slots should be first-class, not a text field:

```
Slot:  code ("C-7") · zone/row ("Row C") · kind (rack / hook / floor) · notes
Bike:  name · slot → Slot · key(s) → Key · photos · status (stored / out / sold / service)
Key:   label ("blue Abus #12") · kept at ("hook 3, left wall") · opens → many Bikes (many-to-many)
Photo: blob · kind (bike | slot | key) · taken at
```

Two consequences worth knowing before you start typing records:

- **Slot codes must be decided once, up front, and written on physical labels.** The app can
  only be as unambiguous as the naming scheme. 100 slots ÷ 4 rows = `A-1…A-25` is plenty.
  Renaming later is possible but annoying.
- **One key → many bikes is the normal case.** If you instead store "key: blue Abus" as free
  text on each bike, you will eventually be unable to answer "I'm holding the blue Abus, which
  bike does it open?" — which is exactly the question you ask when a key is in your hand and
  a lock is in front of you.

### 3.2 Free text vs. slots

Free text for location ("back left corner, second rack") is fast to enter and useless in a
year when you cannot remember whether you meant the rack by the door or the one by the fence.
Photos compensate a lot — that is the real reason to insist on the spot photo, and it is the
single highest-value field in the whole app. Structured slots + a spot photo together are
noticeably better than either alone.

### 3.3 Photo volume

80–120 photos at full phone resolution (3–4 MB each) is 300–500 MB, which will make any
browser storage complain. Downscale on ingest to ~1280 px longest edge, JPEG q≈0.75
(~150–250 KB) → whole inventory lands around **25–30 MB**. That is comfortable, and still
plenty sharp to recognise a frame in a rack. Strip EXIF while doing it (keeps file size down
and does not leak GPS).

### 3.4 Privacy

This is a plain local database. Anyone who picks up your unlocked phone can read it. A PIN
screen on top of unencrypted storage is theatre. Real protection = passphrase-encrypted
records via WebCrypto. Worth doing *later* only if the inventory is valuable; for parking-lot
frames it is almost certainly overkill, and it adds a "forgot passphrase = lost data" failure
mode. Recommendation: skip it in v1, revisit if you ever store serial numbers and purchase
prices.

---

## 4. The one real risk: losing the data

Three separate mechanisms can silently destroy local browser data:

1. **The user clears site data** ("Clear browsing data → Cookies and site data", or an
   aggressive storage cleaner). No API can prevent this.
2. **Storage eviction** under disk pressure. Mitigated but not eliminated by
   `navigator.storage.persist()`, which asks the browser for "persistent" status.
3. **Origin dependence.** Data belongs to a scheme+host. Move the app from `localhost` to a
   Vercel URL, or from a `file://` path to a hosted URL, and the old data is simply not there
   — it is not lost, but it is invisible, which for you is the same thing.

So the app **must** ship with:

- **One-tap "Back up"** → writes a single `.zip` (or `.json` + image files) via the Android
  share sheet / download, which you then put in Drive. You already have Drive connected; a
  backup file landing there is a far better durability story than any browser API.
- **One-tap "Restore"** from that file, with a merge-or-replace choice.
- **A nag**: if the last backup is older than N days or M changes, show a banner. This is the
  feature nobody builds and everybody needs.
- **A visible "last backup" date** on the main screen.

Rule of thumb to design against: *assume the browser wipes itself without warning, and make
that a 30-second recovery.*

---

## 5. How to get it onto the phone (three honest options)

| Option | Offline | Data safety | Effort | Verdict |
|---|---|---|---|---|
| **A. PWA, installed to home screen** (host on Vercel — already connected; service worker precaches everything) | Fully, after first load | Good, with the backup story above | Low | **Recommended start** |
| **B. Single-file HTML in `/Downloads`, opened via file manager** (this is what the root ProCam app does) | Yes | **Poor** — `file://` storage is inconsistently supported across browsers/versions, and Chrome shares one global `file://` origin across all local files | Lowest | Fine as a *demo*, bad as your inventory of record |
| **C. Real APK via Capacitor** (wrap the same React app; build in GitHub Actions, sideload the APK) | Yes, natively | Best — SQLite + real file storage outside the browser's control; no "clear data" footgun | Medium–high (needs Android SDK/Gradle build, CI job, signing) | Do this in v2 if the app earns its place |

Note on B: the root app's `vite-plugin-singlefile` trick is excellent for a *prototype*, but
I would not store 60 bikes' worth of irreplaceable records on `file://` storage. That is the
one place I would deviate from the repo's existing pattern.

Note on A: `localStorage` is not an option for the photos at all — ~5 MB hard cap, strings
only, ~33 % base64 bloat, synchronous. Use **IndexedDB with real `Blob`s** (gigabyte-scale
quota, zero encoding overhead). This is a settled technical point, not a preference.

Good news for C: if the React app keeps all storage access behind one small repository
module (`lib/db.ts`), swapping IndexedDB for Capacitor SQLite later is a contained change,
not a rewrite. Worth doing that way from day one.

---

## 6. Proposed v1 scope

**Must have**
1. Lot setup: define zones/rows and generate slot codes (or "no fixed slots" free-text mode)
2. Occupancy grid: tap a slot → who's in it, or assign a newly added bike
3. Bike record: name, slot, key(s), bike photo, slot photo, notes, status
4. Keys screen: key → "kept where" → list of bikes it opens
5. Search across name / slot code / key label
6. Add photos from camera or gallery; auto-downscale
7. Backup / restore round-trip, with "last backed up" banner
8. Fully offline; installable to home screen

**Nice to have, later**
- Move history ("moved A-3 → C-11 on 12 Oct") — cheap to add, surprisingly useful
- Printable QR labels per slot → scan to jump straight to the slot (Chrome's built-in
  `BarcodeDetector` works offline, no library needed)
- Bulk add ("add 10 bikes to row A")
- Manual reorder / drag to rearrange the grid to match the physical layout
- Maintenance & service log per bike
- Encrypted backups (passphrase)

**Explicitly out of scope**: accounts, sync between devices, sharing with other people,
cloud hosting of the records. All of those contradict "must work offline" and each one drags
in a backend and a privacy story you don't want.

---

## 7. Engineering constraints for this folder

- Own `package.json`, own `vite.config.ts`, own tests (Vitest + RTL, same as the root app).
- **No imports from the root `src/`** and root imports nothing from here. Shared helpers get
  duplicated rather than coupled — 20 lines of `cn()` is cheaper than a shared workspace.
- Root CI (`.github/workflows/ci.yml`) only runs the root app; this folder needs its own job
  (`working-directory: bike-parking`) or its own workflow, otherwise it rots silently.
- Dev server must bind `0.0.0.0` with no host allowlist, so the preview works in the sandbox.
- All persistence behind `lib/db.ts` so the storage engine can be swapped for Capacitor SQLite.

---

## 8. Decisions (your answers, turned into the build)

| Question | Your answer | What was built |
|---|---|---|
| Delivery | **A real APK** | Capacitor shell; the web bundle is packaged inside the APK so it is offline by definition. Built in GitHub Actions because that is the only place with an Android SDK. |
| Layout | **Numbered racks/hooks** | Place codes generated from a layout string (`A=25, B=25 …`), a tappable occupancy grid per zone, and a "free only" filter. |
| Keys | **Mixed** | Keys are first-class records with a "where is it kept" field and a many-to-many link to bikes; both directions are answerable. |
| Persistence | "Everything offline, saved to device" | IndexedDB in the app's private storage (survives restarts, untouched by Chrome's data clearing), plus a one-tap backup file and a reminder when backups go stale. |

### Two things I would still flag

1. **Backups are the only protection against uninstalling the app.** Everything else is
   covered, but "delete the app" or "clear storage" in Android settings takes the inventory
   with it. The reminder bar exists because this is the one failure nobody sees coming.
2. **The lot codes are the app's foundation.** If the physical racks are not labelled
   `A-01`, `A-02`, …, the grid will be a map of a place that does not exist. Label the
   racks first; the app is then a five-second lookup instead of a ten-minute walk.

## 9. Revision — places in your own words

Follow-up from the owner: *"let me manually enter the place in the lot, it doesn't follow
your schema, and I can be verbose about it."* Correct call, and it changes the design:

- **`Bike.place` is free text and is the primary location.** No codes, no validation, no
  reformatting, no length limit. It is shown verbatim (wrapping, not truncated) in the bike
  page and in the place cards.
- **Numbering became optional.** First launch offers "describe places in words" (no setup at
  all) or "numbered places" (the grid from section 3.1). The Lot screen has two modes: a
  searchable list of written places, or the grid. Numbered places can be added or removed
  later without losing a single written description.
- **Section 3.1 was right about the trade-off, wrong about the default.** A grid is a better
  interface *if* the racks are labelled; if they are not, forcing the schema up front is
  pure friction. So the schema is now an opt-in layer on top of the written truth rather
  than the thing the data model is built around.
- **Search was made explicit and wider**: name, tags, notes, place description, key label —
  every word of the query must appear in any order, so "flat tyre" matches "flat rear tyre".

## 10. Revision — a second, simpler entity for everything else

Follow-up: *"options to add other items ranging from laptops, macbooks, chargers, bike tyres,
spray paint can, headphones and anything… name of the item, place stored, tags and additional
notes… additional section in the same app."*

Kept it small and separate rather than bolting more fields onto `Bike`:

- **`Item` is its own record and its own table** (`name`, `place`, `tags[]`, `notes`), with
  one new tab. Bikes and items never appear in each other's lists or search results — a
  deliberate line, because the bike side carries keys, photos and status that would be noise
  on a charger.
- **Same free-text place philosophy.** The place is not validated, not shortened, not split
  into fields.
- **The database went to version 2.** The upgrade path only creates the missing object store,
  so an existing inventory is carried over untouched; there is a test that builds a genuine
  version-1 database and asserts the bikes survive.
- **Backups went to version 2** and still read version-1 files (which simply have no items).
- **Photos were added in a follow-up request.** Each item now holds up to six pictures
  (`photoIds[]`), reusing the bike photo pipeline end to end: same downscaling, same
  `photos` store (with `kind: "item"`), same backup encoding. Removing a picture in the form
  deletes the stored bytes, and deleting an item takes its photos with it.
- **Status is still not on items.** A charger has no "out riding" state.
- **The photo work surfaced a real robustness hole:** image decoding had no deadline, so an
  image that neither loaded nor errored (odd formats, a WebView giving up) would hang the
  save silently forever. Decoding is now capped at 8 seconds with a fallback to storing the
  original bytes.

## 11. Bug — the Items tab blanked the screen

Reported after the photos release: *"when i click on items, it shows all blank screen"*.

Cause: adding `Item.photoIds` changed the shape of a record, but items already saved by the
previous build simply **do not have that key**. `ItemsView` read `item.photoIds.length` on a
value that was `undefined`, the render threw, and React unmounted the tree — a white page
with no message. (The user's items were never lost; the list just could not draw them.)

Three fixes, in order of importance:

1. **Normalise on load.** `normalizeBike` / `normalizeItem` fill in every field an older
   record might lack, at the single boundary where records come off disk. This is the real
   fix: the shape of stored data must be allowed to lag behind the shape of the code.
2. **Don't trust the field in the UI.** The Items list and the item mutations also guard
   `photoIds` directly, so a stray record cannot repeat this.
3. **Never blank the app.** An `ErrorBoundary` now wraps the tab content: a render error shows
   "This screen could not be shown", keeps the shell and the data intact, and offers a way
   back to the lot.

Regression tests: a raw legacy item (no `photoIds`) loads with `[]`; the same record opens
and saves in the Items tab without a blank screen; the boundary shows, reports and recovers.

## 12. Bug — on a Mac the camera button opened the gallery

Reported after the photos release: *"how come both camera/take photo and gallery option both
lead to gallery to add pictures … i am trying on macbook"*.

Not a fault in the app, but a fault in what the app promised. `capture` is part of the file
input spec, and desktop browsers implement it as a no-op: `accept="image/*" capture` and
`accept="image/*"` both open the OS file dialog, because no web page may open a webcam
without `getUserMedia` (which needs a permission prompt, and inside an Android WebView needs
native camera permission — a much bigger surface than the job needs). So on a computer the
two buttons were duplicates, and one of them lied.

The fix is to promise only what the platform can do: `canUseCameraCapture()` in
`src/lib/device.ts` looks for a mobile user agent (plus >1 touch points, because iPadOS
claims to be a Mac), and the pickers render two buttons on a phone and one button plus a
one-line explanation on a computer.

The Android side needed a real fix, though. Capacitor turns `capture` into
`MediaStore.ACTION_IMAGE_CAPTURE` and first calls `Intent.resolveActivity` to see whether a
camera app exists. Android 11+ filters exactly that query unless the intent is declared in
`<queries>`, so on a modern phone the lookup returns null and Capacitor falls back to the
file picker — the same "camera does nothing" symptom, on the device where the feature
matters. `scripts/patch-android-manifest.py` inserts the `<queries>` entry into the manifest
that `cap add android` generates, and the workflow runs it before Gradle.

Tested: `device.test.ts` covers the Android/desktop/iPad decisions, `ItemsView.test.tsx`
covers both button layouts and that a picked file becomes a pending photo either way, and the
end-to-end photo test now runs as a phone.

## 13. Getting the file to you, not just building it

The APK exists after every green run, but "exists on GitHub" and "is on my phone" are two
different problems, and one of them cannot be solved from a sandbox that may only reach a
short list of hosts: GitHub serves artifacts from Azure blob storage, so the build output
cannot be pulled into the agent's workspace, and a Drive connector can only upload a file it
already has. No amount of retrying changes that; the file has to travel from the runner.

Two routes, both from inside the build:

- **A fixed download URL.** The workflow publishes `app-debug.apk` to the `bike-lot-latest`
  release and replaces the asset on every build, so one URL always serves the newest APK.
  Opening it on the phone is the whole install: download, tap, install.
- **Drive, optionally.** `scripts/upload-to-drive.mjs` exchanges a refresh token for an
  access token, looks for a file of the same name in the target folder, and either creates
  it or replaces its media (so the file id, and any link to it, stays stable). It uses the
  `drive` scope rather than `drive.file`, because the narrower scope cannot see a folder the
  user created by hand. Without the secrets the step does nothing.

The OAuth client is a **web application** client, which reads oddly for an Android project
and needed writing down: the credential belongs to the build machine, not the phone. The APK
never talks to Google, so an Android client would be a package-name-and-SHA-1 registration
for something that makes no Google calls — and it would not work anyway, because Android
clients have no client secret and a refresh token cannot be renewed server-side without one.
(The CI debug keystore is regenerated per runner, so that fingerprint would also be a moving
target.) A *desktop* client would fail differently: the OAuth Playground only accepts web
application clients.

Deliberately no service account: a personal Gmail account gives a service account zero
storage quota, so uploads it owns fail. The token is the user's own.

Two notes that belong here because they are the reasons this cannot be a one-liner:
`rclone authorize` — the usual shortcut, which borrows rclone's shared client — is being
retired during 2026 and is rate limited until then, so a token minted that way can die under
the build. And the console instructions had to be rewritten once already: the "OAuth consent
screen" page no longer exists, it is **Google Auth Platform** with Branding / Audience /
Clients tabs, which is why a numbered list written against the old UI sent the reader in the
wrong order. The setup now lives in `DRIVE-UPLOAD.md` rather than the README, because nine
tenths of readers should never do it.

## 14. The builds were un-upgradable

Found while answering "can you edit an APK if I give you one?" — the honest answer needed a
digression about signing, and the digression turned into a bug report against this app.

Android installs an APK over an existing one only if both are signed by the same key. The
builds took whatever debug keystore Gradle happened to find or create, and every CI runner
creates a fresh one, so consecutive runs were three different app identities:

```
run 43763243349  06a69a9f…5e0a63
run 43763544720  19405f29…5d7cbb     (same commit, different runner)
run 43763861086  b012280b…391202
```

Measured, not assumed. The first attempt to read the certificate said "unknown" — the APK is
v2-only, so `keytool -printcert -jarfile` answers "Not a signed jar file", and the apksigner
path had been locating the tool at a hardcoded path the runner does not use. Loosening the
extraction to "any 64-character hex string in what the tools said" turned a formatting
assumption into a measurement, and the measurement was the bug.

The damage was one uninstall away at all times: an install that Android refuses looks like
"App not installed", the obvious workaround is to uninstall, and an uninstall takes the app's
data directory with it — bikes, items, photos. Nothing in the app could have warned anyone; it
is invisible until the moment it costs the inventory.

Fix: `keystore/bike-lot.p12` is committed and every build is re-signed with it after Gradle
finishes (`zipalign` then `apksigner`, both already on the runner), with `apksigner verify`
failing the build if the result is not properly signed. The certificate digest is written into
the release notes, which is how this was measured without being able to download build logs.

Two deliberate trade-offs:

- The key is in a public repository. That makes it worthless as evidence of provenance — but
  it is only an update chain for a sideloaded personal app, and the alternative (a secret the
  user must paste into GitHub) was rejected by the same reasoning that retired the Drive
  setup: fewer manual steps, or it does not happen. `keystore/README.md` says this out loud.
- The migration costs one uninstall, because the key that signed the installed copy no longer
  exists. The README therefore leads the migration with "Back up now", which is exactly the
  flow the app already has, and this is the reason the backup feature earns its keep.

### Deliberately not built

Cloud sync, accounts, sharing, notifications, and encryption. Each one either contradicts
"works offline" or drags in a backend and a privacy story this app does not need. If a real
need appears (a second phone, a second person), the storage layer is one module
(`src/lib/repo.ts`), so that is a contained change rather than a rewrite.
