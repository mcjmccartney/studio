
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Client, Session, BehaviouralBrief, BehaviourQuestionnaire } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, MoreHorizontal, Loader2, User, Dog, Mail, Phone, Home, Info, ListChecks, FileText, Activity, CheckSquare, Users as IconUsers, ShieldQuestion, MessageSquare, Target, HelpingHand, BookOpen, MapPin, FileQuestion as IconFileQuestion, ArrowLeft, PawPrint, ShieldCheck, CalendarDays as IconCalendarDays } from 'lucide-react';
import Image from 'next/image'; // Import next/image
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
import { getClients, addClientToFirestore as fbAddClient, deleteClientFromFirestore, getBehaviouralBriefByBriefId, getBehaviourQuestionnaireById, updateClientInFirestore, type EditableClientData } from '@/lib/firebase'; 
import { mockSessions } from '@/lib/mockData'; 
import { format, parseISO, isValid } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';


const internalClientFormSchema = z.object({
  ownerFirstName: z.string().min(1, { message: "First name is required." }),
  ownerLastName: z.string().min(1, { message: "Last name is required." }),
  contactEmail: z.string().email({ message: "Invalid email address." }),
  contactNumber: z.string().min(5, { message: "Contact number is required." }),
  postcode: z.string().min(3, { message: "Postcode is required." }),
  dogName: z.string().optional(),
  isMember: z.boolean().optional(),
  submissionDate: z.string().optional(), 
});

type InternalClientFormValues = z.infer<typeof internalClientFormSchema>;

interface ClientDetailViewProps {
  client: Client;
  sessions: Session[];
  onBack: () => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

function ClientDetailView({ client, sessions, onBack, onEdit, onDelete }: ClientDetailViewProps) {
  const [behaviouralBrief, setBehaviouralBrief] = useState<BehaviouralBrief | null>(null);
  const [isLoadingBrief, setIsLoadingBrief] = useState<boolean>(false);
  const [behaviourQuestionnaire, setBehaviourQuestionnaire] = useState<BehaviourQuestionnaire | null>(null);
  const [isLoadingQuestionnaire, setIsLoadingQuestionnaire] = useState<boolean>(false);

  useEffect(() => {
    const fetchBrief = async () => {
      if (client.behaviouralBriefId) {
        setIsLoadingBrief(true);
        try {
          const brief = await getBehaviouralBriefByBriefId(client.behaviouralBriefId);
          setBehaviouralBrief(brief);
        } catch (error) {
          console.error("Error fetching behavioural brief:", error);
          setBehaviouralBrief(null);
        } finally {
          setIsLoadingBrief(false);
        }
      } else {
        setBehaviouralBrief(null);
      }
    };
    fetchBrief();
  }, [client.behaviouralBriefId]);

  useEffect(() => {
    const fetchQuestionnaire = async () => {
      if (client.behaviourQuestionnaireId) {
        setIsLoadingQuestionnaire(true);
        try {
          const questionnaire = await getBehaviourQuestionnaireById(client.behaviourQuestionnaireId);
          setBehaviourQuestionnaire(questionnaire);
        } catch (error) {
          console.error("Error fetching behaviour questionnaire:", error);
          setBehaviourQuestionnaire(null);
        } finally {
          setIsLoadingQuestionnaire(false);
        }
      } else {
        setBehaviourQuestionnaire(null);
      }
    };
    fetchQuestionnaire();
  }, [client.behaviourQuestionnaireId]);


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            {client.isMember && (
                 <Image
                    src="https://placehold.co/40x40.png"
                    alt="Member Icon"
                    width={40}
                    height={40}
                    className="rounded-md"
                    data-ai-hint="company logo"
                  />
            )}
            <h2 className="text-2xl font-bold tracking-tight">
            {client.ownerFirstName} {client.ownerLastName}
            </h2>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => onEdit(client)}>
                <Edit className="mr-2 h-4 w-4" /> Edit Client
            </Button>
            <Button variant="destructive" onClick={() => onDelete(client)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete Client
            </Button>
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Client List
            </Button>
        </div>
      </div>
      
      <ScrollArea className="h-[calc(100vh-240px)] pr-4">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <IconUsers className="mr-2 h-5 w-5 text-primary" /> Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><strong>Owner:</strong> {client.ownerFirstName} {client.ownerLastName}</div>
              {client.dogName && <div className="flex items-center"><PawPrint className="mr-2 h-4 w-4 text-muted-foreground"/><strong>Dog:</strong> {client.dogName}</div>}
              <div><strong>Membership:</strong> {client.isMember ? <Badge variant="default">Active Member</Badge> : <Badge variant="outline">Not a Member</Badge>}</div>
              <div className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground"/><strong>Email:</strong> {client.contactEmail}</div>
              <div className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground"/><strong>Contact Number:</strong> {client.contactNumber}</div>
              {client.address ? (
                <>
                  <div className="flex items-start"><MapPin className="mr-2 h-4 w-4 text-muted-foreground mt-0.5"/>
                    <strong>Address:</strong>
                    <div className="ml-1">
                        {client.address.addressLine1} <br />
                        {client.address.addressLine2 && <>{client.address.addressLine2} <br /></>}
                        {client.address.city}, {client.postcode} <br />
                        {client.address.country}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center"><Home className="mr-2 h-4 w-4 text-muted-foreground"/><strong>Postcode:</strong> {client.postcode}</div>
              )}
               {client.howHeardAboutServices && (
                 <div className="pt-2">
                    <strong className="flex items-center"><Info className="mr-2 h-4 w-4 text-muted-foreground"/>How heard about services:</strong>
                    <p className="mt-1 text-muted-foreground">{client.howHeardAboutServices}</p>
                </div>
               )}
               <div className="pt-2">
                  <strong className="flex items-center"><FileText className="mr-2 h-4 w-4 text-muted-foreground"/>Initial Submission Date:</strong>
                  <p className="mt-1 text-muted-foreground">{client.submissionDate ? format(new Date(client.submissionDate), 'PPP p') : 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          {isLoadingBrief && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Loading Behavioural Brief...</CardTitle></CardHeader>
              <CardContent><Loader2 className="h-6 w-6 animate-spin text-primary" /></CardContent>
            </Card>
          )}
          {!isLoadingBrief && behaviouralBrief && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <BookOpen className="mr-2 h-5 w-5 text-primary" /> Behavioural Brief for {behaviouralBrief.dogName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><strong>Dog's Name:</strong> {behaviouralBrief.dogName}</div>
                <div><strong>Breed:</strong> {behaviouralBrief.dogBreed}</div>
                <div><strong>Sex:</strong> {behaviouralBrief.dogSex}</div>
                {behaviouralBrief.lifeWithDogAndHelpNeeded && (
                  <div>
                    <strong className="flex items-center"><MessageSquare className="mr-2 h-4 w-4 text-muted-foreground"/>Life with Dog & Help Needed:</strong>
                    <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{behaviouralBrief.lifeWithDogAndHelpNeeded}</p>
                  </div>
                )}
                {behaviouralBrief.bestOutcome && (
                  <div className="pt-2">
                    <strong className="flex items-center"><Target className="mr-2 h-4 w-4 text-muted-foreground"/>Best Outcome Desired:</strong>
                    <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{behaviouralBrief.bestOutcome}</p>
                  </div>
                )}
                {behaviouralBrief.idealSessionTypes && behaviouralBrief.idealSessionTypes.length > 0 && (
                   <div className="pt-2">
                    <strong className="flex items-center"><HelpingHand className="mr-2 h-4 w-4 text-muted-foreground"/>Ideal Session Types:</strong>
                    <ul className="list-disc list-inside mt-1 text-muted-foreground">
                      {behaviouralBrief.idealSessionTypes.map(type => <li key={type}>{type}</li>)}
                    </ul>
                  </div>
                )}
                 <div className="pt-2">
                    <strong className="flex items-center"><FileText className="mr-2 h-4 w-4 text-muted-foreground"/>Brief Submission Date:</strong>
                    <p className="mt-1 text-muted-foreground">{behaviouralBrief.submissionDate ? format(new Date(behaviouralBrief.submissionDate), 'PPP p') : 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          )}
          {!isLoadingBrief && !behaviouralBrief && client.behaviouralBriefId && (
             <Card>
                <CardHeader><CardTitle className="text-lg">Behavioural Brief Not Found</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">The associated behavioural brief could not be loaded.</p></CardContent>
             </Card>
          )}

          {isLoadingQuestionnaire && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Loading Behaviour Questionnaire...</CardTitle></CardHeader>
              <CardContent><Loader2 className="h-6 w-6 animate-spin text-primary" /></CardContent>
            </Card>
          )}
          {!isLoadingQuestionnaire && behaviourQuestionnaire && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <IconFileQuestion className="mr-2 h-5 w-5 text-primary" /> Behaviour Questionnaire for {behaviourQuestionnaire.dogName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><strong>Dog's Name:</strong> {behaviourQuestionnaire.dogName} ({behaviourQuestionnaire.dogAge}, {behaviourQuestionnaire.dogSex})</div>
                <div><strong>Breed:</strong> {behaviourQuestionnaire.dogBreed}</div>
                <div><strong>Neutered/Spayed Details:</strong> {behaviourQuestionnaire.neuteredSpayedDetails}</div>
                {behaviourQuestionnaire.mainProblem && <div><strong>Main Problem:</strong> <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{behaviourQuestionnaire.mainProblem}</p></div>}
                {behaviourQuestionnaire.idealTrainingOutcome && <div className="pt-2"><strong>Ideal Outcome:</strong> <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{behaviourQuestionnaire.idealTrainingOutcome}</p></div>}
                {behaviourQuestionnaire.sociabilityWithDogs && <div className="pt-2"><strong>Sociability with Dogs:</strong> {behaviourQuestionnaire.sociabilityWithDogs}</div>}
                {behaviourQuestionnaire.sociabilityWithPeople && <div className="pt-2"><strong>Sociability with People:</strong> {behaviourQuestionnaire.sociabilityWithPeople}</div>}
                 <div className="pt-2">
                    <strong className="flex items-center"><FileText className="mr-2 h-4 w-4 text-muted-foreground"/>Questionnaire Submission Date:</strong>
                    <p className="mt-1 text-muted-foreground">{behaviourQuestionnaire.submissionDate ? format(new Date(behaviourQuestionnaire.submissionDate), 'PPP p') : 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          )}
           {!isLoadingQuestionnaire && !behaviourQuestionnaire && client.behaviourQuestionnaireId && (
             <Card>
                <CardHeader><CardTitle className="text-lg">Behaviour Questionnaire Not Found</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">The associated behaviour questionnaire could not be loaded.</p></CardContent>
             </Card>
          )}

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
                          <span className="text-muted-foreground"> with {session.dogName} at {session.time}</span>
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
  const [isSubmittingForm, setIsSubmittingForm] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSessions, setClientSessions] = useState<Session[]>([]);
  
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { toast } = useToast();

  const addClientForm = useForm<InternalClientFormValues>({
    resolver: zodResolver(internalClientFormSchema),
     defaultValues: {
      ownerFirstName: '',
      ownerLastName: '',
      contactEmail: '',
      contactNumber: '',
      postcode: '',
      dogName: '',
      isMember: false,
      submissionDate: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    }
  });

  const editClientForm = useForm<InternalClientFormValues>({
    resolver: zodResolver(internalClientFormSchema),
    defaultValues: {
      ownerFirstName: '',
      ownerLastName: '',
      contactEmail: '',
      contactNumber: '',
      postcode: '',
      dogName: '',
      isMember: false,
    }
  });


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

  useEffect(() => {
    if (!selectedClient) {
      fetchClients();
    }
  }, [selectedClient]); 

  useEffect(() => {
    if (clientToEdit) {
      editClientForm.reset({
        ownerFirstName: clientToEdit.ownerFirstName,
        ownerLastName: clientToEdit.ownerLastName,
        contactEmail: clientToEdit.contactEmail,
        contactNumber: clientToEdit.contactNumber,
        postcode: clientToEdit.postcode,
        dogName: clientToEdit.dogName || '',
        isMember: clientToEdit.isMember || false,
        submissionDate: clientToEdit.submissionDate, 
      });
    }
  }, [clientToEdit, editClientForm]);

  const handleAddClient: SubmitHandler<InternalClientFormValues> = async (data) => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      toast({ title: "Firebase Not Configured", description: "Firebase project ID is missing. Cannot add client.", variant: "destructive" });
      return;
    }
    setIsSubmittingForm(true);
    try {
      const clientDataForFirestore: Omit<Client, 'id' | 'behaviouralBriefId' | 'behaviourQuestionnaireId' | 'address' | 'howHeardAboutServices' | 'lastSession' | 'nextSession' | 'createdAt'> & { dogName?: string; isMember?: boolean, submissionDate?: string } = {
        ownerFirstName: data.ownerFirstName,
        ownerLastName: data.ownerLastName,
        contactEmail: data.contactEmail,
        contactNumber: data.contactNumber,
        postcode: data.postcode,
        dogName: data.dogName || undefined,
        isMember: data.isMember || false,
        submissionDate: data.submissionDate || format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      };
      const newClient = await fbAddClient(clientDataForFirestore);
      setClients(prevClients => [...prevClients, newClient].sort((a, b) => (a.ownerLastName > b.ownerLastName) ? 1 : (a.ownerLastName === b.ownerLastName ? ((a.ownerFirstName > b.ownerFirstName) ? 1: -1) : -1)));
      toast({ title: "Client Added", description: `${newClient.ownerFirstName} ${newClient.ownerLastName} has been successfully added.` });
      addClientForm.reset({ ownerFirstName: '', ownerLastName: '', contactEmail: '', contactNumber: '', postcode: '', dogName: '', isMember: false, submissionDate: format(new Date(), "yyyy-MM-dd HH:mm:ss")});
      setIsAddClientModalOpen(false);
    } catch (err) {
      console.error("Error adding client to Firestore:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to add client.";
      toast({ title: "Error Adding Client", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleUpdateClient: SubmitHandler<InternalClientFormValues> = async (data) => {
    if (!clientToEdit) return;
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      toast({ title: "Firebase Not Configured", description: "Firebase project ID is missing. Cannot update client.", variant: "destructive" });
      return;
    }
    setIsSubmittingForm(true);
    try {
      const updatedData: EditableClientData = {
        ownerFirstName: data.ownerFirstName,
        ownerLastName: data.ownerLastName,
        contactEmail: data.contactEmail,
        contactNumber: data.contactNumber,
        postcode: data.postcode,
        dogName: data.dogName || undefined,
        isMember: data.isMember || false,
      };
      await updateClientInFirestore(clientToEdit.id, updatedData);
      
      const updatedClients = clients.map(c => 
        c.id === clientToEdit.id ? { ...c, ...updatedData, dogName: updatedData.dogName || c.dogName } : c
      ).sort((a, b) => (a.ownerLastName > b.ownerLastName) ? 1 : (a.ownerLastName === b.ownerLastName ? ((a.ownerFirstName > b.ownerFirstName) ? 1: -1) : -1));
      setClients(updatedClients);
      
      toast({ title: "Client Updated", description: `${data.ownerFirstName} ${data.ownerLastName} has been successfully updated.` });
      setIsEditSheetOpen(false);

      if (selectedClient && selectedClient.id === clientToEdit.id) {
        setSelectedClient(updatedClients.find(c => c.id === clientToEdit.id) || null);
      }
      setClientToEdit(null);

    } catch (err) {
      console.error("Error updating client in Firestore:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to update client.";
      toast({ title: "Error Updating Client", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmittingForm(false);
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
  
  const openEditSheet = (client: Client) => {
    setClientToEdit(client);
    setIsEditSheetOpen(true);
  };

  const handleDeleteRequest = (client: Client | null) => {
    if (!client) return;
    setClientToDelete(client);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDeleteClient = async () => {
    if (!clientToDelete) return;
    setIsSubmittingForm(true); 
    try {
      await deleteClientFromFirestore(clientToDelete.id);
      setClients(prevClients => prevClients.filter(c => c.id !== clientToDelete.id));
      toast({ title: "Client Deleted", description: `${clientToDelete.ownerFirstName} ${clientToDelete.ownerLastName} has been successfully deleted.` });
      if (selectedClient && selectedClient.id === clientToDelete.id) {
         setSelectedClient(null); 
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete client.";
      toast({ title: "Error Deleting Client", description: errorMessage, variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setClientToDelete(null);
      setIsSubmittingForm(false);
    }
  };
  
  if (selectedClient) {
    return <ClientDetailView client={selectedClient} sessions={clientSessions} onBack={handleBackToList} onEdit={openEditSheet} onDelete={handleDeleteRequest} />;
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
              <DialogTitle>Add New Client (Quick Add)</DialogTitle>
              <DialogDescription>
                Add essential contact and dog information. Full details can be submitted via public forms.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={addClientForm.handleSubmit(handleAddClient)} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-ownerFirstName" className="text-right">First Name</Label>
                <div className="col-span-3">
                  <Input id="add-ownerFirstName" {...addClientForm.register("ownerFirstName")} className={addClientForm.formState.errors.ownerFirstName ? "border-destructive" : ""} disabled={isSubmittingForm} />
                  {addClientForm.formState.errors.ownerFirstName && <p className="text-xs text-destructive mt-1">{addClientForm.formState.errors.ownerFirstName.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-ownerLastName" className="text-right">Last Name</Label>
                <div className="col-span-3">
                  <Input id="add-ownerLastName" {...addClientForm.register("ownerLastName")} className={addClientForm.formState.errors.ownerLastName ? "border-destructive" : ""} disabled={isSubmittingForm} />
                  {addClientForm.formState.errors.ownerLastName && <p className="text-xs text-destructive mt-1">{addClientForm.formState.errors.ownerLastName.message}</p>}
                </div>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-dogName" className="text-right">Dog's Name</Label>
                <div className="col-span-3">
                  <Input id="add-dogName" {...addClientForm.register("dogName")} className={addClientForm.formState.errors.dogName ? "border-destructive" : ""} disabled={isSubmittingForm}/>
                  {addClientForm.formState.errors.dogName && <p className="text-xs text-destructive mt-1">{addClientForm.formState.errors.dogName.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-contactEmail" className="text-right">Email</Label>
                <div className="col-span-3">
                  <Input id="add-contactEmail" type="email" {...addClientForm.register("contactEmail")} className={addClientForm.formState.errors.contactEmail ? "border-destructive" : ""} disabled={isSubmittingForm}/>
                  {addClientForm.formState.errors.contactEmail && <p className="text-xs text-destructive mt-1">{addClientForm.formState.errors.contactEmail.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-contactNumber" className="text-right">Number</Label>
                <div className="col-span-3">
                  <Input id="add-contactNumber" type="tel" {...addClientForm.register("contactNumber")} className={addClientForm.formState.errors.contactNumber ? "border-destructive" : ""} disabled={isSubmittingForm}/>
                  {addClientForm.formState.errors.contactNumber && <p className="text-xs text-destructive mt-1">{addClientForm.formState.errors.contactNumber.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-postcode" className="text-right">Postcode</Label>
                <div className="col-span-3">
                  <Input id="add-postcode" {...addClientForm.register("postcode")} className={addClientForm.formState.errors.postcode ? "border-destructive" : ""} disabled={isSubmittingForm}/>
                  {addClientForm.formState.errors.postcode && <p className="text-xs text-destructive mt-1">{addClientForm.formState.errors.postcode.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="add-isMember" className="text-right pt-2">Is Member?</Label>
                <div className="col-span-3 flex items-center">
                   <Controller
                    name="isMember"
                    control={addClientForm.control}
                    render={({ field }) => (
                      <Checkbox
                        id="add-isMember"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmittingForm}
                        className="mr-2"
                      />
                    )}
                  />
                  <span className="text-sm text-muted-foreground">Tick if this client is a member.</span>
                </div>
              </div>
              <input type="hidden" {...addClientForm.register("submissionDate")} />
              <DialogFooter>
                <DialogClose asChild>
                   <Button type="button" variant="outline" disabled={isSubmittingForm}>Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmittingForm}>
                  {isSubmittingForm && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Client
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="shadow-lg">
        {/* CardHeader removed as per user request */}
        <CardContent className="pt-6"> {/* Added pt-6 to compensate for removed CardHeader */}
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
              No clients found. Add a new client or submit a form.
              {!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && " (Firebase may not be configured)"}
            </p>
          )}
          {!isLoading && !error && clients.length > 0 && (
            <div className="space-y-2"> {/* Reduced space-y for a tighter list */}
              {clients.map((client) => (
                <div 
                  key={client.id} 
                  onClick={() => handleRowClick(client)} 
                  className="p-4 rounded-md border bg-card hover:bg-muted/50 transition-colors shadow-sm cursor-pointer flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    {client.isMember && (
                      <Image
                        src="https://placehold.co/32x32.png" // Using a 32x32 placeholder
                        alt="Member Logo"
                        width={32}
                        height={32}
                        className="rounded-md"
                        data-ai-hint="company logo"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-base">{client.ownerFirstName} {client.ownerLastName}</h3>
                      {client.dogName && (
                        <p className="text-sm text-muted-foreground">{client.dogName}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={(e) => {e.stopPropagation(); openEditSheet(client);}}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Contact
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {e.stopPropagation(); alert('Schedule session functionality to be implemented.');}}>
                          <IconCalendarDays className="mr-2 h-4 w-4" />
                          Schedule Session
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:bg-destructive focus:text-destructive-foreground data-[highlighted]:bg-destructive data-[highlighted]:text-destructive-foreground"
                          onClick={(e) => {e.stopPropagation(); handleDeleteRequest(client);}}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Client
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Client Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit Client: {clientToEdit?.ownerFirstName} {clientToEdit?.ownerLastName}</SheetTitle>
            <SheetDescription>
              Update the client's contact information and details.
            </SheetDescription>
          </SheetHeader>
          {clientToEdit && (
            <form onSubmit={editClientForm.handleSubmit(handleUpdateClient)} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-ownerFirstName">First Name</Label>
                <Input id="edit-ownerFirstName" {...editClientForm.register("ownerFirstName")} className={editClientForm.formState.errors.ownerFirstName ? "border-destructive" : ""} disabled={isSubmittingForm} />
                {editClientForm.formState.errors.ownerFirstName && <p className="text-xs text-destructive mt-1">{editClientForm.formState.errors.ownerFirstName.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-ownerLastName">Last Name</Label>
                <Input id="edit-ownerLastName" {...editClientForm.register("ownerLastName")} className={editClientForm.formState.errors.ownerLastName ? "border-destructive" : ""} disabled={isSubmittingForm} />
                {editClientForm.formState.errors.ownerLastName && <p className="text-xs text-destructive mt-1">{editClientForm.formState.errors.ownerLastName.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-dogName">Dog's Name</Label>
                <Input id="edit-dogName" {...editClientForm.register("dogName")} className={editClientForm.formState.errors.dogName ? "border-destructive" : ""} disabled={isSubmittingForm}/>
                {editClientForm.formState.errors.dogName && <p className="text-xs text-destructive mt-1">{editClientForm.formState.errors.dogName.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-contactEmail">Email</Label>
                <Input id="edit-contactEmail" type="email" {...editClientForm.register("contactEmail")} className={editClientForm.formState.errors.contactEmail ? "border-destructive" : ""} disabled={isSubmittingForm}/>
                {editClientForm.formState.errors.contactEmail && <p className="text-xs text-destructive mt-1">{editClientForm.formState.errors.contactEmail.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-contactNumber">Number</Label>
                <Input id="edit-contactNumber" type="tel" {...editClientForm.register("contactNumber")} className={editClientForm.formState.errors.contactNumber ? "border-destructive" : ""} disabled={isSubmittingForm}/>
                {editClientForm.formState.errors.contactNumber && <p className="text-xs text-destructive mt-1">{editClientForm.formState.errors.contactNumber.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-postcode">Postcode</Label>
                <Input id="edit-postcode" {...editClientForm.register("postcode")} className={editClientForm.formState.errors.postcode ? "border-destructive" : ""} disabled={isSubmittingForm}/>
                {editClientForm.formState.errors.postcode && <p className="text-xs text-destructive mt-1">{editClientForm.formState.errors.postcode.message}</p>}
              </div>
              <div className="flex items-center space-x-2 pt-2">
                 <Controller
                  name="isMember"
                  control={editClientForm.control}
                  render={({ field }) => (
                    <Checkbox
                      id="edit-isMember"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmittingForm}
                    />
                  )}
                />
                <Label htmlFor="edit-isMember" className="text-sm font-normal">Is Member?</Label>
              </div>
              <SheetFooter className="mt-4">
                <SheetClose asChild>
                   <Button type="button" variant="outline" disabled={isSubmittingForm}>Cancel</Button>
                </SheetClose>
                <Button type="submit" disabled={isSubmittingForm}>
                  {isSubmittingForm && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </SheetFooter>
            </form>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the client
              "{clientToDelete?.ownerFirstName} {clientToDelete?.ownerLastName}" and all associated data from Firestore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setClientToDelete(null); setIsDeleteDialogOpen(false);}} disabled={isSubmittingForm}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteClient} className="bg-destructive hover:bg-destructive/90" disabled={isSubmittingForm}>
              {isSubmittingForm && clientToDelete ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
    

