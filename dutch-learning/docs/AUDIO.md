# Audio

The app speaks in two ways, and it prefers the one that cannot be mispronounced.

1. **Bundled recordings** — `public/audio/<item key>.mp3`, played offline, identical on
   every phone. This is the fix for "an English speaker reading Dutch".
2. **The phone's own text-to-speech** — free, instant, and only as good as the voice
   installed. If Android has no Dutch voice it will read Dutch with an English voice, so
   the app checks first and offers to install the missing voice instead of pretending.

## How a recording is found

The key of an item is `module/unit/item`, and the file name is that key with `/`
replaced by a double underscore (ids never contain `__`):

| Item | File |
| --- | --- |
| `nl-basis/kennismaking/s001` | `public/audio/nl-basis__kennismaking__s001.mp3` |

`public/audio/index.json` lists which keys exist. Without it (or with `[]`) the app uses
text-to-speech only — silence is never an error:

```json
["nl-basis/kennismaking/s001", "nl-basis/kennismaking/s002"]
```

(`scripts/audio-index.mjs` writes this file from the folder — do not hand-edit it.)

Recording quality rules:

- mono, 44.1 kHz, MP3 or AAC, ~64–96 kbps — a two-second sentence is ~20–30 KB;
- no music, no intro, no fade — start speaking within ~150 ms;
- **normal speed only.** The app plays recordings at `settings.rate` with
  `playbackRate`, so a slowed recording would be slowed twice;
- one sentence per file. Never pack several sentences into one clip: the drill plays a
  single sentence, and a shared clip would leak the answer for a dictation card.

## Regenerating the index

```bash
node scripts/audio-index.mjs          # writes public/audio/index.json from the folder
npm run build                         # pick up new files
```

## What is recorded today

Unit 1 (*Kennismaking*, ten sentences) is recorded with a native Dutch neural voice —
the one you picked from the two auditions — one clip per sentence. Those ten cards now
sound identical on every phone, with no dependence on the device's speech engine.

Every other sentence falls back to the phone's own Dutch voice, which is good when the
voice data is installed and wrong when it is not (the app checks, and says so). The rest
of the course can be recorded in batches: ten clips per pass, `npm run audio:index`,
rebuild, ship. Say which unit and it happens.

