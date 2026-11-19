import { z } from 'zod'
import type { Concept, Definition } from '../../shared/concept.type.ts'

/** A page of the Concepts data source and its top-level blocks, as the Notion API returns them. */
export type NotionConceptSheet = { page: unknown; blocks: unknown[] }

const DEFINITIONS_HEADING = 'Comprendre'

const plainText = z.array(z.object({ plain_text: z.string() })).transform((parts) =>
  parts
    .map((part) => part.plain_text)
    .join('')
    .trim(),
)

// Zod drops every key it does not declare: these schemas are the allowlist of published fields.
const pageSchema = z.object({
  id: z.string(),
  properties: z.object({
    Nom: z.object({ title: plainText }),
    Résumé: z.object({ rich_text: plainText }),
    Tags: z.object({ multi_select: z.array(z.object({ name: z.string() })) }),
    'Concepts liés': z.object({ relation: z.array(z.object({ id: z.string() })) }),
  }),
})

type SectionBlock =
  { kind: 'heading'; text: string } | { kind: 'bullet'; text: string } | { kind: 'other' }

const textBlock = z.object({ rich_text: plainText }).optional()

const blockSchema = z
  .object({
    heading_1: textBlock,
    heading_2: textBlock,
    heading_3: textBlock,
    bulleted_list_item: textBlock,
    numbered_list_item: textBlock,
  })
  .transform((block): SectionBlock => {
    const heading = block.heading_1 ?? block.heading_2 ?? block.heading_3
    if (heading) return { kind: 'heading', text: heading.rich_text }
    const listItem = block.bulleted_list_item ?? block.numbered_list_item
    if (listItem) return { kind: 'bullet', text: listItem.rich_text }
    return { kind: 'other' }
  })

type ParsedSheet = {
  id: string
  relatedIds: string[]
  concept: Omit<Concept, 'relatedSlugs'>
}

/**
 * Turns Notion sheets into publishable concepts: only the allowed fields, with slugs in place
 * of Notion ids. Related sheets that are not in `sheets` are dropped.
 */
export function parseConcepts(sheets: NotionConceptSheet[]): Concept[] {
  const parsed = sheets.map(parseSheet)
  assertUniqueSlugs(parsed)
  const slugById = new Map(parsed.map(({ id, concept }) => [id, concept.slug]))

  return parsed.map(({ concept, relatedIds }) => ({
    ...concept,
    relatedSlugs: relatedIds.flatMap((id) => slugById.get(id) ?? []),
  }))
}

function parseSheet({ page, blocks }: NotionConceptSheet): ParsedSheet {
  const { id, properties } = pageSchema.parse(page)
  const name = properties.Nom.title
  if (!name) throw new Error('A sheet has no name')
  const summary = properties.Résumé.rich_text
  if (!summary) throw new Error(`"${name}" has no summary`)

  return {
    id,
    relatedIds: properties['Concepts liés'].relation.map((relation) => relation.id),
    concept: {
      slug: toSlug(name),
      name,
      summary,
      tags: properties.Tags.multi_select.map((tag) => tag.name),
      definitions: definitionsOf(z.array(blockSchema).parse(blocks)),
    },
  }
}

function definitionsOf(blocks: SectionBlock[]): Definition[] {
  const start = blocks.findIndex(
    (block) => block.kind === 'heading' && block.text === DEFINITIONS_HEADING,
  )
  if (start === -1) return []

  const section = blocks.slice(start + 1)
  const end = section.findIndex((block) => block.kind === 'heading')
  return section
    .slice(0, end === -1 ? undefined : end)
    .flatMap((block) => (block.kind === 'bullet' ? toDefinition(block.text) : []))
}

/** Reads "Term : definition"; the space before the colon may be a non-breaking one. */
function toDefinition(text: string): Definition[] {
  const separator = /\s:\s/.exec(text)
  if (!separator) return []

  const term = text.slice(0, separator.index).trim()
  const definition = text.slice(separator.index + separator[0].length).trim()
  return term && definition ? [{ term, definition }] : []
}

function toSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function assertUniqueSlugs(sheets: ParsedSheet[]): void {
  const seen = new Set<string>()
  for (const { concept } of sheets) {
    if (seen.has(concept.slug)) throw new Error(`Two sheets share the slug "${concept.slug}"`)
    seen.add(concept.slug)
  }
}
