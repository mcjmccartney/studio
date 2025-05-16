
import type { Client, Session, BehaviouralBrief } from './types';
import { format } from 'date-fns';

export let mockClients: Client[] = [
  { 
    id: '1', 
    ownerFirstName: 'Alice', 
    ownerLastName: 'Wonderland', 
    contactEmail: 'alice@example.com', 
    contactNumber: '555-0101', 
    postcode: 'EC1A 1BB',
    dogName: 'Cheshire',
    isMember: true,
    behaviouralBriefId: 'brief1',
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
    dogName: 'Scoop',
    isMember: false,
    behaviouralBriefId: 'brief2',
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
    dogName: 'Snoopy',
    isMember: true,
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
  { id: 's1', clientId: '1', clientName: 'Alice Wonderland', dogName: 'Cheshire', date: '2024-07-29', time: '10:00 AM', status: 'Scheduled' },
  { id: 's2', clientId: '2', clientName: 'Bob The Builder', dogName: 'Scoop', date: '2024-07-24', time: '02:00 PM', status: 'Scheduled' },
  { id: 's3', clientId: '3', clientName: 'Charlie Brown', dogName: 'Snoopy', date: '2024-08-01', time: '11:30 AM', status: 'Scheduled' },
  { id: 's4', clientId: '1', clientName: 'Alice Wonderland', dogName: 'Cheshire', date: '2024-08-05', time: '10:00 AM', status: 'Scheduled' },
  { id: 's5', clientId: '2', clientName: 'Bob The Builder', dogName: 'Scoop', date: '2024-08-07', time: '02:00 PM', status: 'Completed', notes: 'Scoop did well with recall. Needs more work on loose-leash walking.' },
];

// Function to add a session to mock data
export const addSession = (sessionData: Omit<Session, 'id' | 'status' | 'clientName' | 'dogName' >, clientDetails: Client ): Session => {
  const clientFullName = `${clientDetails.ownerFirstName} ${clientDetails.ownerLastName}`;
  const dogNameForSession = clientDetails.dogName || 'N/A';

  const newSession: Session = { 
    ...sessionData, 
    id: `s${Date.now()}`, // Ensure unique ID
    status: 'Scheduled',
    clientName: clientFullName,
    dogName: dogNameForSession,
    createdAt: new Date().toISOString(),
  };
  mockSessions.push(newSession); // Add to the main array
  
  const clientIndex = mockClients.findIndex(c => c.id === clientDetails.id);
  if (clientIndex > -1) {
    if (mockClients[clientIndex].nextSession === 'Not Scheduled' || 
        (mockClients[clientIndex].nextSession && new Date(sessionData.date) < new Date(mockClients[clientIndex].nextSession!))) {
        mockClients[clientIndex] = { ...mockClients[clientIndex], nextSession: sessionData.date };
    }
  }
  return newSession;
};

// Function to delete a session from mock data
export const deleteSession = (sessionId: string): boolean => {
  const initialLength = mockSessions.length;
  mockSessions = mockSessions.filter(session => session.id !== sessionId);
  return mockSessions.length < initialLength;
};

    