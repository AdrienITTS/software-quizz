import { describe, expect, it } from 'vitest'
import {
  dueQuestionIds,
  emptyProgress,
  parseProgress,
  progressStats,
  recordAnswer,
  recordSession,
  SESSION_HISTORY_LENGTH,
  type QuizSession,
} from '../../app/utils/progress.ts'

const now = new Date('2026-11-20T10:00:00Z')
const days = (count: number) => new Date(now.getTime() + count * 24 * 60 * 60 * 1000)

describe('recordAnswer', () => {
  it('brings a wrong answer back sooner than a right one', () => {
    const progress = recordAnswer(
      recordAnswer(emptyProgress(), 'right', true, now),
      'wrong',
      false,
      now,
    )

    const rightDue = new Date(progress.cards.right?.due ?? '')
    const wrongDue = new Date(progress.cards.wrong?.due ?? '')

    expect(wrongDue.getTime()).toBeGreaterThan(now.getTime())
    expect(rightDue.getTime()).toBeGreaterThan(wrongDue.getTime())
  })

  it('spaces the reviews further after each right answer', () => {
    const first = recordAnswer(emptyProgress(), 'q', true, now)
    const firstDue = new Date(first.cards.q?.due ?? '')

    const second = recordAnswer(first, 'q', true, firstDue)
    const secondDue = new Date(second.cards.q?.due ?? '')

    expect(secondDue.getTime() - firstDue.getTime()).toBeGreaterThan(
      firstDue.getTime() - now.getTime(),
    )
  })

  it('leaves the previous progress untouched', () => {
    const before = emptyProgress()

    recordAnswer(before, 'q', true, now)

    expect(before.cards).toEqual({})
  })
})

describe('dueQuestionIds', () => {
  it('lists the questions due now, the most overdue first, and skips removed ones', () => {
    let progress = emptyProgress()
    progress = recordAnswer(progress, 'later', true, now)
    progress = recordAnswer(progress, 'soon', false, now)
    progress = recordAnswer(progress, 'removed', false, now)
    progress = recordAnswer(progress, 'oldest', false, days(-1))

    const due = dueQuestionIds(progress, new Set(['later', 'soon', 'oldest']), days(1))

    expect(due).toEqual(['oldest', 'soon'])
  })
})

describe('recordSession', () => {
  const session = (score: number): QuizSession => ({
    finishedAt: now.toISOString(),
    label: 'Architecture',
    score,
    total: 10,
  })

  it(`keeps the last ${SESSION_HISTORY_LENGTH} sessions, the latest first`, () => {
    let progress = emptyProgress()
    for (let score = 0; score <= SESSION_HISTORY_LENGTH; score++) {
      progress = recordSession(progress, session(score))
    }

    expect(progress.sessions).toHaveLength(SESSION_HISTORY_LENGTH)
    expect(progress.sessions[0]?.score).toBe(SESSION_HISTORY_LENGTH)
  })
})

describe('progressStats', () => {
  it('counts the questions seen and due among the current ones', () => {
    let progress = emptyProgress()
    progress = recordAnswer(progress, 'a', true, now)
    progress = recordAnswer(progress, 'b', false, now)
    progress = recordAnswer(progress, 'removed', false, now)

    const stats = progressStats(progress, new Set(['a', 'b', 'c']), days(1))

    expect(stats).toEqual({ seen: 2, total: 3, due: 1 })
  })
})

describe('parseProgress', () => {
  it('reads back what was saved', () => {
    const progress = recordSession(recordAnswer(emptyProgress(), 'q', true, now), {
      finishedAt: now.toISOString(),
      label: 'Quiz mélangé',
      score: 7,
      total: 10,
    })

    expect(parseProgress(JSON.stringify(progress))).toEqual(progress)
  })

  it('starts empty when nothing was saved', () => {
    expect(parseProgress(null)).toEqual(emptyProgress())
  })

  it.each([
    ['broken JSON', '{'],
    ['another version', JSON.stringify({ version: 2, cards: {}, sessions: [] })],
    ['a malformed card', JSON.stringify({ version: 1, cards: { q: { due: 3 } }, sessions: [] })],
  ])('rejects %s', (_, raw) => {
    expect(parseProgress(raw)).toBeUndefined()
  })
})
