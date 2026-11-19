import { mkdir, writeFile } from 'node:fs/promises'
import { Client, collectPaginatedAPI } from '@notionhq/client'
import { z } from 'zod'
import { findNotionTraces } from './notion/find-notion-traces.ts'
import { parseConcepts, type NotionConceptSheet } from './notion/parse-concepts.ts'

const OUTPUT_DIR = 'generated'
const OUTPUT_FILE = `${OUTPUT_DIR}/concepts.json`
const PUBLISHED_STATUS = '✅ Rédigé'

const env = z
  .object({
    NOTION_TOKEN: z.string().min(1),
    NOTION_CONCEPTS_DATA_SOURCE_ID: z.string().min(1),
  })
  .parse(process.env)

const notion = new Client({ auth: env.NOTION_TOKEN })

const pages = await collectPaginatedAPI(notion.dataSources.query, {
  data_source_id: env.NOTION_CONCEPTS_DATA_SOURCE_ID,
  filter: { property: 'Statut', select: { equals: PUBLISHED_STATUS } },
})

// One page at a time: the Notion API allows about three requests per second.
const sheets: NotionConceptSheet[] = []
for (const page of pages) {
  const blocks = await collectPaginatedAPI(notion.blocks.children.list, { block_id: page.id })
  sheets.push({ page, blocks })
}

const concepts = parseConcepts(sheets)
const json = `${JSON.stringify(concepts, null, 2)}\n`

const traces = findNotionTraces(json)
if (traces.length > 0) throw new Error(`The output contains Notion traces: ${traces.join(', ')}`)

await mkdir(OUTPUT_DIR, { recursive: true })
await writeFile(OUTPUT_FILE, json)
console.log(`Wrote ${concepts.length} concepts to ${OUTPUT_FILE}`)
