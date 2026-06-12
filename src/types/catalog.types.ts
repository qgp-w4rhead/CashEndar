// Product catalog types: canonical items with aliases, comparison
// categories ("apples to apples" groups) and stat definitions.

export const StatBasis = {
  PER_100G: 'per100g',
  PER_UNIT: 'perUnit',
  PER_PORTION: 'perPortion',
} as const
export type StatBasis = typeof StatBasis[keyof typeof StatBasis]

export const STAT_BASIS_LABELS: Record<StatBasis, string> = {
  [StatBasis.PER_100G]: 'per 100g',
  [StatBasis.PER_UNIT]: 'per unit',
  [StatBasis.PER_PORTION]: 'per portion',
}

export interface Item {
  id: string;
  name: string;            // Canonical name
  aliases: string[];       // Receipt/alternate names that resolve to this item
  brand?: string;
  categoryId?: string;     // Comparison category
  stats: Record<string, number>; // statDefinitionId -> value
}

export interface ComparisonCategory {
  id: string;
  label: string;
  value: string;
  color: string;
  isCustom: boolean;
  defaultBasis: StatBasis;
}

export interface StatDefinition {
  id: string;
  label: string;
  unit: string;
  basis: StatBasis;
  isBuiltin: boolean;
  starred: boolean;
  derived: boolean; // Computed from purchase data instead of stored per item
}
