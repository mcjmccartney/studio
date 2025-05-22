
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc,
  deleteDoc,
  serverTimestamp, 
  Timestamp, 
  type DocumentData, 
  type FirestoreDataConverter, 
  type QueryDocumentSnapshot,
  query,
  where,
  limit
} from 'firebase/firestore';
import type { Client, BehaviouralBrief, BehaviourQuestionnaire, Address, Session } from './types';
import { format } from 'date-fns';

// This type is for the full form data coming from behavioural-brief/page.tsx
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

export interface BehaviourQuestionnaireFormValues {
  ownerFirstName: string;
  ownerLastName: string;
  contactEmail: string;
  contactNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  postcode: string;
  howHeardAboutServices?: string;
  dogName: string;
  dogAge: string;
  dogSex: 'Male' | 'Female' | '';
  dogBreed: string;
  neuteredSpayedDetails: string;
  mainProblem: string; 
  problemTendencyFirstNoticed: string; 
  problemFrequencyDetails: string; 
  problemRecentChanges: string; 
  problemAnticipationDetails: string; 
  dogMotivationForProblem: string; 
  problemAddressingAttempts: string; 
  idealTrainingOutcome: string; 
  otherHelpNeeded?: string;
  medicalHistory?: string;
  vetConsultationDetails?: string;
  dogOrigin?: string;
  rescueBackground?: string;
  dogAgeWhenAcquired?: string;
  dietDetails?: string;
  foodMotivationLevel?: string; 
  mealtimeRoutine?: string;
  treatRoutine?: string;
  externalTreatsConsent?: string;
  playEngagement?: string;
  affectionResponse?: string;
  exerciseRoutine?: string;
  muzzleUsage?: string;
  reactionToFamiliarPeople?: string;
  reactionToUnfamiliarPeople?: string;
  housetrainedStatus?: string;
  activitiesAsideFromWalks?: string;
  dogLikes?: string;
  dogChallenges?: string; 
  positiveReinforcementMethods?: string; 
  favoriteRewards?: string; 
  correctionMethods?: string; 
  correctionEffects?: string; 
  previousProfessionalTraining?: string; 
  previousTrainingMethodsUsed?: string; 
  previousTrainingExperienceResults?: string; 
  sociabilityWithDogs?: 'Sociable' | 'Nervous' | 'Reactive' | 'Disinterested' | '';
  sociabilityWithPeople?: 'Sociable' | 'Nervous' | 'Reactive' | 'Disinterested' | '';
  additionalInformation?: string;
  timeDedicatedToTraining?: string;
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
const auth = getAuth(app); 

const clientConverter: FirestoreDataConverter<Client> = {
  toFirestore(client: Omit<Client, 'id'>): DocumentData {
    const { behaviouralBriefId, behaviourQuestionnaireId, ...clientData } = client;
    const dataToSave: any = { 
      ...clientData,
      createdAt: client.createdAt instanceof Date || client.createdAt instanceof Timestamp ? client.createdAt : serverTimestamp(),
      submissionDate: client.submissionDate || format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      lastSession: client.lastSession || 'N/A',
      nextSession: client.nextSession || 'Not Scheduled',
      isMember: client.isMember === undefined ? false : client.isMember,
      isActive: client.isActive === undefined ? true : client.isActive,
      dogName: client.dogName === undefined ? null : client.dogName, 
      address: client.address === undefined ? null : client.address, 
      howHeardAboutServices: client.howHeardAboutServices === undefined ? null : client.howHeardAboutServices, 
    };
    if (behaviouralBriefId) dataToSave.behaviouralBriefId = behaviouralBriefId;
    if (behaviourQuestionnaireId) dataToSave.behaviourQuestionnaireId = behaviourQuestionnaireId;
    
     Object.keys(dataToSave).forEach(key => {
      if (dataToSave[key] === undefined) {
        if (['dogName', 'address', 'howHeardAboutServices', 'behaviouralBriefId', 'behaviourQuestionnaireId'].includes(key)) {
          dataToSave[key] = null;
        } else if (key === 'isMember') {
            dataToSave[key] = false;
        } else if (key === 'isActive') {
            dataToSave[key] = true; 
        }
         else {
          delete dataToSave[key]; 
        }
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
      postcode: data.postcode || (data.address ? data.address.postcode : ''), 
      address: data.address === null ? undefined : data.address,
      howHeardAboutServices: data.howHeardAboutServices === null ? undefined : data.howHeardAboutServices,
      dogName: data.dogName === null ? undefined : data.dogName,
      isMember: data.isMember === undefined ? false : data.isMember,
      isActive: data.isActive === undefined ? true : data.isActive,
      behaviouralBriefId: data.behaviouralBriefId === null ? undefined : data.behaviouralBriefId,
      behaviourQuestionnaireId: data.behaviourQuestionnaireId === null ? undefined : data.behaviourQuestionnaireId,
      submissionDate: data.submissionDate || '',
      lastSession: data.lastSession || 'N/A',
      nextSession: data.nextSession || 'Not Scheduled',
      createdAt: data.createdAt, 
    } as Client;
  }
};

const behaviouralBriefConverter: FirestoreDataConverter<BehaviouralBrief> = {
  toFirestore(brief: Omit<BehaviouralBrief, 'id'>): DocumentData {
    const dataToSave: any = { 
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

const behaviourQuestionnaireConverter: FirestoreDataConverter<BehaviourQuestionnaire> = {
  toFirestore(questionnaire: Omit<BehaviourQuestionnaire, 'id'>): DocumentData {
    const dataToSave: any = {
      ...questionnaire,
      createdAt: questionnaire.createdAt instanceof Date || questionnaire.createdAt instanceof Timestamp ? questionnaire.createdAt : serverTimestamp(),
      submissionDate: questionnaire.submissionDate || format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    };
     Object.keys(dataToSave).forEach(key => {
      if (dataToSave[key] === undefined) {
        if (['sociabilityWithDogs', 'sociabilityWithPeople'].includes(key)) {
            dataToSave[key] = '';
        } else {
            // Keep optional fields as null if undefined, rather than deleting
            dataToSave[key] = null; 
        }
      }
    });
    return dataToSave;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>): BehaviourQuestionnaire {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      clientId: data.clientId,
      dogName: data.dogName || '',
      dogAge: data.dogAge || '',
      dogSex: data.dogSex || '',
      dogBreed: data.dogBreed || '',
      neuteredSpayedDetails: data.neuteredSpayedDetails || '',
      mainProblem: data.mainProblem || '',
      problemTendencyFirstNoticed: data.problemTendencyFirstNoticed || '',
      problemFrequencyDetails: data.problemFrequencyDetails || '',
      problemRecentChanges: data.problemRecentChanges || '',
      problemAnticipationDetails: data.problemAnticipationDetails || '',
      dogMotivationForProblem: data.dogMotivationForProblem || '',
      problemAddressingAttempts: data.problemAddressingAttempts || '',
      idealTrainingOutcome: data.idealTrainingOutcome || '',
      otherHelpNeeded: data.otherHelpNeeded === null ? undefined : data.otherHelpNeeded,
      medicalHistory: data.medicalHistory === null ? undefined : data.medicalHistory,
      vetConsultationDetails: data.vetConsultationDetails === null ? undefined : data.vetConsultationDetails,
      dogOrigin: data.dogOrigin === null ? undefined : data.dogOrigin,
      rescueBackground: data.rescueBackground === null ? undefined : data.rescueBackground,
      dogAgeWhenAcquired: data.dogAgeWhenAcquired === null ? undefined : data.dogAgeWhenAcquired,
      dietDetails: data.dietDetails === null ? undefined : data.dietDetails,
      foodMotivationLevel: data.foodMotivationLevel === null ? undefined : data.foodMotivationLevel,
      mealtimeRoutine: data.mealtimeRoutine === null ? undefined : data.mealtimeRoutine,
      treatRoutine: data.treatRoutine === null ? undefined : data.treatRoutine,
      externalTreatsConsent: data.externalTreatsConsent === null ? undefined : data.externalTreatsConsent,
      playEngagement: data.playEngagement === null ? undefined : data.playEngagement,
      affectionResponse: data.affectionResponse === null ? undefined : data.affectionResponse,
      exerciseRoutine: data.exerciseRoutine === null ? undefined : data.exerciseRoutine,
      muzzleUsage: data.muzzleUsage === null ? undefined : data.muzzleUsage,
      reactionToFamiliarPeople: data.reactionToFamiliarPeople === null ? undefined : data.reactionToFamiliarPeople,
      reactionToUnfamiliarPeople: data.reactionToUnfamiliarPeople === null ? undefined : data.reactionToUnfamiliarPeople,
      housetrainedStatus: data.housetrainedStatus === null ? undefined : data.housetrainedStatus,
      activitiesAsideFromWalks: data.activitiesAsideFromWalks === null ? undefined : data.activitiesAsideFromWalks,
      dogLikes: data.dogLikes === null ? undefined : data.dogLikes,
      dogChallenges: data.dogChallenges || '',
      positiveReinforcementMethods: data.positiveReinforcementMethods || '',
      favoriteRewards: data.favoriteRewards || '',
      correctionMethods: data.correctionMethods || '',
      correctionEffects: data.correctionEffects || '',
      previousProfessionalTraining: data.previousProfessionalTraining || '',
      previousTrainingMethodsUsed: data.previousTrainingMethodsUsed || '',
      previousTrainingExperienceResults: data.previousTrainingExperienceResults || '',
      sociabilityWithDogs: data.sociabilityWithDogs || '',
      sociabilityWithPeople: data.sociabilityWithPeople || '',
      additionalInformation: data.additionalInformation === null ? undefined : data.additionalInformation,
      timeDedicatedToTraining: data.timeDedicatedToTraining === null ? undefined : data.timeDedicatedToTraining,
      submissionDate: data.submissionDate || '',
      createdAt: data.createdAt,
    } as BehaviourQuestionnaire;
  }
};

const sessionConverter: FirestoreDataConverter<Session> = {
  toFirestore(session: Omit<Session, 'id'>): DocumentData {
    const dataToSave: any = {
      ...session,
      sessionType: session.sessionType || 'Unknown',
      createdAt: session.createdAt instanceof Date || session.createdAt instanceof Timestamp ? session.createdAt : serverTimestamp(),
      notes: session.notes === undefined ? null : session.notes,
      amount: session.amount === undefined ? null : session.amount,
    };
    if (session.dogName === undefined) dataToSave.dogName = null;
    return dataToSave;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>): Session {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      clientId: data.clientId,
      clientName: data.clientName,
      dogName: data.dogName === null ? undefined : data.dogName,
      date: data.date, 
      time: data.time, 
      sessionType: data.sessionType || 'Unknown',
      amount: data.amount === null ? undefined : data.amount,
      notes: data.notes === null ? undefined : data.notes,
      createdAt: data.createdAt, 
    } as Session;
  }
};


const clientsCollectionRef = collection(db, 'clients').withConverter(clientConverter);
const behaviouralBriefsCollectionRef = collection(db, 'behaviouralBriefs').withConverter(behaviouralBriefConverter);
const behaviourQuestionnairesCollectionRef = collection(db, 'behaviourQuestionnaires').withConverter(behaviourQuestionnaireConverter);
const sessionsCollectionRef = collection(db, 'sessions').withConverter(sessionConverter);


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

export const addClientToFirestore = async (clientData: Omit<Client, 'id' | 'behaviouralBriefId' | 'behaviourQuestionnaireId' | 'createdAt'> & { dogName?: string; isMember?: boolean, isActive?: boolean, submissionDate?: string, address?: Address, howHeardAboutServices?: string }): Promise<Client> => {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error("Firebase project ID is not set. Cannot add client.");
  }
  
  const dataToSave: Omit<Client, 'id'> = {
    ownerFirstName: clientData.ownerFirstName,
    ownerLastName: clientData.ownerLastName,
    contactEmail: clientData.contactEmail,
    contactNumber: clientData.contactNumber,
    postcode: clientData.postcode,
    dogName: clientData.dogName || undefined,
    isMember: clientData.isMember || false,
    isActive: clientData.isActive === undefined ? true : clientData.isActive,
    address: clientData.address || undefined,
    howHeardAboutServices: clientData.howHeardAboutServices || undefined,
    submissionDate: clientData.submissionDate || format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    createdAt: serverTimestamp() as Timestamp,
    lastSession: 'N/A',
    nextSession: 'Not Scheduled',
  };

  const docRef = await addDoc(clientsCollectionRef, dataToSave);
  const newClientData = { ...dataToSave, id: docRef.id, createdAt: new Date().toISOString() } as Client; // Simulate server timestamp for immediate use
  return newClientData;
};

export type EditableClientData = {
  ownerFirstName?: string;
  ownerLastName?: string;
  contactEmail?: string;
  contactNumber?: string;
  postcode?: string;
  dogName?: string;
  isMember?: boolean;
  isActive?: boolean;
  address?: Address;
  howHeardAboutServices?: string;
};

export const updateClientInFirestore = async (clientId: string, clientData: EditableClientData): Promise<void> => {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error("Firebase project ID is not set. Cannot update client.");
  }
  if (!clientId) {
    throw new Error("Client ID is required to update a client.");
  }
  
  const clientDocRef = doc(clientsCollectionRef, clientId);
  const updateData: DocumentData = {};

  Object.keys(clientData).forEach(key => {
    const K = key as keyof EditableClientData;
    if (clientData[K] !== undefined) {
      updateData[K] = clientData[K];
    } else if (clientData[K] === undefined && (K === 'dogName' || K === 'address' || K === 'howHeardAboutServices')) {
      // Explicitly set to null if being cleared and it's an optional field that should be null
      updateData[K] = null;
    }
  });
  
  if (Object.keys(updateData).length === 0) {
    console.warn("No data provided to update client.");
    return;
  }
  await updateDoc(clientDocRef, updateData);
};


export const deleteClientFromFirestore = async (clientId: string): Promise<void> => {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error("Firebase project ID is not set. Cannot delete client.");
  }
  if (!clientId) {
    throw new Error("Client ID is required to delete a client.");
  }
  try {
    const clientDocRef = doc(clientsCollectionRef, clientId);
    await deleteDoc(clientDocRef);
  } catch (error) {
    console.error("Error deleting client from Firestore:", error);
    throw error; 
  }
};

export const addClientAndBriefToFirestore = async (formData: BehaviouralBriefFormValues): Promise<{client: Client, brief: BehaviouralBrief}> => {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error("Firebase project ID is not set. Cannot add client and brief.");
  }

  const submissionTimestamp = formData.submissionDate || format(new Date(), "yyyy-MM-dd HH:mm:ss");

  const clientRecord: Omit<Client, 'id' | 'behaviouralBriefId' | 'behaviourQuestionnaireId' | 'address' | 'howHeardAboutServices'> = {
    ownerFirstName: formData.ownerFirstName,
    ownerLastName: formData.ownerLastName,
    contactEmail: formData.contactEmail,
    contactNumber: formData.contactNumber,
    postcode: formData.postcode, 
    dogName: formData.dogName, 
    isMember: false, 
    isActive: true, 
    submissionDate: submissionTimestamp,
    createdAt: serverTimestamp() as Timestamp,
    lastSession: 'N/A',
    nextSession: 'Not Scheduled',
  };
  const clientDocRef = await addDoc(clientsCollectionRef, clientRecord);
  const newClientId = clientDocRef.id;

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

  await updateDoc(clientDocRef, {
    behaviouralBriefId: newBriefId,
  });

  const finalClientData = { ...clientRecord, id: newClientId, behaviouralBriefId: newBriefId, createdAt: new Date().toISOString() } as Client;
  const finalBriefData = { ...briefRecord, id: newBriefId, createdAt: new Date().toISOString() } as BehaviouralBrief;
  
  return { client: finalClientData, brief: finalBriefData };
};

export const addClientAndBehaviourQuestionnaireToFirestore = async (
  formData: BehaviourQuestionnaireFormValues
): Promise<{ client: Client; questionnaire: BehaviourQuestionnaire }> => {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error("Firebase project ID is not set. Cannot add client and questionnaire.");
  }
  const submissionTimestamp = formData.submissionDate || format(new Date(), "yyyy-MM-dd HH:mm:ss");

  let targetClientId: string;
  let clientDataForReturn: Client;

  const clientsQuery = query(
    clientsCollectionRef,
    where("contactEmail", "==", formData.contactEmail),
    limit(1)
  );
  const querySnapshot = await getDocs(clientsQuery);

  if (!querySnapshot.empty) {
    const existingClientDoc = querySnapshot.docs[0];
    targetClientId = existingClientDoc.id;
    clientDataForReturn = existingClientDoc.data();
    console.log(`Found existing client by email: ${formData.contactEmail}, ID: ${targetClientId}`);
    
    const updates: Partial<Client> = { isActive: true }; // Default to active if questionnaire is filled
    if (formData.addressLine1 && formData.city && formData.country && formData.postcode) {
        updates.address = {
            addressLine1: formData.addressLine1,
            addressLine2: formData.addressLine2 || undefined,
            city: formData.city,
            country: formData.country,
        };
        updates.postcode = formData.postcode; // Also update the top-level postcode
    }
    if (formData.howHeardAboutServices) {
        updates.howHeardAboutServices = formData.howHeardAboutServices;
    }
    if (formData.dogName && (!clientDataForReturn.dogName || clientDataForReturn.dogName !== formData.dogName)) { 
        updates.dogName = formData.dogName;
    }
    // Update owner names if they are different - helps keep client record primary
    if (formData.ownerFirstName && clientDataForReturn.ownerFirstName !== formData.ownerFirstName) {
        updates.ownerFirstName = formData.ownerFirstName;
    }
    if (formData.ownerLastName && clientDataForReturn.ownerLastName !== formData.ownerLastName) {
        updates.ownerLastName = formData.ownerLastName;
    }
    if (formData.contactNumber && clientDataForReturn.contactNumber !== formData.contactNumber) {
        updates.contactNumber = formData.contactNumber;
    }


    if (Object.keys(updates).length > 0) {
        await updateDoc(doc(clientsCollectionRef, targetClientId), updates);
        clientDataForReturn = { ...clientDataForReturn, ...updates };
    }

  } else {
    console.log(`No existing client found for email: ${formData.contactEmail}. Creating new client.`);
    const clientAddress: Address = {
      addressLine1: formData.addressLine1,
      addressLine2: formData.addressLine2 || undefined,
      city: formData.city,
      country: formData.country,
    };

    const newClientRecord: Omit<Client, 'id' | 'behaviouralBriefId' | 'behaviourQuestionnaireId'> = {
      ownerFirstName: formData.ownerFirstName,
      ownerLastName: formData.ownerLastName,
      contactEmail: formData.contactEmail,
      contactNumber: formData.contactNumber,
      postcode: formData.postcode,
      dogName: formData.dogName,
      isMember: false, 
      isActive: true, 
      address: clientAddress,
      howHeardAboutServices: formData.howHeardAboutServices || undefined,
      submissionDate: submissionTimestamp,
      createdAt: serverTimestamp() as Timestamp,
      lastSession: 'N/A',
      nextSession: 'Not Scheduled',
    };
    const clientDocRef = await addDoc(clientsCollectionRef, newClientRecord);
    targetClientId = clientDocRef.id;
    clientDataForReturn = { ...newClientRecord, id: targetClientId, createdAt: new Date().toISOString() } as Client;
  }

  const questionnaireRecord: Omit<BehaviourQuestionnaire, 'id'> = {
    clientId: targetClientId,
    dogName: formData.dogName,
    dogAge: formData.dogAge,
    dogSex: formData.dogSex,
    dogBreed: formData.dogBreed,
    neuteredSpayedDetails: formData.neuteredSpayedDetails,
    mainProblem: formData.mainProblem || '',
    problemTendencyFirstNoticed: formData.problemTendencyFirstNoticed || '',
    problemFrequencyDetails: formData.problemFrequencyDetails || '',
    problemRecentChanges: formData.problemRecentChanges || '',
    problemAnticipationDetails: formData.problemAnticipationDetails || '',
    dogMotivationForProblem: formData.dogMotivationForProblem || '',
    problemAddressingAttempts: formData.problemAddressingAttempts || '',
    idealTrainingOutcome: formData.idealTrainingOutcome || '',
    otherHelpNeeded: formData.otherHelpNeeded || undefined,
    medicalHistory: formData.medicalHistory || undefined,
    vetConsultationDetails: formData.vetConsultationDetails || undefined,
    dogOrigin: formData.dogOrigin || undefined,
    rescueBackground: formData.rescueBackground || undefined,
    dogAgeWhenAcquired: formData.dogAgeWhenAcquired || undefined,
    dietDetails: formData.dietDetails || undefined,
    foodMotivationLevel: formData.foodMotivationLevel || undefined,
    mealtimeRoutine: formData.mealtimeRoutine || undefined,
    treatRoutine: formData.treatRoutine || undefined,
    externalTreatsConsent: formData.externalTreatsConsent || undefined,
    playEngagement: formData.playEngagement || undefined,
    affectionResponse: formData.affectionResponse || undefined,
    exerciseRoutine: formData.exerciseRoutine || undefined,
    muzzleUsage: formData.muzzleUsage || undefined,
    reactionToFamiliarPeople: formData.reactionToFamiliarPeople || undefined,
    reactionToUnfamiliarPeople: formData.reactionToUnfamiliarPeople || undefined,
    housetrainedStatus: formData.housetrainedStatus || undefined,
    activitiesAsideFromWalks: formData.activitiesAsideFromWalks || undefined,
    dogLikes: formData.dogLikes || undefined,
    dogChallenges: formData.dogChallenges || '',
    positiveReinforcementMethods: formData.positiveReinforcementMethods || '',
    favoriteRewards: formData.favoriteRewards || '',
    correctionMethods: formData.correctionMethods || '',
    correctionEffects: formData.correctionEffects || '',
    previousProfessionalTraining: formData.previousProfessionalTraining || '',
    previousTrainingMethodsUsed: formData.previousTrainingMethodsUsed || '',
    previousTrainingExperienceResults: formData.previousTrainingExperienceResults || '',
    sociabilityWithDogs: formData.sociabilityWithDogs || '',
    sociabilityWithPeople: formData.sociabilityWithPeople || '',
    additionalInformation: formData.additionalInformation || undefined,
    timeDedicatedToTraining: formData.timeDedicatedToTraining || undefined,
    submissionDate: submissionTimestamp,
    createdAt: serverTimestamp() as Timestamp,
  };
  const questionnaireDocRef = await addDoc(behaviourQuestionnairesCollectionRef, questionnaireRecord);
  const newQuestionnaireId = questionnaireDocRef.id;

  const clientToUpdateRef = doc(clientsCollectionRef, targetClientId);
  await updateDoc(clientToUpdateRef, {
    behaviourQuestionnaireId: newQuestionnaireId,
  });
  
  clientDataForReturn.behaviourQuestionnaireId = newQuestionnaireId;

  const finalQuestionnaireData: BehaviourQuestionnaire = { ...questionnaireRecord, id: newQuestionnaireId, createdAt: new Date().toISOString() } as BehaviourQuestionnaire;

  return { client: clientDataForReturn, questionnaire: finalQuestionnaireData };
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

export const getBehaviourQuestionnaireById = async (questionnaireId: string): Promise<BehaviourQuestionnaire | null> => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || !questionnaireId) {
    console.warn("Firebase project ID or Questionnaire ID is not set. Skipping Firestore fetch.");
    return null;
  }
  try {
    const qDocRef = doc(behaviourQuestionnairesCollectionRef, questionnaireId);
    const qSnap = await getDoc(qDocRef);
    if (qSnap.exists()) {
      return qSnap.data();
    }
    console.log(`No behaviour questionnaire found with ID: ${questionnaireId}`);
    return null;
  } catch (error) {
    console.error(`Error fetching behaviour questionnaire with ID ${questionnaireId}:`, error);
    return null;
  }
};

// SESSION FIRESTORE FUNCTIONS
export const getSessionsFromFirestore = async (): Promise<Session[]> => {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    console.warn("Firebase project ID is not set. Skipping Firestore fetch for sessions.");
    return [];
  }
  try {
    const snapshot = await getDocs(sessionsCollectionRef);
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error("Error fetching sessions from Firestore:", error);
    return [];
  }
};

export const addSessionToFirestore = async (sessionData: Omit<Session, 'id' | 'createdAt'>): Promise<Session> => {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error("Firebase project ID is not set. Cannot add session.");
  }
  const dataToSave: DocumentData = { // Explicitly type as DocumentData
    ...sessionData,
    createdAt: serverTimestamp() as Timestamp,
  };
  if (sessionData.amount === undefined) { 
    dataToSave.amount = null; 
  }
  if (sessionData.dogName === undefined) {
    dataToSave.dogName = null;
  }
  if (sessionData.notes === undefined) {
    dataToSave.notes = null; 
  }

  const docRef = await addDoc(sessionsCollectionRef, dataToSave);
  // Simulate server timestamp for immediate use, actual timestamp comes from server
  const newSessionData = { ...sessionData, id: docRef.id, createdAt: new Date().toISOString() } as Session; 
  return newSessionData;
};

export const deleteSessionFromFirestore = async (sessionId: string): Promise<void> => {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error("Firebase project ID is not set. Cannot delete session.");
  }
  if (!sessionId) {
    throw new Error("Session ID is required to delete a session.");
  }
  try {
    const sessionDocRef = doc(sessionsCollectionRef, sessionId);
    await deleteDoc(sessionDocRef);
  } catch (error) {
    console.error("Error deleting session from Firestore:", error);
    throw error;
  }
};


export const signInUser = async (email: string, pass: string) => {
  return signInWithEmailAndPassword(auth, email, pass);
};

export const signOutUser = async () => {
  return signOut(auth);
};

export { db, app, auth, onAuthStateChanged, Timestamp, serverTimestamp, type User };
