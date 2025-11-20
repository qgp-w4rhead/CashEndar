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
  portionSize?: number; 
  portionsCount?: number; 
  itemSize?: number;
  itemSizeUnit?: 'single' | 'gram' | 'kg' | 'ml' | 'liter' | 'cup' | 'tablespoon' | 'teaspoon' | 'piece' | 'can' | 'bottle'; // Unit for item size
  depletionRate?: number;
  depletionUnit?: 'day' | 'week' | 'month';
  depletionTime?: number;
  forgone?: boolean;
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
