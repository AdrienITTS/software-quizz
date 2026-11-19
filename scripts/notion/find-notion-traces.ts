const TRACE_PATTERNS = [
  {
    kind: 'page id',
    pattern: /\b[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}\b/i,
  },
  { kind: 'Notion URL', pattern: /notion\.(so|site|com)\b/i },
  { kind: 'Notion token', pattern: /\b(ntn|secret)_[A-Za-z0-9]{20,}/ },
]

/**
 * Lists the kinds of Notion traces found in a text. It never returns the matched values,
 * so the result can be printed in public CI logs.
 */
export function findNotionTraces(text: string): string[] {
  return TRACE_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(({ kind }) => kind)
}
