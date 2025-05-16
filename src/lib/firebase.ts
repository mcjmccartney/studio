
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, serverTimestamp, Timestamp, type DocumentData, type FirestoreDataConverter, type QueryDocumentSnapshot } from 'firebase/firestore';
import type { Client } from './types';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db = getFirestore(app);

// Firestore data converter
const clientConverter: FirestoreDataConverter<Client> = {
  toFirestore(client: Omit<Client, 'id' | 'createdAt'>): DocumentData {
    // Remove id as it's the document ID, not part of the data to be stored.
    // createdAt is handled by serverTimestamp() during addDoc.
    // behaviorHistory is intentionally omitted if new fields cover it.
    // If you want to explicitly save it as an empty string if not provided, handle it here.
    const { id, createdAt, behaviorHistory, ...data } = client as any; // Use 'as any' for easier spread for now
    
    // Ensure all fields defined in Client type are present or defaulted for Firestore
    // This helps prevent "Unsupported field value: undefined" errors
    const firestoreData: any = { ...data };
    for (const key in data) {
        if (firestoreData[key] === undefined) {
            firestoreData[key] = null; // Or specific defaults like '' for strings
        }
    }
    // Explicitly ensure optional fields that might be undefined are set to null or default
    firestoreData.referralSource = data.referralSource || null;
    firestoreData.dogOriginOther = data.dogOriginOther || null;
    firestoreData.otherDogsDetails = data.otherDogsDetails || null;
    firestoreData.catsDetails = data.catsDetails || null;
    firestoreData.childrenDetails = data.childrenDetails || null;
    firestoreData.visitingChildrenDetails = data.visitingChildrenDetails || null;
    firestoreData.otherHouseholdMembers = data.otherHouseholdMembers || null;
    firestoreData.problemTriggers = data.problemTriggers || null;
    firestoreData.previousSolutions = data.previousSolutions || null;
    firestoreData.dogAggressionDetails = data.dogAggressionDetails || null;
    firestoreData.healthProblemsAllergies = data.healthProblemsAllergies || null;
    firestoreData.lastVetCheck = data.lastVetCheck || null;
    firestoreData.currentMedication = data.currentMedication || null;
    firestoreData.pastInjuriesSurgeries = data.pastInjuriesSurgeries || null;
    firestoreData.trainingClassesDetails = data.trainingClassesDetails || null;
    firestoreData.socialisationWithDogs = data.socialisationWithDogs || null;
    firestoreData.socialisationWithPeople = data.socialisationWithPeople || null;
    
    return firestoreData;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>): Client {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      // YOUR DETAILS
      name: data.name || '',
      contactEmail: data.contactEmail || '',
      contactPhone: data.contactPhone || '',
      address: data.address || '',
      preferredContactMethod: data.preferredContactMethod || 'Email', // Default if missing
      referralSource: data.referralSource || undefined,

      // YOUR DOG'S DETAILS
      dogName: data.dogName || '',
      dogBreed: data.dogBreed || '',
      dogAge: data.dogAge || '',
      dogSex: data.dogSex || 'Male', // Default if missing
      dogNeutered: data.dogNeutered || 'No', // Default if missing
      dogOrigin: data.dogOrigin || 'Other', // Default if missing
      dogOriginOther: data.dogOriginOther || undefined,
      dogAcquisitionDuration: data.dogAcquisitionDuration || '',
      
      livesWithOtherDogs: data.livesWithOtherDogs || 'No',
      otherDogsDetails: data.otherDogsDetails || undefined,
      livesWithCats: data.livesWithCats || 'No',
      catsDetails: data.catsDetails || undefined,
      livesWithChildren: data.livesWithChildren || 'No',
      childrenDetails: data.childrenDetails || undefined,
      visitingChildren: data.visitingChildren || 'No',
      visitingChildrenDetails: data.visitingChildrenDetails || undefined,
      otherHouseholdMembers: data.otherHouseholdMembers || undefined,
      
      // BEHAVIOURAL INFORMATION
      behaviouralProblemsDescription: data.behaviouralProblemsDescription || '',
      problemStartDate: data.problemStartDate || '',
      problemFrequency: data.problemFrequency || '',
      problemSituations: data.problemSituations || '',
      problemTriggers: data.problemTriggers || undefined,
      previousSolutions: data.previousSolutions || undefined,
      
      dogAggression: data.dogAggression || 'No',
      dogAggressionDetails: data.dogAggressionDetails || undefined,
      
      trainingGoals: data.trainingGoals || '',
      
      // HEALTH & LIFESTYLE
      dailyRoutine: data.dailyRoutine || '',
      dailyExercise: data.dailyExercise || '',
      exerciseType: data.exerciseType || '',
      dogFoodType: data.dogFoodType || '',
      
      healthProblemsAllergies: data.healthProblemsAllergies || undefined,
      lastVetCheck: data.lastVetCheck || undefined,
      currentMedication: data.currentMedication || undefined,
      pastInjuriesSurgeries: data.pastInjuriesSurgeries || undefined,
      
      // TRAINING & SOCIALISATION
      attendedTrainingClasses: data.attendedTrainingClasses || 'No',
      trainingClassesDetails: data.trainingClassesDetails || undefined,
      
      socialisationWithDogs: data.socialisationWithDogs || undefined,
      socialisationWithPeople: data.socialisationWithPeople || undefined,
      
      // CONSENT & AGREEMENT
      vetConsent: data.vetConsent || false,
      commitmentConsent: data.commitmentConsent || false,
      termsConsent: data.termsConsent || false,
      
      signature: data.signature || '',
      submissionDate: data.submissionDate || '',

      behaviorHistory: data.behaviorHistory || '', // Keep for backward compatibility
      
      lastSession: data.lastSession || 'N/A',
      nextSession: data.nextSession || 'Not Scheduled',
      createdAt: data.createdAt, // This will be a Firestore Timestamp
    } as Client;
  }
};

// Client Functions
const clientsCollectionRef = collection(db, 'clients').withConverter(clientConverter);

export const getClients = async (): Promise<Client[]> => {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    console.warn("Firebase project ID is not set. Skipping Firestore fetch for clients.");
    return [];
  }
  try {
    const snapshot = await getDocs(clientsCollectionRef);
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error("Error fetching clients from Firestore:", error);
    if (error instanceof Error && error.message.includes("Failed to get document because the client is offline")) {
        // Handle offline case if necessary
    }
    return [];
  }
};

// The clientData type here is Omit Client, but excluding fields auto-set or not from this specific form
export const addClientToFirestore = async (clientData: Omit<Client, 'id' | 'lastSession' | 'nextSession' | 'createdAt' | 'behaviorHistory'>): Promise<Client> => {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error("Firebase project ID is not set. Cannot add client.");
  }
  
  // Prepare data for Firestore, ensuring undefined optionals are set to null
  // to avoid Firestore "Unsupported field value: undefined" error.
  const dataToSave: any = { ...clientData };
  Object.keys(dataToSave).forEach(key => {
    if (dataToSave[key] === undefined) {
      dataToSave[key] = null;
    }
  });
  
  // Add system-managed fields
  dataToSave.createdAt = serverTimestamp();
  dataToSave.lastSession = 'N/A';
  dataToSave.nextSession = 'Not Scheduled';
  // behaviorHistory is not part of the new form's direct input, handled by Client type definition

  const docRef = await addDoc(collection(db, 'clients'), dataToSave);
  
  // Construct the Client object to return.
  // For createdAt, we don't fetch the doc back, so it's technically not populated here.
  // The Client type allows `createdAt` to be undefined or a string if needed for optimistic updates.
  return { 
    id: docRef.id, 
    ...clientData, 
    lastSession: 'N/A', 
    nextSession: 'Not Scheduled',
    // createdAt: "Pending server timestamp" // Or handle as Date if needed client-side immediately
  } as Client; // Cast as Client, acknowledging createdAt isn't the server's yet.
};


// Placeholder for other Firestore functions (Sessions, Finance)
// export const getSessions = async (): Promise<Session[]> => { ... };
// export const addSessionToFirestore = async (sessionData: Omit<Session, 'id'>): Promise<Session> => { ... };

export { db, app, Timestamp, serverTimestamp };
