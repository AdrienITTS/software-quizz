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
  const base = { id: question.id, concept }

  switch (question.kind) {
    case 'concept-to-summary':
      return {
        ...base,
        prompt: `Quelle phrase résume ${question.conceptName}\u00a0?`,
        options: question.choices,
        answerIndex: question.answerIndex,
      }
    case 'summary-to-concept':
      return {
        ...base,
        prompt: 'Quel concept ce résumé décrit-il\u00a0?',
        quote: question.maskedSummary,
        options: question.choices,
        answerIndex: question.answerIndex,
      }
    case 'related-concept':
      return {
        ...base,
        prompt: `Lequel de ces concepts est lié à ${question.conceptName}\u00a0?`,
        options: question.choices,
        answerIndex: question.answerIndex,
      }
    case 'summary-true-false':
      return {
        ...base,
        prompt: `Vrai ou faux\u00a0: ce résumé décrit ${question.conceptName}.`,
        quote: question.summary,
        options: TRUE_FALSE_OPTIONS,
        answerIndex: question.answer ? 0 : 1,
      }
    case 'definition-true-false':
      return {
        ...base,
        prompt: `Vrai ou faux\u00a0: dans ${question.conceptName}, voici «\u00a0${question.term}\u00a0».`,
        quote: question.definition,
        options: TRUE_FALSE_OPTIONS,
        answerIndex: question.answer ? 0 : 1,
      }
  }
}
