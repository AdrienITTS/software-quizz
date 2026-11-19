import { describe, expect, it } from 'vitest'
import { frenchTypography } from '../../scripts/questions/french-typography.ts'

describe('frenchTypography', () => {
  it.each([
    ['Quel principe ?', 'Quel principe ?'],
    ['Vrai !', 'Vrai !'],
    [
      'Deux cas : lecture et écriture ; rien d’autre.',
      'Deux cas : lecture et écriture ; rien d’autre.',
    ],
    ['Le « design simple » de Beck', 'Le « design simple » de Beck'],
  ])('uses a no-break space in "%s"', (text, expected) => {
    expect(frenchTypography(text)).toBe(expected)
  })

  it('leaves URLs and times alone', () => {
    const text = 'Voir https://example.com, à 10:30.'

    expect(frenchTypography(text)).toBe(text)
  })
})
