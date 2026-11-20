import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { CONCEPTS_FILE, QUESTIONS_FILE, readBank, readConcepts } from '../../scripts/data-files.ts'
import { findNotionTraces } from '../../scripts/notion/find-notion-traces.ts'

// The committed data is published as is: these checks run on every `npm run check`.
describe('committed data', () => {
  it.each([CONCEPTS_FILE, QUESTIONS_FILE])('%s has no trace of Notion', async (path) => {
    expect(findNotionTraces(await readFile(path, 'utf8'))).toEqual([])
  })

  // readBank parses the questions with the same rules as the drafts.
  it('has well-formed questions, with unique ids, for existing concepts only', async () => {
    const slugs = new Set((await readConcepts()).map((concept) => concept.slug))
    const { questions } = await readBank()

    expect(questions.every((question) => slugs.has(question.conceptSlug))).toBe(true)
    expect(new Set(questions.map((question) => question.id)).size).toBe(questions.length)
  })
})
