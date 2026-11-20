import { describe, expect, it } from 'vitest'
import type { Concept } from '../../shared/concept.type.ts'
import type { QuestionBank } from '../../shared/question.type.ts'
import {
  applyDrafts,
  conceptHash,
  emptyBank,
  parseDrafts,
  planQuestions,
} from '../../scripts/questions/question-bank.ts'

function concept(slug: string, summary = `Résumé de ${slug}.`): Concept {
  return { slug, name: slug.toUpperCase(), summary, tags: [], relatedSlugs: [], definitions: [] }
}

const choiceDraft = (prompt: string, right = 'Bonne') => ({
  kind: 'multiple-choice',
  prompt,
  choices: [right, 'Fausse 1', 'Fausse 2', 'Fausse 3'],
  answerIndex: 0,
  explanation: 'Parce que.',
})

const trueFalseDraft = (statement: string, answer = true) => ({
  kind: 'true-false',
  statement,
  answer,
  explanation: 'Parce que.',
})

const threeQuestions = [choiceDraft('Q1 ?'), choiceDraft('Q2 ?'), trueFalseDraft('Affirmation.')]

describe('planQuestions', () => {
  it('lists new and changed concepts, and the ones that are gone', () => {
    const kept = concept('kept')
    const changed = concept('changed')
    const bank: QuestionBank = {
      sourceHashes: {
        kept: conceptHash(kept),
        changed: conceptHash(changed),
        removed: 'old',
      },
      questions: [],
    }

    const plan = planQuestions(
      [kept, concept('changed', 'Nouveau résumé.'), concept('added')],
      bank,
    )

    expect(plan).toEqual({ toGenerate: ['changed', 'added'], toRemove: ['removed'] })
  })
})

describe('parseDrafts', () => {
  it('accepts three to eight questions per concept', () => {
    const drafts = parseDrafts({ solid: threeQuestions })

    expect(drafts.solid).toHaveLength(3)
  })

  it.each([
    ['too few questions', { solid: threeQuestions.slice(0, 2) }],
    ['too many questions', { solid: Array.from({ length: 9 }, (_, i) => choiceDraft(`Q${i} ?`)) }],
    [
      'three choices',
      { solid: [...threeQuestions, { ...choiceDraft('Q ?'), choices: ['a', 'b', 'c'] }] },
    ],
    [
      'the same choice twice',
      { solid: [...threeQuestions, { ...choiceDraft('Q ?'), choices: ['a', 'a', 'b', 'c'] }] },
    ],
    [
      'an answer out of range',
      { solid: [...threeQuestions, { ...choiceDraft('Q ?'), answerIndex: 4 }] },
    ],
    [
      'no explanation',
      { solid: [...threeQuestions, { ...trueFalseDraft('A.'), explanation: ' ' }] },
    ],
    ['an unknown kind', { solid: [...threeQuestions, { kind: 'open', prompt: 'Q ?' }] }],
  ])('rejects %s', (_, data) => {
    expect(() => parseDrafts(data)).toThrow()
  })
})

describe('applyDrafts', () => {
  const solid = concept('solid')
  const kiss = concept('kiss')

  it('adds the questions with stable ids and the concept hash', () => {
    const bank = applyDrafts(emptyBank(), [solid], parseDrafts({ solid: threeQuestions }))

    expect(bank.sourceHashes).toEqual({ solid: conceptHash(solid) })
    expect(bank.questions).toHaveLength(3)
    expect(bank.questions.every((question) => question.conceptSlug === 'solid')).toBe(true)

    const again = applyDrafts(emptyBank(), [solid], parseDrafts({ solid: threeQuestions }))
    expect(again.questions.map((question) => question.id)).toEqual(
      bank.questions.map((question) => question.id),
    )
  })

  it('keeps the choices in the order they were written', () => {
    const bank = applyDrafts(emptyBank(), [solid], parseDrafts({ solid: threeQuestions }))

    expect(bank.questions[0]).toMatchObject({
      choices: ['Bonne', 'Fausse 1', 'Fausse 2', 'Fausse 3'],
      answerIndex: 0,
    })
  })

  it('replaces the questions of a regenerated concept and keeps the others', () => {
    const first = applyDrafts(
      emptyBank(),
      [solid, kiss],
      parseDrafts({ solid: threeQuestions, kiss: threeQuestions }),
    )
    const kissIds = first.questions.filter((q) => q.conceptSlug === 'kiss').map((q) => q.id)

    const second = applyDrafts(
      first,
      [solid, kiss],
      parseDrafts({ solid: [...threeQuestions, trueFalseDraft('Nouvelle.', false)] }),
    )

    expect(second.questions.filter((q) => q.conceptSlug === 'solid')).toHaveLength(4)
    expect(second.questions.filter((q) => q.conceptSlug === 'kiss').map((q) => q.id)).toEqual(
      kissIds,
    )
  })

  it('drops the questions of a concept that is gone', () => {
    const first = applyDrafts(
      emptyBank(),
      [solid, kiss],
      parseDrafts({ solid: threeQuestions, kiss: threeQuestions }),
    )

    const second = applyDrafts(first, [solid], {})

    expect(second.sourceHashes).toEqual({ solid: conceptHash(solid) })
    expect(second.questions.every((question) => question.conceptSlug === 'solid')).toBe(true)
  })

  it('applies the French typography', () => {
    const bank = applyDrafts(emptyBank(), [solid], parseDrafts({ solid: threeQuestions }))

    expect(bank.questions[0]?.kind === 'multiple-choice' && bank.questions[0].prompt).toBe(
      'Q1\u00a0?',
    )
  })

  it('rejects drafts for an unknown concept', () => {
    expect(() => applyDrafts(emptyBank(), [solid], parseDrafts({ ghost: threeQuestions }))).toThrow(
      'Drafts for unknown concepts: ghost',
    )
  })

  it('rejects two questions with the same wording', () => {
    const drafts = parseDrafts({
      solid: [choiceDraft('Q ?'), choiceDraft('Q ?'), trueFalseDraft('A.')],
    })

    expect(() => applyDrafts(emptyBank(), [solid], drafts)).toThrow('Duplicate question')
  })
})
