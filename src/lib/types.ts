
import type { Timestamp } from 'firebase/firestore';

export interface Client {
  id: string;
  name: string; // Your Full Name
  dogName: string; // Dog's Name
  dogBreed: string; // Dog's Breed
  contactEmail: string; // Your Email
  contactPhone: string; // Your Phone Number
  
  // Fields from Behavioural Brief
  address?: string; // Your Address
  preferredContactMethod?: 'Email' | 'Phone';
  referralSource?: string; // How did you hear about us?
  
  dogAge?: string; // Dog's Age
  dogSex?: 'Male' | 'Female';
  dogNeutered?: 'Yes' | 'No'; // Is your dog neutered?
  dogOrigin?: 'Breeder' | 'Rescue (UK)' | 'Rescue (Abroad)' | 'Other';
  dogOriginOther?: string; // If Other, please specify (for dogOrigin)
  dogAcquisitionDuration?: string; // How long have you had your dog?
  
  livesWithOtherDogs?: 'Yes' | 'No';
  otherDogsDetails?: string; // If yes, provide details
  livesWithCats?: 'Yes' | 'No';
  catsDetails?: string; // If yes, provide details
  livesWithChildren?: 'Yes' | 'No';
  childrenDetails?: string; // If yes, provide ages
  visitingChildren?: 'Yes' | 'No';
  visitingChildrenDetails?: string; // If yes, provide ages and frequency
  otherHouseholdMembers?: string; // Who else lives in the household?
  
  behaviouralProblemsDescription?: string; // "Please describe in detail the behavioural problem(s)..."
  problemStartDate?: string; // When did the problem behaviour(s) start?
  problemFrequency?: string; // How often does the problem behaviour(s) occur?
  problemSituations?: string; // In what situations does the behaviour occur?
  problemTriggers?: string; // Are there any triggers for the behaviour?
  previousSolutions?: string; // What have you tried so far?
  
  dogAggression?: 'Yes' | 'No'; // Has your dog shown any aggression?
  dogAggressionDetails?: string; // If yes, describe incidents
  
  trainingGoals?: string; // What are your goals for your dog's behaviour?
  
  dailyRoutine?: string; // Describe dog's daily routine
  dailyExercise?: string; // How much exercise?
  exerciseType?: string; // What type of exercise?
  dogFoodType?: string; // What type of food?
  
  healthProblemsAllergies?: string; // Known health problems or allergies?
  lastVetCheck?: string; // When was last vet check?
  currentMedication?: string; // Currently on any medication?
  pastInjuriesSurgeries?: string; // Past injuries or surgeries?
  
  attendedTrainingClasses?: 'Yes' | 'No';
  trainingClassesDetails?: string; // If yes, describe type and experience
  
  socialisationWithDogs?: string; // Describe socialisation with dogs
  socialisationWithPeople?: string; // Describe socialisation with people
  
  vetConsent?: boolean; // I consent to Raising My Rescue contacting my vet
  commitmentConsent?: boolean; // I understand behavioural change takes time...
  termsConsent?: boolean; // I agree to the terms and conditions
  
  signature?: string; // Please type your full name to sign
  submissionDate?: string; // Date of submission (auto-filled)

  // Original optional fields, re-evaluate if `behaviouralProblemsDescription` covers `behaviorHistory`
  behaviorHistory?: string; // May be used for internal notes or be deprecated

  // System Fields
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
