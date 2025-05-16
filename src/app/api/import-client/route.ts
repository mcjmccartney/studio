
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { addClientToFirestore } from '@/lib/firebase';
import type { Client } from '@/lib/types';

// Define the expected schema for the incoming client data
const ImportClientSchema = z.object({
  name: z.string().min(2, { message: "Client name must be at least 2 characters." }),
  dogName: z.string().min(1, { message: "Dog name is required." }),
  dogBreed: z.string().min(2, { message: "Dog breed must be at least 2 characters." }),
  contactEmail: z.string().email({ message: "Invalid email address." }),
  contactPhone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  behaviorHistory: z.string().optional(),
  // Add any other fields that come directly from your Squarespace form / Google Sheet
});

export async function POST(request: NextRequest) {
  // SECURITY_NOTE: In a production environment, you should secure this endpoint.
  // Options include:
  // 1. A secret key/token passed in the headers or query parameters.
  // 2. IP whitelisting (if Google Apps Script has static IPs, which is unlikely for UrlFetchApp).
  // 3. Firebase App Check if the request is made from a trusted environment.
  // For now, this endpoint is open.
  // Example secret key check:
  // const secret = request.headers.get('X-Squarespace-Secret');
  // if (secret !== process.env.SQUARESPACE_WEBHOOK_SECRET) {
  //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  // }

  let requestBody;
  try {
    requestBody = await request.json();
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const validationResult = ImportClientSchema.safeParse(requestBody);

  if (!validationResult.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid input data', details: validationResult.error.flatten() },
      { status: 400 }
    );
  }

  const clientDataFromForm: Omit<Client, 'id' | 'lastSession' | 'nextSession' | 'createdAt'> = {
    name: validationResult.data.name,
    dogName: validationResult.data.dogName,
    dogBreed: validationResult.data.dogBreed,
    contactEmail: validationResult.data.contactEmail,
    contactPhone: validationResult.data.contactPhone,
    behaviorHistory: validationResult.data.behaviorHistory || '',
  };

  try {
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      console.error("API Error: Firebase project ID is not set. Cannot add client.");
      return NextResponse.json({ success: false, error: 'Firebase not configured on server' }, { status: 500 });
    }
    const newClient = await addClientToFirestore(clientDataFromForm);
    return NextResponse.json({ success: true, clientId: newClient.id, message: 'Client imported successfully' });
  } catch (error) {
    console.error('Error importing client to Firestore:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to import client';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
