
"use client";

import { useState, useEffect } from 'react';
import type { Client, Session, BehaviouralBrief, BehaviourQuestionnaire } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, MoreHorizontal, Loader2, User, Dog, Mail, Phone, Home, Info, ListChecks, FileText, Activity, CheckSquare, Users as IconUsers, ShieldQuestion, MessageSquare, Target, HelpingHand, BookOpen, MapPin, FileQuestion as IconFileQuestion, ArrowLeft, PawPrint, ShieldCheck, CalendarDays as IconCalendarDays } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox'; // Added Checkbox import
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
import { getClients, addClientToFirestore as fbAddClient, getBehaviouralBriefByBriefId, getBehaviourQuestionnaireById } from '@/lib/firebase'; 
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
}

function ClientDetailView({ client, sessions, onBack }: ClientDetailViewProps) {
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
            {client.isMember && <ShieldCheck className="h-7 w-7 text-primary" />}
            <h2 className="text-2xl font-bold tracking-tight">
            {client.ownerFirstName} {client.ownerLastName}
            </h2>
        </div>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Client List
        </Button>
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
              <div><strong>Membership:</strong> {client.isMember ? <Badge variant="default">Active</Badge> : <Badge variant="outline">Not Active</Badge>}</div>
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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSessions, setClientSessions] = useState<Session[]>([]);

  const { toast } = useToast();

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<InternalClientFormValues>({
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
      const clientDataForFirestore: Omit<Client, 'id' | 'behaviouralBriefId' | 'behaviourQuestionnaireId' | 'address' | 'howHeardAboutServices' | 'lastSession' | 'nextSession' | 'createdAt'> & { dogName?: string; isMember?: boolean } = {
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
      toast({
        title: "Client Added",
        description: `${newClient.ownerFirstName} ${newClient.ownerLastName} has been successfully added.`,
      });
      reset({ ownerFirstName: '', ownerLastName: '', contactEmail: '', contactNumber: '', postcode: '', dogName: '', isMember: false, submissionDate: format(new Date(), "yyyy-MM-dd HH:mm:ss")});
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
              <DialogTitle>Add New Client (Quick Add)</DialogTitle>
              <DialogDescription>
                Add essential contact and dog information. Full details can be submitted via public forms.
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
                <Label htmlFor="dogName" className="text-right">Dog's Name</Label>
                <div className="col-span-3">
                  <Input id="dogName" {...register("dogName")} className={errors.dogName ? "border-destructive" : ""} disabled={isSubmitting}/>
                  {errors.dogName && <p className="text-xs text-destructive mt-1">{errors.dogName.message}</p>}
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
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="isMember" className="text-right pt-2">Is Member?</Label>
                <div className="col-span-3 flex items-center">
                   <Controller
                    name="isMember"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="isMember"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                        className="mr-2"
                      />
                    )}
                  />
                  <span className="text-sm text-muted-foreground">Tick if this client is a member.</span>
                </div>
              </div>
              <input type="hidden" {...register("submissionDate")} />
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
          <CardDescription>Manage your clients. Click an item to view details.</CardDescription>
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
              No clients found. Add a new client or submit a form.
              {!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && " (Firebase may not be configured)"}
            </p>
          )}
          {!isLoading && !error && clients.length > 0 && (
            <div className="space-y-4">
              {clients.map((client) => (
                <div 
                  key={client.id} 
                  onClick={() => handleRowClick(client)} 
                  className="p-4 rounded-md border bg-card hover:bg-muted/50 transition-colors shadow-sm cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        {client.isMember && <ShieldCheck className="h-5 w-5 text-primary" />}
                        <h3 className="font-semibold text-base">{client.ownerFirstName} {client.ownerLastName}</h3>
                      </div>
                      {client.dogName && (
                        <p className="text-sm text-muted-foreground flex items-center mt-1">
                          <PawPrint className="inline-block mr-1.5 h-4 w-4" />
                          {client.dogName}
                        </p>
                      )}
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
                          <DropdownMenuItem onClick={(e) => {e.stopPropagation(); alert('Edit client functionality to be implemented.');}}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Contact
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {e.stopPropagation(); alert('Schedule session functionality to be implemented.');}}>
                            <IconCalendarDays className="mr-2 h-4 w-4" />
                            Schedule Session
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive hover:!bg-destructive/10" onClick={(e) => {e.stopPropagation(); alert('Delete client functionality to be implemented.');}}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Client
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                      <span className="mr-4">Email: {client.contactEmail}</span>
                      <span>Phone: {client.contactNumber}</span>
                  </div>
                   <div className="mt-1 text-xs">
                        <Badge variant={client.behaviouralBriefId ? "default" : "outline"} className="mr-2">
                            Brief: {client.behaviouralBriefId ? "Yes" : "No"}
                        </Badge>
                        <Badge variant={client.behaviourQuestionnaireId ? "default" : "outline"}>
                            Questionnaire: {client.behaviourQuestionnaireId ? "Yes" : "No"}
                        </Badge>
                   </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
