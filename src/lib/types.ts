
import type { Timestamp } from 'firebase/firestore';

// Primarily contact information and a link to the behavioural brief
export interface Client {
  id: string; // System managed

  // CONTACT INFORMATION
  ownerFirstName: string;
  ownerLastName: string;
  contactEmail: string;
  contactNumber: string;
  postcode: string; // Retained for Behavioural Brief compatibility, populated from address by new form

  address?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    country: string;
    // Postcode is part of this structure but also at top level for simpler form.
  };
  howHeardAboutServices?: string;


  // Link to the Behavioural Brief
  behaviouralBriefId?: string; // ID of the associated BehaviouralBrief document in Firestore
  behaviourQuestionnaireId?: string; // ID of the associated BehaviourQuestionnaire document

  // System Fields
  submissionDate: string; // Date the original brief/contact was submitted
  lastSession?: string; // Date of last session as YYYY-MM-DD string or 'N/A'
  nextSession?: string; // Date of next session as YYYY-MM-DD string or 'Not Scheduled'
  createdAt?: Timestamp | Date | string; // Firestore timestamp for when client record was created
}

// Detailed dog and behavioural information from the "Behavioural Brief" form
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

// Data from the new "Behaviour Questionnaire" form
export interface BehaviourQuestionnaire {
  id: string; // System managed
  clientId: string; // ID of the Client this questionnaire belongs to

  // DOG INFORMATION (from questionnaire)
  dogName: string; // Already on BehaviouralBrief, but part of this form too
  dogAge: string;
  dogSex: 'Male' | 'Female' | ''; // Already on BehaviouralBrief
  dogBreed: string; // Already on BehaviouralBrief
  neuteredSpayedDetails: string; // "Neutered/Spayed? At what age?"
  mainProblem: string; // "What is the main thing you would like help with?"
  problemTendencyFirstNoticed: string; // "When did you first notice tendencies of this behaviour?"
  problemFrequencyDetails: string; // "When, where and how often does it happen? Be specific"
  problemRecentChanges: string; // "Has there been a recent change in the behaviour?"
  problemAnticipationDetails: string; // "Can you anticipate when it is likely to happen?"
  dogMotivationForProblem: string; // "Why do you think your dog is doing this?"
  problemAddressingAttempts: string; // "What have you done so far to address this problem? With what effect?"
  idealTrainingOutcome: string; // "What would you consider your ideal goal/outcome of a training program?"
  otherHelpNeeded?: string; // "Is there anything else you would like help with if possible?"

  // HEALTH AND VETERINARY INFORMATION
  medicalHistory?: string; // "Does your dog have any past relevant medical or health conditions..."
  vetConsultationDetails?: string; // "Have you specifically asked your Veterinarian about any of your dog’s training and behaviour concerns?"

  // BACKGROUND INFORMATION
  dogOrigin?: string; // "Where did you get your dog from?"
  rescueBackground?: string; // "If your dog was a rescue, what do you know about their background?"
  dogAgeWhenAcquired?: string; // "How old was your dog when you got him/her?"

  // DIET AND FEEDING
  dietDetails?: string; // "What do you feed your dog? Please be specific"
  foodMotivationLevel?: string; // "How food motivated is your dog?" (1-10)
  mealtimeRoutine?: string; // "Please describe your dog’s mealtime."
  treatRoutine?: string; // "Please describe any treat routine your dog has."
  externalTreatsConsent?: string; // "If applicable, are you happy for me to give your dog treats I bring along?"

  // ROUTINES
  playEngagement?: string; // "What types of play do you engage in with your dog? Do they enjoy it?"
  affectionResponse?: string; // "Are you affectionate with your dog? Do they enjoy it?"
  exerciseRoutine?: string; // "What types of exercise does your dog regularly get?"
  muzzleUsage?: string; // "Does your dog use a muzzle for any reason?"
  reactionToFamiliarPeople?: string; // "How does your dog react when familiar people come to your home?"
  reactionToUnfamiliarPeople?: string; // "How does your dog react when unfamiliar people come to your home?"
  housetrainedStatus?: string; // "Is your dog fully housetrained?"
  activitiesAsideFromWalks?: string; // "What does your dog like to do aside from walks?"

  // TEMPERAMENT
  dogLikes?: string; // "What do you like about your dog?"
  dogChallenges?: string; // "What do you find most challenging about your dog?"

  // TRAINING
  positiveReinforcementMethods?: string; // "How do you let your dog know when they have done something "good"?"
  favoriteRewards?: string; // "What are your dog’s favourite rewards?"
  correctionMethods?: string; // "Do you let your dog know when they have done something “bad”? How?"
  correctionEffects?: string; // "What effect does your method of telling them they've done something bad have?"
  previousProfessionalTraining?: string; // "Has your dog participated in any professional training before? If yes, please describe."
  previousTrainingMethodsUsed?: string; // "What type of methods were used?"
  previousTrainingExperienceResults?: string; // "How was your experience and the results?"

  // SOCIABILITY
  sociabilityWithDogs?: 'Sociable' | 'Nervous' | 'Reactive' | 'Disinterested' | '';
  sociabilityWithPeople?: 'Sociable' | 'Nervous' | 'Reactive' | 'Disinterested' | '';
  additionalInformation?: string; // "Is there anything else that you would like me to know about your situation or your dog?"
  timeDedicatedToTraining?: string; // "How much time per week total are you able to dedicate to training?"

  // System Fields
  submissionDate: string; // Date this questionnaire was submitted
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
