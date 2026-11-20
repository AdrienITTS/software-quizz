import { describe, expect, it } from 'vitest'
import { frenchTypography } from '../../scripts/questions/french-typography.ts'

const NBSP = '\u00a0'

describe('frenchTypography', () => {
  it.each([
    ['Quel principe ?', `Quel principe${NBSP}?`],
    ['Vrai !', `Vrai${NBSP}!`],
    ['Deux cas : lecture ; écriture.', `Deux cas${NBSP}: lecture${NBSP}; écriture.`],
    ['Le « design simple » de Beck', `Le «${NBSP}design simple${NBSP}» de Beck`],
  ])('uses a no-break space in "%s"', (text, expected) => {
    expect(frenchTypography(text)).toBe(expected)
  })

  it('leaves URLs and times alone', () => {
    const text = 'Voir https://example.com, à 10:30.'

    expect(frenchTypography(text)).toBe(text)
  })
})
