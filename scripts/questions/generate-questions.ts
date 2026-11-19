import type { Concept } from '../../shared/concept.type.ts'
import type { Question } from '../../shared/question.type.ts'
import { maskConceptName } from './mask-concept-name.ts'
import { hashText, seededRandom, shuffle, type Random } from '../../shared/random.ts'

const DISTRACTOR_COUNT = 3

/**
 * Builds the quiz from the concepts, by rules. A question is left out when the library
 * has too few candidates for its wrong answers.
 */
export function generateQuestions(concepts: Concept[]): Question[] {
  return concepts.flatMap((concept) => [
    ...conceptToSummary(concept, concepts),
    ...summaryToConcept(concept, concepts),
    ...summaryTrueFalse(concept, concepts),
    ...definitionTrueFalse(concept),
    ...relatedConcept(concept, concepts),
  ])
}

function conceptToSummary(concept: Concept, concepts: Concept[]): Question[] {
  const kind = 'concept-to-summary'
  const random = seededRandom(`${kind}:${concept.slug}`)
  const distractors = pickDistractors(concept, otherConcepts(concept, concepts), random)
  if (!distractors) return []

  return [
    {
      id: questionId(kind, concept, concept.summary),
      kind,
      conceptSlug: concept.slug,
      conceptName: concept.name,
      ...multipleChoice(
        concept.summary,
        distractors.map((distractor) => distractor.summary),
        random,
      ),
    },
  ]
}

function summaryToConcept(concept: Concept, concepts: Concept[]): Question[] {
  const kind = 'summary-to-concept'
  const random = seededRandom(`${kind}:${concept.slug}`)
  const distractors = pickDistractors(concept, otherConcepts(concept, concepts), random)
  if (!distractors) return []

  return [
    {
      id: questionId(kind, concept, concept.name),
      kind,
      conceptSlug: concept.slug,
      maskedSummary: maskConceptName(concept.summary, concept.name),
      ...multipleChoice(
        concept.name,
        distractors.map((distractor) => distractor.name),
        random,
      ),
    },
  ]
}

function summaryTrueFalse(concept: Concept, concepts: Concept[]): Question[] {
  const kind = 'summary-true-false'
  const random = seededRandom(`${kind}:${concept.slug}`)
  const question = (summary: string, answer: boolean): Question => ({
    id: questionId(kind, concept, concept.summary),
    kind,
    conceptSlug: concept.slug,
    conceptName: concept.name,
    summary,
    answer,
  })

  if (random() < 0.5) return [question(concept.summary, true)]
  const [other] = pickDistractors(concept, otherConcepts(concept, concepts), random, 1) ?? []
  return other ? [question(other.summary, false)] : []
}

/** The false definitions come from the same concept, so they sound plausible. */
function definitionTrueFalse(concept: Concept): Question[] {
  const kind = 'definition-true-false'

  return concept.definitions.flatMap(({ term, definition }) => {
    const others = concept.definitions.filter((other) => other.definition !== definition)
    if (others.length === 0) return []

    const random = seededRandom(`${kind}:${concept.slug}:${term}`)
    const answer = random() < 0.5
    const [other] = shuffle(others, random)

    return [
      {
        id: questionId(kind, concept, `${term}:${definition}`),
        kind,
        conceptSlug: concept.slug,
        conceptName: concept.name,
        term,
        definition: answer || !other ? definition : other.definition,
        answer,
      },
    ]
  })
}

function relatedConcept(concept: Concept, concepts: Concept[]): Question[] {
  const kind = 'related-concept'
  const random = seededRandom(`${kind}:${concept.slug}`)
  const [related] = shuffle(
    concepts.filter((other) => concept.relatedSlugs.includes(other.slug)),
    random,
  )
  if (!related) return []

  const unrelated = otherConcepts(concept, concepts).filter(
    (other) =>
      !concept.relatedSlugs.includes(other.slug) && !other.relatedSlugs.includes(concept.slug),
  )
  const distractors = pickDistractors(concept, unrelated, random)
  if (!distractors) return []

  return [
    {
      id: questionId(kind, concept, related.name),
      kind,
      conceptSlug: concept.slug,
      conceptName: concept.name,
      ...multipleChoice(
        related.name,
        distractors.map((distractor) => distractor.name),
        random,
      ),
    },
  ]
}

function otherConcepts(concept: Concept, concepts: Concept[]): Concept[] {
  return concepts.filter((other) => other.slug !== concept.slug)
}

/** Concepts sharing a tag come first: they make harder, more plausible wrong answers. */
function pickDistractors(
  concept: Concept,
  candidates: Concept[],
  random: Random,
  count = DISTRACTOR_COUNT,
): Concept[] | undefined {
  const sharesTag = (candidate: Concept) => candidate.tags.some((tag) => concept.tags.includes(tag))
  const picked = [
    ...shuffle(candidates.filter(sharesTag), random),
    ...shuffle(
      candidates.filter((candidate) => !sharesTag(candidate)),
      random,
    ),
  ].slice(0, count)
  return picked.length === count ? picked : undefined
}

function multipleChoice(answer: string, distractors: string[], random: Random) {
  const choices = shuffle([answer, ...distractors], random)
  return { choices, answerIndex: choices.indexOf(answer) }
}

/**
 * Depends only on the concept and the right answer, not on the wrong ones, so the id
 * survives when other concepts are added.
 */
function questionId(kind: Question['kind'], concept: Concept, answer: string): string {
  return `${kind}:${concept.slug}:${hashText(answer).toString(36)}`
}
