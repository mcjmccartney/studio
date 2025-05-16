
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
  toFirestore(client: Client): DocumentData {
    // Omitting id as it's the document ID, not part of the data
    const { id, ...data } = client;
    return data;
  },
  fromFirestore(snapshot, options): Client {
    const data = snapshot.data(options);
    // Ensure all fields of Client are present, providing defaults or handling missing data
    return {
      id: snapshot.id,
      name: data.name || '',
      dogName: data.dogName || '',
      dogBreed: data.dogBreed || '',
      contactEmail: data.contactEmail || '',
      contactPhone: data.contactPhone || '',
      behaviorHistory: data.behaviorHistory || '',
      lastSession: data.lastSession || 'N/A',
      nextSession: data.nextSession || 'Not Scheduled',
      // createdAt will be a Firestore Timestamp, handle accordingly if needed for display
      // For now, ensure the Client type doesn't strictly require it or handle its conversion
    } as Client;
  }
};

// Client Functions
const clientsCollection = collection(db, 'clients').withConverter(clientConverter);

export const getClients = async (): Promise<Client[]> => {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    console.warn("Firebase project ID is not set. Skipping Firestore fetch for clients.");
    return []; // Return empty array or mock data if preferred when not configured
  }
  try {
    const snapshot = await getDocs(clientsCollection);
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error("Error fetching clients from Firestore:", error);
    // Optionally, re-throw the error or return an empty array / fallback
    if (error instanceof Error && error.message.includes("Failed to get document because the client is offline")) {
        // Handle offline case if necessary
    }
    return []; // Or throw error;
  }
};

export const addClientToFirestore = async (clientData: Omit<Client, 'id' | 'lastSession' | 'nextSession' | 'createdAt'>): Promise<Client> => {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error("Firebase project ID is not set. Cannot add client.");
  }
  const newClientData = {
    ...clientData,
    createdAt: serverTimestamp(),
    lastSession: 'N/A',
    nextSession: 'Not Scheduled',
  };
  const docRef = await addDoc(collection(db, 'clients'), newClientData); // Use base collection for addDoc
  
  // Construct the Client object to return, matching the Client type
  // The id is docRef.id. The other fields come from clientData.
  // lastSession and nextSession are defaulted. createdAt is handled by Firestore.
  return { 
    id: docRef.id, 
    name: clientData.name,
    dogName: clientData.dogName,
    dogBreed: clientData.dogBreed,
    contactEmail: clientData.contactEmail,
    contactPhone: clientData.contactPhone,
    behaviorHistory: clientData.behaviorHistory || '',
    lastSession: 'N/A', 
    nextSession: 'Not Scheduled'
  };
};


// Placeholder for other Firestore functions (Sessions, Finance)
// export const getSessions = async (): Promise<Session[]> => { ... };
// export const addSessionToFirestore = async (sessionData: Omit<Session, 'id'>): Promise<Session> => { ... };

export { db, app, Timestamp, serverTimestamp };
