import type { Concept } from '#shared/concept.type'
import type { Question } from '#shared/question.type'
import conceptsJson from '~~/generated/concepts.json'
import questionsJson from '~~/generated/questions.json'

// Written in the same build by the scripts, from these same types, so no parsing here:
// it would ship zod to every visitor for files we produce ourselves.
export const concepts = conceptsJson as Concept[]
export const questions = questionsJson as Question[]
export const questionIds: ReadonlySet<string> = new Set(questions.map((question) => question.id))
