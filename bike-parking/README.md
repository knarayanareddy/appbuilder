# Bike Lot

An offline inventory for a bike parking lot: which bike is in which place, which key
opens it, and a photo of both the bike and the place. Built for Android, installable as a
real APK, and it never touches the network.

**Why it exists:** 40–60 bikes, 100 places, and no memory of where any individual bike
stands. A text list solves half of it. A tappable map of the lot, with a photo of each
place, solves the other half — including the question you ask when a spare place is
needed ("what's free?") and the one you ask with a key in your hand ("what does this
open?").

This folder is self-contained: its own `package.json`, its own build, its own tests. It
imports nothing from the root ProCam app, and the root app imports nothing from here.

---

## Where the data lives (the part that matters)

Everything is stored in **IndexedDB inside the app's own private storage** on the phone:

```
/data/data/com.bikelot.tracker/app_webview/…
```

Consequences, stated plainly:

| Question | Answer |
|---|---|
| Does it need internet? | No. The app bundle ships inside the APK; there is no fetch anywhere in the code. |
| Is it saved between launches? | Yes — IndexedDB persists until the app is uninstalled or its storage is cleared in Android settings. |
| Can Chrome's "clear browsing data" wipe it? | **No.** It is not Chrome's storage; it is the app's own sandbox. |
| Does it survive losing the phone? | Only if you made a backup file. |

Because re-installing the app *does* start from an empty database, the app ships with:

- **Back up now** — writes one JSON file (bikes, places, keys, tags, notes **and photos**)
  to `Documents/BikeLot/` and opens the Android share sheet so it can go straight to
  Drive or email. A reminder bar appears when there are bikes and the last backup is
  older than a week (or missing).
- **Restore** — reads that file back. It *replaces* the current inventory (deliberately:
  a half-merged restore is worse than a replace), so back up first if unsure.

Photos are downscaled to a 1280 px long edge (~150–250 KB each) before they are stored, so
a full lot of 60 bikes with two photos each lands around **25–30 MB** rather than 400 MB.

---

## Run it

```sh
cd bike-parking
npm install
npm run dev          # http://localhost:5180
```

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server on `0.0.0.0:5180` |
| `npm run build` | Single-file production build at `dist/index.html` (≈330 KB, works from `file://` too) |
| `npm test` | Vitest + Testing Library |
| `npm run typecheck` | `tsc --noEmit`, strict |
| `npm run lint` | ESLint |
| `npm run check` | All three |
| `npm run cap:add` | Build, then generate the `android/` project (needs the Android SDK) |
| `npm run android:debug` | Build + sync + `./gradlew assembleDebug` |

## Get the APK onto the phone

The APK is built by GitHub Actions, because it needs the Android SDK:

1. Push a change under `bike-parking/` (or run the **Bike Lot** workflow manually from the
   Actions tab).
2. Open the finished run, download the **`bike-lot-apk`** artifact, unzip `app-debug.apk`.
3. Copy it to the phone (USB, Drive, email), tap it, allow "install unknown apps" for the
   app you opened it with, and install.

It is a *debug* APK: signed with the standard debug key, so it installs fine by sideloading
but is not suitable for the Play Store. If this app earns its place, the next step would be
a release build with a real keystore.

The `android/` folder is **not committed** — it is generated from `capacitor.config.ts` by
`npx cap add android` on every build. That keeps a large, machine-specific, constantly
regenerating tree out of the repository.

---

## How it works

```
src/
  App.tsx                   Shell, tabs, sheet routing, backup nag
  types.ts                  Bike / Slot / Key / Photo shapes
  lib/
    idb.ts                  Promise wrapper over IndexedDB (5 object stores)
    repo.ts                 The only module that persists anything
    model.ts                Pure logic: occupancy, free places, search, cascades
    slots.ts                Lot layout parsing and place-code generation
    backup.ts              Export/import: bytes ↔ base64, validation, repair
    image.ts                Downscale + re-encode to JPEG on the device
    native.ts               Capacitor filesystem/share, persistent-storage request
    format.ts, cn.ts, id.ts Small helpers (duplicated from the root app on purpose)
  hooks/useInventory.ts     All mutations: persist first, then update state
  components/               LotView, BikesView, BikeForm, BikeDetail, KeysView,
                            SettingsView, LotSetup, PhotoPicker, PhotoThumb, TagInput…
```

### The model

```
Slot   code ("B-07") · zone · index · note
Bike   name · slot → Slot · keyIds → Key[] · tags[] · status · notes ·
       bikePhotoId · slotPhotoId
Key    label ("Blue Abus #12") · keptAt ("hook 3, left wall") · note
```

Two decisions worth knowing:

- **Keys are records, not a text field.** One key commonly opens several bikes, so
  `Bike.keyIds` is a list and the Keys tab answers "this key fits these bikes" as well as
  "which key fits this bike". Deleting a key detaches it from every bike instead of
  leaving a dangling reference.
- **A bike keeps its place when it is out riding or in service.** Only `sold` releases the
  place (the bike keeps its last known place for history). Otherwise the lot grid would
  show empty holes every time someone cycled home.

Place codes are generated from a compact layout string (`A=25, B=25, C=25, D=25` → A-01 …
D-25). Changing the layout keeps the id of every place whose code survives, so bikes are
not silently unassigned; any bike whose place disappears is unassigned and reported, never
deleted.

### Photos

`<input type="file" accept="image/*" capture="environment">` — the Android WebView routes
this to the system camera. No plugin, no permission prompt, no upload. The picked image is
drawn onto a canvas, re-encoded as JPEG at 1280 px / quality 0.75, and stored as raw bytes
plus a MIME type (bytes rather than a `Blob`, because Blob support in structured-clone
varies between storage engines).

### Tests

85 tests across the pure model, the storage layer, backup round-trips, and the UI
(onboarding → layout → add bike → reopen). `fake-indexeddb` stands in for the device
database. Notable cases covered: a sold bike frees its place, a deleted key detaches from
every bike, a layout change that removes places reports the affected bikes, a corrupt photo
in a backup does not sink the restore, and a reload reads the inventory back from disk.

Not covered by tests: real camera capture and real canvas downscaling (both need a browser),
and the Capacitor filesystem/share calls (they need a device).

---

## Known limits

- **No sync, no accounts, no cloud.** By design — that is what "works offline" costs you.
  Moving to a new phone means backing up, then restoring on the new one.
- **Restore replaces everything.** Merge-on-restore would be a future nicety.
- **The data is not encrypted.** Anyone with the unlocked phone can read it. Fine for
  frames in a shed; revisit if you ever store serial numbers and purchase prices.
- **Slot codes are only as good as the physical labels.** Write `A-01 …` on the racks if
  they are not already marked; a code you can read while standing in front of it beats any
  search field.
- Debug APK only, as above.
