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

## Three ways this app can have a voice

Recording every sentence does not scale — the course is 121 sentences today and could be
any number tomorrow, in any language. So recordings are one layer, not the plan.

| Route | Coverage | Quality | Cost | Can the app do it alone? |
| --- | --- | --- | --- | --- |
| **Bundled recordings** | only the sentences we record | same voice on every phone | ~20 KB per sentence in the APK | yes — but it is the thing that does not scale |
| **The phone's speech engine** | every sentence, every imported module, unlimited | depends on the installed pack | 0 MB | **no** — Android installs voice data, not apps |
| **An on-device neural engine** (sherpa-onnx / Piper) | unlimited, offline | studio-grade, one voice forever | ~64 MB for a Dutch voice (`vits-piper-nl_NL-*`) | only as a native plugin plus a model download |

### The phone's engine is the general answer

The app already speaks every sentence it has, forever, through Android's TTS engine; the
recordings are just a better-sounding fallback for the first units. Nothing limits the app
to 121 sentences — 1 000 imported sentences get 1 000 spoken sentences.

The catch is the **voice pack**, and it is not app data:

1. It lives inside a text-to-speech engine (usually Google's), is downloaded once, is
   shared by every app on the phone, and works offline afterwards.
2. No app can install it silently — Android shows the prompt and the user confirms. That
   is what `TextToSpeech.openInstall()` opens, and if the engine has no installer the app
   hands over to the engine's Play Store page.
3. Without it Android does not go silent; it reads Dutch in the default (often English)
   voice. That is why the app checks first.

### Sound versus silence: the English fallback

A learner can explicitly allow "English voice as a last resort"
(`settings.approximateVoice`, on by default). The app then speaks with whatever voice the
engine has and marks the result as approximate: one toast the first time, and a gold
`approximate` pill in Settings → Voice instead of a red `missing` one. Turn it off and the
app stays silent and says why. It is a deliberate trade — the vowels are wrong, and
hearing wrong vowels is still better for reading practice than a button that does nothing
— but it is never silent about being approximate.

### If even that is not enough

Any TTS engine Android is set to will be used, including third-party offline engines that
ship their own Dutch neural voices (sherpa-onnx builds, RHVoice). Nothing in the app assumes
Google. A future build can bundle that path directly — a ~64 MB Piper Dutch model plus a
native plugin would give one studio voice for unlimited sentences, with no per-sentence
recording ever again. That is the honest "download a Dutch pack for this app" answer; it is
a native change, so it needs a rebuild and a model download of that size.

## Recording the rest, in batches

Ten clips per pass is the honest rate for the current pipeline:

1. generate the ten clips for the next unit in curriculum order;
2. rename them to `nl-basis__<unit>__<item>.mp3` (double underscore, no path);
3. `node scripts/audio-index.mjs`;
4. `npm run build`, commit, push — the APK carries them and coverage moves.

Unit 3 (*Wonen*) is next: `s021`–`s030`.
