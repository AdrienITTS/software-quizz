import { mkdir, readdir, rm } from 'node:fs/promises'
import { applyDrafts, parseDrafts, planQuestions } from './questions/question-bank.ts'
import {
  DRAFTS_DIR,
  QUESTIONS_FILE,
  readBank,
  readConcepts,
  readJson,
  writeDataFile,
} from './data-files.ts'

// Merges data/drafts/*.json into data/questions.json, then deletes the drafts.
await mkdir(DRAFTS_DIR, { recursive: true })
const files = (await readdir(DRAFTS_DIR)).filter((file) => file.endsWith('.json')).sort()

const merged: Record<string, unknown> = {}
for (const file of files) {
  const data = await readJson(`${DRAFTS_DIR}/${file}`)
  if (typeof data !== 'object' || data === null) throw new Error(`${file} is not a JSON object`)
  for (const [slug, questions] of Object.entries(data)) {
    if (slug in merged) throw new Error(`${slug} is drafted twice (last in ${file})`)
    merged[slug] = questions
  }
}

const concepts = await readConcepts()
const bank = applyDrafts(await readBank(), concepts, parseDrafts(merged))
await writeDataFile(QUESTIONS_FILE, bank)
await rm(DRAFTS_DIR, { recursive: true, force: true })

const plan = planQuestions(concepts, bank)
console.log(
  `Applied ${Object.keys(merged).length} concepts from ${files.length} draft files.`,
  `${bank.questions.length} questions in ${QUESTIONS_FILE}.`,
  plan.toGenerate.length > 0
    ? `Still without questions: ${plan.toGenerate.join(', ')}.`
    : 'Every concept has questions.',
)
