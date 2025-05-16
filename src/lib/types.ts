
import type { Timestamp } from 'firebase/firestore';

// Primarily contact information and a link to the behavioural brief
export interface Client {
  id: string; // System managed

  // CONTACT INFORMATION
  ownerFirstName: string;
  ownerLastName: string;
  contactEmail: string;
  contactNumber: string;
  postcode: string;

  // Link to the Behavioural Brief
  behaviouralBriefId?: string; // ID of the associated BehaviouralBrief document in Firestore

  // System Fields
  submissionDate: string; // Date the original brief/contact was submitted
  lastSession?: string; // Date of last session as YYYY-MM-DD string or 'N/A'
  nextSession?: string; // Date of next session as YYYY-MM-DD string or 'Not Scheduled'
  createdAt?: Timestamp | Date | string; // Firestore timestamp for when client record was created
}

// Detailed dog and behavioural information
export interface BehaviouralBrief {
  id: string; // System managed, ID of this brief document
  clientId: string; // ID of the Client this brief belongs to

  // DOG INFORMATION from the form
  dogName: string;
  dogSex: 'Male' | 'Female' | '';
  dogBreed: string;
  lifeWithDogAndHelpNeeded: string;
  bestOutcome: string;
  idealSessionTypes?: string[]; // Optional array of selected session types

  // System Fields
  submissionDate: string; // Date this brief was submitted (copied from form)
  createdAt?: Timestamp | Date | string; // Firestore timestamp for when brief was created
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
