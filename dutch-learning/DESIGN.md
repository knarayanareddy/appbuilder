# Dutch from English — the design

A language app that teaches Dutch (NL) with English translation, on an Android phone.
This document is the design, not the build. It is opinionated on purpose: a language app
fails from having too many features, not too few.

---

## 0. The verdict in six lines

1. Build a **sentence-based spaced-repetition system with four skills around each sentence**
   (understand, produce, hear, say), not a course of grammar lessons.
2. Teach **Dutch sound-to-spelling first**. Dutch is unusually regular once you know the
   rules; English speakers who skip this read Dutch wrong forever.
3. Spend the "fun budget" on **short sessions and visible progress**, not on points.
4. Speech in: **TTS out is free and offline** (Android's Dutch voice). Speech in is the hard
   part — solve it with **vocabulary-constrained offline ASR**, not open dictation.
5. Translation is a **scaffold, not the lesson**. English is available on every card, but the
   default drill hides it.
6. The app cannot make you speak Dutch. It can make you **ready to**, and it should push you
   into Delft for the rest — that is a feature, not a disclaimer.

---

## 1. What actually causes learning

Five mechanisms have repeatable evidence behind them. Everything in the app must serve one:

| Mechanism | What it looks like in the app |
|---|---|
| **Spaced retrieval** (testing effect + spacing effect) | Every item is a card with a due date; you answer *before* you see the answer |
| **Desirable difficulty** | Typing the sentence, not recognising it; cloze with 2 blanks; audio before text |
| **Interleaving** | Mixed review (old + new + weak) rather than blocked "unit 3 practice" |
| **Comprehensible input** | Sentence sets you understand ~80% of, with one unknown element |
| **Output with feedback** | Production (typing/speaking) graded immediately, with the *difference* shown |

Two more that matter for Dutch specifically: **frequency-first vocabulary** (the top ~1,000
words cover the large majority of everyday speech) and **early pronunciation**, because Dutch
orthography gives you a second chance at correct sound that English does not.

Deliberately *not* in that list: streaks, XP, leagues, cartoon mascots. They raise engagement
and measurably do **not** raise proficiency. Keep only what supports adherence: a daily goal,
a "reviews due" number, and no punishment for a missed day.

---

## 2. What the best apps get right

| App | The one thing worth copying |
|---|---|
| **Anki** | The scheduler is the product. Cards are yours, sentences carry context, and you can see retention |
| **Pimsleur** | Audio-first production: you speak before you see. Graduated interval recall by ear |
| **LingQ / Clozemaster** | Learning from real sentences in the target language, unknown words highlighted |
| **Language Reactor** | Mining sentences from subtitles you were going to watch anyway |
| **Speechling** | Pronunciation with someone actually listening; imitation as a drill |
| **Duolingo** | The onboarding and the 3-minute session. Adherence mechanics, not pedagogy |
| **Busuu** | Getting corrected by humans you never meet |
| **italki / tandem** | The only thing that reliably fixes speaking: a person |

The design below is, bluntly: **Anki's scheduler + Pimsleur's audio drills + Clozemaster's
sentence mining + Duolingo's session shape**, with humans kept where they belong — outside.

---

## 3. Where Duolingo-class apps fail a Delft resident

- **Recognition ≠ production.** You can tap "de fiets" for a year and still not order coffee.
- **Word order is treated as vocabulary.** Dutch's V2 rule and its subordinate-clause order are
  the single largest source of "I know the words but the sentence is wrong".
- **No pronunciation gradient.** Dutch has sounds English lacks (ui, eu, ij, uu, sch, g). Errors
  here are the difference between understood and "sorry, English?".
- **They never leave the app.** In the Netherlands, everyone switches to English the moment you
  hesitate. The app must prepare *specific* encounters, because generic practice loses to that.
- **Grammar without pattern.** Dutch grammar is small and pattern-based (this is a Category I
  language for English speakers). Rules + drills beat explanations of rules.

---

## 4. The core loop (one screen, 15–20 minutes)

```
┌─────────────────────────────────────────────┐
│  Today: 34 reviews · 8 new · 3 weak spots    │  ← one number that matters
├─────────────────────────────────────────────┤
│  De fiets staat achter het station.          │  sentence card
│  🔊 [play]                                   │
│  ____ fiets staat achter ____ station.       │  cloze in context
│  [type] [speak] [skip] [why?]                │  four ways to answer
├─────────────────────────────────────────────┤
│  ✓ de / het   ✗ separable verb   ⇄ EN on/off │  immediate, specific feedback
└─────────────────────────────────────────────┘
```

Session shape: **70% due reviews, 20% new, 10% weak spots** — the 10% is what makes it feel
like a tutor rather than a deck. Never show a word without a sentence. Never show a sentence
you can't hear. "Why?" always answers with the rule and two contrastive examples.

---

## 5. Curriculum, A0 → B1, in the order that unlocks speech

Cumulative guided hours from zero, by the standard estimates: **A1 90–100h, A2 180–200h,
B1 350–400h** (Cambridge/ALTE; Dutch has no official figures, FSI puts Dutch at ~24 weeks
full-time). At 20 min/day that's ~120h/year, so **A2 in about a year, B1 in ~2.5–3 years** —
or **B1 in ~14 months at 45 min/day**. The app must therefore be honest about pace and refuse
to sell "fluent in 30 days".

| Stage | Weeks (at ~30 min/day) | Exit ability |
|---|---|---|
| **0. Sounds** | 1–2 | Read any Dutch word aloud approximately right; hear the difference between ui/eu/u, g/ch, aa/a |
| **1. Survival A1** | 2–12 | Introduce yourself, numbers/time, shop, directions, understand slow speech |
| **2. Everyday A2** | 12–40 | Past tense, plans, housing, GP, gemeente, work small talk, simple phone calls |
| **3. Independence B1** | 40–120 | Opinions with reasons, longer listening, subordinate clauses, natural particles, news headlines |

**Grammar spine** (each item gets pattern drills, not a lecture):
V2 word order → yes/no and wh-questions (inversion) → negation (niet/geen) → de/het + plural →
present perfect (hebben/zijn) → modal verbs → separable verbs → subordinate clause order
(omdat/als/toen/dat) → simple past of strong verbs → er + quantitative er → diminutives →
comparatives → passive reading → relative clauses.

**Vocabulary**: top ~1,000 word families by frequency (spoken-first), introduced *inside
sentences*, with themed additions that matter locally (housing, gemeente, healthcare,
supermarket, cycling, work). Cognates (water, hand, huis, fiets… ) are a free multiplier and
get their own fast lane.

---

## 6. Dutch traps that deserve their own drill type

| Trap | Drill |
|---|---|
| **de / het** | Article-only cards in context + rule hints (diminutive → het, -ing/-heid/-ie → de, plural → de) |
| **V2 / inversion** | Given a sentence and a fronted time phrase, produce the reordered sentence ("Morgen **ga ik**…") |
| **Separable verbs** | Transformation pairs: "Ik bel je op" ↔ "Ik heb je opgebeld" |
| **'t kofschip** | Past participle production from the infinitive, with the rule surfaced after mistakes |
| **Modal particles** (maar, even, toch, hè, nou) | Contrast pairs: what changes if you remove it? This is the difference between textbook and native |
| **Register** (jij / u) | Same sentence, both forms |
| **Sounds** (ui, eu, ij/ei, uu, sch, g, r) | Minimal-pair listening first, then speaking |

Regional note: Delft is Randstad (Hollandic) — hard *g*, "niet" with a clipped vowel, and
plenty of English switching. Stick to standard NL Dutch, add a "what you'll actually hear"
note on cards rather than regional drill variants.

---

## 7. Speech: cheap out, and constrain the hard part

**Out (listening): solved offline and free.** Android's `TextToSpeech` has an nl-NL voice on
essentially every device; it works offline and costs nothing. Per-card audio is generated once
and cached. For a single consistent "teacher voice", pre-generate with a Piper Dutch voice and
ship the clips (~30–80 KB per sentence at 24 kbps Opus; 1,000 sentences ≈ 40 MB, which is why
TTS-at-runtime is the default and pre-generated audio is an option).

**In (speaking): the constraint is what makes it work offline.** The Vosk Dutch small model is
**39 MB, Apache-2.0**, and reports **22–26% word error rate** on free speech — useless for
grading an open answer. The trick: **pass the expected words as the recogniser's grammar.**
Vosk accepts a restricted vocabulary per recogniser, and with a 3–8 word target the effective
accuracy becomes good enough to say "you said *het* instead of *de*" or "that ui came out as
oe". Feedback is then *targeted at the Dutch sounds*, not at general transcription:

- **Minimal pairs** (ui/oe, eu/u, ij/ee): pick which you heard, then say it and check.
- **Shadowing**: play the sentence, you repeat, we compare at word level.
- **Read-aloud**: the card's own sentence, graded against its own text.

Explicitly not built: free conversation with the app. A 39 MB model cannot hold a conversation,
and pretending otherwise is the failure mode of every "AI tutor" app.

---

## 8. Translation to English: scaffold, not crutch

Three layers, all offline:

1. **Gloss** on every card: the English sentence, plus a literal word-by-word line under the
   Dutch (this is what teaches Dutch word order — the literal line looks wrong and that's the
   lesson).
2. **Word lookup**: a bundled Dutch→English lexicon for the covered vocabulary (curated from
   Wiktionary, CC-BY-SA) with gender, plural, and the part of speech — a few MB compressed.
3. **Free-text translation**, optional: ML Kit on-device translation (nl↔en) once its model is
   downloaded over wifi (~30 MB). This is the only piece that touches the network at all, it
   happens once, and it is skippable. Everything else works with the phone in aeroplane mode.

Why not bundle a neural translation model? A usable nl→en NMT is 100–300 MB and would double
the APK, to answer a question the gloss already answers. Not worth it.

---

## 9. Content: where the sentences come from

| Need | Source | Licence |
|---|---|---|
| Dutch↔English sentence pairs | **Tatoeba** (hundreds of thousands of nl/en pairs) | CC-BY 2.0 FR — attribution |
| Frequency ranking | OpenSubtitles/NT2 word lists | attribution per source |
| Definitions, gender, plurals | **Wiktionary** (nl + en) | CC-BY-SA |
| Real-world tasks | written by hand, Delft-flavoured (markt, gemeente, huisarts, TU, café) | ours |

A pipeline turns these into cards: filter to sentence length 4–12 words, rank by covered
vocabulary, attach frequency position, tag grammar patterns automatically (articles, V2,
separable verbs, participles), deduplicate near-identical sentences, and pick one sentence per
word for introduction. Target: **~1,200 core sentences** for A0→A2 (that is the whole product;
everything else is polish), then another ~1,500 for B1.

---

## 10. Data model and scheduling

```
Lexeme   id, dutch, english[], pos, gender, plural, frequencyRank, audioKey
Sentence id, dutch, english, literalGloss, lexemeIds[], patternTags[], audioKey, source
Card     id, kind(card sentence|cloze|listen|speak|article|pattern), sentenceId,
         stability, difficulty, dueAt, reps, lapses, state, leech
Attempt  id, cardId, at, kind, correct, latencyMs, typedAnswer, audioScore, mistakeTag
Mission  id, title, prompt, phrases[], doneAt, note
```

Scheduler: **FSRS** (open-source, better calibrated than SM-2), target **90% retention**,
`desiredRetention` adjustable, new-card cap per day. Leech handling: after 4 lapses a card is
suspended and *re-built* (new sentence, same lexeme) rather than shown again — the card was the
problem, not the learner. Everything is local: one SQLite database plus audio files, no
account, no server. A JSON export/import for backups, exactly like the bike app.

---

## 11. Architecture — reuse what already works here

The Android pipeline in this repo is already solved and proven: Capacitor shell, offline store,
CI that builds the APK, **one pinned signing key so upgrades never wipe data**, a fixed
download link. That is the difference between "a design" and "installable on your phone next
week", and it should be reused rather than rebuilt.

- **Shell**: Capacitor + React + TypeScript, 100% offline, `dist` bundled in the APK.
- **Storage**: SQLite via a Capacitor plugin (10k sentences + scheduling history is a database,
  not localStorage); audio as files in app storage.
- **Speech out**: Android `TextToSpeech` (nl-NL) through a small local Capacitor plugin.
- **Speech in**: `vosk-android` (39 MB model, packaged as an APK asset, unpacked on first run)
  through the same local plugin. This is the one genuinely new native piece, and it is
  milestone 4 — behind the whole offline core, not in front of it.
- **Translation**: ML Kit on-device, optional, wifi-only model download.
- **CI**: the existing workflow pattern — typecheck, lint, tests, build, sign, release.

Risks worth naming now: Vosk's model-packing adds ~56 MB to the APK (§20) and needs an
`unzip`-on-first-run step; constrained-grammar accuracy on a phone speaker must be *measured*
on your voice before pronunciation grading ships; ASR plus TTS in one app wants microphone
permission, which is a one-time prompt you should see explained in-app.

---

## 12. What this app will not do (and shouldn't pretend to)

- **Get you to B2 alone.** ~500–600 hours; the app is the spine, not the whole.
- **Fix speaking.** Shadowing and minimal pairs fix *sounds*. Fluency needs a person — the app's
  job is to make your first 100 conversations cheaper, and to send you to one weekly.
- **Grade free speech.** Constrained vocab only. No fake conversation partner.
- **Replace a course for inburgering.** B1-route integration has its own requirements (600 NT2
  hours at a qualifying provider under Wet inburgering 2021). The app can prepare and drill, not
  certify — if this is the goal, that changes the plan and I need to know.
- **Guarantee Dutch-only input.** At A0, glossed English is faster. It tapers: English fades out
  by B1 by design, not by accident.

---

## 13. Metrics that matter

Tracked locally, shown as one honest screen:

- **True retention** (percent correct on cards *not* seen in the last 7 days) — target ≥85%.
- **Reviews due vs done** — adherence, the only thing gamification was ever good for.
- **Words in "known" state** (stability > 21 days) — the closest thing to a progress bar.
- **Speaking attempts per week** with audio score trend.
- **Mistake tags over time** (V2, de/het, participles) — the curriculum should visibly bend.

Vanity metrics to refuse: XP, minutes-in-app, streak length as a headline, "lessons completed".

---

## 14. The plan — five shippable milestones

| # | Milestone | What you can do at the end | Effort |
|---|---|---|---|
| **M1** | **Offline core**: FSRS scheduler, 300 core sentences with TTS audio, sentence + cloze + typing drills, glosses, daily session, local stats. Seed corpus weighted to inburgering themes (gemeente, wonen, huisarts, werk, boodschappen, KNM) | Learn 300 real sentences; app works with no network | 1–2 weeks |
| **M2** | **Dutch traps**: de/het, V2/inversion, separable verbs, participles, minimal-pair listening; mistake journal | Fix the errors English speakers actually make | 1 week |
| **M3** | **Input**: 1,200 sentences, graded listening (speed-controlled), reading sets, English fade-out curve | Understand slow Dutch, not just drill it | 1–2 weeks |
| **M4** | **Speaking**: Vosk plugin, constrained grammar, shadowing, minimal-pair production, pronunciation screen | Practise saying words and hear what was wrong | 2 weeks (highest risk) |
| **M5** | **The real world**: missions (market, gemeente, GP, café), weekly "speak to a human" ritual, export your phrasebook | Use Dutch outside the app | 1 week |

M1 is the whole bet: if the session is not something you want to open on day 6, no amount of
M4 rescues it. So M1 ships first, small, with the existing CI and install link.

### Adjusted for your answers (A1 start · inburgering/NT2 · optional online input)

- **You are not at zero**, so the A0 phase is dropped, not the sounds work: M1 opens with
  survival consolidation and pronunciation repair inside the sentence drills rather than a
  separate alphabet module. The clock starts at the A1 benchmark (~80 guided hours), not at zero.
- **An exam is the target**, so the curriculum bends in three places: (1) the M1 seed is
  deliberately exam-weighted — gemeente, wonen, huisarts, werk, boodschappen, plus KNM-style
  "how it works here" sentences; (2) M2 grows an **exam module** — inburgering exam formats
  (lees/luister/schrijf/spreek tasks, KNM questions) on top of the grammar traps; (3) the M3
  input hours are trimmed, because exam preparation rewards task formats as much as raw input.
- **Optional online input is allowed**, so M3 may fetch news/subtitles on demand. Nothing in
  M1 goes near the network: the corpus and the scheduler are local, and audio is the phone's
  own voice.
- **Order stays**: M1 now, then the exam module, then input, then speaking.

---

## 15. Decisions (answered)

| Question | Your answer | What changed in the build |
|---|---|---|
| Starting point | **A1-ish survival Dutch** | A0 phase dropped; M1 starts at survival consolidation with pronunciation repair inside sentence drills |
| Goal | **Inburgering / NT2 exam** | Exam-weighted seed corpus (KNM included); exam-task module added to M2; M3 input hours trimmed |
| Daily time | 15–20 min implied; app default **6 new sentences/day**, adjustable 0–40 | New-card cap is a setting, not a promise |
| Offline strictness | **Core offline, optional online input allowed** | M1 touches no network at all: local corpus, local schedule, the phone's own Dutch voice. Fetching arrives in M3 only |
| Build order | **Start M1 now** | M1 built first, small, behind the existing CI + install-link pattern |

Still open, and deliberately so: the **exam date** (it sets whether M2's exam module runs before
or after M3's input) and **which exam** — inburgering (A1 buitenland / B1 route) versus
Staatsexamen NT2 Programma I (≈B1). Programme I is the harder, more useful target; the drills
are the same shape either way, only the pass bar moves.

---

## 16. What has shipped

**M1 — offline core.** FSRS scheduler, 121 exam-weighted sentences, six drill types, daily
session, honest stats, IndexedDB persistence with record repair, backup/restore, pinned APK
signing and a CI-released install link.

**M2 — the app becomes programmable and varied.** Two changes matter more than the count:

- **Content is a module, not code.** `schemaVersion 1` JSON with units, items, literal
  glosses, grammar tags and dialogues. Validated on import, exports back out, migratable
  across languages. A model can write one from `docs/AUTHORING-PROMPT.md`, and the app
  treats it exactly like the built-in Dutch — because the built-in Dutch *is* one.
- **No ceiling.** The daily pace paces only the daily session. Practise, Quiz and unit
  drills are unlimited by construction; a quiz records answers without corrupting the
  schedule; mistakes get their own queue. A learning app that says "come back tomorrow"
  is optimising for retention of the app, not the language.

The ladder also gained the drills that make short sessions productive: multiple choice,
word-bank sentence building, and a per-unit path with per-unit progress.

**M2.5 — it has to feel like an app.** The first build was honest and looked like a
settings page: flat cards, system fonts, no motion, no hierarchy. The rebuild is a design
system rather than a coat of paint — a bundled rounded typeface, tactile buttons with a
physical bottom edge, an orange accent that only marks the next action, a unit path with
state badges, full-screen sessions with a bottom action bar, chat-shaped dialogues, a
celebration screen with a ring and confetti, and micro-motion on every state change. The
rule used throughout: colour means something (orange = do this, teal = you got it, rose =
fix it), and nothing decorative is allowed to compete with the sentence being learned.

Still open by design: speech recognition (M4) stays behind the offline core, and the exam
module (inburgering task formats + KNM questions) is the next content milestone.

## 17. First run, two palettes, and units that look like places

§M2.5 fixed how the app looks once you are inside it. This closes the three gaps that
still made it feel like a prototype handed over mid-build.

**First run.** The old build opened on a dashboard with a full unit path, a streak and a
settings tab: technically complete, emotionally as welcoming as a spreadsheet. There are
now three screens — what this is, how much Dutch you already have, and whether the phone
can actually speak Dutch — and each one changes the app, it does not just describe it.
The level question sets `dailyNew` (8/10/12/14), which is the one number that decides how
the next month feels. The voice screen is the app being honest before it is charming: no
Dutch engine means an English voice butchering every sentence, so the installer is offered
on the spot. The last button can start a 12-question placement check; a correct answer
there schedules the sentence at review rung 3 instead of teaching it again, which is how
you avoid re-drilling "goedemorgen" for a week. Existing installs are migrated as
already-introduced — a welcome screen is for people who have not been here before.

**Two palettes.** Light mode is not a second stylesheet. The dark palette had whites
hard-coded into surfaces, so those became `--tint-1`, `--tint-2`, `--nav-bg`,
`--app-frame`, `--toast-bg`; then `[data-theme="light"]` overrides the tokens and the
handful of places where a dark-palette colour was text on a light background (`.streak`,
`.kind-chip`, `.speaker`, verdicts, tokens). The theme is one attribute on `<html>`,
`"system"` follows the OS live through `matchMedia`, and the meta `theme-color` is repainted
with it. Text contrast was measured, not eyeballed: light `--dim` at `#667190` is 4.85:1 on
white, 4.49:1 on the app background, and `--muted` is 6.26:1.

**Feedback.** A correct answer gets a quiet rising two-note tone, a wrong one a soft low
thud, and a finished session a four-note arpeggio — all synthesised with WebAudio at
runtime, so there is no new asset, no licensing, and the APK does not grow. Haptics go
through `@capacitor/haptics` on a phone (`ImpactStyle.Light`, `NotificationType.Error`) and
`navigator.vibrate` in a browser; the manifest now declares `VIBRATE`. Both channels are
switchable in Settings, and both are quiet by design: this app does not have a reward
sound, it has a confirmation sound.

**Unit art.** Emoji and stock icons were the last thing making the path look like a
settings menu. `src/components/unitArt.tsx` draws seventeen small scenes — two speech
bubbles, a shopping bag, a Delft-ish windmill, a heart with a pulse — as inline SVG: a
tinted squircle, two or three shapes in one hue, and `currentColor` everywhere, so they
recolour with the theme and cost nothing to load. Completed units get a green check on the
corner of the art, untouched ones sit at 55% opacity, and the story nodes have their own
scene. An unknown module id falls back to a generic pair of shapes rather than breaking.

## 18. The premium pass: why it looked machine-made, and what replaced it

The complaint was that the interface "screams AI generated". That is a real, documented
failure mode rather than a matter of taste, and it has named causes: a model with no
committed direction returns the statistical average of its training data — the purple
gradient, the grey 1px border on every card, the gradient badge above a headline, the
row of three identical feature cards, the playful bounce. The fix is not a better
adjective, it is a decision: lock the tokens, cap the palette, pick a real type scale,
default to borderless, and measure contrast.

This version commits to **one ink, one accent, type-led hierarchy** — the Apple-shaped
answer, because that is what "polished and premium, think Apple" means in practice.

**What came out** (each was a tell):

| Removed | Why it read as generated |
| --- | --- |
| Orange→rose→violet CTA gradient | multi-hue gradients are the single most reliable tell |
| Radial colour glows on the page background | neon-on-dark decoration nobody asked for |
| 3px hard "press edge" under every button | game-app skeuomorphism, not depth |
| Confetti on the summary | celebration as noise; the number is the reward |
| Per-mode icon colours (violet/teal/rose) | four hues doing no work; colour is for state |
| Seventeen coloured unit illustrations | a rainbow list reads as unedited output |
| Emoji-adjacent badges above every headline | the "gradient badge above the H1" pattern |
| Nunito, bundled | a friendly display face fighting the platform; the system font is the premium choice |
| Fake phone bezel note on desktop | decoration standing in for layout |

**What replaced it:**

- **Surfaces.** `#000` canvas, `#1c1c1e` surfaces, `#2c2c2e` controls (dark); `#f2f2f7`,
  `#fff`, `#e4e4ea` (light) — Apple's grouped-background values, which is why light mode
  reads like Settings rather than an inverted dark theme. No gradients on chrome, ever.
- **Type.** The iOS scale (34 / 28 / 22 / 17 / 15 / 13 / 12 / 11) with tracking
  `-0.028em` at display sizes tapering to `0` by footnote. Body is 17px — Apple's
  legibility floor — so the previous 15px body is gone. The system stack means SF Pro on
  iOS and Roboto on Android, both of which a bundled font cannot beat for "native".
- **Structure.** Hairline separators inside grouped containers instead of a border on
  every card; the unit path is now an inset list with 76px rows, art on the left and a
  4px progress bar; the three practice modes became one grouped list with trailing
  metadata instead of three identical cards, and the three headline statistics became a
  single card split by hairlines; the tab bar is 49pt with `backdrop-filter: saturate(180%) blur(24px)`
  and a hairline top edge; the active tab gains weight via stroke-width, not a filled
  shape, because this icon set is drawn for strokes.
- **Colour discipline.** One accent (`#ff7a45`), three semantics (`#30d158` green,
  `#ff453a` red, `#ffd60a` amber), and nothing else. Semantic colours appear only as
  status pills and verdict panels, always as a 12–16% tint behind text, never as a fill.
- **Motion.** One curve, `cubic-bezier(.32,.72,0,1)`, 160–240ms, scale 0.975 on press.
  No bounce, no entrance animations, and `prefers-reduced-motion` disables the rest.

**Verification.** There is no headless browser in this environment, so the pass was
checked the way a stylesheet can be: every selector from the previous sheet exists in the
new one (scripted diff — 177 selectors, 0 meaningful omissions), every `var(--token)` used
in TSX is defined in CSS (scripted check — 0 missing), contrast computed numerically
(dark `--label-2` 6.2:1 and `--label-3` 4.6:1 on `#1c1c1e`; light `--label-2` 6.3:1 and
`--label-3` 4.7:1 on white — Apple's own tertiary label sits at 3.4:1 and is pushed up
here deliberately, because a 12px uppercase section header is not large text; accent ink
on accent 7.4:1 dark / 6.1:1 light),
typecheck clean, 89 tests, production build green. The one thing pixels would catch that
maths cannot is optical spacing, which is the next thing to eyeball on a device.

## 19. Pictures, flashcards, and whether this is the best combination

The question was whether to add pictures or flashcards, or whether the six drills are
already the right answer. Both exist now, but not as equal citizens, and the reasoning is
worth writing down because it decides what gets added next.

**What the evidence actually says.**

- *Testing beats restudying.* Retrieval practice produces substantially better retention
  than re-reading (Roediger & Karpicke). The six rungs are all retrieval except the first,
  which is why the deck is a review surface and not the main path: a flip card you grade
  yourself is weaker evidence than an answer that was checked.
- *Spacing beats massing,* and FSRS already models it. A "flashcard app" is mostly a
  scheduler; that part was never missing.
- *Pictures help encoding of concrete words* (dual coding, picture superiority), **and they
  can replace the thing being learned**: an image-cued card is passable by recognising the
  image, and the recall does not transfer to production. That failure mode is the reason
  pictures are support here, never the prompt.
- *Production needs output, not recognition.* The goal is B1 inburgering: speaking and
  writing under time pressure. Image multiple-choice trains the weakest of those.

**What shipped.**

1. **A flashcard deck** (`mode: "cards"`). Front: Dutch + audio (+ picture if the item has
   one). Reveal: English and the literal gloss. Then two buttons, **Again** and **Good**.
   - It reviews what is due first (never squeezed out by the pace), then adds new material
     up to `dailyNew` — the same allowance the daily session uses.
   - Both grades feed FSRS (forgot → grade 1, good → grade 3) and move the rung, so a card
     graded Good in the deck is genuinely further along in the drills.
   - Attempts are recorded as `study`, which the stats code already excludes from *recall*.
     That is deliberate: a self-graded card must not inflate the one number that is
     supposed to be trustworthy.
   - Why have it at all, when the drills are better? Breadth and imported decks. A module
     written by someone else may not survive the rung ladder's assumptions, and sometimes
     you want to sweep 80 sentences rather than answer 80 questions.
2. **Picture cues as data** (`item.image`), shown on first exposure and in Words. Validated
   to relative paths, https, or inline images; everything else is rejected before it can
   reach an `<img src>`. Four built-in sentences have one, in the same two-tone flat style
   as the unit art, and the app is complete without a single image.

**What was deliberately not built.**

- A stock-photo deck. It costs megabytes, cannot be generated reliably for 121 sentences,
  and in the premium look of §18 it would be the loudest thing on screen.
- Picture-only multiple choice ("which is the bike?"). That is a vocabulary trainer, not
  an exam trainer, and it competes with the drills for the same minutes.
- A "study mode" that just shows cards forever. Recognition feels productive and isn't.

**What would genuinely improve the combination next,** in order of expected gain per
megabyte: (1) output practice with constrained ASR — now built, see §20, and the honest
verdict is that it checks words, not vowels; (2) listening in
noise and at natural speed, which is what the exam actually tests; (3) more recorded audio,
which is already the established batch process; (4) pictures, for the subset of concrete
nouns where the image narrows meaning — the field is now there, so this is content work,
not engineering.

## 20. Speaking: on-device recognition, and the limits that kept it honest

The `produce` rung always had a hole in it. Dictation proves you can hear a sentence,
cloze proves you know the word, but "produce this from the English" only ever proved you
could *type* it — which is not the exam, and not the point. The cheapest real fix was to
let the phone listen.

**Why Vosk and not the Web Speech API.** The WebView's `SpeechRecognition` is Chrome's,
which means it can send audio to Google's servers and, on Android, is occasionally not
present at all. `vosk-model-small-nl-0.22` (39 MB, Apache-2.0) runs in-process: no
network permission, no vendor account, nothing to be switched off. Offline-first was the
whole premise, so the model has to be in the APK.

**Where it lives.** A ~300-line local Capacitor plugin (`scripts/android-speech.mjs`
writes it into the generated project on every build, because the native project is a
build artifact). The model is fetched by CI, never committed. Vosk cannot read a
compressed asset, so the first `Say it` unpacks assets → the app's files directory once,
marked with a file; later launches load in under a second. The microphone is opened for at
most six seconds, closed on answer, on card change, and on unmount.

**Scoring is pure and dumb on purpose** (`src/lib/pronounce.ts`, nine tests). Normalise
(lowercase, strip punctuation and `de/het`-level filler noise), compare word arrays with
Levenshtein, and score `1 - (substitutions + deletions + insertions) / target.length`.
`≥ 0.95` is *good*, `≥ 0.55` is *almost*, anything else is a *miss*. The thresholds are
deliberately generous because a 40 MB model mishears roughly a quarter of clean words;
a stricter threshold would fail correct speech and destroy trust in the check.

**The failure contract, which is the actual design.** A recogniser that cannot run must
cost nothing:

- a miss **never** marks the card wrong — it shows *Heard: "…"* and leaves the card open,
  because a small model's miss is not evidence of a bad accent;
- *almost* grades the card correct with the `almost` flag, the same flag the typing
  tolerance path uses, so the scheduler hears "you probably can, prove it again sooner";
- no model, no microphone, no permission, or the browser build → the microphone card
  never renders, and the drill is exactly the app from before. `asr.ts` returns
  `{heard: "", ok: false}` for every failure rather than an empty success.

**What it still cannot do, said plainly.** It checks *which words came out*, not *how
they sounded*. `u` versus `ui`, long versus short vowels, stress and rhythm — a cheap
model simply does not encode those distinctions, and grading them would be a lie dressed
up as feedback. Free-speaking grammar checking needs a much larger model (300 MB+ and a
language model) or a cloud API; both break the offline, no-account promise, so neither is
here. The value it does deliver is behavioural: on the one rung where you are supposed to
*say* something, the app now expects you to say it.

**Cost, measured rather than estimated.** 4.9 MB → **61.1 MB**: 39 MB of model, ~17 MB of
Kaldi and JNA native libraries, and the web build. The first attempt shipped at 84 MB
because Vosk bundles four architectures and two of them are x86 — emulators, never phones —
so the Gradle config now limits the APK to `arm64-v8a` and `armeabi-v7a`. The rest of the
cost is a one-time unpack on first use and a `RECORD_AUDIO` permission requested only when
the learner taps *Say it*, with a refusal just hiding the button.
**Settings → Voice → Speech check** turns the whole thing off for anyone who would rather
just type.

## 21. Persistence: the checks that were missing, and what is still true

The question that produced this section: *does anything survive the app being closed, and
what else should be checked?* Two answers.

**What was already true.** State lives in IndexedDB inside the app's private WebView
storage, and every answer writes the schedule and the attempt **as it is answered**
(`saveCards` then `appendAttempt`), not at the end of a session. So a kill in the middle of
a session loses at most the card in flight, and there is nothing to flush on exit. The
attempts log is capped at 5,000 by design; cards, settings and modules are not. Installing
a newer APK over an older one keeps everything, because the signing key is pinned.

**What was not true, and is now.** Three silent failures, each of which would have looked
like the app working:

1. **The app could spin forever.** If `loadSnapshot()` rejected — damaged data directory,
   storage blocked — nothing caught it and the screen said "Opening your sentences…"
   indefinitely. The database open now has a six-second deadline and a `blocked` handler,
   and the App shows what happened with a *Try again*, plus the honest note that a reinstall
   fixes a damaged directory at the cost of progress.
2. **A refused write was invisible.** Success was taken from the request returning, not from
   the transaction committing, so a quota or eviction failure could report "saved" while the
   data was gone. Writes now resolve on `transaction.oncomplete` and reject on `onabort`;
   every save goes through one `persist()` wrapper in `App` that shows a red bar the moment
   something is refused, and clears it when a write succeeds again.
3. **Nobody checked whether storage worked at all.** `probeStorage()` writes a token, reads
   it back, and asks the platform for persistence and an estimate. Settings shows the result
   in words: *Saving on this phone · 48 KB in use*, or *Not saving: …*.

Around that: the backup card now reports how old the last export is (`backupAge`), nags once
there are 100+ attempts and either no backup or one older than 30 days (`backupIsStale`), and
records the date when you take one. The point is not the reminder — it is that a phone that
dies, or a data directory that gets cleared, is survivable only if a file exists somewhere
else.

**What is accepted, not fixed.** Uninstalling wipes progress. Android's *Clear storage* does
the same. A learner who never exports has one copy, on one device. The speech model's unpack
takes another 39 MB of app storage, which on a nearly full phone is precisely how a save
starts failing — which is why the refusal is now loud rather than silent.

**Verified rather than assumed:** `durability.test.ts` (probe success, a rejected write, a
store that reads back something else, size and age formatting, the nag threshold),
`repo.test.ts` (the backup date survives normalisation, and nonsense is dropped), and
`App.storage.test.tsx` (a broken open shows the recovery screen, not a spinner).
