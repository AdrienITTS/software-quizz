import { describe, expect, it } from 'vitest'
import type { Concept } from '../../shared/concept.type.ts'
import type { Question } from '../../shared/question.type.ts'
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

function choiceQuestion(conceptSlug: string, index = 0): Question {
  return {
    id: `${conceptSlug}:${index}`,
    kind: 'multiple-choice',
    conceptSlug,
    prompt: `Question ${index} sur ${conceptSlug}\u00a0?`,
    choices: ['A', 'B', 'C', 'D'],
    answerIndex: 2,
    explanation: 'Parce que C.',
  }
}

/** A predictable stand-in for Math.random: 0, 0.618…, 0.236…, and so on. */
function random() {
  let call = 0
  return () => (call++ * 0.618) % 1
}

describe('buildQuiz', () => {
  const concepts = Array.from({ length: 12 }, (_, index) =>
    concept(`c${index}`, index < 4 ? ['Architecture'] : ['Craftsmanship']),
  )
  const questions = concepts.flatMap((item) => [
    choiceQuestion(item.slug, 0),
    choiceQuestion(item.slug, 1),
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

  it('shows a multiple-choice question with its explanation', () => {
    const [item] = quizOf(choiceQuestion('solid'))

    expect(item).toMatchObject({
      prompt: 'Question 0 sur solid\u00a0?',
      explanation: 'Parce que C.',
    })
    expect(item?.quote).toBeUndefined()
  })

  it('shuffles the choices and keeps the right answer', () => {
    const [item] = quizOf(choiceQuestion('solid'))

    expect(item?.options).not.toEqual(['A', 'B', 'C', 'D'])
    expect([...(item?.options ?? [])].sort()).toEqual(['A', 'B', 'C', 'D'])
    expect(item?.options[item.answerIndex]).toBe('C')
  })

  it.each([
    [true, 0],
    [false, 1],
  ])('turns a true or false statement into two options (answer %s)', (answer, answerIndex) => {
    const [item] = quizOf({
      id: 'q',
      kind: 'true-false',
      conceptSlug: 'solid',
      statement: 'Un module ne doit avoir qu’une raison de changer.',
      answer,
      explanation: 'C’est le S de SOLID.',
    })

    expect(item).toMatchObject({
      prompt: 'Vrai ou faux\u00a0?',
      quote: 'Un module ne doit avoir qu’une raison de changer.',
      options: ['Vrai', 'Faux'],
      answerIndex,
    })
  })

  it('carries the concept for the correction', () => {
    const [item] = quizOf(choiceQuestion('solid'))

    expect(item?.concept).toEqual(solid)
  })
})

describe('buildReviewQuiz', () => {
  const concepts = Array.from({ length: 12 }, (_, index) => concept(`c${index}`))
  const questions = concepts.map((item) => choiceQuestion(item.slug))

  it('asks the due questions in the given order, up to a full quiz', () => {
    const dueIds = [...questions].reverse().map((question) => question.id)

    const quiz = buildReviewQuiz(questions, concepts, dueIds, random())

    expect(quiz.map((item) => item.id)).toEqual(dueIds.slice(0, QUIZ_LENGTH))
  })

  it('skips the ids of questions that no longer exist', () => {
    const quiz = buildReviewQuiz(questions, concepts, ['gone', 'c3:0'], random())

    expect(quiz.map((item) => item.id)).toEqual(['c3:0'])
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
