
import type { Timestamp } from 'firebase/firestore';

export interface Client {
  id: string;
  name: string;
  dogName: string;
  dogBreed: string;
  contactEmail: string;
  contactPhone: string;
  behaviorHistory?: string;
  lastSession?: string; // Date of last session as YYYY-MM-DD string or 'N/A'
  nextSession?: string; // Date of next session as YYYY-MM-DD string or 'Not Scheduled'
  createdAt?: Timestamp | Date | string; // Firestore timestamp, Date object, or string representation
}

export interface Session {
  id: string;
  clientId: string;
  clientName: string; 
  dogName: string; 
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  notes?: string;
  createdAt?: Timestamp | Date | string;
}

export interface FinancialTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  type: 'Income' | 'Expense';
  amount: number;
  status: 'Paid' | 'Unpaid' | 'Pending';
  clientId?: string; 
  clientName?: string; 
  createdAt?: Timestamp | Date | string;
}
