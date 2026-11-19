import type { Concept } from '#shared/concept.type'
import type { Question } from '#shared/question.type'
import { shuffle, type Random } from '#shared/random'

export const QUIZ_LENGTH = 10

/** One quiz question, whatever its kind: true or false questions become two options. */
export type QuizItem = {
  id: string
  concept: Concept
  prompt: string
  quote?: string
  options: string[]
  answerIndex: number
  explanation: string
}

export type QuizTag = { tag: string; conceptCount: number }

/**
 * Picks the questions of a quiz, at random, with one question per concept as long as there
 * are concepts left.
 */
export function buildQuiz(
  questions: Question[],
  concepts: Concept[],
  filter: { tag?: string },
  random: Random,
): QuizItem[] {
  const conceptsBySlug = new Map(concepts.map((concept) => [concept.slug, concept]))
  const candidates = shuffle(questions, random).flatMap((question) => {
    const concept = conceptsBySlug.get(question.conceptSlug)
    if (!concept || (filter.tag && !concept.tags.includes(filter.tag))) return []
    return [{ question, concept }]
  })

  const seen = new Set<string>()
  const firstPerConcept = candidates.filter(({ concept }) => {
    if (seen.has(concept.slug)) return false
    seen.add(concept.slug)
    return true
  })
  const rest = candidates.filter((candidate) => !firstPerConcept.includes(candidate))

  return [...firstPerConcept, ...rest]
    .slice(0, QUIZ_LENGTH)
    .map(({ question, concept }) => toQuizItem(question, concept))
}

/** A review quiz: the due questions, in the order given (most overdue first). */
export function buildReviewQuiz(
  questions: Question[],
  concepts: Concept[],
  dueIds: string[],
): QuizItem[] {
  const questionsById = new Map(questions.map((question) => [question.id, question]))
  const conceptsBySlug = new Map(concepts.map((concept) => [concept.slug, concept]))

  return dueIds
    .flatMap((id) => {
      const question = questionsById.get(id)
      const concept = question && conceptsBySlug.get(question.conceptSlug)
      return question && concept ? [toQuizItem(question, concept)] : []
    })
    .slice(0, QUIZ_LENGTH)
}

export function quizTags(concepts: Concept[]): QuizTag[] {
  const counts = new Map<string, number>()
  for (const tag of concepts.flatMap((concept) => concept.tags)) {
    counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts]
    .map(([tag, conceptCount]) => ({ tag, conceptCount }))
    .sort((a, b) => b.conceptCount - a.conceptCount || a.tag.localeCompare(b.tag))
}

const TRUE_FALSE_OPTIONS = ['Vrai', 'Faux']

function toQuizItem(question: Question, concept: Concept): QuizItem {
  const base = { id: question.id, concept, explanation: question.explanation }

  if (question.kind === 'true-false') {
    return {
      ...base,
      prompt: 'Vrai ou faux\u00a0?',
      quote: question.statement,
      options: TRUE_FALSE_OPTIONS,
      answerIndex: question.answer ? 0 : 1,
    }
  }
  return {
    ...base,
    prompt: question.prompt,
    options: question.choices,
    answerIndex: question.answerIndex,
  }
}
