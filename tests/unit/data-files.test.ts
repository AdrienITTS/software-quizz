import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { CONCEPTS_FILE, QUESTIONS_FILE, readBank, readConcepts } from '../../scripts/data-files.ts'
import { findNotionTraces } from '../../scripts/notion/find-notion-traces.ts'

// The committed data is published as is: these checks run on every `npm run check`.
describe('committed data', () => {
  it.each([CONCEPTS_FILE, QUESTIONS_FILE])('%s has no trace of Notion', async (path) => {
    expect(findNotionTraces(await readFile(path, 'utf8'))).toEqual([])
  })

  it('has questions only for existing concepts, with a valid answer', async () => {
    const slugs = new Set((await readConcepts()).map((concept) => concept.slug))
    const { questions } = await readBank()

    for (const question of questions) {
      expect(slugs).toContain(question.conceptSlug)
      expect(question.explanation.trim()).not.toBe('')
      if (question.kind === 'multiple-choice') {
        expect(question.choices[question.answerIndex]).toBeDefined()
      }
    }
    expect(new Set(questions.map((question) => question.id)).size).toBe(questions.length)
  })
})
