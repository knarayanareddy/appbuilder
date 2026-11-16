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

Twenty of the 121 sentences have a native Dutch neural voice — one clip per sentence:

| Unit | Items | Recording |
| --- | --- | --- |
| Kennismaking | `s001`–`s010` | 10 of 10 |
| Boodschappen | `s011`–`s019` | 9 of 9 |
| Wonen | `s020` | 1 of 11 |

Those cards sound identical on every phone, with no dependence on the device's speech
engine. The app shows the ratio in **Settings → Voice → Recorded narration**, so the
coverage is never a guess: *"Recorded narration · 20 of 121"*.

## Why the rest uses the phone's voice — and what the "Dutch pack" is

Android's Dutch voice is **not app data**. It is a voice pack inside the Google
text-to-speech engine: one download, stored by the system, shared by every app, and
offline once installed. Three consequences matter here:

1. An app cannot install it silently. Android shows the install prompt and the user
   confirms; that is what `TextToSpeech.openInstall()` opens (`Settings → Voice →
   Install the voice`).
2. The same pack fixes every other app, so it is worth installing even if you never use
   this one.
3. Without it, Android does not go silent — it reads Dutch with an English voice, which
   is worse than silence for pronunciation. That is why the app checks before it speaks.

If the pack is missing, the app cannot be made to sound right by any setting inside it.
What it *can* do is stop depending on the pack, which is what recording the course does.

## Recording the rest, in batches

Ten clips per pass is the honest rate for the current pipeline:

1. generate the ten clips for the next unit in curriculum order;
2. rename them to `nl-basis__<unit>__<item>.mp3` (double underscore, no path);
3. `node scripts/audio-index.mjs`;
4. `npm run build`, commit, push — the APK carries them and coverage moves.

Unit 3 (*Wonen*) is next: `s021`–`s030`.
