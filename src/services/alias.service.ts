// Alias resolution and fuzzy matching between receipt-style names
// ("PST BARILLA 500G") and canonical catalog items ("Pasta Barilla").
// Pure functions — reactive wiring lives in the catalog store.
import { Item } from '../types/catalog.types'

// Units commonly glued to sizes on receipts; stripped during normalization
const SIZE_TOKEN_PATTERN = /\b\d+(?:[.,]\d+)?\s*(?:g|gr|kg|mg|ml|cl|l|lt|lb|oz|pcs?|pc|ct|pk)\b\.?/g
const MULTIPLIER_PATTERN = /\b\d+\s*x\b|\bx\s*\d+\b/g

// Combining diacritical marks left over after NFD decomposition
const DIACRITICS_PATTERN = new RegExp('[\\u0300-\\u036f]', 'g')

// Lowercase, strip accents, drop size tokens ("500g", "1.5L", "x4"),
// punctuation and leftover numbers, collapse whitespace
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_PATTERN, '')
    .replace(SIZE_TOKEN_PATTERN, ' ')
    .replace(MULTIPLIER_PATTERN, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b\d+\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Maps every normalized canonical name and alias to its canonical name
export type AliasLookup = Map<string, string>

export function buildAliasLookup(items: Item[]): AliasLookup {
  const lookup: AliasLookup = new Map()
  items.forEach(item => {
    const normalized = normalizeName(item.name)
    if (normalized) lookup.set(normalized, item.name)
    item.aliases.forEach(alias => {
      const normalizedAlias = normalizeName(alias)
      if (normalizedAlias && !lookup.has(normalizedAlias)) {
        lookup.set(normalizedAlias, item.name)
      }
    })
  })
  return lookup
}

// Resolve any name (raw receipt name, alias, old free-text itemName) to its
// canonical catalog name; unknown names resolve to themselves
export function resolveCanonicalName(name: string, lookup: AliasLookup): string {
  if (!name) return name
  return lookup.get(normalizeName(name)) ?? name.trim()
}

export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  let prev = new Array(b.length + 1)
  let curr = new Array(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[b.length]
}

// Similarity in [0, 1]: 1 = identical
export function levenshteinSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  return 1 - levenshteinDistance(a, b) / maxLen
}

// Receipts abbreviate by dropping vowels ("PST" for pasta) — compare
// consonant skeletons to catch those
function consonantSkeleton(token: string): string {
  return token.replace(/[aeiou]/g, '')
}

// How well two single tokens match, in [0, 1]
function tokenMatchScore(a: string, b: string): number {
  if (a === b) return 1

  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a]
  if (shorter.length >= 3 && longer.startsWith(shorter)) return 0.9

  const skelA = consonantSkeleton(a)
  const skelB = consonantSkeleton(b)
  if (skelA.length >= 2 && (skelA === skelB || skelB.startsWith(skelA) || skelA.startsWith(skelB))) {
    return 0.85
  }

  const similarity = levenshteinSimilarity(a, b)
  return similarity >= 0.75 ? similarity : 0
}

// Token-set similarity: each token of the shorter side greedily takes its
// best counterpart; extra unmatched tokens on either side dilute the score
function tokenSetScore(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0
  const [shorter, longer] = tokensA.length <= tokensB.length ? [tokensA, tokensB] : [tokensB, tokensA]

  const used = new Set<number>()
  let total = 0
  shorter.forEach(token => {
    let bestScore = 0
    let bestIndex = -1
    longer.forEach((candidate, index) => {
      if (used.has(index)) return
      const score = tokenMatchScore(token, candidate)
      if (score > bestScore) {
        bestScore = score
        bestIndex = index
      }
    })
    if (bestIndex !== -1) used.add(bestIndex)
    total += bestScore
  })

  return total / longer.length
}

// Overall similarity between a raw (receipt) name and a candidate name
export function nameSimilarity(rawName: string, candidateName: string): number {
  const normalizedRaw = normalizeName(rawName)
  const normalizedCandidate = normalizeName(candidateName)
  if (!normalizedRaw || !normalizedCandidate) return 0
  if (normalizedRaw === normalizedCandidate) return 1

  const tokenScore = tokenSetScore(normalizedRaw.split(' '), normalizedCandidate.split(' '))
  const stringScore = levenshteinSimilarity(normalizedRaw, normalizedCandidate)
  return Math.max(0.6 * tokenScore + 0.4 * stringScore, tokenScore * 0.95)
}

export interface AliasSuggestion {
  item: Item
  score: number
}

export const ALIAS_SUGGESTION_THRESHOLD = 0.55

// Suggest catalog items a raw name probably refers to (best first).
// Exact resolutions score 1 — callers usually resolve first and only ask
// for suggestions when resolution failed.
export function suggestAliasMatches(rawName: string, items: Item[], limit = 3): AliasSuggestion[] {
  if (!rawName.trim()) return []

  const suggestions: AliasSuggestion[] = []
  items.forEach(item => {
    let best = nameSimilarity(rawName, item.name)
    item.aliases.forEach(alias => {
      best = Math.max(best, nameSimilarity(rawName, alias))
    })
    if (best >= ALIAS_SUGGESTION_THRESHOLD) {
      suggestions.push({ item, score: best })
    }
  })

  return suggestions.sort((a, b) => b.score - a.score).slice(0, limit)
}
