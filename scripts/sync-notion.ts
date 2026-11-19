import { Client, collectPaginatedAPI, isNotionClientError, LogLevel } from '@notionhq/client'
import { z } from 'zod'
import { parseConcepts, type NotionConceptSheet } from './notion/parse-concepts.ts'
import { CONCEPTS_FILE, writeDataFile } from './data-files.ts'

const PUBLISHED_STATUS = '✅ Rédigé'

const env = z
  .object({
    NOTION_TOKEN: z.string().min(1),
    NOTION_CONCEPTS_DATA_SOURCE_ID: z.string().min(1),
  })
  .parse(process.env)

// The SDK logs failed requests with their full message, ids included: keep CI logs quiet.
const notion = new Client({ auth: env.NOTION_TOKEN, logLevel: LogLevel.ERROR })

async function fetchSheets(): Promise<NotionConceptSheet[]> {
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
  return sheets
}

let sheets: NotionConceptSheet[]
try {
  sheets = await fetchSheets()
} catch (error) {
  // A Notion error carries the response body, with ids and the integration name, and the
  // CI logs are public: keep only the error code.
  if (isNotionClientError(error)) {
    // eslint-disable-next-line preserve-caught-error -- Node would print the cause, ids included.
    throw new Error(`Notion request failed: ${error.code}`)
  }
  throw error
}

const concepts = parseConcepts(sheets)
await writeDataFile(CONCEPTS_FILE, concepts)
console.log(`Wrote ${concepts.length} concepts to ${CONCEPTS_FILE}`)
