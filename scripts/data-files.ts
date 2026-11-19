import { readFile, writeFile } from 'node:fs/promises'
import { z } from 'zod'
import type { Concept } from '../shared/concept.type.ts'
import type { QuestionBank } from '../shared/question.type.ts'
import { findNotionTraces } from './notion/find-notion-traces.ts'

export const DATA_DIR = 'data'
export const CONCEPTS_FILE = `${DATA_DIR}/concepts.json`
export const QUESTIONS_FILE = `${DATA_DIR}/questions.json`
export const DRAFTS_DIR = `${DATA_DIR}/drafts`

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

const questionBase = { id: z.string(), conceptSlug: z.string(), explanation: z.string() }

const bankSchema = z.object({
  sourceHashes: z.record(z.string(), z.string()),
  questions: z.array(
    z.discriminatedUnion('kind', [
      z.object({
        ...questionBase,
        kind: z.literal('multiple-choice'),
        prompt: z.string(),
        choices: z.array(z.string()),
        answerIndex: z.number(),
      }),
      z.object({
        ...questionBase,
        kind: z.literal('true-false'),
        statement: z.string(),
        answer: z.boolean(),
      }),
    ]),
  ),
}) satisfies z.ZodType<QuestionBank>

export async function readConcepts(): Promise<Concept[]> {
  return conceptsSchema.parse(await readJson(CONCEPTS_FILE))
}

export async function readBank(): Promise<QuestionBank> {
  return bankSchema.parse(await readJson(QUESTIONS_FILE))
}

/** Writes a committed data file, refusing anything that could point back to Notion. */
export async function writeDataFile(path: string, data: unknown): Promise<void> {
  const json = `${JSON.stringify(data, null, 2)}\n`
  const traces = findNotionTraces(json)
  if (traces.length > 0)
    throw new Error(`${path} would contain Notion traces: ${traces.join(', ')}`)
  await writeFile(path, json)
}

export async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8'))
}
