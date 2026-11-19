import { describe, expect, it } from 'vitest'
import type { Concept, Definition } from '../../shared/concept.type.ts'
import type { Question } from '../../shared/question.type.ts'
import { generateQuestions } from '../../scripts/questions/generate-questions.ts'

function concept(
  slug: string,
  options: { tags?: string[]; relatedSlugs?: string[]; definitions?: Definition[] } = {},
): Concept {
  return {
    slug,
    name: slug.toUpperCase(),
    summary: `Résumé de ${slug.toUpperCase()}.`,
    tags: options.tags ?? ['Craftsmanship'],
    relatedSlugs: options.relatedSlugs ?? [],
    definitions: options.definitions ?? [],
  }
}

function questionsOf<K extends Question['kind']>(
  questions: Question[],
  kind: K,
  conceptSlug: string,
): Extract<Question, { kind: K }>[] {
  return questions.filter(
    (question): question is Extract<Question, { kind: K }> =>
      question.kind === kind && question.conceptSlug === conceptSlug,
  )
}

const library = [
  concept('solid', { tags: ['Craftsmanship'] }),
  concept('kiss', { tags: ['Craftsmanship'] }),
  concept('yagni', { tags: ['Craftsmanship'] }),
  concept('dry', { tags: ['Craftsmanship'] }),
  concept('cqrs', { tags: ['Architecture'] }),
  concept('microservices', { tags: ['Architecture'] }),
  concept('bulkhead', { tags: ['Architecture'] }),
]

describe('generateQuestions', () => {
  describe('concept to summary', () => {
    it('offers the concept summary among four distinct choices', () => {
      const [question] = questionsOf(generateQuestions(library), 'concept-to-summary', 'solid')

      expect(question?.conceptName).toBe('SOLID')
      expect(new Set(question?.choices).size).toBe(4)
      expect(question?.choices[question.answerIndex]).toBe('Résumé de SOLID.')
    })

    it('takes distractors from the same tag first', () => {
      const [question] = questionsOf(generateQuestions(library), 'concept-to-summary', 'solid')

      expect([...(question?.choices ?? [])].sort()).toEqual([
        'Résumé de DRY.',
        'Résumé de KISS.',
        'Résumé de SOLID.',
        'Résumé de YAGNI.',
      ])
    })

    it('completes with other tags when the tag is too small', () => {
      const [question] = questionsOf(generateQuestions(library), 'concept-to-summary', 'cqrs')

      expect(question?.choices).toEqual(
        expect.arrayContaining(['Résumé de MICROSERVICES.', 'Résumé de BULKHEAD.']),
      )
      expect(question?.choices).toHaveLength(4)
    })

    it('is skipped when the library has fewer than four concepts', () => {
      const questions = generateQuestions(library.slice(0, 3))

      expect(questionsOf(questions, 'concept-to-summary', 'solid')).toEqual([])
    })
  })

  describe('summary to concept', () => {
    it('masks the name in the summary and offers four concept names', () => {
      const [question] = questionsOf(generateQuestions(library), 'summary-to-concept', 'solid')

      expect(question?.maskedSummary).toBe('Résumé de ___.')
      expect(question?.choices).toHaveLength(4)
      expect(question?.choices[question.answerIndex]).toBe('SOLID')
    })
  })

  describe('summary true or false', () => {
    it('shows the concept summary when true, and another one when false', () => {
      const questions = library.flatMap((item) =>
        questionsOf(generateQuestions(library), 'summary-true-false', item.slug),
      )

      expect(questions).toHaveLength(library.length)
      expect(new Set(questions.map((question) => question.answer))).toEqual(new Set([true, false]))
      for (const question of questions) {
        const ownSummary = library.find((item) => item.slug === question.conceptSlug)?.summary
        expect(question.summary === ownSummary).toBe(question.answer)
      }
    })
  })

  describe('definition true or false', () => {
    const definitions = [
      { term: 'S', definition: 'Une seule raison de changer.' },
      { term: 'O', definition: 'Ouvert à l’extension.' },
      { term: 'L', definition: 'Un sous-type remplace son parent.' },
    ]

    it('asks about each definition, with false ones borrowed from the same concept', () => {
      const solid = concept('solid', { definitions })

      const questions = questionsOf(
        generateQuestions([solid, ...library.slice(1)]),
        'definition-true-false',
        'solid',
      )

      expect(questions.map((question) => question.term)).toEqual(['S', 'O', 'L'])
      expect(new Set(questions.map((question) => question.answer))).toEqual(new Set([true, false]))
      for (const question of questions) {
        const own = definitions.find((item) => item.term === question.term)?.definition
        expect(question.definition === own).toBe(question.answer)
        expect(definitions.map((item) => item.definition)).toContain(question.definition)
      }
    })

    it('is skipped for a concept with a single definition', () => {
      const solid = concept('solid', { definitions: definitions.slice(0, 1) })

      const questions = generateQuestions([solid, ...library.slice(1)])

      expect(questionsOf(questions, 'definition-true-false', 'solid')).toEqual([])
    })
  })

  describe('related concept', () => {
    it('offers one related concept among unrelated ones', () => {
      const concepts = [
        concept('solid', { relatedSlugs: ['kiss'] }),
        concept('kiss'),
        concept('yagni', { relatedSlugs: ['solid'] }),
        ...library.slice(3),
      ]

      const [question] = questionsOf(generateQuestions(concepts), 'related-concept', 'solid')

      expect(question?.conceptName).toBe('SOLID')
      expect(question?.choices[question.answerIndex]).toBe('KISS')
      expect(question?.choices).not.toContain('SOLID')
      expect(question?.choices).not.toContain('YAGNI')
      expect(question?.choices).toHaveLength(4)
    })

    it('is skipped for a concept without related concepts', () => {
      expect(questionsOf(generateQuestions(library), 'related-concept', 'solid')).toEqual([])
    })
  })

  it('gives the same questions for the same concepts', () => {
    expect(generateQuestions(library)).toEqual(generateQuestions(library))
  })

  it('gives every question a unique id', () => {
    const questions = generateQuestions([
      concept('solid', {
        relatedSlugs: ['kiss'],
        definitions: [
          { term: 'S', definition: 'Une seule raison de changer.' },
          { term: 'O', definition: 'Ouvert à l’extension.' },
        ],
      }),
      ...library.slice(1),
    ])

    const ids = questions.map((question) => question.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('keeps question ids when another concept is added', () => {
    const idsBefore = generateQuestions(library).map((question) => question.id)

    const idsAfter = generateQuestions([...library, concept('tdd')]).map((question) => question.id)

    expect(idsAfter).toEqual(expect.arrayContaining(idsBefore))
  })
})
