import { planQuestions } from './questions/question-bank.ts'
import { readBank, readConcepts } from './data-files.ts'

// Prints which concepts need questions, with their content, for the generate-questions skill.
const concepts = await readConcepts()
const plan = planQuestions(concepts, await readBank())

console.log(
  JSON.stringify(
    {
      ...plan,
      concepts: concepts.filter((concept) => plan.toGenerate.includes(concept.slug)),
    },
    null,
    2,
  ),
)
