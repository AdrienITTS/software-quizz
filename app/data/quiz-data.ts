import type { Concept } from '#shared/concept.type'
import type { QuestionBank } from '#shared/question.type'
import conceptsJson from '~~/data/concepts.json'
import bankJson from '~~/data/questions.json'

// Written by the scripts from these same types and checked by `npm run check`, so no parsing
// here: it would ship zod to every visitor for files we produce ourselves.
export const concepts = conceptsJson as Concept[]
export const questions = (bankJson as QuestionBank).questions
export const questionIds: ReadonlySet<string> = new Set(questions.map((question) => question.id))
