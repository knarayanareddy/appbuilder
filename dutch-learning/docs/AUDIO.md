# Audio

The app speaks in two ways, and it prefers the one that cannot be mispronounced.

1. **Bundled recordings** — `public/audio/<item key>.mp3`, played offline, identical on
   every phone. This is the fix for "an English speaker reading Dutch".
2. **The phone's own text-to-speech** — free, instant, and only as good as the voice
   installed. If Android has no Dutch voice it will read Dutch with an English voice, so
   the app checks first and offers to install the missing voice instead of pretending.

## How a recording is found

The key of an item is `module/unit/item`, so the file name is that with `/` replaced:

| Item | File |
| --- | --- |
| `nl-basis/kennismaking/s001` | `public/audio/nl-basis_kennismaking_s001.mp3` |

`public/audio/index.json` lists which keys exist. Without it (or with `[]`) the app uses
text-to-speech only — silence is never an error:

```json
["nl-basis_kennismaking_s001", "nl-basis_kennismaking_s002"]
```

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

## How the current recordings were made

The M2 batch was generated with a native Dutch neural voice, one clip per sentence, and
checked by ear for the traps this app teaches: the *ui/ou* pair, final *-en* as a
schwa, *de/het* before a vowel, and the *sch-* at the start of a word. Where a sentence
exists mainly to teach a trap, it is worth listening to that one file specifically.
