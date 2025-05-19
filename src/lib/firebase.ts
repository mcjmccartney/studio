
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
  type QueryDocumentSnapshot 
} from 'firebase/firestore';
import type { Client, BehaviouralBrief, BehaviourQuestionnaire, Address } from './types';
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
  mainProblem: string; // Changed from optional to required based on HTML
  problemTendencyFirstNoticed: string; // Changed from optional to required based on HTML
  problemFrequencyDetails: string; // Changed from optional to required based on HTML
  problemRecentChanges: string; // Changed from optional to required based on HTML
  problemAnticipationDetails: string; // Changed from optional to required based on HTML
  dogMotivationForProblem: string; // Changed from optional to required based on HTML
  problemAddressingAttempts: string; // Changed from optional to required based on HTML
  idealTrainingOutcome: string; // Changed from optional to required based on HTML
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
  dogChallenges?: string; // Changed from optional to required based on HTML
  positiveReinforcementMethods?: string; // Changed from optional to required
  favoriteRewards?: string; // Changed from optional to required
  correctionMethods?: string; // Changed from optional to required
  correctionEffects?: string; // Changed from optional to required
  previousProfessionalTraining?: string; // Changed from optional to required
  previousTrainingMethodsUsed?: string; // Changed from optional to required
  previousTrainingExperienceResults?: string; // Changed from optional to required
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
      dogName: client.dogName || null, // Ensure dogName is null if undefined
      address: client.address || null, // Ensure address is null if undefined
      howHeardAboutServices: client.howHeardAboutServices || null, // Ensure this is null if undefined
    };
    if (behaviouralBriefId) dataToSave.behaviouralBriefId = behaviouralBriefId;
    if (behaviourQuestionnaireId) dataToSave.behaviourQuestionnaireId = behaviourQuestionnaireId;
    
     Object.keys(dataToSave).forEach(key => {
      if (dataToSave[key] === undefined) {
        if (['dogName', 'address', 'howHeardAboutServices', 'behaviouralBriefId', 'behaviourQuestionnaireId'].includes(key)) {
          dataToSave[key] = null;
        } else if (key === 'isMember') {
            dataToSave[key] = false;
        } else {
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
      postcode: data.postcode || (data.address ? data.address.postcode : ''), // Use postcode from address if available
      address: data.address || undefined,
      howHeardAboutServices: data.howHeardAboutServices || undefined,
      dogName: data.dogName || undefined,
      isMember: data.isMember === undefined ? false : data.isMember,
      behaviouralBriefId: data.behaviouralBriefId || undefined,
      behaviourQuestionnaireId: data.behaviourQuestionnaireId || undefined,
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
            dataToSave[key] = null; 
        }
      }
    });
    return dataToSave;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>): BehaviourQuestionnaire {
    const data = snapshot.data();
    // Ensure all optional fields from the type are present, defaulting to undefined or empty string
    // to match the type, even if Firestore stores them as null.
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


const clientsCollectionRef = collection(db, 'clients').withConverter(clientConverter);
const behaviouralBriefsCollectionRef = collection(db, 'behaviouralBriefs').withConverter(behaviouralBriefConverter);
const behaviourQuestionnairesCollectionRef = collection(db, 'behaviourQuestionnaires').withConverter(behaviourQuestionnaireConverter);

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

// This function is used for the internal "Add Client" modal
export const addClientToFirestore = async (clientData: Omit<Client, 'id' | 'behaviouralBriefId' | 'behaviourQuestionnaireId' | 'address' | 'howHeardAboutServices' | 'lastSession' | 'nextSession' | 'createdAt'> & { dogName?: string; isMember?: boolean, submissionDate?: string, address?: Address, howHeardAboutServices?: string }): Promise<Client> => {
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
    address: clientData.address || undefined,
    howHeardAboutServices: clientData.howHeardAboutServices || undefined,
    submissionDate: clientData.submissionDate || format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    createdAt: serverTimestamp() as Timestamp,
    lastSession: 'N/A',
    nextSession: 'Not Scheduled',
  };

  const docRef = await addDoc(clientsCollectionRef, dataToSave);
  
  return { 
    id: docRef.id, 
    ...dataToSave,
    // Simulate serverTimestamp for local state update
    createdAt: new Date().toISOString(), 
  } as Client; 
};

export type EditableClientData = {
  ownerFirstName?: string;
  ownerLastName?: string;
  contactEmail?: string;
  contactNumber?: string;
  postcode?: string;
  dogName?: string;
  isMember?: boolean;
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

  // Filter out undefined values before updating
  Object.keys(clientData).forEach(key => {
    const K = key as keyof EditableClientData;
    if (clientData[K] !== undefined) {
      updateData[K] = clientData[K];
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
    // Future consideration: delete associated behavioural briefs and questionnaires if needed (cascade delete)
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
    postcode: formData.postcode, // Keep postcode at top level for quick access
    dogName: formData.dogName, 
    isMember: false, // Default to not a member
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

  // Update the client record with the ID of the newly created brief
  await updateDoc(clientDocRef, {
    behaviouralBriefId: newBriefId,
  });

  // For returning to the client, ensure all fields including generated IDs are present
  const finalClientData = { ...clientRecord, id: newClientId, behaviouralBriefId: newBriefId, createdAt: new Date().toISOString() } as Client;
  const finalBriefData = { ...briefRecord, id: newBriefId, createdAt: new Date().toISOString() } as BehaviouralBrief;
  
  return { client: finalClientData, brief: finalBriefData };
};

export const addClientAndBehaviourQuestionnaireToFirestore = async (
  formData: BehaviourQuestionnaireFormValues, 
  existingClientId?: string
): Promise<{client?: Client, questionnaire: BehaviourQuestionnaire}> => {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error("Firebase project ID is not set. Cannot add client and questionnaire.");
  }
  const submissionTimestamp = formData.submissionDate || format(new Date(), "yyyy-MM-dd HH:mm:ss");

  let finalClientData: Client | undefined = undefined;
  let targetClientId: string;

  if (existingClientId) {
    targetClientId = existingClientId;
    // Fetch the existing client to return it, but don't modify its contact details here based on questionnaire.
    const existingClientSnap = await getDoc(doc(clientsCollectionRef, existingClientId));
    if (existingClientSnap.exists()) {
      finalClientData = existingClientSnap.data();
    } else {
      throw new Error(`Client with ID ${existingClientId} not found.`);
    }
  } else {
    // Create a new client if no existingClientId is provided
    const clientAddress: Address = {
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2 || '',
        city: formData.city,
        country: formData.country,
    };

    const clientRecord: Omit<Client, 'id' | 'behaviouralBriefId' | 'behaviourQuestionnaireId'> = {
      ownerFirstName: formData.ownerFirstName,
      ownerLastName: formData.ownerLastName,
      contactEmail: formData.contactEmail,
      contactNumber: formData.contactNumber,
      postcode: formData.postcode, // Postcode from form
      dogName: formData.dogName, 
      isMember: false, 
      address: clientAddress,
      howHeardAboutServices: formData.howHeardAboutServices,
      submissionDate: submissionTimestamp,
      createdAt: serverTimestamp() as Timestamp,
      lastSession: 'N/A',
      nextSession: 'Not Scheduled',
    };
    const clientDocRef = await addDoc(clientsCollectionRef, clientRecord);
    targetClientId = clientDocRef.id;
    finalClientData = { ...clientRecord, id: targetClientId, createdAt: new Date().toISOString() } as Client;
  }

  // Create the BehaviourQuestionnaire document
  const questionnaireRecord: Omit<BehaviourQuestionnaire, 'id'> = {
    clientId: targetClientId, // Use targetClientId (either existing or new)
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
    otherHelpNeeded: formData.otherHelpNeeded,
    medicalHistory: formData.medicalHistory,
    vetConsultationDetails: formData.vetConsultationDetails,
    dogOrigin: formData.dogOrigin,
    rescueBackground: formData.rescueBackground,
    dogAgeWhenAcquired: formData.dogAgeWhenAcquired,
    dietDetails: formData.dietDetails,
    foodMotivationLevel: formData.foodMotivationLevel,
    mealtimeRoutine: formData.mealtimeRoutine,
    treatRoutine: formData.treatRoutine,
    externalTreatsConsent: formData.externalTreatsConsent,
    playEngagement: formData.playEngagement,
    affectionResponse: formData.affectionResponse,
    exerciseRoutine: formData.exerciseRoutine,
    muzzleUsage: formData.muzzleUsage,
    reactionToFamiliarPeople: formData.reactionToFamiliarPeople,
    reactionToUnfamiliarPeople: formData.reactionToUnfamiliarPeople,
    housetrainedStatus: formData.housetrainedStatus,
    activitiesAsideFromWalks: formData.activitiesAsideFromWalks,
    dogLikes: formData.dogLikes,
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
    additionalInformation: formData.additionalInformation,
    timeDedicatedToTraining: formData.timeDedicatedToTraining,
    submissionDate: submissionTimestamp,
    createdAt: serverTimestamp() as Timestamp,
  };
  const questionnaireDocRef = await addDoc(behaviourQuestionnairesCollectionRef, questionnaireRecord);
  const newQuestionnaireId = questionnaireDocRef.id;

  // Update the client record (whether new or existing) with the ID of the newly created questionnaire
  const clientToUpdateRef = doc(clientsCollectionRef, targetClientId);
  await updateDoc(clientToUpdateRef, {
    behaviourQuestionnaireId: newQuestionnaireId,
  });
  
  if(finalClientData) {
    finalClientData.behaviourQuestionnaireId = newQuestionnaireId;
  }


  const finalQuestionnaireData: BehaviourQuestionnaire = { ...questionnaireRecord, id: newQuestionnaireId, createdAt: new Date().toISOString() } as BehaviourQuestionnaire;

  return { client: finalClientData, questionnaire: finalQuestionnaireData };
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

// --- Firebase Auth Functions ---
export const signInUser = async (email: string, pass: string) => {
  return signInWithEmailAndPassword(auth, email, pass);
};

export const signOutUser = async () => {
  return signOut(auth);
};

// --- End Firebase Auth Functions ---

export { db, app, auth, onAuthStateChanged, Timestamp, serverTimestamp, type User };

    