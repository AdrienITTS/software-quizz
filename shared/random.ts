/** Returns numbers in [0, 1), like Math.random, but reproducible. */
export type Random = () => number

/** FNV-1a: a fast, stable 32-bit hash. Not for security, only for seeds and ids. */
export function hashText(text: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** Mulberry32, seeded from a text so that the same content always gives the same questions. */
export function seededRandom(seed: string): Random {
  let state = hashText(seed)
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 2 ** 32
  }
}

/** Fisher-Yates on a copy. */
export function shuffle<T>(items: readonly T[], random: Random): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1))
    ;[result[index], result[other]] = [result[other] as T, result[index] as T]
  }
  return result
}
