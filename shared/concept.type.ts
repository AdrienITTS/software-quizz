export type Definition = {
  term: string
  definition: string
}

/** A concept sheet reduced to the fields allowed on the public site. */
export type Concept = {
  slug: string
  name: string
  summary: string
  tags: string[]
  relatedSlugs: string[]
  definitions: Definition[]
}
