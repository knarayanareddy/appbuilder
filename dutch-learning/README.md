# Taal — Dutch on your phone, offline

A sentence gets you further than a word list. Every sentence in Taal comes back just before
you would forget it, and climbs six rungs: read it → fill the missing word → choose the
meaning → build it from a word bank → hear it and type it → produce it in Dutch from English.
Audio is offline, the schedule is local, and nothing stops you when the day's numbers run out.

**121 sentences, 15 units, 3 dialogues** — gemeente, wonen, huisarts, werk, boodschappen,
vervoer, bellen, klachten, KNM. Exam-weighted on purpose.

## Install (the short way)

1. On the phone, open **<https://github.com/knarayanareddy/appbuilder/releases/download/taal-latest/app-debug.apk>**
2. Tap the downloaded file. If Android asks, allow "install unknown apps" for your browser once.
3. Open **Taal** → **Continue**.

If the voice sounds like an English speaker reading Dutch, the Dutch voice data is not on
the phone: **Settings → Voice → Install the voice** opens Android's own installer. That fixes
it for every app, not just this one.

## What is in it

| | |
| --- | --- |
| **Learn** | Today's plan, plus three unlimited modes: **Practise more** (keeps serving whatever is weakest), **Quiz me** (tests without touching the schedule) and **Mistakes**. Tap any unit to drill just that unit. |
| **Flashcards** | A flip deck for review: Dutch on the front, tap to reveal English, then grade it **Again** or **Good**. Both answers feed the same scheduler, and because you grade yourself those attempts never flatter the recall figure. |
| **Pictures** | Optional picture cues in the module data (`image`), shown while a sentence is first met and in Words. Four of the built-in sentences use one; the app is complete without any. |
| **Six drill types** | reading with audio, gap-fill, multiple choice, word-bank sentence building, dictation, production from English. A failure drops a sentence one rung; success moves it up. |
| **Words** | every sentence, searchable, with audio, literal gloss and grammar tags. |
| **Progress** | true recall (reviews only), sentences known, per-unit coverage, day streak, and the grammar tags you keep missing. |
| **Dialogen** | three short dialogues (gemeente, huisarts, markt) with line-by-line audio and English on demand — the Delftse-methode idea that context beats isolated sentences. |
| **Modules** | the curriculum is data: paste a JSON module in Settings and it appears in Learn, in any of eight languages. See [docs/MODULE-FORMAT.md](docs/MODULE-FORMAT.md) and [docs/AUTHORING-PROMPT.md](docs/AUTHORING-PROMPT.md). |
| **Backup** | one JSON file with schedules, history and imported modules — the only copy that survives a lost phone. |
| **First run** | three screens: what this is, how much Dutch you already have (which sets the pace), and whether the phone can actually speak Dutch — then a 12-question placement check that skips what you already know. **Settings → Intro** replays it. |
| **Feel** | a quiet two-note tone when an answer lands, a low thud when it does not, a short arpeggio when the session ends, plus haptics on a phone. Both can be switched off; both are generated at runtime, so there is no sound file in the APK. |
| **Light theme** | dark by default, with a manual dark/light/system switch in Settings. Both palettes are the same tokens — the theme is one attribute on `<html>`. |

No account, no network, no XP. The statistics are the ones that predict whether you can
follow a conversation, not the ones that predict whether you come back tomorrow.

## The interface

Quiet, typographic, and built on one accent. The screen is a neutral canvas (black, or
#F2F2F7 in light mode) with a single 560px column of white/`#1c1c1e` surfaces, hairline
separators instead of borders, and orange reserved for exactly two things: the next
action, and the section you are in. Everything else is hierarchy by size and weight.

The type scale is Apple's: 34pt large title, 17pt body and headline, 15pt subhead, 13pt
footnote, 12–11pt captions, with the system font stack (`-apple-system`, then Roboto on
Android) so the app reads native on whatever phone it lands on. Nothing is bundled, so
nothing waits on a download and nothing looks off-platform. Tap targets are 44pt, the tab
bar is 49pt with a translucent blur, and the palette is tokens: light mode is an override
block, not a second stylesheet.

This was a deliberate pass away from the consumer-app look: no rainbow gradients, no
glowing background, no 3px "press edge" on buttons, no confetti, no coloured icon chips on
every card, and no seventeen-hue unit art. Those are the tells that make an interface read
as machine-made. The path is a grouped list now, the units are drawn in one ink colour,
and colour only ever means state — done is green, next is orange, wrong is red.

Everything is plain CSS: one `src/styles.css` (tokens, type, surfaces, controls, session
states) and `src/components/icons.tsx` (a hand-drawn 24×24 set at 2px strokes). Progress
rings are stroke-only; motion is one easing curve, `cubic-bezier(.32,.72,0,1)`, and it
respects `prefers-reduced-motion`.

The units are not icons. Each of the seventeen has its own small scene in
`src/components/unitArt.tsx` — two shoppers, a windmill, a coffee cup, a bike — drawn
inline with three or four shapes in one ink, so the list reads as situations instead of
buttons and still works with no files to load.

## Voice quality

- Bundled recordings win when a sentence has one (`public/audio/`, see [docs/AUDIO.md](docs/AUDIO.md))
  — a real Dutch voice, identical on every phone. Twenty of the 121 sentences are
  recorded today (units 1–2 plus the first sentence of unit 3); **Settings → Voice** shows
  the exact count, and the rest of the course is recorded in batches of ten.
- Otherwise the phone's own engine speaks — and it speaks *every* sentence, including
  everything in an imported module, so coverage is never limited by what has been
  recorded. Without the Dutch pack, Android reads Dutch in an English voice; the app
  checks first and offers the installer.
- If the pack is missing you can still choose sound over silence: **Settings → Voice →
  English voice as a last resort** (on by default). The app then speaks with whatever
  voice the phone has, tells you once that it is approximate, and marks the card
  `approximate` instead of pretending it is right. Turn it off and it stays quiet and
  explains why.
- The catch that no app can fix: the Dutch voice is a Google text-to-speech pack, one
  download for the whole phone, installed by you, not by the app. Any engine works,
  including third-party offline ones with their own Dutch voices.
- Pick the voice and the speed in **Settings → Voice**. That screen also explains the
  one thing the app cannot do for you: Android's Dutch voice is a Google text-to-speech
  pack, installed once for the whole phone. The app opens the installer; Android makes
  you confirm it.

## Working on it

```bash
npm install
npm run dev        # http://localhost:5182 — the web build is the same app
npm run check      # typecheck + 96 tests
npm run build      # static build into dist/
node scripts/audio-index.mjs   # re-index bundled recordings
```

| Path | What lives there |
| --- | --- |
| `src/lib/fsrs.ts` | FSRS scheduler (published weights, target-recall intervals) |
| `src/lib/session.ts` | The six-rung ladder, the queue builder for every mode |
| `src/lib/module.ts` | Module validation, registry, legacy-id migration |
| `src/content/nl-basis.ts` | The built-in Dutch module — plain rows, no database |
| `src/lib/repo.ts` | IndexedDB persistence, repair of old records, backup/restore |
| `src/components/SessionView.tsx` | The six drill types |
| `src/components/Onboarding.tsx` | First run: intro, level question, voice check |
| `src/components/unitArt.tsx` | One inline-SVG scene per unit, no image files |
| `src/lib/sound.ts` | Synthesised feedback tones + native haptics (both optional) |
| `src/lib/theme.ts` | `data-theme` painting, including live system-follow |
| `docs/` | Module format, AI authoring prompt, audio pipeline |
| `DESIGN.md` | The full design: evidence, curriculum, traps, milestones |

The APK is built by `.github/workflows/taal.yml` on every push and published to the same
release tag, so the install link never changes. Signing is pinned in
[keystore/README.md](keystore/README.md) — that is what lets a new APK install over the old
one without wiping your progress.
