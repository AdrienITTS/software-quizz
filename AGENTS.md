# AGENTS.md

software-quizz is a public quiz site built from the "Concepts" library in Adrien's Notion
(Perso › Veille › Concepts). It is mostly for Adrien's own revision, and public as a showcase.
The plan and decisions live in Notion, on the page "Perso › Projets › software-quizz".

## Architecture

- Static site: Nuxt 4, pre-rendered by `nuxt generate`. No server, no database, no accounts.
  Quiz progress stays in the visitor's browser.
- Data is committed in `data/`: `npm run sync` exports the concepts from Notion, locally, and the
  `generate-questions` skill (`.claude/skills/`) has Claude write the questions in a session, on
  Adrien's subscription. The CI never talks to Notion or to a model: it builds from `data/`.
- The site must never let anyone trace back to Notion: no Notion token, page ID or URL in the
  repository or in the built site. The Notion token only exists in the local `.env`.
- Only these fields may be published: name, summary ("Résumé"), tags, related concepts, and the
  "Term: definition" bullets of the "Comprendre" section. Never code examples, opinions, status or
  "Passages brief".
- Domain logic (parsing, question generation) is pure TypeScript, tested with Vitest without Notion.

## Layout

- `shared/`: types used by both the build scripts and the site (`concept.type.ts`,
  `question.type.ts`).
- `scripts/sync-notion.ts`: the only code that talks to Notion. It reads the "✅ Rédigé" sheets,
  parses them and writes `data/concepts.json`.
- `scripts/notion/`: pure functions. The zod schemas in `parse-concepts.ts` are the allowlist of
  published fields: a field they don't declare never reaches the output. `find-notion-traces.ts`
  fails the sync if an id, a Notion URL or a token slips through.
- `data/questions.json`: the questions and, per concept, the hash of the content they were
  written from. `scripts/questions/question-bank.ts` (pure, unit-tested) plans which concepts are
  new or changed, validates the drafts written by the model (zod, 3 to 8 questions per concept;
  the same schema parses the committed bank), computes ids from the concept and the wording and
  applies French typography. Only changed concepts are rewritten: a new id resets the visitor's
  progress on it. Choices are stored as written; the site shuffles them at each game.
- `scripts/plan-questions.ts`, `scripts/apply-questions.ts`: the I/O around it. `data/drafts/`
  is git-ignored scratch space for the skill. `scripts/data-files.ts` reads and writes `data/`,
  and refuses to write anything that contains a Notion trace.
- `app/`: the quiz site. `app/data/quiz-data.ts` imports `data/*.json` at build time;
  `app/utils/quiz.ts` (pure, unit-tested) picks the questions of a quiz and turns every kind into
  one shape (prompt, quote, options, explanation), shuffling the choices. The draw runs in the browser, on mount, so the pre-rendered
  pages are the same for everyone.
- Progress: `app/utils/progress.ts` (pure, unit-tested) keeps one FSRS card per question id
  (`ts-fsrs`, short-term steps off, so intervals count in days; right = Good, wrong = Again) and
  the last sessions. `app/composables/useProgress.ts` is the only code that touches
  `localStorage` (key `software-quizz:progress`, `version: 1`); bump the version and handle the
  old shape if the format changes. `/quiz?mode=revision` asks the due questions.
- App code reaches `shared/` through the `#shared` alias: Nuxt does not bundle relative imports
  that leave `app/`. Scripts and tests use relative paths with `.ts` extensions.
- `Dockerfile`, `docker/Caddyfile`: the image, Caddy serving `.output/public`, built from the
  committed `data/`.
- `deploy/vps/`: the files to copy on the VPS (compose, forced-command script, Caddy block).
- `tests/unit/`: Vitest tests, with fake Notion responses. Never paste a real Notion id or URL in
  a fixture: the repository is public.
- Scripts run on Node's type stripping (no build step), so they use `.ts` import extensions and
  erasable syntax only (no enums, no parameter properties).

## Commands

- `npm run dev`: dev server on http://localhost:3000.
- `npm run format`: Prettier. Formatting is Prettier's job; ESLint only reports code issues.
- `npm run check`: format check, lint, type-check and unit tests.
- `npm run generate`: static build into `.output/public`.
- `npm run sync`: exports the Concepts sheets to `data/concepts.json`. Needs `NOTION_TOKEN` and
  `NOTION_CONCEPTS_DATA_SOURCE_ID` in `.env` (see `.env.example`).
- `npm run -s questions:plan` / `npm run questions:apply`: used by the `generate-questions` skill.
- `npm run test:e2e`: Playwright on the static build, desktop and mobile.

Before saying a change is done, run `npm run check`, `npm run generate`
and `npm run test:e2e`. Playwright reuses a server already running on port 4173, so stop it or
regenerate first, or the tests run against an old build.

UI text is in French: use a no-break space (`\u00a0`) before `?`, `!`, `:`, `;` and inside « ».
`data/questions.json` gets it from the apply step.

## Rules

- Never commit, push or deploy without Adrien's explicit request.
- Ask before adding a dependency.
