type QuestionBase = {
  /** Stable across builds while the question's answer stays the same, so progress survives. */
  id: string
  conceptSlug: string
}

type MultipleChoice = {
  choices: string[]
  answerIndex: number
}

export type Question =
  | (QuestionBase & MultipleChoice & { kind: 'concept-to-summary'; conceptName: string })
  | (QuestionBase & MultipleChoice & { kind: 'summary-to-concept'; maskedSummary: string })
  | (QuestionBase & MultipleChoice & { kind: 'related-concept'; conceptName: string })
  | (QuestionBase & {
      kind: 'summary-true-false'
      conceptName: string
      summary: string
      answer: boolean
    })
  | (QuestionBase & {
      kind: 'definition-true-false'
      conceptName: string
      term: string
      definition: string
      answer: boolean
    })
