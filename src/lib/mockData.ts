
import type { Client, Session, BehaviouralBrief } from './types';
import { format } from 'date-fns';

// Updated Mock Data to reflect the new Client & BehaviouralBrief type structure
export let mockClients: Client[] = [
  { 
    id: '1', 
    ownerFirstName: 'Alice', 
    ownerLastName: 'Wonderland', 
    contactEmail: 'alice@example.com', 
    contactNumber: '555-0101', 
    postcode: 'EC1A 1BB',
    behaviouralBriefId: 'brief1', // Link to mock brief
    submissionDate: format(new Date('2024-07-01'), "yyyy-MM-dd HH:mm:ss"),
    lastSession: '2024-07-15', 
    nextSession: '2024-07-29',
    createdAt: new Date('2024-07-01').toISOString(),
  },
  { 
    id: '2', 
    ownerFirstName: 'Bob', 
    ownerLastName: 'The Builder', 
    contactEmail: 'bob@example.com', 
    contactNumber: '555-0102', 
    postcode: 'SW1A 0AA',
    behaviouralBriefId: 'brief2', // Link to mock brief
    submissionDate: format(new Date('2024-07-05'), "yyyy-MM-dd HH:mm:ss"),
    lastSession: '2024-07-10', 
    nextSession: '2024-07-24',
    createdAt: new Date('2024-07-05').toISOString(),
  },
  { 
    id: '3', 
    ownerFirstName: 'Charlie', 
    ownerLastName: 'Brown', 
    contactEmail: 'charlie@example.com', 
    contactNumber: '555-0103', 
    postcode: 'W1A 0AX',
    // No behaviouralBriefId, simulating an internally added client
    submissionDate: format(new Date('2024-07-10'), "yyyy-MM-dd HH:mm:ss"),
    lastSession: '2024-07-18', 
    nextSession: '2024-08-01',
    createdAt: new Date('2024-07-10').toISOString(),
  },
];

export let mockBehaviouralBriefs: BehaviouralBrief[] = [
  {
    id: 'brief1',
    clientId: '1',
    dogName: 'Cheshire', 
    dogSex: 'Male',
    dogBreed: 'British Shorthair', 
    lifeWithDogAndHelpNeeded: 'Very curious, tends to disappear and reappear unexpectedly. Needs help with staying present.', 
    bestOutcome: 'For Cheshire to be more grounded and less prone to vanishing acts.',
    idealSessionTypes: ['In-Person Session', 'Online Session'],
    submissionDate: format(new Date('2024-07-01'), "yyyy-MM-dd HH:mm:ss"),
    createdAt: new Date('2024-07-01').toISOString(),
  },
  {
    id: 'brief2',
    clientId: '2',
    dogName: 'Scoop', 
    dogSex: 'Male',
    dogBreed: 'Labrador Retriever', 
    lifeWithDogAndHelpNeeded: 'Good with tools, a bit clumsy. Could use some focus training.', 
    bestOutcome: 'Scoop to be more agile and less likely to knock things over.',
    idealSessionTypes: ['In-Person Session'],
    submissionDate: format(new Date('2024-07-05'), "yyyy-MM-dd HH:mm:ss"),
    createdAt: new Date('2024-07-05').toISOString(),
  }
];


export let mockSessions: Session[] = [
  { id: '1', clientId: '1', clientName: 'Alice Wonderland', dogName: 'Cheshire', date: '2024-07-29', time: '10:00 AM', status: 'Scheduled' },
  { id: '2', clientId: '2', clientName: 'Bob The Builder', dogName: 'Scoop', date: '2024-07-24', time: '02:00 PM', status: 'Scheduled' },
  { id: '3', clientId: '3', clientName: 'Charlie Brown', dogName: 'Snoopy', date: '2024-08-01', time: '11:30 AM', status: 'Scheduled' },
  { id: '4', clientId: '1', clientName: 'Alice Wonderland', dogName: 'Cheshire', date: '2024-08-05', time: '10:00 AM', status: 'Scheduled' },
  { id: '5', clientId: '2', clientName: 'Bob The Builder', dogName: 'Scoop', date: '2024-08-07', time: '02:00 PM', status: 'Completed' },
];


// This function is now more for client selection in "Add Session" modal if it uses mock data
// It's not for adding clients to the main list anymore if Firestore is primary.
export const addSession = (session: Omit<Session, 'id' | 'status' | 'clientName' | 'dogName'>, clientDetails: {id: string, ownerFirstName: string, ownerLastName: string, dogName?: string}): Session => {
  const clientName = `${clientDetails.ownerFirstName} ${clientDetails.ownerLastName}`;
  // Attempt to find a linked brief for the dog name, or use a placeholder if clientDetails.dogName is not directly available
  // This part might need adjustment based on how dogName is passed or if sessions should always link to a specific brief's dog.
  const briefForClient = mockBehaviouralBriefs.find(b => b.clientId === clientDetails.id);
  const dogNameForSession = clientDetails.dogName || (briefForClient ? briefForClient.dogName : 'N/A');

  const newSession: Session = { 
    ...session, 
    id: String(Date.now()), 
    status: 'Scheduled',
    clientName: clientName,
    dogName: dogNameForSession,
  };
  mockSessions = [...mockSessions, newSession];
  
  // Update client's nextSession if this is the most recent
  const clientIndex = mockClients.findIndex(c => c.id === clientDetails.id);
  if (clientIndex > -1) {
    // Basic logic for updating next session, can be made more robust
    if (mockClients[clientIndex].nextSession === 'Not Scheduled' || 
        new Date(session.date) < new Date(mockClients[clientIndex].nextSession!)) {
        mockClients[clientIndex] = { ...mockClients[clientIndex], nextSession: session.date };
    }
  }
  return newSession;
};
