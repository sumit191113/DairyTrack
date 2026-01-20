export interface MilkRecord {
  id: string;
  date: string; // ISO String YYYY-MM-DD
  quantity: number;
  totalPrice: number;
  pricePerLiter: number;
  timestamp: number;
  status?: 'PAID' | 'UNPAID';
}

export interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  timestamp: number;
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