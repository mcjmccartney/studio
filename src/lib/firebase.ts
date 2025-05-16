
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc,
  query, 
  where,
  limit,
  serverTimestamp, 
  Timestamp, 
  type DocumentData, 
  type FirestoreDataConverter, 
  type QueryDocumentSnapshot 
} from 'firebase/firestore';
import type { Client, BehaviouralBrief } from './types'; // BehaviouralBriefFormValues is from the form page
import { format } from 'date-fns';

// This type is for the full form data coming from public-intake/page.tsx
// It's useful here because addClientAndBriefToFirestore will receive this full object.
export interface BehaviouralBriefFormValues {
  ownerFirstName: string;
  ownerLastName: string;
  contactEmail: string;
  contactNumber: string;
  postcode: string;
  dogName: string;
  dogSex: 'Male' | 'Female' | '';
  dogBreed: string;
  lifeWithDogAndHelpNeeded: string;
  bestOutcome: string;
  idealSessionTypes?: string[];
  submissionDate: string;
}


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

// Firestore data converter for Client
const clientConverter: FirestoreDataConverter<Client> = {
  toFirestore(client: Omit<Client, 'id'>): DocumentData {
    const { behaviouralBriefId, ...contactData } = client; // Destructure to handle potentially undefined briefId
    const dataToSave: any = { 
      ...contactData,
      createdAt: client.createdAt instanceof Date || client.createdAt instanceof Timestamp ? client.createdAt : serverTimestamp(),
      submissionDate: client.submissionDate || format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      lastSession: client.lastSession || 'N/A',
      nextSession: client.nextSession || 'Not Scheduled',
    };
    if (behaviouralBriefId) { // Only include if it exists
      dataToSave.behaviouralBriefId = behaviouralBriefId;
    }
     Object.keys(dataToSave).forEach(key => {
      if (dataToSave[key] === undefined) {
        delete dataToSave[key]; // Firestore doesn't like undefined
      }
    });
    return dataToSave;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>): Client {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      ownerFirstName: data.ownerFirstName || '',
      ownerLastName: data.ownerLastName || '',
      contactEmail: data.contactEmail || '',
      contactNumber: data.contactNumber || '',
      postcode: data.postcode || '',
      behaviouralBriefId: data.behaviouralBriefId || undefined,
      submissionDate: data.submissionDate || '',
      lastSession: data.lastSession || 'N/A',
      nextSession: data.nextSession || 'Not Scheduled',
      createdAt: data.createdAt, // This will be a Firestore Timestamp
    } as Client;
  }
};

// Firestore data converter for BehaviouralBrief
const behaviouralBriefConverter: FirestoreDataConverter<BehaviouralBrief> = {
  toFirestore(brief: Omit<BehaviouralBrief, 'id'>): DocumentData {
    const dataToSave = { 
        ...brief, 
        createdAt: brief.createdAt instanceof Date || brief.createdAt instanceof Timestamp ? brief.createdAt : serverTimestamp(),
        submissionDate: brief.submissionDate || format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        idealSessionTypes: brief.idealSessionTypes || [],
    };
    Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key] === undefined) {
             if (key === 'idealSessionTypes') dataToSave[key] = [];
             else delete dataToSave[key];
        }
    });
    return dataToSave;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>): BehaviouralBrief {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      clientId: data.clientId,
      dogName: data.dogName || '',
      dogSex: data.dogSex || '',
      dogBreed: data.dogBreed || '',
      lifeWithDogAndHelpNeeded: data.lifeWithDogAndHelpNeeded || '',
      bestOutcome: data.bestOutcome || '',
      idealSessionTypes: data.idealSessionTypes || [],
      submissionDate: data.submissionDate || '',
      createdAt: data.createdAt,
    } as BehaviouralBrief;
  }
};

const clientsCollectionRef = collection(db, 'clients').withConverter(clientConverter);
const behaviouralBriefsCollectionRef = collection(db, 'behaviouralBriefs').withConverter(behaviouralBriefConverter);

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
    return [];
  }
};

// For internal "Add Client" modal - creates a client without a brief initially
export const addClientToFirestore = async (clientContactData: Omit<Client, 'id' | 'behaviouralBriefId' | 'lastSession' | 'nextSession' | 'createdAt'>): Promise<Client> => {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error("Firebase project ID is not set. Cannot add client.");
  }
  
  const dataToSave: Omit<Client, 'id'> = {
    ...clientContactData,
    submissionDate: clientContactData.submissionDate || format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    createdAt: serverTimestamp() as Timestamp,
    lastSession: 'N/A',
    nextSession: 'Not Scheduled',
    // behaviouralBriefId will be undefined here
  };

  const docRef = await addDoc(clientsCollectionRef, dataToSave);
  
  return { 
    id: docRef.id, 
    ...dataToSave,
  } as Client; 
};

// For the public Behavioural Brief form
export const addClientAndBriefToFirestore = async (formData: BehaviouralBriefFormValues): Promise<{client: Client, brief: BehaviouralBrief}> => {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error("Firebase project ID is not set. Cannot add client and brief.");
  }

  const submissionTimestamp = formData.submissionDate || format(new Date(), "yyyy-MM-dd HH:mm:ss");

  // 1. Create Client document
  const clientRecord: Omit<Client, 'id' | 'behaviouralBriefId'> = {
    ownerFirstName: formData.ownerFirstName,
    ownerLastName: formData.ownerLastName,
    contactEmail: formData.contactEmail,
    contactNumber: formData.contactNumber,
    postcode: formData.postcode,
    submissionDate: submissionTimestamp,
    createdAt: serverTimestamp() as Timestamp,
    lastSession: 'N/A',
    nextSession: 'Not Scheduled',
  };
  const clientDocRef = await addDoc(clientsCollectionRef, clientRecord);
  const newClientId = clientDocRef.id;

  // 2. Create BehaviouralBrief document
  const briefRecord: Omit<BehaviouralBrief, 'id'> = {
    clientId: newClientId,
    dogName: formData.dogName,
    dogSex: formData.dogSex,
    dogBreed: formData.dogBreed,
    lifeWithDogAndHelpNeeded: formData.lifeWithDogAndHelpNeeded,
    bestOutcome: formData.bestOutcome,
    idealSessionTypes: formData.idealSessionTypes || [],
    submissionDate: submissionTimestamp,
    createdAt: serverTimestamp() as Timestamp,
  };
  const briefDocRef = await addDoc(behaviouralBriefsCollectionRef, briefRecord);
  const newBriefId = briefDocRef.id;

  // 3. Update Client document with behaviouralBriefId
  await updateDoc(clientDocRef, {
    behaviouralBriefId: newBriefId,
  });

  const finalClientData = { ...clientRecord, id: newClientId, behaviouralBriefId: newBriefId } as Client;
  const finalBriefData = { ...briefRecord, id: newBriefId } as BehaviouralBrief;
  
  return { client: finalClientData, brief: finalBriefData };
};


export const getBehaviouralBriefByBriefId = async (briefId: string): Promise<BehaviouralBrief | null> => {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || !briefId) {
    console.warn("Firebase project ID or Brief ID is not set. Skipping Firestore fetch for brief.");
    return null;
  }
  try {
    const briefDocRef = doc(behaviouralBriefsCollectionRef, briefId);
    const briefSnap = await getDoc(briefDocRef);
    if (briefSnap.exists()) {
      return briefSnap.data();
    }
    console.log(`No behavioural brief found with ID: ${briefId}`);
    return null;
  } catch (error) {
    console.error(`Error fetching behavioural brief with ID ${briefId}:`, error);
    return null;
  }
};

// Placeholder for other Firestore functions (Sessions, Finance)
// export const getSessions = async (): Promise<Session[]> => { ... };
// export const addSessionToFirestore = async (sessionData: Omit<Session, 'id'>): Promise<Session> => { ... };

export { db, app, Timestamp, serverTimestamp };
