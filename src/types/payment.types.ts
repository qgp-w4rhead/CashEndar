// Payment interface for TypeScript
export interface Payment {
  id: string;
  title: string;
  amount: string;
  date: string;
  time?: string;
  type: string; // Changed to string to support custom types
  // Add day of month for calendar integration
  day?: number;
  // Add day of week for bi-monthly payments (0 = Sunday, 1 = Monday, etc.)
  dayOfWeek?: number;
  // Add reference date for bi-monthly payments (stored as timestamp)
  referenceDate?: number;
  // Add payment frequency type - now supports: 'one-time', 'recurring', 'weekly', 'bi-monthly'
  frequency: 'one-time' | 'recurring' | 'weekly' | 'bi-monthly';
}

// Earnings interface for TypeScript
export interface Earning {
  id: string;
  title: string;
  amount: string;
  date: string;
  type: string;
  // Add day of month for calendar integration
  day?: number;
  // Add earning frequency type
  isRecurring: boolean;
}

// Payment type interface for TypeScript
export interface PaymentType {
  id: string;
  label: string;
  value: string;
  color: string;
  isCustom: boolean;
  isEarning?: boolean; // New property to distinguish earnings from expenses
}
