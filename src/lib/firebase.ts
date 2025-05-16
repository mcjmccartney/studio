
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc,
  // query, 
  // where,
  // limit,
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

// This type is for the full form data coming from behaviour-questionnaire/page.tsx
// It's extensive, mirroring the Zod schema there.
export interface BehaviourQuestionnaireFormValues {
  // Owner Info
  ownerFirstName: string;
  ownerLastName: string;
  contactEmail: string;
  contactNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  postcode: string; // Part of address, but also useful standalone
  howHeardAboutServices?: string;

  // Dog Info
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

  // Health and Veterinary Information
  medicalHistory?: string;
  vetConsultationDetails?: string;

  // Background Information
  dogOrigin?: string;
  rescueBackground?: string;
  dogAgeWhenAcquired?: string;

  // Diet and Feeding
  dietDetails?: string;
  foodMotivationLevel?: string; // "1" - "10"
  mealtimeRoutine?: string;
  treatRoutine?: string;
  externalTreatsConsent?: string;

  // Routines
  playEngagement?: string;
  affectionResponse?: string;
  exerciseRoutine?: string;
  muzzleUsage?: string;
  reactionToFamiliarPeople?: string;
  reactionToUnfamiliarPeople?: string;
  housetrainedStatus?: string;
  activitiesAsideFromWalks?: string;

  // Temperament
  dogLikes?: string;
  dogChallenges?: string;

  // Training
  positiveReinforcementMethods?: string;
  favoriteRewards?: string;
  correctionMethods?: string;
  correctionEffects?: string;
  previousProfessionalTraining?: string;
  previousTrainingMethodsUsed?: string;
  previousTrainingExperienceResults?: string;

  // Sociability
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

// Firestore data converter for Client
const clientConverter: FirestoreDataConverter<Client> = {
  toFirestore(client: Omit<Client, 'id'>): DocumentData {
    const { behaviouralBriefId, behaviourQuestionnaireId, address, ...contactData } = client;
    const dataToSave: any = { 
      ...contactData,
      createdAt: client.createdAt instanceof Date || client.createdAt instanceof Timestamp ? client.createdAt : serverTimestamp(),
      submissionDate: client.submissionDate || format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      lastSession: client.lastSession || 'N/A',
      nextSession: client.nextSession || 'Not Scheduled',
    };
    if (behaviouralBriefId) dataToSave.behaviouralBriefId = behaviouralBriefId;
    if (behaviourQuestionnaireId) dataToSave.behaviourQuestionnaireId = behaviourQuestionnaireId;
    if (address) dataToSave.address = address;
    
     Object.keys(dataToSave).forEach(key => {
      if (dataToSave[key] === undefined) {
        delete dataToSave[key]; 
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
      address: data.address || undefined,
      howHeardAboutServices: data.howHeardAboutServices || undefined,
      behaviouralBriefId: data.behaviouralBriefId || undefined,
      behaviourQuestionnaireId: data.behaviourQuestionnaireId || undefined,
      submissionDate: data.submissionDate || '',
      lastSession: data.lastSession || 'N/A',
      nextSession: data.nextSession || 'Not Scheduled',
      createdAt: data.createdAt, 
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

// Firestore data converter for BehaviourQuestionnaire
const behaviourQuestionnaireConverter: FirestoreDataConverter<BehaviourQuestionnaire> = {
  toFirestore(questionnaire: Omit<BehaviourQuestionnaire, 'id'>): DocumentData {
    const dataToSave = {
      ...questionnaire,
      createdAt: questionnaire.createdAt instanceof Date || questionnaire.createdAt instanceof Timestamp ? questionnaire.createdAt : serverTimestamp(),
      submissionDate: questionnaire.submissionDate || format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    };
     Object.keys(dataToSave).forEach(key => {
      if (dataToSave[key] === undefined) {
        // For optional fields, if they are undefined, don't save them.
        // For specific fields like sociability, ensure empty string if not provided, if that's the desired DB state.
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
    // Ensure all fields from BehaviourQuestionnaire type are mapped
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
      dogChallenges: data.dogChallenges || undefined,
      positiveReinforcementMethods: data.positiveReinforcementMethods || undefined,
      favoriteRewards: data.favoriteRewards || undefined,
      correctionMethods: data.correctionMethods || undefined,
      correctionEffects: data.correctionEffects || undefined,
      previousProfessionalTraining: data.previousProfessionalTraining || undefined,
      previousTrainingMethodsUsed: data.previousTrainingMethodsUsed || undefined,
      previousTrainingExperienceResults: data.previousTrainingExperienceResults || undefined,
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

// For internal "Add Client" modal - creates a client without a brief or questionnaire initially
export const addClientToFirestore = async (clientContactData: Omit<Client, 'id' | 'behaviouralBriefId' | 'behaviourQuestionnaireId' | 'address' | 'howHeardAboutServices' | 'lastSession' | 'nextSession' | 'createdAt'>): Promise<Client> => {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error("Firebase project ID is not set. Cannot add client.");
  }
  
  const dataToSave: Omit<Client, 'id'> = {
    ...clientContactData, // ownerFirstName, ownerLastName, contactEmail, contactNumber, postcode
    submissionDate: clientContactData.submissionDate || format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    createdAt: serverTimestamp() as Timestamp,
    lastSession: 'N/A',
    nextSession: 'Not Scheduled',
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

  const clientRecord: Omit<Client, 'id' | 'behaviouralBriefId' | 'behaviourQuestionnaireId' | 'address' | 'howHeardAboutServices'> = {
    ownerFirstName: formData.ownerFirstName,
    ownerLastName: formData.ownerLastName,
    contactEmail: formData.contactEmail,
    contactNumber: formData.contactNumber,
    postcode: formData.postcode, // From Behavioural Brief form
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

  const finalClientData = { ...clientRecord, id: newClientId, behaviouralBriefId: newBriefId } as Client;
  const finalBriefData = { ...briefRecord, id: newBriefId } as BehaviouralBrief;
  
  return { client: finalClientData, brief: finalBriefData };
};

// For the public Behaviour Questionnaire form
export const addClientAndBehaviourQuestionnaireToFirestore = async (formData: BehaviourQuestionnaireFormValues): Promise<{client: Client, questionnaire: BehaviourQuestionnaire}> => {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error("Firebase project ID is not set. Cannot add client and questionnaire.");
  }
  const submissionTimestamp = formData.submissionDate || format(new Date(), "yyyy-MM-dd HH:mm:ss");

  // Create Client document
  const clientRecord: Omit<Client, 'id' | 'behaviouralBriefId' | 'behaviourQuestionnaireId'> = {
    ownerFirstName: formData.ownerFirstName,
    ownerLastName: formData.ownerLastName,
    contactEmail: formData.contactEmail,
    contactNumber: formData.contactNumber,
    postcode: formData.postcode, // From the address object in this form
    address: {
      addressLine1: formData.addressLine1,
      addressLine2: formData.addressLine2,
      city: formData.city,
      country: formData.country,
    },
    howHeardAboutServices: formData.howHeardAboutServices,
    submissionDate: submissionTimestamp, // This client record gets a submission date too
    createdAt: serverTimestamp() as Timestamp,
    lastSession: 'N/A',
    nextSession: 'Not Scheduled',
  };
  // For now, assume new client. Could add find-or-create logic later.
  const clientDocRef = await addDoc(clientsCollectionRef, clientRecord);
  const newClientId = clientDocRef.id;

  // Create BehaviourQuestionnaire document
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
    dogChallenges: formData.dogChallenges,
    positiveReinforcementMethods: formData.positiveReinforcementMethods,
    favoriteRewards: formData.favoriteRewards,
    correctionMethods: formData.correctionMethods,
    correctionEffects: formData.correctionEffects,
    previousProfessionalTraining: formData.previousProfessionalTraining,
    previousTrainingMethodsUsed: formData.previousTrainingMethodsUsed,
    previousTrainingExperienceResults: formData.previousTrainingExperienceResults,
    sociabilityWithDogs: formData.sociabilityWithDogs,
    sociabilityWithPeople: formData.sociabilityWithPeople,
    additionalInformation: formData.additionalInformation,
    timeDedicatedToTraining: formData.timeDedicatedToTraining,
    submissionDate: submissionTimestamp,
    createdAt: serverTimestamp() as Timestamp,
  };
  const questionnaireDocRef = await addDoc(behaviourQuestionnairesCollectionRef, questionnaireRecord);
  const newQuestionnaireId = questionnaireDocRef.id;

  // Update Client document with behaviourQuestionnaireId
  await updateDoc(clientDocRef, {
    behaviourQuestionnaireId: newQuestionnaireId,
  });

  const finalClientData: Client = { ...clientRecord, id: newClientId, behaviourQuestionnaireId: newQuestionnaireId } as Client;
  const finalQuestionnaireData: BehaviourQuestionnaire = { ...questionnaireRecord, id: newQuestionnaireId } as BehaviourQuestionnaire;

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


// Placeholder for other Firestore functions (Sessions, Finance)
// export const getSessions = async (): Promise<Session[]> => { ... };
// export const addSessionToFirestore = async (sessionData: Omit<Session, 'id'>): Promise<Session> => { ... };

export { db, app, Timestamp, serverTimestamp };
