
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Client, Session, BehaviouralBrief, BehaviourQuestionnaire, Address } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, MoreHorizontal, Loader2, User, Dog, Mail, Phone, Home, Info, ListChecks, FileText, Activity, CheckSquare, Users as IconUsers, ShieldQuestion, MessageSquare, Target, HelpingHand, BookOpen, MapPin, FileQuestion as IconFileQuestion, ArrowLeft, PawPrint, ShieldCheck, CalendarDays as IconCalendarDays, X, BadgeCheck, SquareCheck, Eye, Filter } from 'lucide-react';
import Image from 'next/image';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
import { 
  getClients, 
  addClientToFirestore as fbAddClient, 
  deleteClientFromFirestore, 
  getBehaviouralBriefByBriefId, 
  getBehaviourQuestionnaireById, 
  updateClientInFirestore, 
  getSessionsFromFirestore,
  type EditableClientData 
} from '@/lib/firebase';
import { format, parseISO, isValid } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { cn, formatFullNameAndDogName } from '@/lib/utils';


const internalClientFormSchema = z.object({
  ownerFirstName: z.string().min(1, { message: "First name is required." }),
  ownerLastName: z.string().min(1, { message: "Last name is required." }),
  contactEmail: z.string().email({ message: "Invalid email address." }),
  contactNumber: z.string().min(5, { message: "Contact number is required." }),
  postcode: z.string().min(3, { message: "Postcode is required." }),
  dogName: z.string().optional(),
  isMember: z.boolean().optional(),
  isActive: z.boolean().optional(),
  submissionDate: z.string().optional(), 
});

type InternalClientFormValues = z.infer<typeof internalClientFormSchema>;

type SheetViewMode = 'clientInfo' | 'behaviouralBrief' | 'behaviourQuestionnaire';
type MemberFilterType = 'all' | 'members' | 'nonMembers';


export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [allSessions, setAllSessions] = useState<Session[]>([]); 
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmittingForm, setIsSubmittingForm] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);

  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  const [clientForViewSheet, setClientForViewSheet] = useState<Client | null>(null);
  const [sheetViewMode, setSheetViewMode] = useState<SheetViewMode>('clientInfo');
  
  const [briefForSheet, setBriefForSheet] = useState<BehaviouralBrief | null>(null);
  const [isLoadingBriefForSheet, setIsLoadingBriefForSheet] = useState<boolean>(false);
  
  const [questionnaireForSheet, setQuestionnaireForSheet] = useState<BehaviourQuestionnaire | null>(null);
  const [isLoadingQuestionnaireForSheet, setIsLoadingQuestionnaireForSheet] = useState<boolean>(false);
  
  const [clientSessionsForViewSheet, setClientSessionsForViewSheet] = useState<Session[]>([]);
  const [memberFilter, setMemberFilter] = useState<MemberFilterType>('all');

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
      isActive: true, 
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
      isActive: true,
    }
  });


  const fetchInitialData = async () => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      toast({
        title: "Firebase Not Configured",
        description: "Firebase project ID is missing. Cannot fetch data.",
        variant: "destructive",
      });
      setIsLoading(false);
      setClients([]);
      setAllSessions([]);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const [firestoreClients, firestoreSessions] = await Promise.all([
        getClients(),
        getSessionsFromFirestore()
      ]);
      setClients(firestoreClients.sort((a, b) => (a.ownerLastName > b.ownerLastName) ? 1 : (a.ownerLastName === b.ownerLastName ? ((a.ownerFirstName > b.ownerFirstName) ? 1: -1) : -1)));
      setAllSessions(firestoreSessions);
    } catch (err) {
      console.error("Error fetching data:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load data.";
      setError(errorMessage);
      toast({
        title: "Error Loading Data",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [toast]);

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
        isActive: clientToEdit.isActive === undefined ? true : clientToEdit.isActive,
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
      const clientDataForFirestore: Omit<Client, 'id' | 'behaviouralBriefId' | 'behaviourQuestionnaireId' | 'address' | 'howHeardAboutServices' | 'lastSession' | 'nextSession' | 'createdAt'> & { dogName?: string; isMember?: boolean; isActive?: boolean; submissionDate?: string } = {
        ownerFirstName: data.ownerFirstName,
        ownerLastName: data.ownerLastName,
        contactEmail: data.contactEmail,
        contactNumber: data.contactNumber,
        postcode: data.postcode,
        dogName: data.dogName || undefined,
        isMember: data.isMember || false,
        isActive: data.isActive === undefined ? true : data.isActive,
        submissionDate: data.submissionDate || format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      };
      const newClient = await fbAddClient(clientDataForFirestore);
      setClients(prevClients => [...prevClients, newClient].sort((a, b) => (a.ownerLastName > b.ownerLastName) ? 1 : (a.ownerLastName === b.ownerLastName ? ((a.ownerFirstName > b.ownerFirstName) ? 1: -1) : -1)));
      const ownerFullName = `${newClient.ownerFirstName} ${newClient.ownerLastName}`.trim();
      toast({ title: "Client Added", description: `${formatFullNameAndDogName(ownerFullName, newClient.dogName)} has been successfully added.` });
      addClientForm.reset({ ownerFirstName: '', ownerLastName: '', contactEmail: '', contactNumber: '', postcode: '', dogName: '', isMember: false, isActive: true, submissionDate: format(new Date(), "yyyy-MM-dd HH:mm:ss")});
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
        isActive: data.isActive === undefined ? true : data.isActive,
      };
      await updateClientInFirestore(clientToEdit.id, updatedData);

      const updatedClients = clients.map(c =>
        c.id === clientToEdit.id ? { ...c, ...updatedData, dogName: updatedData.dogName || c.dogName, isActive: updatedData.isActive } : c
      ).sort((a, b) => (a.ownerLastName > b.ownerLastName) ? 1 : (a.ownerLastName === b.ownerLastName ? ((a.ownerFirstName > b.ownerFirstName) ? 1: -1) : -1));
      setClients(updatedClients);
      
      const ownerFullName = `${data.ownerFirstName} ${data.ownerLastName}`.trim();
      toast({ title: "Client Updated", description: `${formatFullNameAndDogName(ownerFullName, data.dogName)} has been successfully updated.` });
      setIsEditSheetOpen(false);

      if (clientForViewSheet && clientForViewSheet.id === clientToEdit.id) {
        setClientForViewSheet(updatedClients.find(c => c.id === clientToEdit.id) || null);
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
      const ownerFullName = `${clientToDelete.ownerFirstName} ${clientToDelete.ownerLastName}`.trim();
      toast({ title: "Client Deleted", description: `${formatFullNameAndDogName(ownerFullName, clientToDelete.dogName)} has been successfully deleted.` });
      if (clientForViewSheet && clientForViewSheet.id === clientToDelete.id) {
         setClientForViewSheet(null);
         setIsViewSheetOpen(false);
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

  const handleClientRowClick = (client: Client) => {
    setClientForViewSheet(client);
    setSheetViewMode('clientInfo');
    setIsViewSheetOpen(true);
    
    const sessionsForThisClient = allSessions.filter(session => session.clientId === client.id)
                                .sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    setClientSessionsForViewSheet(sessionsForThisClient);
    
    setBriefForSheet(null);
    setQuestionnaireForSheet(null);
  };

  useEffect(() => {
    const fetchBriefForSheet = async () => {
      if (clientForViewSheet?.behaviouralBriefId && sheetViewMode === 'clientInfo' && !briefForSheet) { 
        setIsLoadingBriefForSheet(true);
        try {
          const brief = await getBehaviouralBriefByBriefId(clientForViewSheet.behaviouralBriefId);
          setBriefForSheet(brief);
        } catch (error) {
          console.error("Error fetching behavioural brief for sheet:", error);
          setBriefForSheet(null);
        } finally {
          setIsLoadingBriefForSheet(false);
        }
      }
    };
    fetchBriefForSheet();
  }, [clientForViewSheet, sheetViewMode, briefForSheet]);

  useEffect(() => {
    const fetchQuestionnaireForSheet = async () => {
      if (clientForViewSheet?.behaviourQuestionnaireId && sheetViewMode === 'clientInfo' && !questionnaireForSheet) { 
        setIsLoadingQuestionnaireForSheet(true);
        try {
          const q = await getBehaviourQuestionnaireById(clientForViewSheet.behaviourQuestionnaireId);
          setQuestionnaireForSheet(q);
        } catch (error) {
          console.error("Error fetching behaviour questionnaire for sheet:", error);
          setQuestionnaireForSheet(null);
        } finally {
          setIsLoadingQuestionnaireForSheet(false);
        }
      }
    };
    fetchQuestionnaireForSheet();
  }, [clientForViewSheet, sheetViewMode, questionnaireForSheet]);


  const handleViewBriefInSheet = async () => {
    if (!clientForViewSheet || !clientForViewSheet.behaviouralBriefId) return;
    if (!briefForSheet) setIsLoadingBriefForSheet(true); 
    try {
        if (!briefForSheet) { 
            const brief = await getBehaviouralBriefByBriefId(clientForViewSheet.behaviouralBriefId);
            setBriefForSheet(brief);
        }
        setSheetViewMode('behaviouralBrief');
    } catch (error) {
        toast({ title: "Error", description: "Could not load behavioural brief.", variant: "destructive" });
        console.error("Error fetching brief for sheet:", error);
    } finally {
        setIsLoadingBriefForSheet(false);
    }
  };

  const handleViewQuestionnaireInSheet = async () => {
    if (!clientForViewSheet || !clientForViewSheet.behaviourQuestionnaireId) return;
    if (!questionnaireForSheet) setIsLoadingQuestionnaireForSheet(true); 
    try {
        if (!questionnaireForSheet) {
            const q = await getBehaviourQuestionnaireById(clientForViewSheet.behaviourQuestionnaireId);
            setQuestionnaireForSheet(q);
        }
        setSheetViewMode('behaviourQuestionnaire');
    } catch (error) {
        toast({ title: "Error", description: "Could not load behaviour questionnaire.", variant: "destructive" });
        console.error("Error fetching questionnaire for sheet:", error);
    } finally {
        setIsLoadingQuestionnaireForSheet(false);
    }
  };

  const filteredClients = useMemo(() => {
    if (memberFilter === 'all') {
      return clients;
    } else if (memberFilter === 'members') {
      return clients.filter(client => client.isMember === true);
    } else { // nonMembers
      return clients.filter(client => client.isMember === false || client.isMember === undefined);
    }
  }, [clients, memberFilter]);


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Clients</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="memberFilter" className="text-sm font-medium">Show:</Label>
            <Select value={memberFilter} onValueChange={(value: MemberFilterType) => setMemberFilter(value)}>
              <SelectTrigger id="memberFilter" className="w-[180px] h-9">
                <SelectValue placeholder="Filter by membership" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                <SelectItem value="members">Members Only</SelectItem>
                <SelectItem value="nonMembers">Non-Members</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                 <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="add-isActive" className="text-right pt-2">Is Active?</Label>
                  <div className="col-span-3 flex items-center">
                     <Controller
                      name="isActive"
                      control={addClientForm.control}
                      render={({ field }) => (
                        <Checkbox
                          id="add-isActive"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmittingForm}
                          className="mr-2"
                        />
                      )}
                    />
                    <span className="text-sm text-muted-foreground">Untick if client is inactive.</span>
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
      </div>
      
      <div className="mt-0"> 
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
          {!isLoading && !error && filteredClients.length === 0 && (
            <p className="text-muted-foreground text-center py-10">
              No clients found for the current filter.
              {!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && " (Firebase may not be configured)"}
            </p>
          )}
          {!isLoading && !error && filteredClients.length > 0 && (
             <div className="space-y-0">
              {filteredClients.map((client) => {
                const ownerFullName = `${client.ownerFirstName} ${client.ownerLastName}`.trim();
                const displayName = formatFullNameAndDogName(ownerFullName, client.dogName);
                return (
                  <div
                    key={client.id}
                    onClick={() => handleClientRowClick(client)}
                    className="p-4 hover:bg-muted/50 transition-colors cursor-pointer flex justify-between items-center bg-card shadow-sm rounded-md mb-2"
                  >
                    <div className="flex items-center gap-3">
                      {client.isMember && (
                        <Image
                          src="https://iili.io/34300ox.md.jpg" 
                          alt="Member Icon"
                          width={32}
                          height={32}
                          className="rounded-md"
                          data-ai-hint="company logo"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold text-base">{displayName}</h3>
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
                );
              })}
            </div>
          )}
      </div>


      {/* Edit Client Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={(isOpen) => { setIsEditSheetOpen(isOpen); if(!isOpen) setClientToEdit(null);}}>
        <SheetContent className="sm:max-w-md w-[90vw] max-w-[500px]">
          <SheetHeader>
            <SheetTitle>Edit Client: {clientToEdit ? formatFullNameAndDogName(`${clientToEdit.ownerFirstName} ${clientToEdit.ownerLastName}`, clientToEdit.dogName) : ''}</SheetTitle>
            <SheetDescription>
              Update the client's contact information and details.
            </SheetDescription>
          </SheetHeader>
          {clientToEdit && (
            <ScrollArea className="h-[calc(100vh-150px)] pr-3">
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
              <div className="flex items-center space-x-2 pt-1">
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
               <div className="flex items-center space-x-2 pt-1">
                 <Controller
                  name="isActive"
                  control={editClientForm.control}
                  render={({ field }) => (
                    <Checkbox
                      id="edit-isActive"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmittingForm}
                    />
                  )}
                />
                <Label htmlFor="edit-isActive" className="text-sm font-normal">Is Active?</Label>
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
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {/* View Client Sheet */}
      <Sheet open={isViewSheetOpen} onOpenChange={(isOpen) => { setIsViewSheetOpen(isOpen); if (!isOpen) setClientForViewSheet(null); }}>
        <SheetContent className="sm:max-w-lg w-[90vw] max-w-[600px] p-0">
          {clientForViewSheet && (
            <>
              <SheetHeader className="p-6 border-b">
                <SheetTitle className="flex items-center">
                   {clientForViewSheet.isMember && (
                      <Image
                        src="https://iili.io/34300ox.md.jpg"
                        alt="Member Icon"
                        width={32}
                        height={32}
                        className="rounded-md mr-3"
                        data-ai-hint="company logo"
                      />
                    )}
                  {formatFullNameAndDogName(`${clientForViewSheet.ownerFirstName} ${clientForViewSheet.ownerLastName}`, clientForViewSheet.dogName)}
                </SheetTitle>
                <div className="flex flex-col space-y-1 text-sm">
                  <Badge variant={clientForViewSheet.isActive ? "default" : "secondary"} className="w-fit">
                    {clientForViewSheet.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-100px)]">
                <div className="p-6 space-y-6">
                  {sheetViewMode === 'clientInfo' && (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center"><IconUsers className="mr-2 h-5 w-5 text-primary" /> Contact Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground"/><strong>Email:</strong> <a href={`mailto:${clientForViewSheet.contactEmail}`} className="ml-1 hover:underline">{clientForViewSheet.contactEmail}</a></div>
                          <div className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground"/><strong>Number:</strong> <a href={`tel:${clientForViewSheet.contactNumber}`} className="ml-1 hover:underline">{clientForViewSheet.contactNumber}</a></div>
                          
                          {clientForViewSheet.address ? (
                            <div className="flex items-start"><MapPin className="mr-2 h-4 w-4 text-muted-foreground mt-0.5"/>
                              <strong>Address:</strong>
                              <div className="ml-1">
                                  {clientForViewSheet.address.addressLine1} <br />
                                  {clientForViewSheet.address.addressLine2 && <>{clientForViewSheet.address.addressLine2} <br /></>}
                                  {clientForViewSheet.address.city}, {clientForViewSheet.postcode} <br /> 
                                  {clientForViewSheet.address.country}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center"><Home className="mr-2 h-4 w-4 text-muted-foreground"/><strong>Postcode:</strong> {clientForViewSheet.postcode}</div>
                          )}

                          {clientForViewSheet.howHeardAboutServices && (
                            <div className="pt-2">
                                <strong className="flex items-center"><Info className="mr-2 h-4 w-4 text-muted-foreground"/>How heard about services:</strong>
                                <p className="mt-1 text-muted-foreground">{clientForViewSheet.howHeardAboutServices}</p>
                            </div>
                          )}
                           <div className="pt-2">
                              <strong className="flex items-center"><FileText className="mr-2 h-4 w-4 text-muted-foreground"/>Initial Submission:</strong>
                              <p className="mt-1 text-muted-foreground">{clientForViewSheet.submissionDate && isValid(parseISO(clientForViewSheet.submissionDate)) ? format(parseISO(clientForViewSheet.submissionDate), 'PPP p') : 'N/A'}</p>
                          </div>
                          <div className="pt-2">
                              <strong className="flex items-center"><ShieldCheck className="mr-2 h-4 w-4 text-muted-foreground"/>Membership:</strong>
                              <Badge variant={clientForViewSheet.isMember ? "default" : "outline"} className="ml-1">{clientForViewSheet.isMember ? "Active Member" : "Not a Member"}</Badge>
                          </div>
                           <div className="pt-2">
                              <strong className="flex items-center"><SquareCheck className="mr-2 h-4 w-4 text-muted-foreground"/>Status:</strong>
                              <Badge variant={clientForViewSheet.isActive ? "default" : "secondary"} className="ml-1">{clientForViewSheet.isActive ? "Active Client" : "Inactive Client"}</Badge>
                          </div>
                        </CardContent>
                      </Card>

                      {clientForViewSheet.behaviouralBriefId && (
                        <Button variant="outline" className="w-full" onClick={handleViewBriefInSheet} disabled={isLoadingBriefForSheet}>
                          {isLoadingBriefForSheet && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          View Behavioural Brief
                        </Button>
                      )}
                      {clientForViewSheet.behaviourQuestionnaireId && (
                        <Button variant="outline" className="w-full" onClick={handleViewQuestionnaireInSheet} disabled={isLoadingQuestionnaireForSheet}>
                           {isLoadingQuestionnaireForSheet && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          View Behaviour Questionnaire
                        </Button>
                      )}

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center"><Activity className="mr-2 h-5 w-5 text-primary" /> Session History</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {clientSessionsForViewSheet.length > 0 ? (
                            <ul className="space-y-3">
                              {clientSessionsForViewSheet.map(session => (
                                <li key={session.id} className="p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors text-sm">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <span className="font-semibold">
                                        {isValid(parseISO(session.date)) ? format(parseISO(session.date), 'PPP') : 'Invalid Date'}
                                      </span>
                                      <span className="text-muted-foreground"> at {session.time}</span>
                                    </div>
                                    <Badge variant={session.status === 'Scheduled' ? 'default' : session.status === 'Completed' ? 'secondary' : 'outline'}>
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
                    </>
                  )}

                  {sheetViewMode === 'behaviouralBrief' && briefForSheet && (
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg flex items-center"><BookOpen className="mr-2 h-5 w-5 text-primary" /> Behavioural Brief</CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => setSheetViewMode('clientInfo')} className="h-7 w-7">
                            <X className="h-4 w-4" />
                            <span className="sr-only">Back to Client Info</span>
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div><strong>Dog's Name:</strong> {briefForSheet.dogName}</div>
                        <div><strong>Breed:</strong> {briefForSheet.dogBreed}</div>
                        <div><strong>Sex:</strong> {briefForSheet.dogSex}</div>
                        {briefForSheet.lifeWithDogAndHelpNeeded && (
                          <div>
                            <strong className="flex items-center"><MessageSquare className="mr-2 h-4 w-4 text-muted-foreground"/>Life with Dog & Help Needed:</strong>
                            <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{briefForSheet.lifeWithDogAndHelpNeeded}</p>
                          </div>
                        )}
                        {briefForSheet.bestOutcome && (
                          <div className="pt-2">
                            <strong className="flex items-center"><Target className="mr-2 h-4 w-4 text-muted-foreground"/>Best Outcome Desired:</strong>
                            <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{briefForSheet.bestOutcome}</p>
                          </div>
                        )}
                        {briefForSheet.idealSessionTypes && briefForSheet.idealSessionTypes.length > 0 && (
                          <div className="pt-2">
                            <strong className="flex items-center"><HelpingHand className="mr-2 h-4 w-4 text-muted-foreground"/>Ideal Session Types:</strong>
                            <ul className="list-disc list-inside mt-1 text-muted-foreground">
                              {briefForSheet.idealSessionTypes.map(type => <li key={type}>{type}</li>)}
                            </ul>
                          </div>
                        )}
                        <div className="pt-2">
                            <strong className="flex items-center"><FileText className="mr-2 h-4 w-4 text-muted-foreground"/>Brief Submission Date:</strong>
                            <p className="mt-1 text-muted-foreground">{briefForSheet.submissionDate && isValid(parseISO(briefForSheet.submissionDate)) ? format(parseISO(briefForSheet.submissionDate), 'PPP p') : 'N/A'}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                   {sheetViewMode === 'behaviouralBrief' && !briefForSheet && !isLoadingBriefForSheet && (
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle className="text-lg">Behavioural Brief Not Found</CardTitle>
                           <Button variant="ghost" size="icon" onClick={() => setSheetViewMode('clientInfo')} className="h-7 w-7">
                                <X className="h-4 w-4" />
                                <span className="sr-only">Back to Client Info</span>
                            </Button>
                        </CardHeader>
                        <CardContent><p className="text-muted-foreground">The associated behavioural brief could not be loaded or does not exist.</p></CardContent>
                     </Card>
                  )}
                  {sheetViewMode === 'behaviouralBrief' && isLoadingBriefForSheet && (
                    <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Loading Brief...</p></div>
                  )}


                  {sheetViewMode === 'behaviourQuestionnaire' && questionnaireForSheet && (
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center"><IconFileQuestion className="mr-2 h-5 w-5 text-primary" /> Behaviour Questionnaire</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setSheetViewMode('clientInfo')} className="h-7 w-7">
                                <X className="h-4 w-4" />
                                <span className="sr-only">Back to Client Info</span>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div><strong>Dog's Name:</strong> {questionnaireForSheet.dogName} ({questionnaireForSheet.dogAge}, {questionnaireForSheet.dogSex})</div>
                            <div><strong>Breed:</strong> {questionnaireForSheet.dogBreed}</div>
                            <div><strong>Neutered/Spayed Details:</strong> {questionnaireForSheet.neuteredSpayedDetails}</div>
                            {questionnaireForSheet.mainProblem && <div className="pt-1"><strong>Main Problem:</strong> <p className="mt-0.5 text-muted-foreground whitespace-pre-wrap">{questionnaireForSheet.mainProblem}</p></div>}
                            {questionnaireForSheet.idealTrainingOutcome && <div className="pt-1"><strong>Ideal Outcome:</strong> <p className="mt-0.5 text-muted-foreground whitespace-pre-wrap">{questionnaireForSheet.idealTrainingOutcome}</p></div>}
                            {questionnaireForSheet.sociabilityWithDogs && <div className="pt-1"><strong>Sociability with Dogs:</strong> {questionnaireForSheet.sociabilityWithDogs}</div>}
                            {questionnaireForSheet.sociabilityWithPeople && <div className="pt-1"><strong>Sociability with People:</strong> {questionnaireForSheet.sociabilityWithPeople}</div>}
                            {/* Add more questionnaire fields here as needed */}
                            <div className="pt-2">
                                <strong className="flex items-center"><FileText className="mr-2 h-4 w-4 text-muted-foreground"/>Questionnaire Submission Date:</strong>
                                <p className="mt-1 text-muted-foreground">{questionnaireForSheet.submissionDate && isValid(parseISO(questionnaireForSheet.submissionDate)) ? format(parseISO(questionnaireForSheet.submissionDate), 'PPP p') : 'N/A'}</p>
                            </div>
                        </CardContent>
                     </Card>
                  )}
                  {sheetViewMode === 'behaviourQuestionnaire' && !questionnaireForSheet && !isLoadingQuestionnaireForSheet && (
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle className="text-lg">Behaviour Questionnaire Not Found</CardTitle>
                           <Button variant="ghost" size="icon" onClick={() => setSheetViewMode('clientInfo')} className="h-7 w-7">
                                <X className="h-4 w-4" />
                                <span className="sr-only">Back to Client Info</span>
                            </Button>
                        </CardHeader>
                        <CardContent><p className="text-muted-foreground">The associated behaviour questionnaire could not be loaded or does not exist.</p></CardContent>
                     </Card>
                  )}
                  {sheetViewMode === 'behaviourQuestionnaire' && isLoadingQuestionnaireForSheet && (
                    <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Loading Questionnaire...</p></div>
                  )}

                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>


      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the client
              "{clientToDelete ? formatFullNameAndDogName(`${clientToDelete.ownerFirstName} ${clientToDelete.ownerLastName}`, clientToDelete.dogName) : ""}" and all associated data from Firestore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setClientToDelete(null); setIsDeleteDialogOpen(false);}} disabled={isSubmittingForm}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteClient} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isSubmittingForm}>
              {isSubmittingForm && clientToDelete ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

