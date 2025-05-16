
"use client";

import { useState, useEffect } from 'react';
import type { Client, Session } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, MoreHorizontal, CalendarDays as IconCalendarDays, Loader2, User, Dog, Mail, Phone, Home, Info, ListChecks, FileText, Activity, CheckSquare, Users as IconUsers, ShieldQuestion, MessageSquare, Target, HelpingHand } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
import { getClients, addClientToFirestore as fbAddClient } from '@/lib/firebase'; 
import { mockSessions } from '@/lib/mockData'; 
import { format, parseISO, isValid } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft } from 'lucide-react';

// Simplified Zod schema for internal "Add New Client" modal
// This can be simpler than the public behavioural brief.
const internalClientFormSchema = z.object({
  ownerFirstName: z.string().min(1, { message: "First name is required." }),
  ownerLastName: z.string().min(1, { message: "Last name is required." }),
  contactEmail: z.string().email({ message: "Invalid email address." }),
  contactNumber: z.string().min(5, { message: "Contact number is required." }),
  postcode: z.string().min(3, { message: "Postcode is required." }),
  dogName: z.string().min(1, { message: "Dog's name is required." }),
  dogBreed: z.string().min(1, { message: "Dog's breed is required." }),
  dogSex: z.enum(['Male', 'Female', ''], { required_error: "Dog's sex is required."}).refine(val => val !== '', { message: "Dog's sex is required." }),
  // Optional fields for quick add, can be expanded later via detailed view/edit
  lifeWithDogAndHelpNeeded: z.string().optional(),
  bestOutcome: z.string().optional(),
  idealSessionTypes: z.array(z.string()).optional(),
});

type InternalClientFormValues = z.infer<typeof internalClientFormSchema>;

interface ClientDetailViewProps {
  client: Client;
  sessions: Session[];
  onBack: () => void;
}

function ClientDetailView({ client, sessions, onBack }: ClientDetailViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          {client.ownerFirstName} {client.ownerLastName} &amp; {client.dogName}
        </h2>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Client List
        </Button>
      </div>
      
      <ScrollArea className="h-[calc(100vh-240px)] pr-4"> {/* Adjusted height */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <IconUsers className="mr-2 h-5 w-5 text-primary" /> Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><strong>Owner:</strong> {client.ownerFirstName} {client.ownerLastName}</div>
              <div className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground"/><strong>Email:</strong> {client.contactEmail}</div>
              <div className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground"/><strong>Contact Number:</strong> {client.contactNumber}</div>
              <div className="flex items-center"><Home className="mr-2 h-4 w-4 text-muted-foreground"/><strong>Postcode:</strong> {client.postcode}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Dog className="mr-2 h-5 w-5 text-primary" /> Dog Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><strong>Name:</strong> {client.dogName}</div>
              <div><strong>Breed:</strong> {client.dogBreed}</div>
              <div><strong>Sex:</strong> {client.dogSex}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Info className="mr-2 h-5 w-5 text-primary" /> Behavioural Brief Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {client.lifeWithDogAndHelpNeeded && (
                <div>
                  <strong className="flex items-center"><MessageSquare className="mr-2 h-4 w-4 text-muted-foreground"/>Life with Dog & Help Needed:</strong>
                  <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{client.lifeWithDogAndHelpNeeded}</p>
                </div>
              )}
              {client.bestOutcome && (
                <div className="pt-2">
                  <strong className="flex items-center"><Target className="mr-2 h-4 w-4 text-muted-foreground"/>Best Outcome Desired:</strong>
                  <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{client.bestOutcome}</p>
                </div>
              )}
              {client.idealSessionTypes && client.idealSessionTypes.length > 0 && (
                 <div className="pt-2">
                  <strong className="flex items-center"><HelpingHand className="mr-2 h-4 w-4 text-muted-foreground"/>Ideal Session Types:</strong>
                  <ul className="list-disc list-inside mt-1 text-muted-foreground">
                    {client.idealSessionTypes.map(type => <li key={type}>{type}</li>)}
                  </ul>
                </div>
              )}
              <div className="pt-2">
                  <strong className="flex items-center"><FileText className="mr-2 h-4 w-4 text-muted-foreground"/>Submission Date:</strong>
                  <p className="mt-1 text-muted-foreground">{client.submissionDate ? format(new Date(client.submissionDate), 'PPP p') : 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Activity className="mr-2 h-5 w-5 text-primary" /> Session History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessions.length > 0 ? (
                <ul className="space-y-3">
                  {sessions.map(session => (
                    <li key={session.id} className="p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors text-sm">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-semibold">
                            {isValid(parseISO(session.date)) ? format(parseISO(session.date), 'PPP') : 'Invalid Date'}
                          </span>
                          <span className="text-muted-foreground"> at {session.time}</span>
                        </div>
                        <Badge 
                          variant={
                            session.status === 'Scheduled' ? 'default' : 
                            session.status === 'Completed' ? 'secondary' : 'outline'
                          }
                        >
                          {session.status}
                        </Badge>
                      </div>
                      {session.notes && <p className="mt-1 text-xs text-muted-foreground">Notes: {session.notes}</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No session history found for this client.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}


export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSessions, setClientSessions] = useState<Session[]>([]);

  const { toast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InternalClientFormValues>({
    resolver: zodResolver(internalClientFormSchema),
     defaultValues: {
      ownerFirstName: '',
      ownerLastName: '',
      contactEmail: '',
      contactNumber: '',
      postcode: '',
      dogName: '',
      dogBreed: '',
      dogSex: '', // Initialize select to empty string
      lifeWithDogAndHelpNeeded: '',
      bestOutcome: '',
      idealSessionTypes: [],
    }
  });

  useEffect(() => {
    if (!selectedClient) {
      const fetchClients = async () => {
        if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
          toast({
            title: "Firebase Not Configured",
            description: "Firebase project ID is missing. Cannot fetch clients.",
            variant: "destructive",
          });
          setIsLoading(false);
          setClients([]); 
          return;
        }
        try {
          setIsLoading(true);
          setError(null);
          const firestoreClients = await getClients();
          setClients(firestoreClients.sort((a, b) => (a.ownerLastName > b.ownerLastName) ? 1 : (a.ownerLastName === b.ownerLastName ? ((a.ownerFirstName > b.ownerFirstName) ? 1: -1) : -1)));
        } catch (err) {
          console.error("Error fetching clients:", err);
          const errorMessage = err instanceof Error ? err.message : "Failed to load clients.";
          setError(errorMessage);
          toast({
            title: "Error Loading Clients",
            description: errorMessage,
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchClients();
    }
  }, [toast, selectedClient]);

  const handleAddClient: SubmitHandler<InternalClientFormValues> = async (data) => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      toast({
        title: "Firebase Not Configured",
        description: "Firebase project ID is missing. Cannot add client.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const clientDataForFirestore: Omit<Client, 'id' | 'lastSession' | 'nextSession' | 'createdAt' | 'submissionDate'> = {
        ...data,
        submissionDate: format(new Date(), "yyyy-MM-dd HH:mm:ss"), // Add submission date for internal adds too
      };
      const newClient = await fbAddClient(clientDataForFirestore);
      setClients(prevClients => [...prevClients, newClient].sort((a, b) => (a.ownerLastName > b.ownerLastName) ? 1 : (a.ownerLastName === b.ownerLastName ? ((a.ownerFirstName > b.ownerFirstName) ? 1: -1) : -1)));
      toast({
        title: "Client Added",
        description: `${newClient.ownerFirstName} ${newClient.ownerLastName} has been successfully added.`,
      });
      reset();
      setIsAddClientModalOpen(false);
    } catch (err) {
      console.error("Error adding client to Firestore:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to add client.";
      toast({
        title: "Error Adding Client",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRowClick = (client: Client) => {
    setSelectedClient(client);
    const sessions = mockSessions.filter(session => session.clientId === client.id)
                                .sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    setClientSessions(sessions);
  };

  const handleBackToList = () => {
    setSelectedClient(null);
    setClientSessions([]);
  };
  
  if (selectedClient) {
    return <ClientDetailView client={selectedClient} sessions={clientSessions} onBack={handleBackToList} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Clients</h1>
        <Dialog open={isAddClientModalOpen} onOpenChange={setIsAddClientModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-5 w-5" />
              Add New Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Fill in the details below to add a new client. More details can be added from the client's page.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleAddClient)} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ownerFirstName" className="text-right">First Name</Label>
                <div className="col-span-3">
                  <Input id="ownerFirstName" {...register("ownerFirstName")} className={errors.ownerFirstName ? "border-destructive" : ""} disabled={isSubmitting} />
                  {errors.ownerFirstName && <p className="text-xs text-destructive mt-1">{errors.ownerFirstName.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ownerLastName" className="text-right">Last Name</Label>
                <div className="col-span-3">
                  <Input id="ownerLastName" {...register("ownerLastName")} className={errors.ownerLastName ? "border-destructive" : ""} disabled={isSubmitting} />
                  {errors.ownerLastName && <p className="text-xs text-destructive mt-1">{errors.ownerLastName.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contactEmail" className="text-right">Email</Label>
                <div className="col-span-3">
                  <Input id="contactEmail" type="email" {...register("contactEmail")} className={errors.contactEmail ? "border-destructive" : ""} disabled={isSubmitting}/>
                  {errors.contactEmail && <p className="text-xs text-destructive mt-1">{errors.contactEmail.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contactNumber" className="text-right">Number</Label>
                <div className="col-span-3">
                  <Input id="contactNumber" type="tel" {...register("contactNumber")} className={errors.contactNumber ? "border-destructive" : ""} disabled={isSubmitting}/>
                  {errors.contactNumber && <p className="text-xs text-destructive mt-1">{errors.contactNumber.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="postcode" className="text-right">Postcode</Label>
                <div className="col-span-3">
                  <Input id="postcode" {...register("postcode")} className={errors.postcode ? "border-destructive" : ""} disabled={isSubmitting}/>
                  {errors.postcode && <p className="text-xs text-destructive mt-1">{errors.postcode.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dogName" className="text-right">Dog's Name</Label>
                 <div className="col-span-3">
                  <Input id="dogName" {...register("dogName")} className={errors.dogName ? "border-destructive" : ""} disabled={isSubmitting} />
                  {errors.dogName && <p className="text-xs text-destructive mt-1">{errors.dogName.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dogBreed" className="text-right">Dog's Breed</Label>
                 <div className="col-span-3">
                  <Input id="dogBreed" {...register("dogBreed")} className={errors.dogBreed ? "border-destructive" : ""} disabled={isSubmitting} />
                  {errors.dogBreed && <p className="text-xs text-destructive mt-1">{errors.dogBreed.message}</p>}
                </div>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dogSex" className="text-right">Dog's Sex</Label>
                 <div className="col-span-3">
                    <select id="dogSex" {...register("dogSex")} className={`w-full p-2 border rounded-md ${errors.dogSex ? "border-destructive" : "border-input"}`} disabled={isSubmitting}>
                        <option value="">Select Sex</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                    {errors.dogSex && <p className="text-xs text-destructive mt-1">{errors.dogSex.message}</p>}
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                   <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Client
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Client List</CardTitle>
          <CardDescription>Manage your clients and their dogs. Click a row to view details.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Loading clients...</p>
            </div>
          )}
          {!isLoading && error && (
            <div className="text-destructive text-center py-10">
              <p>Error loading clients: {error}</p>
              <p>Please ensure Firebase is configured correctly and you are online.</p>
            </div>
          )}
          {!isLoading && !error && clients.length === 0 && (
            <p className="text-muted-foreground text-center py-10">
              No clients found. Add a new client to get started.
              {!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && " (Firebase may not be configured)"}
            </p>
          )}
          {!isLoading && !error && clients.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Owner Name</TableHead>
                  <TableHead>Dog Name</TableHead>
                  <TableHead>Dog Breed</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Next Session</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id} onClick={() => handleRowClick(client)} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{client.ownerFirstName} {client.ownerLastName}</TableCell>
                    <TableCell>{client.dogName}</TableCell>
                    <TableCell>{client.dogBreed}</TableCell>
                    <TableCell>
                      <div>{client.contactEmail}</div>
                      <div className="text-xs text-muted-foreground">{client.contactNumber}</div>
                    </TableCell>
                    <TableCell>
                      {client.nextSession !== 'Not Scheduled' ? (
                        <Badge variant="default">{client.nextSession}</Badge>
                      ) : (
                        <Badge variant="secondary">{client.nextSession}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()} /* Prevents row click */>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={(e) => e.stopPropagation() /* TODO: Implement Edit */}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Client
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => e.stopPropagation() /* TODO: Implement Schedule */}>
                            <IconCalendarDays className="mr-2 h-4 w-4" />
                            Schedule Session
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive hover:!bg-destructive/10" onClick={(e) => e.stopPropagation() /* TODO: Implement Delete */}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Client
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
