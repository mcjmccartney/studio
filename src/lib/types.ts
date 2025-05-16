
import type { Timestamp } from 'firebase/firestore';

export interface Client {
  id: string; // System managed

  // CONTACT INFORMATION
  ownerFirstName: string;
  ownerLastName: string;
  contactEmail: string;
  contactNumber: string;
  postcode: string;

  // DOG INFORMATION
  dogName: string;
  dogSex: 'Male' | 'Female' | ''; // Allow '' for initial state of select
  dogBreed: string; // "What breed is your dog?"
  lifeWithDogAndHelpNeeded: string; // "In general, how is life with your dog, and what would you like help with?"
  bestOutcome: string; // "What would be the best outcome for you and your dog?"
  idealSessionTypes?: string[]; // "Which type of session would you ideally like?" (array of selected checkbox values) - Optional field

  // System Fields
  submissionDate: string; // Auto-filled on public form submission
  lastSession?: string; // Date of last session as YYYY-MM-DD string or 'N/A'
  nextSession?: string; // Date of next session as YYYY-MM-DD string or 'Not Scheduled'
  createdAt?: Timestamp | Date | string; // Firestore timestamp
}

export interface Session {
  id: string;
  clientId: string;
  clientName: string; // Concatenation of ownerFirstName and ownerLastName
  dogName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  notes?: string;
  createdAt?: Timestamp | Date | string;
}

export interface FinancialTransaction {
  id:string;
  date: string; // YYYY-MM-DD
  description: string;
  type: 'Income' | 'Expense';
  amount: number;
  status: 'Paid' | 'Unpaid' | 'Pending';
  clientId?: string;
  clientName?: string;
  createdAt?: Timestamp | Date | string;
}
