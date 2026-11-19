import { describe, expect, it } from 'vitest'
import { hashText, seededRandom, shuffle } from '../../shared/random.ts'

describe('seededRandom', () => {
  it('gives the same sequence for the same seed', () => {
    const first = seededRandom('solid')
    const second = seededRandom('solid')

    expect([first(), first(), first()]).toEqual([second(), second(), second()])
  })

  it('gives numbers in [0, 1)', () => {
    const random = seededRandom('range')

    const values = Array.from({ length: 1000 }, random)

    expect(values.every((value) => value >= 0 && value < 1)).toBe(true)
  })
})

describe('shuffle', () => {
  it('returns a reordered copy with the same items', () => {
    const items = ['a', 'b', 'c', 'd', 'e']

    const shuffled = shuffle(items, seededRandom('shuffle'))

    expect(shuffled).toHaveLength(items.length)
    expect([...shuffled].sort()).toEqual(items)
    expect(items).toEqual(['a', 'b', 'c', 'd', 'e'])
  })
})

describe('hashText', () => {
  it('is stable and tells texts apart', () => {
    expect(hashText('SOLID')).toBe(hashText('SOLID'))
    expect(hashText('SOLID')).not.toBe(hashText('KISS'))
  })
})
