# Ask an AI for a module

Copy the block below into any capable model, fill in the two lines at the top, and
paste the JSON back into **Settings → Modules**. No code, no repository access, no
credentials — the module format is the interface.

---

You are writing a lesson module for a Dutch-learning app used by an adult living in
the Netherlands. Output **only** valid JSON in the schema below — no prose, no markdown
fences.

**Subject:** `<e.g. dealing with a Dutch landlord, or: Spanish for a week in Valencia>`
**Target language:** `<nl | es | de | fr | it | pt | ja>` **Level:** `<A1 | A2 | B1>`
**How many sentences:** `<e.g. 24>` **Units:** `<e.g. 3 units of 8>`

Schema:

```json
{
  "schemaVersion": 1,
  "id": "<language>-<topic>, lowercase, dashes, max 40 chars>",
  "language": "<code>",
  "title": "<short title>",
  "description": "<one sentence>",
  "author": "<you>",
  "units": [
    {
      "id": "<lowercase-dashes>",
      "title": "<short>",
      "blurb": "<one line: what this unit lets the learner do>",
      "level": "A1",
      "tip": "<one grammar note, max 25 words>",
      "items": [
        {
          "id": "<topic>001",
          "text": "<sentence in the target language, ends with . ? or !>",
          "translation": "<natural English>",
          "literal": "<word-for-word English gloss>",
          "tags": ["<from: v2, inversion, question, negation, modal, de/het, separable, participle, subordinate, time, formal, telefoon>"],
          "tip": "<optional: one line on the trap in this sentence>"
        }
      ]
    }
  ],
  "stories": [
    {
      "id": "<lowercase-dashes>",
      "title": "<short>",
      "situation": "<one line>",
      "lines": [{ "speaker": "<name>", "text": "<line>", "translation": "<English>" }]
    }
  ]
}
```

Rules, all of which the app checks:

1. Every sentence must be something a person would actually say or hear in that
   situation. No textbook filler, no sentence written to show off a tense.
2. `image` is optional and should be rare: only for sentences whose meaning is a concrete
   object or scene. Omit it for anything abstract; a picture that can be recognised
   without reading the sentence teaches the picture instead of the language.
3. `literal` is a deliberately clumsy word-for-word gloss ("how goes it with you"), not
   a second translation. It exists to make word order visible.
3. Item ids are unique inside the module and never reused for a different sentence —
   progress is stored against them.
4. Only use tags from the list above.
5. Sentences must be correct at the stated level: no subordinate clauses at A1 unless
   they are the whole point of the sentence, and no rare vocabulary without a `tip`.
6. Keep sentences short enough to type on a phone: under ~60 characters.
7. Include at most one story, 5–7 lines, at the natural speed of that situation.
8. Output nothing but the JSON object.

---

## Model-specific notes

- **Smaller / cheaper models** often invent tags or drop `literal`. Ask again with:
  "Your last answer used the tag `verb-second`; use only the tags listed."
- **Long outputs** get truncated. Ask for one unit at a time, then merge the `items`
  arrays yourself.
- **ChatGPT / Claude / Gemini** all handle this well at 20–30 sentences. Beyond that,
  ask per unit — truncation is the usual failure, not schema errors.

## Check it before importing

```bash
node -e "const m=require('./my-module.json');console.log(m.units.map(u=>u.items.length))"
```

Paste into **Settings → Modules**; the importer lists exactly which unit and item is
wrong if something is off.
