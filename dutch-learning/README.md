# Taal — Dutch on your phone, offline

Sentences, not word lists. Every sentence comes back just before you would forget it, and each
one climbs a ladder: read it → fill the missing word → hear it and type it → say it in Dutch.
Audio is your phone's own Dutch voice, so it works with no network and no downloads.

This is **M1**: the offline core. 97 exam-weighted A1/A2 sentences across the situations you meet
in Delft — gemeente, wonen, huisarts, werk, boodschappen, vervoer, familie, tijd, KNM.

## Install (the short way)

1. On the phone, open **<https://github.com/knarayanareddy/appbuilder/releases/download/taal-latest/app-debug.apk>**
2. Tap the downloaded file. If Android asks, allow "install unknown apps" for your browser once.
3. Open **Taal** → **Start**.

That's it. The app never asks for an account, an email, or a network connection.

## Daily use

- **Vandaag** shows what is due. Tap **Start** once a day; six new sentences are added, the rest
  are reviews. Roughly 15–20 minutes.
- Type the missing word or the whole sentence. A small typo counts as "almost" — the card is
  marked hard, not failed, and you can override it with **I was right (typo)**.
- **Progress** is honest: true recall on reviews only, sentences known (survived three weeks),
  per-theme coverage, and the grammar tags you keep missing.
- **Settings** holds the daily new-sentence count, the recall target, the voice speed, and
  **Back up now** — one JSON file with every card's schedule. Use it before changing phones.

Audio silent? Install a Dutch text-to-speech voice in Android *Settings → System → Languages →
Text-to-speech output*. The app uses whatever Dutch voice is on the phone.

## What M1 deliberately does not do

No speech recognition, no free conversation, no grammar explanations, no XP, no streaks-as-a-score.
Those are M2–M4 in [DESIGN.md](DESIGN.md). The design doc also explains why: open speech
recognition at 22–26% word error cannot grade you, and XP measures tapping, not knowing.

## Working on it

```bash
npm install
npm run dev        # http://localhost:5182 — the web build is the same app
npm run check      # typecheck + 49 tests
npm run build      # static build into dist/
```

| Path | What lives there |
| --- | --- |
| `src/lib/fsrs.ts` | FSRS scheduler (published default weights, target-recall intervals) |
| `src/lib/session.ts` | Queue building, stage ladder, grading |
| `src/lib/content.ts` | The sentence corpus — plain rows, no database |
| `src/lib/repo.ts` | IndexedDB persistence, repair of old records, backup/restore |
| `src/components/SessionView.tsx` | The four drill types |
| `DESIGN.md` | The full design: evidence, curriculum, traps, milestones |

The APK is built by `.github/workflows/taal.yml` on every push. It publishes the same release tag
each time, so the install link above never changes. Signing is pinned in
[keystore/README.md](keystore/README.md) — that is what lets a new APK install over the old one
without wiping your progress.
