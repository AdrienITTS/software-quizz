# software-quizz

Quiz site for revising software development concepts. The questions come from a personal
Notion library; Claude writes them, locally, and they are committed in `data/`.

Requires Node 22.18 or later.

## Run

```bash
npm install
npm run dev
```

The site runs on http://localhost:3000.

## Test

```bash
npm run check
```

This runs the Prettier check, ESLint, the type-check and the Vitest unit tests. The end-to-end
tests run on the static build, on desktop and mobile:

```bash
npx playwright install chromium   # once
npm run test:e2e
```

## Update the content

The concepts and questions are committed in `data/`.

```bash
cp .env.example .env   # once, then fill in the two values
npm run sync
```

`sync` writes `data/concepts.json`. The token comes from a read-only Notion integration that can
only see the Concepts database. Then, in a Claude Code session, run the `/generate-questions`
skill: Claude writes 3 to 8 questions for each new or changed concept, and
`npm run questions:apply` merges them into `data/questions.json`. Read the diff before committing.

## Build

```bash
npm run generate
npm run preview
```

`generate` writes the static site to `.output/public`; `preview` serves it on http://localhost:4173.

## Deploy

`.github/workflows/deploy.yml` runs on every push to `main` and on demand. It runs the checks and
the end-to-end tests, builds a Docker image (Caddy serving the static site), pushes it to `ghcr.io/adrienitts/software-quizz` and
deploys it to the VPS over SSH, behind the front Caddy, at https://quizz.adrienitts.com.

Repository secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` and `VPS_KNOWN_HOSTS`. The files to install on the VPS are in `deploy/vps/`.

Each image is tagged `sha-<commit>`. To roll back, run the deploy key with an older tag:

```bash
ssh -i ~/.ssh/deploy_software_quizz adrien@<vps> "sha-1a2b3c4"
```
