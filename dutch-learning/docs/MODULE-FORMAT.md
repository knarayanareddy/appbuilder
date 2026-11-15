# Module format

A **module** is a JSON file with a handful of units of bilingual sentences. It is the
only thing the app needs to teach a new subject — or a new language. Built-in Dutch is
just the first module, written in the same shape.

## Shape

```json
{
  "schemaVersion": 1,
  "id": "nl-werk",
  "language": "nl",
  "title": "Nederlands op het werk",
  "description": "Work Dutch: meetings, email, asking people to repeat things.",
  "author": "you",
  "units": [
    {
      "id": "overleg",
      "title": "Overleg",
      "blurb": "Meetings and standups.",
      "level": "A2",
      "tip": "Separable verbs split: uitleggen → Ik leg het uit.",
      "items": [
        {
          "id": "w001",
          "text": "Kunnen we het overleg verplaatsen?",
          "translation": "Can we move the meeting?",
          "literal": "Can we the meeting dis-place?",
          "tags": ["modal", "question"],
          "tip": "verplaatsen = to move (a meeting), like verhuizen for houses."
        }
      ]
    }
  ],
  "stories": [
    {
      "id": "standup",
      "title": "De standup",
      "situation": "Monday morning, the team is late.",
      "lines": [
        { "speaker": "Collega", "text": "Zullen we beginnen?", "translation": "Shall we start?" }
      ]
    }
  ]
}
```

## Rules the importer enforces

| Field | Requirement |
| --- | --- |
| `schemaVersion` | must be `1` (omit it and it is assumed) |
| `id` | lowercase letters, digits, `.`, `_`, `-`; 1–40 characters. Must be unique — importing the same id again replaces that module |
| `language` | a code: `nl`, `en`, `es`, `de`, `fr`, `it`, `pt`, `ja`. The TTS locale is derived from it |
| `title`, `description` | plain text, both required |
| `units[].id` | unique inside the module |
| `units[].level` | `A1`, `A2` or `B1` |
| `units[].items[].id` | unique **inside the module** — see the warning below |
| `units[].items[].text` | the sentence in the language being learned |
| `units[].items[].translation` | English (or your own language) |
| `literal` | optional word-for-word gloss; keep it clumsy on purpose |
| `tags` | optional. Preferred: `v2`, `inversion`, `question`, `negation`, `modal`, `de/het`, `separable`, `participle`, `subordinate`, `time`, `formal`, `telefoon` |
| `tip` | optional one-line note, shown when a card is missed |
| `stories` | optional; each needs at least one line |

Errors are reported with the unit title and item number, so a broken file tells you
which sentence to fix rather than "invalid input".

## Item ids are load-bearing

Progress is stored against `moduleId/unitId/itemId`. Changing the **text** of an item
keeps its history; changing or reusing its **id** for a different sentence inherits
history that belongs to another sentence. When you revise a module, keep ids stable and
only add new ones.

## Import

**Settings → Modules → paste the JSON → Add module**, or **From file** for a `.json`.
The module appears in Learn immediately, with its own units and stories. Remove it again
with **Remove** (progress is kept, the sentences are not).

## Export and edit

**Settings → Modules → Export** writes the module back out as JSON, built-in Dutch
included. The fastest way to make a variant is to export, rename the `id`, and edit.

## Multiple languages

Nothing in the app knows the word "Dutch": the drill engine reads the sentence, the
translation and the language code. Import `es-basis` and Spanish appears next to Dutch;
switch which language the voice uses in Settings. Sentiment for grammar tags is shared,
which is why tags are a fixed vocabulary — a Spanish module can use `subordinate` too.
