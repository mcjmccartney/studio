
import type { Client, Session } from './types';
import { format } from 'date-fns';

// Updated Mock Data to reflect the new Client type structure
export let mockClients: Client[] = [
  { 
    id: '1', 
    ownerFirstName: 'Alice', 
    ownerLastName: 'Wonderland', 
    contactEmail: 'alice@example.com', 
    contactNumber: '555-0101', 
    postcode: 'EC1A 1BB',
    dogName: 'Cheshire', 
    dogSex: 'Male',
    dogBreed: 'British Shorthair', 
    lifeWithDogAndHelpNeeded: 'Very curious, tends to disappear and reappear unexpectedly. Needs help with staying present.', 
    bestOutcome: 'For Cheshire to be more grounded and less prone to vanishing acts.',
    idealSessionTypes: ['In-Person Session', 'Online Session'],
    submissionDate: format(new Date('2024-07-01'), "yyyy-MM-dd HH:mm:ss"),
    lastSession: '2024-07-15', 
    nextSession: '2024-07-29' 
  },
  { 
    id: '2', 
    ownerFirstName: 'Bob', 
    ownerLastName: 'The Builder', 
    contactEmail: 'bob@example.com', 
    contactNumber: '555-0102', 
    postcode: 'SW1A 0AA',
    dogName: 'Scoop', 
    dogSex: 'Male',
    dogBreed: 'Labrador Retriever', 
    lifeWithDogAndHelpNeeded: 'Good with tools, a bit clumsy. Could use some focus training.', 
    bestOutcome: 'Scoop to be more agile and less likely to knock things over.',
    idealSessionTypes: ['In-Person Session'],
    submissionDate: format(new Date('2024-07-05'), "yyyy-MM-dd HH:mm:ss"),
    lastSession: '2024-07-10', 
    nextSession: '2024-07-24' 
  },
  { 
    id: '3', 
    ownerFirstName: 'Charlie', 
    ownerLastName: 'Brown', 
    contactEmail: 'charlie@example.com', 
    contactNumber: '555-0103', 
    postcode: 'W1A 0AX',
    dogName: 'Snoopy', 
    dogSex: 'Male',
    dogBreed: 'Beagle', 
    lifeWithDogAndHelpNeeded: 'Likes to nap on his doghouse, philosophical. Needs motivation for active training.', 
    bestOutcome: 'Snoopy to engage more during training sessions.',
    idealSessionTypes: ['Online Session'],
    submissionDate: format(new Date('2024-07-10'), "yyyy-MM-dd HH:mm:ss"),
    lastSession: '2024-07-18', 
    nextSession: '2024-08-01' 
  },
];

export let mockSessions: Session[] = [
  { id: '1', clientId: '1', clientName: 'Alice Wonderland', dogName: 'Cheshire', date: '2024-07-29', time: '10:00 AM', status: 'Scheduled' },
  { id: '2', clientId: '2', clientName: 'Bob The Builder', dogName: 'Scoop', date: '2024-07-24', time: '02:00 PM', status: 'Scheduled' },
  { id: '3', clientId: '3', clientName: 'Charlie Brown', dogName: 'Snoopy', date: '2024-08-01', time: '11:30 AM', status: 'Scheduled' },
  { id: '4', clientId: '1', clientName: 'Alice Wonderland', dogName: 'Cheshire', date: '2024-08-05', time: '10:00 AM', status: 'Scheduled' },
  { id: '5', clientId: '2', clientName: 'Bob The Builder', dogName: 'Scoop', date: '2024-08-07', time: '02:00 PM', status: 'Completed' },
];


export const addSession = (session: Omit<Session, 'id' | 'status' | 'clientName' | 'dogName'>, client: Client): Session => {
  const newSession: Session = { 
    ...session, 
    id: String(Date.now()), 
    status: 'Scheduled',
    clientName: `${client.ownerFirstName} ${client.ownerLastName}`,
    dogName: client.dogName,
  };
  mockSessions = [...mockSessions, newSession];
  const clientIndex = mockClients.findIndex(c => c.id === client.id);
  if (clientIndex > -1) {
    mockClients[clientIndex] = { ...mockClients[clientIndex], nextSession: session.date };
  }
  return newSession;
};
