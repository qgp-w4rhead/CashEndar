export const ViewMode = {
  MONTH: 'month',
  WEEK: 'week',
} as const
export type ViewMode = typeof ViewMode[keyof typeof ViewMode]

export const PaymentFrequency = {
  ONE_TIME: 'one-time',
  WEEKLY: 'weekly',
  BI_MONTHLY: 'bi-monthly',
  RECURRING: 'recurring',
} as const
export type PaymentFrequency = typeof PaymentFrequency[keyof typeof PaymentFrequency]

export const FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  [PaymentFrequency.ONE_TIME]: 'One-Time',
  [PaymentFrequency.WEEKLY]: 'Weekly',
  [PaymentFrequency.BI_MONTHLY]: 'Bi-Monthly',
  [PaymentFrequency.RECURRING]: 'Monthly',
}

export interface Payment {
  id: string;
  title: string;
  amount: string;
  date: string;
  time?: string;
  type: string;
  day?: number;
  dayOfWeek?: number;
  referenceDate?: number;
  frequency: 'one-time' | 'recurring' | 'weekly' | 'bi-monthly';
  itemName?: string; 
  brand?: string; 
  quantity?: number;
  unitCost?: number;
  portionSize?: number; 
  portionsCount?: number; 
  itemSize?: number;
  itemSizeUnit?: 'single' | 'gram' | 'kg' | 'ml' | 'liter' | 'cup' | 'tablespoon' | 'teaspoon' | 'piece' | 'can' | 'bottle'; // Unit for item size
  depletionRate?: number;
  depletionUnit?: 'day' | 'week' | 'month';
  depletionTime?: number;
  forgone?: boolean;
  // Expiration tracking fields
  expirationPeriod?: number; // Time amount (e.g., 5)
  expirationUnit?: 'day' | 'week' | 'month' | 'year'; // Time unit
  freshnessOffset?: number; // Days to subtract from expiration
  freshnessOffsetUnit?: 'day' | 'week' | 'month' | 'year'; // Time unit for freshness offset
  calculatedExpirationDate?: string; // Computed per purchase (YYYY-MM-DD)
  statOverrides?: Record<string, number>; // Per-purchase stat values (statDefinitionId -> value)
}

export interface Earning {
  id: string;
  title: string;
  amount: string;
  date: string;
  type: string;
  day?: number;
  isRecurring: boolean;
}

export interface PaymentType {
  id: string;
  label: string;
  value: string;
  color: string;
  isCustom: boolean;
  isEarning?: boolean;
}
