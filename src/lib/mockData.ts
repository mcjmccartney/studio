
import type { Client, Session } from './types';

// Initial Mock Data
export let mockClients: Client[] = [
  { id: '1', name: 'Alice Wonderland', dogName: 'Cheshire', dogBreed: 'British Shorthair', contactEmail: 'alice@example.com', contactPhone: '555-0101', behaviorHistory: 'Very curious, tends to disappear and reappear unexpectedly.', lastSession: '2024-07-15', nextSession: '2024-07-29' },
  { id: '2', name: 'Bob The Builder', dogName: 'Scoop', dogBreed: 'Labrador Retriever', contactEmail: 'bob@example.com', contactPhone: '555-0102', behaviorHistory: 'Good with tools, a bit clumsy.', lastSession: '2024-07-10', nextSession: '2024-07-24' },
  { id: '3', name: 'Charlie Brown', dogName: 'Snoopy', dogBreed: 'Beagle', contactEmail: 'charlie@example.com', contactPhone: '555-0103', behaviorHistory: 'Likes to nap on his doghouse, philosophical.', lastSession: '2024-07-18', nextSession: '2024-08-01' },
  { id: '4', name: 'Diana Prince', dogName: 'Krypto (visiting)', dogBreed: 'Golden Retriever', contactEmail: 'diana@example.com', contactPhone: '555-0104', behaviorHistory: 'Noble and strong, occasionally flies.', lastSession: '2024-06-20', nextSession: 'Not Scheduled' },
];

export let mockSessions: Session[] = [
  { id: '1', clientId: '1', clientName: 'Alice Wonderland', dogName: 'Cheshire', date: '2024-07-29', time: '10:00 AM', status: 'Scheduled' },
  { id: '2', clientId: '2', clientName: 'Bob The Builder', dogName: 'Scoop', date: '2024-07-24', time: '02:00 PM', status: 'Scheduled' },
  { id: '3', clientId: '3', clientName: 'Charlie Brown', dogName: 'Snoopy', date: '2024-08-01', time: '11:30 AM', status: 'Scheduled' },
  { id: '4', clientId: '1', clientName: 'Alice Wonderland', dogName: 'Cheshire', date: '2024-08-05', time: '10:00 AM', status: 'Scheduled' },
  { id: '5', clientId: '2', clientName: 'Bob The Builder', dogName: 'Scoop', date: '2024-08-07', time: '02:00 PM', status: 'Completed' },
];

// Functions to modify mock data
export const addClient = (client: Omit<Client, 'id' | 'lastSession' | 'nextSession'>): Client => {
  const newClient: Client = { 
    ...client, 
    id: String(Date.now()),
    lastSession: 'N/A',
    nextSession: 'Not Scheduled' 
  };
  mockClients = [...mockClients, newClient];
  return newClient;
};

export const addSession = (session: Omit<Session, 'id' | 'status' | 'clientName' | 'dogName'>, client: Client): Session => {
  const newSession: Session = { 
    ...session, 
    id: String(Date.now()), 
    status: 'Scheduled',
    clientName: client.name,
    dogName: client.dogName,
  };
  mockSessions = [...mockSessions, newSession];
  return newSession;
};
