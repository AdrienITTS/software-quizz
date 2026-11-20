import { z } from 'zod'
import type { Concept } from '../../shared/concept.type.ts'
import type { Question, QuestionBank } from '../../shared/question.type.ts'
import { frenchTypography } from './french-typography.ts'

const MIN_QUESTIONS_PER_CONCEPT = 3
const MAX_QUESTIONS_PER_CONCEPT = 8

const text = z.string().trim().min(1)

const multipleChoiceSchema = z.object({
  kind: z.literal('multiple-choice'),
  prompt: text,
  choices: z
    .array(text)
    .length(4)
    .refine((choices) => new Set(choices).size === choices.length, 'Choices must differ'),
  answerIndex: z.number().int().min(0).max(3),
  explanation: text,
})

const trueFalseSchema = z.object({
  kind: z.literal('true-false'),
  statement: text,
  answer: z.boolean(),
  explanation: text,
})

const draftQuestionSchema = z.discriminatedUnion('kind', [multipleChoiceSchema, trueFalseSchema])

// Questions written by the model, keyed by concept slug: untrusted until parsed.
const draftsSchema = z.record(
  z.string(),
  z.array(draftQuestionSchema).min(MIN_QUESTIONS_PER_CONCEPT).max(MAX_QUESTIONS_PER_CONCEPT),
)

// The committed bank: the same questions, plus the fields the apply step adds.
const identity = { id: z.string(), conceptSlug: z.string() }
export const questionBankSchema = z.object({
  sourceHashes: z.record(z.string(), z.string()),
  questions: z.array(
    z.discriminatedUnion('kind', [
      multipleChoiceSchema.extend(identity),
      trueFalseSchema.extend(identity),
    ]),
  ),
}) satisfies z.ZodType<QuestionBank>

type DraftQuestion = z.infer<typeof draftQuestionSchema>
type Drafts = Record<string, DraftQuestion[]>
type QuestionPlan = { toGenerate: string[]; toRemove: string[] }

export function emptyBank(): QuestionBank {
  return { sourceHashes: {}, questions: [] }
}

/** Changes whenever a published field of the concept changes. */
export function conceptHash(concept: Concept): string {
  return hashText(JSON.stringify(concept))
}

/** Concepts that need questions (new or changed since their questions were written). */
export function planQuestions(concepts: Concept[], bank: QuestionBank): QuestionPlan {
  const slugs = new Set(concepts.map((concept) => concept.slug))
  return {
    toGenerate: concepts
      .filter((concept) => bank.sourceHashes[concept.slug] !== conceptHash(concept))
      .map((concept) => concept.slug),
    toRemove: Object.keys(bank.sourceHashes).filter((slug) => !slugs.has(slug)),
  }
}

export function parseDrafts(data: unknown): Drafts {
  return draftsSchema.parse(data)
}

/**
 * Replaces the questions of the drafted concepts, keeps the others, and drops the concepts
 * that no longer exist.
 */
export function applyDrafts(bank: QuestionBank, concepts: Concept[], drafts: Drafts): QuestionBank {
  const order = new Map(concepts.map((concept, index) => [concept.slug, index]))
  const unknown = Object.keys(drafts).filter((slug) => !order.has(slug))
  if (unknown.length > 0) throw new Error(`Drafts for unknown concepts: ${unknown.join(', ')}`)

  const kept = bank.questions.filter(
    (question) => order.has(question.conceptSlug) && !(question.conceptSlug in drafts),
  )
  const added = Object.entries(drafts).flatMap(([slug, questions]) =>
    questions.map((draft) => toQuestion(slug, draft)),
  )
  // Grouped by concept, in library order, so the committed diff reads concept by concept.
  const questions = [...kept, ...added].sort(
    (a, b) => (order.get(a.conceptSlug) ?? 0) - (order.get(b.conceptSlug) ?? 0),
  )
  assertUniqueIds(questions)

  const sourceHashes: Record<string, string> = {}
  for (const concept of concepts) {
    const hash = concept.slug in drafts ? conceptHash(concept) : bank.sourceHashes[concept.slug]
    if (hash) sourceHashes[concept.slug] = hash
  }
  return { sourceHashes, questions }
}

function toQuestion(conceptSlug: string, draft: DraftQuestion): Question {
  const explanation = frenchTypography(draft.explanation)

  if (draft.kind === 'true-false') {
    const statement = frenchTypography(draft.statement)
    return {
      id: questionId(conceptSlug, statement),
      kind: draft.kind,
      conceptSlug,
      statement,
      answer: draft.answer,
      explanation,
    }
  }

  const prompt = frenchTypography(draft.prompt)
  return {
    id: questionId(conceptSlug, prompt),
    kind: draft.kind,
    conceptSlug,
    prompt,
    choices: draft.choices.map(frenchTypography),
    answerIndex: draft.answerIndex,
    explanation,
  }
}

/** Depends only on the concept and the wording, so editing other questions keeps this id. */
function questionId(conceptSlug: string, wording: string): string {
  return `${conceptSlug}:${hashText(wording)}`
}

/** FNV-1a, in base 36: a short, stable fingerprint. Not for security. */
function hashText(text: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}

function assertUniqueIds(questions: Question[]): void {
  const seen = new Set<string>()
  for (const { id } of questions) {
    if (seen.has(id)) throw new Error(`Duplicate question ${id}`)
    seen.add(id)
  }
}
