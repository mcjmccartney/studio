
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, serverTimestamp, Timestamp, type DocumentData, type FirestoreDataConverter } from 'firebase/firestore';
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
  toFirestore(client: Omit<Client, 'id'>): DocumentData {
    // Omitting id as it's the document ID, not part of the data
    // No, id is part of Client, but toFirestore should receive client: Client
    // FirestoreDataConverter<T, DbModel>
    // toFirestore(modelObject: T): DbModel
    // fromFirestore(snapshot: QueryDocumentSnapshot<DbModel>): T
    // Let's assume Client is T and DocumentData is DbModel (or a typed version)
    const { id, ...data } = client; // This seems off, as id is not on the type passed to addDoc
    return data; // Data sent to Firestore shouldn't include the ID we generate/get back
  },
  fromFirestore(snapshot, options): Client {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      name: data.name || '',
      dogName: data.dogName || '',
      dogBreed: data.dogBreed || '',
      contactEmail: data.contactEmail || '',
      contactPhone: data.contactPhone || '',
      
      address: data.address,
      preferredContactMethod: data.preferredContactMethod,
      referralSource: data.referralSource,
      dogAge: data.dogAge,
      dogSex: data.dogSex,
      dogNeutered: data.dogNeutered,
      dogOrigin: data.dogOrigin,
      dogOriginOther: data.dogOriginOther,
      dogAcquisitionDuration: data.dogAcquisitionDuration,
      livesWithOtherDogs: data.livesWithOtherDogs,
      otherDogsDetails: data.otherDogsDetails,
      livesWithCats: data.livesWithCats,
      catsDetails: data.catsDetails,
      livesWithChildren: data.livesWithChildren,
      childrenDetails: data.childrenDetails,
      visitingChildren: data.visitingChildren,
      visitingChildrenDetails: data.visitingChildrenDetails,
      otherHouseholdMembers: data.otherHouseholdMembers,
      behaviouralProblemsDescription: data.behaviouralProblemsDescription,
      problemStartDate: data.problemStartDate,
      problemFrequency: data.problemFrequency,
      problemSituations: data.problemSituations,
      problemTriggers: data.problemTriggers,
      previousSolutions: data.previousSolutions,
      dogAggression: data.dogAggression,
      dogAggressionDetails: data.dogAggressionDetails,
      trainingGoals: data.trainingGoals,
      dailyRoutine: data.dailyRoutine,
      dailyExercise: data.dailyExercise,
      exerciseType: data.exerciseType,
      dogFoodType: data.dogFoodType,
      healthProblemsAllergies: data.healthProblemsAllergies,
      lastVetCheck: data.lastVetCheck,
      currentMedication: data.currentMedication,
      pastInjuriesSurgeries: data.pastInjuriesSurgeries,
      attendedTrainingClasses: data.attendedTrainingClasses,
      trainingClassesDetails: data.trainingClassesDetails,
      socialisationWithDogs: data.socialisationWithDogs,
      socialisationWithPeople: data.socialisationWithPeople,
      vetConsent: data.vetConsent || false,
      commitmentConsent: data.commitmentConsent || false,
      termsConsent: data.termsConsent || false,
      signature: data.signature,
      submissionDate: data.submissionDate,

      behaviorHistory: data.behaviorHistory || '', // Keep if used elsewhere, or phase out
      lastSession: data.lastSession || 'N/A',
      nextSession: data.nextSession || 'Not Scheduled',
      createdAt: data.createdAt, // This will be a Firestore Timestamp
    } as Client; // Cast needed because of optional fields becoming potentially undefined
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

export const addClientToFirestore = async (clientData: Omit<Client, 'id' | 'lastSession' | 'nextSession' | 'createdAt'>): Promise<Client> => {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error("Firebase project ID is not set. Cannot add client.");
  }
  const dataToSave = {
    ...clientData, // This now includes all the new fields from BehaviouralBriefFormValues
    createdAt: serverTimestamp(),
    lastSession: 'N/A', // Default value
    nextSession: 'Not Scheduled', // Default value
  };

  // We don't use the converter for addDoc directly, Firestore handles the types.
  // The converter is for getDocs.
  const docRef = await addDoc(collection(db, 'clients'), dataToSave);
  
  // Construct the Client object to return, matching the Client type
  return { 
    id: docRef.id, 
    ...clientData, // Spread all submitted data
    lastSession: 'N/A', 
    nextSession: 'Not Scheduled',
    // createdAt will be set by serverTimestamp, not immediately available here unless we fetch the doc.
    // For now, the return type matches what we can immediately construct.
    // To get the actual createdAt, a getDoc(docRef) would be needed.
  } as Client; // Cast might be needed if createdAt is strictly Timestamp in Client type, but it's flexible.
};


// Placeholder for other Firestore functions (Sessions, Finance)
// export const getSessions = async (): Promise<Session[]> => { ... };
// export const addSessionToFirestore = async (sessionData: Omit<Session, 'id'>): Promise<Session> => { ... };

export { db, app, Timestamp, serverTimestamp };
