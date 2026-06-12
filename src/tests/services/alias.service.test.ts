import { describe, it, expect } from 'vitest'
import {
  normalizeName,
  buildAliasLookup,
  resolveCanonicalName,
  suggestAliasMatches,
  levenshteinDistance,
  nameSimilarity,
} from '../../services/alias.service'
import { Item } from '../../types/catalog.types'

const makeItem = (name: string, aliases: string[] = [], id = name): Item => ({
  id,
  name,
  aliases,
  stats: {},
})

describe('normalizeName', () => {
  it('lowercases and trims', () => {
    expect(normalizeName('  Pasta Barilla ')).toBe('pasta barilla')
  })

  it('strips size tokens like 500g, 1.5L and x4', () => {
    expect(normalizeName('Pasta Barilla 500g')).toBe('pasta barilla')
    expect(normalizeName('Coke 1.5L x4')).toBe('coke')
    expect(normalizeName('Milk 2x 1L')).toBe('milk')
  })

  it('strips punctuation and standalone numbers', () => {
    expect(normalizeName('B&B Bread, sliced (2)')).toBe('b b bread sliced')
  })

  it('removes accents', () => {
    expect(normalizeName('Pâtes à l’œuf')).toBe('pates a l uf')
  })
})

describe('levenshteinDistance', () => {
  it('computes edit distance', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3)
    expect(levenshteinDistance('', 'abc')).toBe(3)
    expect(levenshteinDistance('same', 'same')).toBe(0)
  })
})

describe('resolveCanonicalName', () => {
  const items = [
    makeItem('Pasta Barilla', ['PST BARILLA', 'BARILLA SPAGH 500G']),
    makeItem('Whole Milk', ['MLK WHL']),
  ]
  const lookup = buildAliasLookup(items)

  it('resolves canonical names to themselves', () => {
    expect(resolveCanonicalName('Pasta Barilla', lookup)).toBe('Pasta Barilla')
  })

  it('resolves aliases regardless of case and size suffixes', () => {
    expect(resolveCanonicalName('pst barilla', lookup)).toBe('Pasta Barilla')
    expect(resolveCanonicalName('PST BARILLA 500G', lookup)).toBe('Pasta Barilla')
    expect(resolveCanonicalName('Barilla Spagh', lookup)).toBe('Pasta Barilla')
  })

  it('returns unknown names unchanged (trimmed)', () => {
    expect(resolveCanonicalName(' Olive Oil ', lookup)).toBe('Olive Oil')
  })
})

describe('suggestAliasMatches', () => {
  const items = [
    makeItem('Pasta Barilla'),
    makeItem('Whole Milk'),
    makeItem('Orange Juice'),
    makeItem('Strawberry Jam'),
  ]

  it('matches abbreviated receipt names (vowel-dropped)', () => {
    const suggestions = suggestAliasMatches('PST BARILLA 500G', items)
    expect(suggestions.length).toBeGreaterThan(0)
    expect(suggestions[0].item.name).toBe('Pasta Barilla')
  })

  it('matches truncated receipt names (prefix)', () => {
    const suggestions = suggestAliasMatches('STRAWB JAM', items)
    expect(suggestions.length).toBeGreaterThan(0)
    expect(suggestions[0].item.name).toBe('Strawberry Jam')
  })

  it('ranks the right item first among similar candidates', () => {
    const suggestions = suggestAliasMatches('ORANGE JCE 1L', items)
    expect(suggestions[0].item.name).toBe('Orange Juice')
  })

  it('does not suggest unrelated items', () => {
    const suggestions = suggestAliasMatches('DOG FOOD ROYAL CANIN', items)
    expect(suggestions).toEqual([])
  })

  it('returns empty for blank input', () => {
    expect(suggestAliasMatches('   ', items)).toEqual([])
  })

  it('matches against existing aliases too', () => {
    const withAlias = [makeItem('Pasta Barilla', ['BAR PENNE'])]
    const suggestions = suggestAliasMatches('BAR PENNE RIGATE', withAlias)
    expect(suggestions.length).toBeGreaterThan(0)
    expect(suggestions[0].item.name).toBe('Pasta Barilla')
  })
})

describe('nameSimilarity', () => {
  it('is 1 for names equal after normalization', () => {
    expect(nameSimilarity('Pasta Barilla 500g', 'pasta barilla')).toBe(1)
  })

  it('is higher for closer names', () => {
    const close = nameSimilarity('PST BARILLA', 'Pasta Barilla')
    const far = nameSimilarity('PST BARILLA', 'Whole Milk')
    expect(close).toBeGreaterThan(far)
  })
})
