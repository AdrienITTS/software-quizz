import { describe, expect, it } from 'vitest'
import { findNotionTraces } from '../../scripts/notion/find-notion-traces.ts'
import { parseConcepts } from '../../scripts/notion/parse-concepts.ts'

const SOLID_ID = '11111111-2222-4333-8444-555555555555'
const KISS_ID = 'bbbbbbbb-cccc-4ddd-8eee-ffffffffffff'
const UNPUBLISHED_ID = '12345678-90ab-4cde-8f01-234567890abc'

function richText(text: string) {
  return [
    {
      type: 'text',
      text: { content: text, link: null },
      annotations: { bold: false, code: false, color: 'default' },
      plain_text: text,
      href: null,
    },
  ]
}

function notionPage(page: {
  id: string
  name: string
  summary: string
  tags?: string[]
  related?: string[]
}) {
  return {
    object: 'page',
    id: page.id,
    url: `https://www.notion.so/${page.id.replaceAll('-', '')}`,
    properties: {
      Nom: { id: 'title', type: 'title', title: richText(page.name) },
      Résumé: { id: 'r', type: 'rich_text', rich_text: richText(page.summary) },
      Tags: {
        id: 't',
        type: 'multi_select',
        multi_select: (page.tags ?? []).map((name) => ({ id: 'o', name, color: 'blue' })),
      },
      'Concepts liés': {
        id: 'c',
        type: 'relation',
        relation: (page.related ?? []).map((id) => ({ id })),
        has_more: false,
      },
      Statut: { id: 's', type: 'select', select: { name: '✅ Rédigé', color: 'green' } },
      'Passages brief': { id: 'p', type: 'number', number: 3 },
    },
  }
}

function block(type: string, text: string) {
  return { object: 'block', id: SOLID_ID, type, [type]: { rich_text: richText(text) } }
}

const heading = (text: string) => block('heading_2', text)
const bullet = (text: string) => block('bulleted_list_item', text)
const paragraph = (text: string) => block('paragraph', text)

describe('parseConcepts', () => {
  it('maps a sheet to a concept with its Comprendre definitions', () => {
    const page = notionPage({
      id: SOLID_ID,
      name: 'SOLID',
      summary: 'Cinq principes de conception objet.',
      tags: ['Craftsmanship', 'Architecture'],
    })
    const blocks = [
      heading('Comprendre'),
      paragraph('Le problème de départ : un code rigide.'),
      bullet('S, Single Responsibility : un module n’a qu’une raison de changer.'),
      bullet('O, Open/Closed : on ajoute un comportement avec du nouveau code.'),
    ]

    const concepts = parseConcepts([{ page, blocks }])

    expect(concepts).toEqual([
      {
        slug: 'solid',
        name: 'SOLID',
        summary: 'Cinq principes de conception objet.',
        tags: ['Craftsmanship', 'Architecture'],
        relatedSlugs: [],
        definitions: [
          {
            term: 'S, Single Responsibility',
            definition: 'un module n’a qu’une raison de changer.',
          },
          {
            term: 'O, Open/Closed',
            definition: 'on ajoute un comportement avec du nouveau code.',
          },
        ],
      },
    ])
  })

  it('keeps only the "Term : definition" bullets of the Comprendre section', () => {
    const page = notionPage({ id: SOLID_ID, name: 'SOLID', summary: 'Résumé.' })
    const blocks = [
      heading('Le pitch'),
      bullet('Avant : hors section.'),
      heading('Comprendre'),
      bullet('Une puce sans séparateur.'),
      bullet('Terme : définition.'),
      heading('Exemple / cas d’usage'),
      bullet('Après : hors section.'),
      block('code', 'const avis = "opinion : non publiée"'),
    ]

    const [concept] = parseConcepts([{ page, blocks }])

    expect(concept?.definitions).toEqual([{ term: 'Terme', definition: 'définition.' }])
  })

  it('reads definitions written as a numbered list', () => {
    const page = notionPage({ id: SOLID_ID, name: 'Event Sourcing', summary: 'Résumé.' })
    const blocks = [
      heading('Comprendre'),
      block('numbered_list_item', 'Chargement : on rejoue les événements.'),
      block('numbered_list_item', 'Passe les tests.'),
    ]

    const [concept] = parseConcepts([{ page, blocks }])

    expect(concept?.definitions).toEqual([
      { term: 'Chargement', definition: 'on rejoue les événements.' },
    ])
  })

  it('resolves related sheets to slugs and drops the unpublished ones', () => {
    const solid = notionPage({
      id: SOLID_ID,
      name: 'SOLID',
      summary: 'Principes objet.',
      related: [KISS_ID, UNPUBLISHED_ID],
    })
    const kiss = notionPage({
      id: KISS_ID,
      name: 'KISS (Keep It Simple, Stupid)',
      summary: 'Simple.',
    })

    const [concept] = parseConcepts([
      { page: solid, blocks: [] },
      { page: kiss, blocks: [] },
    ])

    expect(concept?.relatedSlugs).toEqual(['kiss-keep-it-simple-stupid'])
  })

  it.each([
    ['Architecture N-tier (en couches)', 'architecture-n-tier-en-couches'],
    ['Événement métier', 'evenement-metier'],
    ['CI/CD', 'ci-cd'],
  ])('builds the slug of "%s" without accents or punctuation', (name, slug) => {
    const page = notionPage({ id: SOLID_ID, name, summary: 'Résumé.' })

    const [concept] = parseConcepts([{ page, blocks: [] }])

    expect(concept?.slug).toBe(slug)
  })

  it('publishes no Notion id, URL or private field', () => {
    const page = notionPage({
      id: SOLID_ID,
      name: 'SOLID',
      summary: 'Résumé.',
      related: [KISS_ID],
    })
    const kiss = notionPage({ id: KISS_ID, name: 'KISS', summary: 'Simple.' })

    const json = JSON.stringify(
      parseConcepts([
        { page, blocks: [heading('Comprendre'), bullet('Terme : définition.')] },
        { page: kiss, blocks: [] },
      ]),
    )

    expect(findNotionTraces(json)).toEqual([])
    expect(json).not.toMatch(/Statut|Rédigé|Passages/)
  })

  it('rejects two sheets that would share a slug', () => {
    const pages = [
      { page: notionPage({ id: SOLID_ID, name: 'CI/CD', summary: 'A.' }), blocks: [] },
      { page: notionPage({ id: KISS_ID, name: 'CI CD', summary: 'B.' }), blocks: [] },
    ]

    expect(() => parseConcepts(pages)).toThrow('Two sheets share the slug "ci-cd"')
  })

  it('rejects a sheet without a summary, naming it', () => {
    const page = notionPage({ id: SOLID_ID, name: 'SOLID', summary: '  ' })

    expect(() => parseConcepts([{ page, blocks: [] }])).toThrow('"SOLID" has no summary')
  })
})
