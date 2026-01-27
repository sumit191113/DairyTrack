
export interface MilkRecord {
  id: string;
  date: string; // ISO String YYYY-MM-DD
  quantity: number;
  totalPrice: number;
  pricePerLiter: number;
  timestamp: number;
  shift?: 'DAY' | 'NIGHT'; // Added shift field
  status?: 'PAID' | 'UNPAID';
  pendingSync?: boolean; // New: True if waiting to upload
}

export interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  timestamp: number;
  remindMe?: boolean; // New: True if user wants a reminder for this note
  pendingSync?: boolean; // New: True if waiting to upload
}

export interface FolderSummary {
  id: string; // Identifier for the folder (e.g., "2023-10-P1")
  label: string; // Display label (e.g., "1–10 Oct 2023")
  startDate: string;
  endDate: string;
  totalQuantity: number;
  totalAmount: number;
  avgPricePerLiter: number;
  records: MilkRecord[];
}

export enum AppView {
  HOME = 'HOME',
  HISTORY = 'HISTORY',
  SETTINGS = 'SETTINGS',
  PROFILE = 'PROFILE',
  MANAGE = 'MANAGE',
  NOTEPAD = 'NOTEPAD',
  CALENDAR = 'CALENDAR',
  CALCULATOR = 'CALCULATOR',
  TRASH = 'TRASH'
}
