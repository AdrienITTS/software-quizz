import { readFile, writeFile } from 'node:fs/promises'
import { z } from 'zod'
import type { Concept } from '../shared/concept.type.ts'
import { generateQuestions } from './questions/generate-questions.ts'

const INPUT_FILE = 'generated/concepts.json'
const OUTPUT_FILE = 'generated/questions.json'

const conceptsSchema = z.array(
  z.object({
    slug: z.string(),
    name: z.string(),
    summary: z.string(),
    tags: z.array(z.string()),
    relatedSlugs: z.array(z.string()),
    definitions: z.array(z.object({ term: z.string(), definition: z.string() })),
  }),
) satisfies z.ZodType<Concept[]>

const concepts = conceptsSchema.parse(JSON.parse(await readFile(INPUT_FILE, 'utf8')))
const questions = generateQuestions(concepts)
await writeFile(OUTPUT_FILE, `${JSON.stringify(questions, null, 2)}\n`)

const countByKind = Object.groupBy(questions, (question) => question.kind)
const details = Object.entries(countByKind)
  .map(([kind, items]) => `${kind}: ${items?.length ?? 0}`)
  .join(', ')
console.log(`Wrote ${questions.length} questions to ${OUTPUT_FILE} (${details})`)
