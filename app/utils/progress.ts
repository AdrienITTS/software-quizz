import { createEmptyCard, fsrs, Rating, type CardInput } from 'ts-fsrs'

export const SESSION_HISTORY_LENGTH = 10

/** An FSRS card as saved in the browser: the same fields, with dates as ISO strings. */
type StoredCard = CardInput & { due: string; last_review?: string }

export type QuizSession = {
  finishedAt: string
  label: string
  score: number
  total: number
}

/** Everything the site remembers about a visitor, keyed by question id. */
export type Progress = {
  version: 1
  cards: Record<string, StoredCard>
  sessions: QuizSession[]
}

export type ProgressStats = { seen: number; total: number; due: number }

// Without short-term steps, intervals count in days: a missed question comes back tomorrow,
// not ten minutes later, which suits a quiz better than flashcards drilled in one sitting.
const scheduler = fsrs({ enable_short_term: false })

export function emptyProgress(): Progress {
  return { version: 1, cards: {}, sessions: [] }
}

export function recordAnswer(
  progress: Progress,
  questionId: string,
  isRight: boolean,
  now: Date,
): Progress {
  const card = progress.cards[questionId] ?? createEmptyCard(now)
  const next = scheduler.next(card, now, isRight ? Rating.Good : Rating.Again).card
  const stored: StoredCard = JSON.parse(JSON.stringify(next))
  return { ...progress, cards: { ...progress.cards, [questionId]: stored } }
}

export function recordSession(progress: Progress, session: QuizSession): Progress {
  return {
    ...progress,
    sessions: [session, ...progress.sessions].slice(0, SESSION_HISTORY_LENGTH),
  }
}

/** Questions to review now, the most overdue first. Questions no longer in the quiz are skipped. */
export function dueQuestionIds(
  progress: Progress,
  questionIds: ReadonlySet<string>,
  now: Date,
): string[] {
  return currentCards(progress, questionIds)
    .filter(([, card]) => Date.parse(card.due) <= now.getTime())
    .sort(([, a], [, b]) => Date.parse(a.due) - Date.parse(b.due))
    .map(([id]) => id)
}

export function progressStats(
  progress: Progress,
  questionIds: ReadonlySet<string>,
  now: Date,
): ProgressStats {
  return {
    seen: currentCards(progress, questionIds).length,
    total: questionIds.size,
    due: dueQuestionIds(progress, questionIds, now).length,
  }
}

/**
 * Reads what `JSON.stringify(progress)` saved. Returns undefined for anything else, so the
 * caller decides what to do with data it can't trust.
 */
export function parseProgress(raw: string | null): Progress | undefined {
  if (raw === null) return emptyProgress()

  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return undefined
  }

  if (!isRecord(data) || data.version !== 1) return undefined
  const { cards, sessions } = data
  if (!isCardRecord(cards)) return undefined
  if (!Array.isArray(sessions) || !sessions.every(isQuizSession)) return undefined
  return { version: 1, cards, sessions }
}

function currentCards(
  progress: Progress,
  questionIds: ReadonlySet<string>,
): [string, StoredCard][] {
  return Object.entries(progress.cards).filter(([id]) => questionIds.has(id))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCardRecord(value: unknown): value is Record<string, StoredCard> {
  return isRecord(value) && Object.values(value).every(isStoredCard)
}

function isStoredCard(value: unknown): value is StoredCard {
  if (!isRecord(value)) return false
  const numbers = ['stability', 'difficulty', 'scheduled_days', 'reps', 'lapses', 'learning_steps']
  return (
    typeof value.due === 'string' &&
    !Number.isNaN(Date.parse(value.due)) &&
    typeof value.state === 'number' &&
    numbers.every((key) => typeof value[key] === 'number')
  )
}

function isQuizSession(value: unknown): value is QuizSession {
  return (
    isRecord(value) &&
    typeof value.finishedAt === 'string' &&
    typeof value.label === 'string' &&
    typeof value.score === 'number' &&
    typeof value.total === 'number'
  )
}
