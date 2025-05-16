
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
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
import type { Client, BehaviouralBrief, BehaviourQuestionnaire } from './types';
import { format } from 'date-fns';

// This type is for the full form data coming from public-intake/page.tsx
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
  mainProblem?: string;
  problemTendencyFirstNoticed?: string;
  problemFrequencyDetails?: string;
  problemRecentChanges?: string;
  problemAnticipationDetails?: string;
  dogMotivationForProblem?: string;
  problemAddressingAttempts?: string;
  idealTrainingOutcome?: string;
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

const clientConverter: FirestoreDataConverter<Client> = {
  toFirestore(client: Omit<Client, 'id'>): DocumentData {
    const { behaviouralBriefId, behaviourQuestionnaireId, ...clientData } = client;
    const dataToSave: any = { 
      ...clientData, // Includes ownerFirstName, ownerLastName, contactEmail, contactNumber, postcode, dogName, isMember, address, howHeardAboutServices
      createdAt: client.createdAt instanceof Date || client.createdAt instanceof Timestamp ? client.createdAt : serverTimestamp(),
      submissionDate: client.submissionDate || format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      lastSession: client.lastSession || 'N/A',
      nextSession: client.nextSession || 'Not Scheduled',
    };
    if (behaviouralBriefId) dataToSave.behaviouralBriefId = behaviouralBriefId;
    if (behaviourQuestionnaireId) dataToSave.behaviourQuestionnaireId = behaviourQuestionnaireId;
    
     Object.keys(dataToSave).forEach(key => {
      if (dataToSave[key] === undefined) {
        if (key === 'dogName') dataToSave[key] = null;
        else if (key === 'isMember') dataToSave[key] = false;
        else if (key === 'address') dataToSave[key] = null; // or {} depending on desired Firestore representation for empty address
        else if (key === 'howHeardAboutServices') dataToSave[key] = null;
        // Don't delete IDs if they are meant to be optional
        else if (key !== 'behaviouralBriefId' && key !== 'behaviourQuestionnaireId') { 
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
            delete dataToSave[key];
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
      otherHelpNeeded: data.otherHelpNeeded || undefined,
      medicalHistory: data.medicalHistory || undefined,
      vetConsultationDetails: data.vetConsultationDetails || undefined,
      dogOrigin: data.dogOrigin || undefined,
      rescueBackground: data.rescueBackground || undefined,
      dogAgeWhenAcquired: data.dogAgeWhenAcquired || undefined,
      dietDetails: data.dietDetails || undefined,
      foodMotivationLevel: data.foodMotivationLevel || undefined,
      mealtimeRoutine: data.mealtimeRoutine || undefined,
      treatRoutine: data.treatRoutine || undefined,
      externalTreatsConsent: data.externalTreatsConsent || undefined,
      playEngagement: data.playEngagement || undefined,
      affectionResponse: data.affectionResponse || undefined,
      exerciseRoutine: data.exerciseRoutine || undefined,
      muzzleUsage: data.muzzleUsage || undefined,
      reactionToFamiliarPeople: data.reactionToFamiliarPeople || undefined,
      reactionToUnfamiliarPeople: data.reactionToUnfamiliarPeople || undefined,
      housetrainedStatus: data.housetrainedStatus || undefined,
      activitiesAsideFromWalks: data.activitiesAsideFromWalks || undefined,
      dogLikes: data.dogLikes || undefined,
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
      additionalInformation: data.additionalInformation || undefined,
      timeDedicatedToTraining: data.timeDedicatedToTraining || undefined,
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

export const addClientToFirestore = async (clientData: Omit<Client, 'id' | 'behaviouralBriefId' | 'behaviourQuestionnaireId' | 'address' | 'howHeardAboutServices' | 'lastSession' | 'nextSession' | 'createdAt'> & { dogName?: string; isMember?: boolean, submissionDate?: string }): Promise<Client> => {
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
    submissionDate: clientData.submissionDate || format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    createdAt: serverTimestamp() as Timestamp,
    lastSession: 'N/A',
    nextSession: 'Not Scheduled',
  };

  const docRef = await addDoc(clientsCollectionRef, dataToSave);
  
  return { 
    id: docRef.id, 
    ...dataToSave,
    createdAt: new Date().toISOString(), // Approximate createdAt for immediate use
  } as Client; 
};

// Type for data used when updating a client (subset of Client fields)
export type EditableClientData = {
  ownerFirstName?: string;
  ownerLastName?: string;
  contactEmail?: string;
  contactNumber?: string;
  postcode?: string;
  dogName?: string;
  isMember?: boolean;
  // Note: address and howHeardAboutServices are not part of the internal edit form for now.
  // submissionDate is system-managed and not typically user-editable.
};

export const updateClientInFirestore = async (clientId: string, clientData: EditableClientData): Promise<void> => {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error("Firebase project ID is not set. Cannot update client.");
  }
  if (!clientId) {
    throw new Error("Client ID is required to update a client.");
  }
  
  const clientDocRef = doc(clientsCollectionRef, clientId);
  
  // Construct the update object, ensuring only defined fields are sent
  const updateData: Partial<Client> = {};
  if (clientData.ownerFirstName !== undefined) updateData.ownerFirstName = clientData.ownerFirstName;
  if (clientData.ownerLastName !== undefined) updateData.ownerLastName = clientData.ownerLastName;
  if (clientData.contactEmail !== undefined) updateData.contactEmail = clientData.contactEmail;
  if (clientData.contactNumber !== undefined) updateData.contactNumber = clientData.contactNumber;
  if (clientData.postcode !== undefined) updateData.postcode = clientData.postcode;
  if (clientData.dogName !== undefined) updateData.dogName = clientData.dogName;
  if (clientData.isMember !== undefined) updateData.isMember = clientData.isMember;
  // Add other editable fields here if needed, ensuring they are part of EditableClientData

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
    // Note: Consider deleting associated behavioural briefs and questionnaires here if needed (cascade delete)
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

export const addClientAndBehaviourQuestionnaireToFirestore = async (formData: BehaviourQuestionnaireFormValues): Promise<{client: Client, questionnaire: BehaviourQuestionnaire}> => {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error("Firebase project ID is not set. Cannot add client and questionnaire.");
  }
  const submissionTimestamp = formData.submissionDate || format(new Date(), "yyyy-MM-dd HH:mm:ss");

  const clientAddress = {
      addressLine1: formData.addressLine1,
      addressLine2: formData.addressLine2 || '',
      city: formData.city,
      country: formData.country,
      // postcode: formData.postcode, // Postcode also stored in address object - removed redundancy, client.postcode is primary
  };

  const clientRecord: Omit<Client, 'id' | 'behaviouralBriefId' | 'behaviourQuestionnaireId'> = {
    ownerFirstName: formData.ownerFirstName,
    ownerLastName: formData.ownerLastName,
    contactEmail: formData.contactEmail,
    contactNumber: formData.contactNumber,
    postcode: formData.postcode, // Top-level postcode
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
  const newClientId = clientDocRef.id;

  const questionnaireRecord: Omit<BehaviourQuestionnaire, 'id'> = {
    clientId: newClientId,
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

  await updateDoc(clientDocRef, {
    behaviourQuestionnaireId: newQuestionnaireId,
  });

  const finalClientData: Client = { ...clientRecord, id: newClientId, behaviourQuestionnaireId: newQuestionnaireId, createdAt: new Date().toISOString() } as Client;
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

export { db, app, Timestamp, serverTimestamp };

    
