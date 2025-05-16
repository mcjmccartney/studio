export interface Client {
  id: string;
  name: string;
  dogName: string;
  dogBreed: string;
  contactEmail: string;
  contactPhone: string;
  behaviorHistory?: string;
  lastSession?: string; // Date of last session
  nextSession?: string; // Date of next session
}

export interface Session {
  id: string;
  clientId: string;
  clientName: string; 
  dogName: string; 
  date: string; 
  time: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  notes?: string;
}

export interface FinancialTransaction {
  id: string;
  date: string; 
  description: string;
  type: 'Income' | 'Expense';
  amount: number;
  status: 'Paid' | 'Unpaid' | 'Pending';
  clientId?: string; 
  clientName?: string; 
}
