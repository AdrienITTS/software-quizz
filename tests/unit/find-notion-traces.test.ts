import { describe, expect, it } from 'vitest'
import { findNotionTraces } from '../../scripts/notion/find-notion-traces.ts'

describe('findNotionTraces', () => {
  it('finds nothing in plain quiz content', () => {
    const text = '{"name":"SOLID","summary":"Cinq principes de conception objet."}'

    expect(findNotionTraces(text)).toEqual([])
  })

  it.each([
    ['a dashed page id', '11111111-2222-4333-8444-555555555555', 'page id'],
    ['a compact page id', '11111111222243338444555555555555', 'page id'],
    ['a notion.so link', 'https://www.notion.so/SOLID', 'Notion URL'],
    ['a notion.site link', 'https://someone.notion.site/x', 'Notion URL'],
    ['an app.notion.com link', 'https://app.notion.com/p/x', 'Notion URL'],
    ['an integration token', 'ntn_0123456789abcdefghijABCDEFGHIJ', 'Notion token'],
    ['a legacy token', 'secret_0123456789abcdefghijABCDEFGHIJ', 'Notion token'],
  ])('reports %s', (_, trace, kind) => {
    const text = `{"summary":"before ${trace} after"}`

    expect(findNotionTraces(text)).toEqual([kind])
  })

  it('reports each kind once', () => {
    const text =
      '11111111-2222-4333-8444-555555555555 66666666-7777-4888-9999-aaaaaaaaaaaa https://notion.so/a'

    expect(findNotionTraces(text)).toEqual(['page id', 'Notion URL'])
  })
})
