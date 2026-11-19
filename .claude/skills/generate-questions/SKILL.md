---
name: generate-questions
description: Write the quiz questions of software-quizz for the concepts that are new or changed, then merge them into data/questions.json. Use when Adrien asks to generate, regenerate or update the quiz questions, or after a Notion sync brought new or edited sheets.
---

# Generate the quiz questions

The questions are written by you, in this session, from `data/concepts.json`. Code does the
rest: it finds what to (re)generate, validates your output, computes the ids, shuffles the
choices and applies French typography. Never edit `data/questions.json` by hand.

## Steps

1. Optional, if Adrien asks for fresh sheets: `npm run sync` (needs `.env`).
2. `npm run -s questions:plan` prints `toGenerate` (new or changed concepts), `toRemove`
   (concepts gone from Notion) and the content of each concept to write for. Only write for
   `toGenerate`: rewriting other concepts would change their question ids and reset the
   visitor's progress on them.
3. Write the drafts in `data/drafts/`, one JSON file per batch of about 8 concepts
   (`batch-1.json`, …). Each file maps a concept slug to its questions (format below).
4. `npm run questions:apply` validates and merges the drafts, removes the concepts that are
   gone, then deletes `data/drafts/`. If it fails, fix the draft it names and run it again.
5. `npm run check`, then show Adrien a short summary (questions per concept, a few examples)
   and let him read the diff of `data/questions.json` before any commit.

## Draft format

```json
{
  "solid": [
    {
      "kind": "multiple-choice",
      "prompt": "Quel principe SOLID demande qu'un module n'ait qu'une seule raison de changer ?",
      "choices": [
        "Single Responsibility",
        "Open/Closed",
        "Liskov Substitution",
        "Interface Segregation"
      ],
      "answerIndex": 0,
      "explanation": "Le S de SOLID : un module ne répond qu'à un seul acteur, donc n'a qu'une raison de changer."
    },
    {
      "kind": "true-false",
      "statement": "Selon le principe ouvert/fermé, on ajoute un comportement en modifiant le code existant.",
      "answer": false,
      "explanation": "C'est l'inverse : on étend le comportement avec du nouveau code, sans modifier l'existant."
    }
  ]
}
```

Put the right answer anywhere: the apply step shuffles the choices.

## How many questions

3 to 8 per concept (the apply step rejects anything else), depending on how much the concept
has to say: about 3 for a short concept with no definitions, up to 8 for one with several
definitions (SOLID, ACID, CQRS…). Mix kinds, with roughly two multiple-choice questions for
one true-or-false.

## What makes a good question

- Write natural, correct French, as a teacher would. Never paste a fragment of a sentence as a
  quote.
- Every question must make sense on its own: quizzes mix concepts and the site never shows
  which concept a question belongs to. Name the concept or its field in the wording ("En
  CQRS, …", "Dans une file de messages, …"), unless the question asks for that concept. Read
  each prompt as if it came out of nowhere: "Que se passe-t-il à l'état semi-ouvert ?" fails,
  "Un circuit breaker est à l'état semi-ouvert… Que se passe-t-il ?" works.
- Test understanding, not wording: what a concept is for, when to use it, how it differs from
  a related one, what a term means, a typical consequence. Avoid trivia such as dates or
  author names unless the sheet makes them central.
- Wrong choices must be plausible to someone who half knows the subject: other concepts,
  terms or consequences from the same field, of the same length and style as the right one.
  No joke answers, no "all of the above", no choice that gives the answer away by its length.
- A true-or-false statement is clearly true or clearly false for someone who knows the
  concept, never ambiguous. False statements are mostly near-misses: a swapped term, an
  inverted effect, the wrong concept's purpose. Keep true and false roughly balanced.
- The prompt must not contain the answer: when asking for a concept from its description,
  don't name it or its acronym in the prompt.
- The explanation says why the right answer is right in one or two sentences, and may say
  why a tempting wrong answer is wrong.
- You may use the related concepts (`relatedSlugs`, look their names up in
  `data/concepts.json`) for questions on how concepts relate.

## What you must not do

- Use only the fields of `data/concepts.json`: name, summary, tags, related concepts and
  definitions. Don't add facts from the Notion sheets or from your own knowledge that the
  concept doesn't support: the site only publishes these fields, and a wrong "fact" in a quiz
  is worse than a missing question.
- Never mention Notion, a sheet ("fiche"), the author, or any URL or id.

## Fixing existing questions

To reword questions of a concept that hasn't changed, write a draft for that concept with all
its current questions (from `data/questions.json`, in draft form), changing only the faulty
ones, then run `npm run questions:apply`. An id depends on the concept and the wording, so the
untouched questions keep their id and the visitor's progress on them.
