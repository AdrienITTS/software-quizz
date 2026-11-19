const MASK = '___'

/**
 * Hides a concept's name in a text, in all its forms: "DDD (Domain-Driven Design)" masks
 * the full name, "DDD" and "Domain-Driven Design"; " / " separates alternatives.
 */
export function maskConceptName(text: string, conceptName: string): string {
  return nameForms(conceptName).reduce(
    (masked, form) =>
      masked.replace(
        new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(form)}(?![\\p{L}\\p{N}])`, 'giu'),
        MASK,
      ),
    text,
  )
}

function nameForms(conceptName: string): string[] {
  const match = /^(.*?)\s*\((.*)\)$/.exec(conceptName)
  const parts = match ? [match[1] ?? '', match[2] ?? ''] : [conceptName]
  const forms = [conceptName, ...parts, ...parts.flatMap((part) => part.split(' / '))]
  // Longest first, so "Domain-Driven Design" goes before a shorter form it contains.
  return [...new Set(forms.map((form) => form.trim()).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  )
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
