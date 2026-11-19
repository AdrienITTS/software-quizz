import { describe, expect, it } from 'vitest'
import { maskConceptName } from '../../scripts/questions/mask-concept-name.ts'

describe('maskConceptName', () => {
  it('masks the full name in one piece', () => {
    const summary = 'Le DDD (Domain-Driven Design) aligne le code sur le métier.'

    const masked = maskConceptName(summary, 'DDD (Domain-Driven Design)')

    expect(masked).toBe('Le ___ aligne le code sur le métier.')
  })

  it('masks the acronym and its expansion apart', () => {
    const summary = 'Domain-Driven Design, ou DDD, aligne le code sur le métier.'

    const masked = maskConceptName(summary, 'DDD (Domain-Driven Design)')

    expect(masked).toBe('___, ou ___, aligne le code sur le métier.')
  })

  it('ignores case', () => {
    const masked = maskConceptName('On rejoue l’event sourcing.', 'Event Sourcing')

    expect(masked).toBe('On rejoue l’___.')
  })

  it('masks every form of a name with alternatives', () => {
    const name = 'ETL / ELT (Extract, Transform, Load / Extract, Load, Transform)'

    const masked = maskConceptName('ETL transforme avant, ELT après.', name)

    expect(masked).toBe('___ transforme avant, ___ après.')
  })

  it('leaves the name inside another word alone', () => {
    const masked = maskConceptName('Les microservices et les CIS.', 'CI')

    expect(masked).toBe('Les microservices et les CIS.')
  })
})
