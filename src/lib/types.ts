
import type { Timestamp } from 'firebase/firestore';

export interface Client {
  id: string;
  // YOUR DETAILS
  name: string; 
  contactEmail: string; 
  contactPhone: string; 
  address: string; 
  preferredContactMethod: 'Email' | 'Phone';
  referralSource?: string; 

  // YOUR DOG'S DETAILS
  dogName: string; 
  dogBreed: string; 
  dogAge: string; 
  dogSex: 'Male' | 'Female';
  dogNeutered: 'Yes' | 'No'; 
  dogOrigin: 'Breeder' | 'Rescue (UK)' | 'Rescue (Abroad)' | 'Other';
  dogOriginOther?: string; 
  dogAcquisitionDuration: string; 
  
  livesWithOtherDogs: 'Yes' | 'No';
  otherDogsDetails?: string; 
  livesWithCats: 'Yes' | 'No';
  catsDetails?: string; 
  livesWithChildren: 'Yes' | 'No';
  childrenDetails?: string; 
  visitingChildren: 'Yes' | 'No';
  visitingChildrenDetails?: string; 
  otherHouseholdMembers?: string; 
  
  // BEHAVIOURAL INFORMATION
  behaviouralProblemsDescription: string; 
  problemStartDate: string; 
  problemFrequency: string; 
  problemSituations: string; 
  problemTriggers?: string; 
  previousSolutions?: string; 
  
  dogAggression: 'Yes' | 'No'; 
  dogAggressionDetails?: string; 
  
  trainingGoals: string; 
  
  // HEALTH & LIFESTYLE
  dailyRoutine: string; 
  dailyExercise: string; 
  exerciseType: string; 
  dogFoodType: string; 
  
  healthProblemsAllergies?: string; 
  lastVetCheck?: string; 
  currentMedication?: string; 
  pastInjuriesSurgeries?: string; 
  
  // TRAINING & SOCIALISATION
  attendedTrainingClasses: 'Yes' | 'No';
  trainingClassesDetails?: string; 
  
  socialisationWithDogs?: string; 
  socialisationWithPeople?: string; 
  
  // CONSENT & AGREEMENT
  vetConsent: boolean; 
  commitmentConsent: boolean; 
  termsConsent: boolean; 
  
  signature: string; 
  submissionDate: string; 

  // Original optional fields from before this detailed form
  // behaviorHistory is kept for backward compatibility or internal notes, 
  // but new detailed fields above are primary for intake.
  behaviorHistory?: string; 

  // System Fields
  lastSession?: string; // Date of last session as YYYY-MM-DD string or 'N/A'
  nextSession?: string; // Date of next session as YYYY-MM-DD string or 'Not Scheduled'
  createdAt?: Timestamp | Date | string; 
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
