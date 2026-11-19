import { describe, expect, it } from 'vitest'
import type { Concept } from '../../shared/concept.type.ts'
import type { Question } from '../../shared/question.type.ts'
import { seededRandom } from '../../shared/random.ts'
import { buildQuiz, buildReviewQuiz, QUIZ_LENGTH, quizTags } from '../../app/utils/quiz.ts'

function concept(slug: string, tags: string[] = ['Craftsmanship']): Concept {
  return {
    slug,
    name: slug.toUpperCase(),
    summary: `Résumé de ${slug}.`,
    tags,
    relatedSlugs: [],
    definitions: [],
  }
}

function relatedQuestion(conceptSlug: string, index = 0): Question {
  return {
    id: `related-concept:${conceptSlug}:${index}`,
    kind: 'related-concept',
    conceptSlug,
    conceptName: conceptSlug.toUpperCase(),
    choices: ['A', 'B', 'C', 'D'],
    answerIndex: 2,
  }
}

const random = () => seededRandom('quiz-test')

describe('buildQuiz', () => {
  const concepts = Array.from({ length: 12 }, (_, index) =>
    concept(`c${index}`, index < 4 ? ['Architecture'] : ['Craftsmanship']),
  )
  const questions = concepts.flatMap((item) => [
    relatedQuestion(item.slug, 0),
    relatedQuestion(item.slug, 1),
  ])

  it(`asks ${QUIZ_LENGTH} questions on as many different concepts`, () => {
    const quiz = buildQuiz(questions, concepts, {}, random())

    expect(quiz).toHaveLength(QUIZ_LENGTH)
    expect(new Set(quiz.map((item) => item.concept.slug)).size).toBe(QUIZ_LENGTH)
  })

  it('keeps only the concepts of the chosen tag', () => {
    const quiz = buildQuiz(questions, concepts, { tag: 'Architecture' }, random())

    expect(quiz).toHaveLength(8)
    expect(quiz.every((item) => item.concept.tags.includes('Architecture'))).toBe(true)
  })

  it('asks the questions of each concept before asking a second one', () => {
    const quiz = buildQuiz(questions, concepts, { tag: 'Architecture' }, random())

    const firstFour = quiz.slice(0, 4).map((item) => item.concept.slug)

    expect(new Set(firstFour).size).toBe(4)
  })

  it('returns no question for an unknown tag', () => {
    expect(buildQuiz(questions, concepts, { tag: 'Inconnu' }, random())).toEqual([])
  })
})

describe('quiz items', () => {
  const solid = concept('solid')
  const quizOf = (question: Question) => buildQuiz([question], [solid], {}, random())

  it('asks for the summary of a concept', () => {
    const [item] = quizOf({
      id: 'q',
      kind: 'concept-to-summary',
      conceptSlug: 'solid',
      conceptName: 'SOLID',
      choices: ['a', 'b', 'c', 'd'],
      answerIndex: 1,
    })

    expect(item).toMatchObject({
      prompt: 'Quelle phrase résume SOLID\u00a0?',
      options: ['a', 'b', 'c', 'd'],
      answerIndex: 1,
    })
    expect(item?.quote).toBeUndefined()
  })

  it('quotes the masked summary when asking for the concept', () => {
    const [item] = quizOf({
      id: 'q',
      kind: 'summary-to-concept',
      conceptSlug: 'solid',
      maskedSummary: '___ regroupe cinq principes.',
      choices: ['KISS', 'SOLID', 'DRY', 'TDD'],
      answerIndex: 1,
    })

    expect(item).toMatchObject({
      prompt: 'Quel concept ce résumé décrit-il\u00a0?',
      quote: '___ regroupe cinq principes.',
      answerIndex: 1,
    })
  })

  it.each([
    [true, 0],
    [false, 1],
  ])('turns a true or false question into two options (answer %s)', (answer, answerIndex) => {
    const [item] = quizOf({
      id: 'q',
      kind: 'definition-true-false',
      conceptSlug: 'solid',
      conceptName: 'SOLID',
      term: 'S, Single Responsibility',
      definition: 'Une seule raison de changer.',
      answer,
    })

    expect(item).toMatchObject({
      prompt: 'Vrai ou faux\u00a0: dans SOLID, voici «\u00a0S, Single Responsibility\u00a0».',
      quote: 'Une seule raison de changer.',
      options: ['Vrai', 'Faux'],
      answerIndex,
    })
  })

  it('carries the concept for the correction', () => {
    const [item] = quizOf(relatedQuestion('solid'))

    expect(item?.concept).toEqual(solid)
  })
})

describe('buildReviewQuiz', () => {
  const concepts = Array.from({ length: 12 }, (_, index) => concept(`c${index}`))
  const questions = concepts.map((item) => relatedQuestion(item.slug))

  it('asks the due questions in the given order, up to a full quiz', () => {
    const dueIds = [...questions].reverse().map((question) => question.id)

    const quiz = buildReviewQuiz(questions, concepts, dueIds)

    expect(quiz.map((item) => item.id)).toEqual(dueIds.slice(0, QUIZ_LENGTH))
  })

  it('skips the ids of questions that no longer exist', () => {
    const quiz = buildReviewQuiz(questions, concepts, ['gone', 'related-concept:c3:0'])

    expect(quiz.map((item) => item.id)).toEqual(['related-concept:c3:0'])
  })
})

describe('quizTags', () => {
  it('lists the tags with their concept count, the biggest first', () => {
    const concepts = [
      concept('a', ['Back']),
      concept('b', ['Architecture', 'Back']),
      concept('c', ['Architecture']),
      concept('d', ['Agile', 'Architecture']),
    ]

    expect(quizTags(concepts)).toEqual([
      { tag: 'Architecture', conceptCount: 3 },
      { tag: 'Back', conceptCount: 2 },
      { tag: 'Agile', conceptCount: 1 },
    ])
  })
})
