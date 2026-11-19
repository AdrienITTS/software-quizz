type QuestionBase = {
  /** Stable while the question's wording stays the same, so the visitor's progress survives. */
  id: string
  conceptSlug: string
  /** Why the right answer is right, shown with the correction. */
  explanation: string
}

export type Question =
  | (QuestionBase & {
      kind: 'multiple-choice'
      prompt: string
      choices: string[]
      answerIndex: number
    })
  | (QuestionBase & { kind: 'true-false'; statement: string; answer: boolean })

/** The committed questions, with the hash of each concept they were written from. */
export type QuestionBank = {
  sourceHashes: Record<string, string>
  questions: Question[]
}
