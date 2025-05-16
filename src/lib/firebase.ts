
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
    const { id, createdAt, ...data } = client as any; // Use 'as any' for easier spread for now
    
    const firestoreData: any = { ...data };
    // Ensure all required fields are present and optional fields are handled
    firestoreData.ownerFirstName = data.ownerFirstName || '';
    firestoreData.ownerLastName = data.ownerLastName || '';
    firestoreData.contactEmail = data.contactEmail || '';
    firestoreData.contactNumber = data.contactNumber || '';
    firestoreData.postcode = data.postcode || '';
    firestoreData.dogName = data.dogName || '';
    firestoreData.dogSex = data.dogSex || '';
    firestoreData.dogBreed = data.dogBreed || '';
    firestoreData.lifeWithDogAndHelpNeeded = data.lifeWithDogAndHelpNeeded || '';
    firestoreData.bestOutcome = data.bestOutcome || '';
    firestoreData.idealSessionTypes = data.idealSessionTypes || []; // Default to empty array if undefined
    firestoreData.submissionDate = data.submissionDate || format(new Date(), "yyyy-MM-dd HH:mm:ss");
    
    // System managed fields not directly from form, set during addClientToFirestore
    // firestoreData.lastSession = data.lastSession || 'N/A';
    // firestoreData.nextSession = data.nextSession || 'Not Scheduled';

    // Remove any undefined properties explicitly before sending to Firestore
    Object.keys(firestoreData).forEach(key => {
      if (firestoreData[key] === undefined) {
        delete firestoreData[key];
      }
    });
    
    return firestoreData;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>): Client {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      // CONTACT INFORMATION
      ownerFirstName: data.ownerFirstName || '',
      ownerLastName: data.ownerLastName || '',
      contactEmail: data.contactEmail || '',
      contactNumber: data.contactNumber || '',
      postcode: data.postcode || '',

      // DOG INFORMATION
      dogName: data.dogName || '',
      dogSex: data.dogSex || '',
      dogBreed: data.dogBreed || '',
      lifeWithDogAndHelpNeeded: data.lifeWithDogAndHelpNeeded || '',
      bestOutcome: data.bestOutcome || '',
      idealSessionTypes: data.idealSessionTypes || [],

      // System Fields
      submissionDate: data.submissionDate || '',
      lastSession: data.lastSession || 'N/A',
      nextSession: data.nextSession || 'Not Scheduled',
      createdAt: data.createdAt, // This will be a Firestore Timestamp
    } as Client;
  }
};

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
  
  const dataToSave: any = { ...clientData };
  Object.keys(dataToSave).forEach(key => {
    if (dataToSave[key] === undefined) {
       // For arrays that might be optional and undefined, default to empty array
      if (key === 'idealSessionTypes') {
        dataToSave[key] = [];
      } else {
        dataToSave[key] = null; // Default other undefined to null for Firestore
      }
    }
  });
  
  dataToSave.createdAt = serverTimestamp();
  dataToSave.lastSession = 'N/A';
  dataToSave.nextSession = 'Not Scheduled';

  const docRef = await addDoc(collection(db, 'clients').withConverter(clientConverter), dataToSave);
  
  return { 
    id: docRef.id, 
    ...clientData, 
    lastSession: 'N/A', 
    nextSession: 'Not Scheduled',
    // createdAt: "Pending server timestamp" // This is handled by fromFirestore when data is read
  } as Client;
};

// Placeholder for other Firestore functions (Sessions, Finance)
// export const getSessions = async (): Promise<Session[]> => { ... };
// export const addSessionToFirestore = async (sessionData: Omit<Session, 'id'>): Promise<Session> => { ... };

export { db, app, Timestamp, serverTimestamp };
