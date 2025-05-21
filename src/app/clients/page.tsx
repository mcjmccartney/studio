
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Client, Session, BehaviouralBrief, BehaviourQuestionnaire, Address } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, MoreHorizontal, Loader2, User, Dog, Mail, Phone, Home, Info, ListChecks, FileText, Activity, CheckSquare, Users as IconUsers, ShieldQuestion, MessageSquare, Target, HelpingHand, BookOpen, MapPin, FileQuestion as IconFileQuestion, ArrowLeft, PawPrint, ShieldCheck, CalendarDays as IconCalendarDays, X, BadgeCheck, SquareCheck, Eye, Filter, Search } from 'lucide-react';
import Image from 'next/image';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
  SheetTrigger,
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

// Schema for the internal "Add New Client" / "Edit Client" form
const internalClientFormSchema = z.object({
  ownerFirstName: z.string().min(1, { message: "First name is required." }),
  ownerLastName: z.string().min(1, { message: "Last name is required." }),
  dogName: z.string().optional(),
  contactEmail: z.string().email({ message: "Invalid email address." }),
  contactNumber: z.string().min(5, { message: "Contact number is required." }),
  postcode: z.string().min(3, { message: "Postcode is required." }),
  isMember: z.boolean().optional(),
  isActive: z.boolean().optional(),
  submissionDate: z.string().optional(), // Added for consistency, populated automatically
});
type InternalClientFormValues = z.infer<typeof internalClientFormSchema>;


type MemberFilterType = 'all' | 'members' | 'nonMembers';


export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [allSessions, setAllSessions] = useState<Session[]>([]); 
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmittingForm, setIsSubmittingForm] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isAddClientSheetOpen, setIsAddClientSheetOpen] = useState(false);

  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // State for View Client Sheet
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  const [clientForViewSheet, setClientForViewSheet] = useState<Client | null>(null);
  const [sheetViewMode, setSheetViewMode] = useState<'clientInfo' | 'behaviouralBrief' | 'behaviourQuestionnaire'>('clientInfo');
  
  const [briefForSheet, setBriefForSheet] = useState<BehaviouralBrief | null>(null);
  const [isLoadingBriefForSheet, setIsLoadingBriefForSheet] = useState<boolean>(false);
  
  const [questionnaireForSheet, setQuestionnaireForSheet] = useState<BehaviourQuestionnaire | null>(null);
  const [isLoadingQuestionnaireForSheet, setIsLoadingQuestionnaireForSheet] = useState<boolean>(false);
  
  const [clientSessionsForView, setClientSessionsForView] = useState<Session[]>([]);
  const [memberFilter, setMemberFilter] = useState<MemberFilterType>('all');

  const { toast } = useToast();

  const addClientForm = useForm<InternalClientFormValues>({
    resolver: zodResolver(internalClientFormSchema),
     defaultValues: {
      ownerFirstName: '',
      ownerLastName: '',
      dogName: '',
      contactEmail: '',
      contactNumber: '',
      postcode: '',
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
      dogName: '',
      contactEmail: '',
      contactNumber: '',
      postcode: '',
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
      setClients(firestoreClients.sort((a, b) => {
          const nameA = formatFullNameAndDogName(`${a.ownerFirstName} ${a.ownerLastName}`, a.dogName).toLowerCase();
          const nameB = formatFullNameAndDogName(`${b.ownerFirstName} ${b.ownerLastName}`, b.dogName).toLowerCase();
          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          return 0;
        }));
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
        dogName: clientToEdit.dogName || '',
        contactEmail: clientToEdit.contactEmail,
        contactNumber: clientToEdit.contactNumber,
        postcode: clientToEdit.postcode,
        isMember: clientToEdit.isMember || false,
        isActive: clientToEdit.isActive === undefined ? true : clientToEdit.isActive,
        submissionDate: clientToEdit.submissionDate, // Keep existing submissionDate
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
      // Prepare client data for Firestore, ensuring all relevant fields are included
      const clientDataForFirestore: Omit<Client, 'id' | 'behaviouralBriefId' | 'behaviourQuestionnaireId' | 'address' | 'howHeardAboutServices' | 'lastSession' | 'nextSession' | 'createdAt'> & { dogName?: string; isMember?: boolean; isActive?: boolean; submissionDate?: string } = {
        ownerFirstName: data.ownerFirstName,
        ownerLastName: data.ownerLastName,
        contactEmail: data.contactEmail,
        contactNumber: data.contactNumber,
        postcode: data.postcode,
        dogName: data.dogName || undefined, // Ensure it's undefined if empty
        isMember: data.isMember || false,
        isActive: data.isActive === undefined ? true : data.isActive,
        submissionDate: data.submissionDate || format(new Date(), "yyyy-MM-dd HH:mm:ss"), // Use form's date or new one
      };
      const newClient = await fbAddClient(clientDataForFirestore);
      setClients(prevClients => [...prevClients, newClient].sort((a, b) => {
          const nameA = formatFullNameAndDogName(`${a.ownerFirstName} ${a.ownerLastName}`, a.dogName).toLowerCase();
          const nameB = formatFullNameAndDogName(`${b.ownerFirstName} ${b.ownerLastName}`, b.dogName).toLowerCase();
          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          return 0;
        }));
      const ownerFullName = `${newClient.ownerFirstName} ${newClient.ownerLastName}`.trim();
      toast({ title: "Client Added", description: `${formatFullNameAndDogName(ownerFullName, newClient.dogName)} has been successfully added.` });
      addClientForm.reset({ ownerFirstName: '', ownerLastName: '', dogName: '', contactEmail: '', contactNumber: '', postcode: '', isMember: false, isActive: true, submissionDate: format(new Date(), "yyyy-MM-dd HH:mm:ss")});
      setIsAddClientSheetOpen(false);
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
        // address and howHeardAboutServices are not part of this form, so they are not updated here
      };
      await updateClientInFirestore(clientToEdit.id, updatedData);

      const updatedClients = clients.map(c =>
        c.id === clientToEdit.id ? { ...c, ...updatedData, dogName: updatedData.dogName || c.dogName, isActive: updatedData.isActive === undefined ? c.isActive : updatedData.isActive } : c
      ).sort((a, b) => {
          const nameA = formatFullNameAndDogName(`${a.ownerFirstName} ${a.ownerLastName}`, a.dogName).toLowerCase();
          const nameB = formatFullNameAndDogName(`${b.ownerFirstName} ${b.ownerLastName}`, b.dogName).toLowerCase();
          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          return 0;
        });
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

  const openViewSheet = (client: Client) => {
    setClientForViewSheet(client);
    setSheetViewMode('clientInfo'); 
    setIsViewSheetOpen(true);
    
    const sessionsForThisClient = allSessions.filter(session => session.clientId === client.id)
                                .sort((a,b) => {
                                    const dateA = parseISO(a.date);
                                    const dateB = parseISO(b.date);
                                    if (!isValid(dateA) && !isValid(dateB)) return 0;
                                    if (!isValid(dateA)) return 1;
                                    if (!isValid(dateB)) return -1;
                                    return dateB.getTime() - dateA.getTime();
                                });
    setClientSessionsForView(sessionsForThisClient);
    
    setBriefForSheet(null); 
    setQuestionnaireForSheet(null); 
  };

  const openBriefInSheet = async () => {
    if (!clientForViewSheet || !clientForViewSheet.behaviouralBriefId) return;
    setIsLoadingBriefForSheet(true);
    try {
      const brief = await getBehaviouralBriefByBriefId(clientForViewSheet.behaviouralBriefId);
      setBriefForSheet(brief);
      setSheetViewMode('behaviouralBrief');
    } catch (error) {
      console.error("Error fetching behavioural brief for sheet:", error);
      setBriefForSheet(null);
      toast({ title: "Error", description: "Could not load behavioural brief.", variant: "destructive" });
    } finally {
      setIsLoadingBriefForSheet(false);
    }
  };

  const openQuestionnaireInSheet = async () => {
    if (!clientForViewSheet || !clientForViewSheet.behaviourQuestionnaireId) return;
    setIsLoadingQuestionnaireForSheet(true);
    try {
      const q = await getBehaviourQuestionnaireById(clientForViewSheet.behaviourQuestionnaireId);
      setQuestionnaireForSheet(q);
      setSheetViewMode('behaviourQuestionnaire');
    } catch (error) {
      console.error("Error fetching behaviour questionnaire for sheet:", error);
      setQuestionnaireForSheet(null);
      toast({ title: "Error", description: "Could not load behaviour questionnaire.", variant: "destructive" });
    } finally {
      setIsLoadingQuestionnaireForSheet(false);
    }
  };


  const filteredClients = useMemo(() => {
    if (memberFilter === 'all') {
      return clients;
    } else if (memberFilter === 'members') {
      return clients.filter(client => client.isMember === true);
    } else { 
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
          <Sheet open={isAddClientSheetOpen} onOpenChange={setIsAddClientSheetOpen}>
            <SheetTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-5 w-5" />
                New Client
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md bg-card">
              <SheetHeader>
                <SheetTitle>New Client</SheetTitle>
                <SheetDescription>
                  Add essential contact and dog information.
                </SheetDescription>
              </SheetHeader>
              <form onSubmit={addClientForm.handleSubmit(handleAddClient)} className="space-y-4 py-4">
                <div>
                  <Label htmlFor="add-ownerFirstName">First Name</Label>
                  <Input id="add-ownerFirstName" {...addClientForm.register("ownerFirstName")} className={cn("mt-1", addClientForm.formState.errors.ownerFirstName ? "border-destructive" : "")} disabled={isSubmittingForm} />
                  {addClientForm.formState.errors.ownerFirstName && <p className="text-xs text-destructive mt-1">{addClientForm.formState.errors.ownerFirstName.message}</p>}
                </div>
                <div>
                  <Label htmlFor="add-ownerLastName">Last Name</Label>
                  <Input id="add-ownerLastName" {...addClientForm.register("ownerLastName")} className={cn("mt-1", addClientForm.formState.errors.ownerLastName ? "border-destructive" : "")} disabled={isSubmittingForm} />
                  {addClientForm.formState.errors.ownerLastName && <p className="text-xs text-destructive mt-1">{addClientForm.formState.errors.ownerLastName.message}</p>}
                </div>
                 <div>
                  <Label htmlFor="add-dogName">Dog's Name</Label>
                  <Input id="add-dogName" {...addClientForm.register("dogName")} className={cn("mt-1", addClientForm.formState.errors.dogName ? "border-destructive" : "")} disabled={isSubmittingForm}/>
                  {addClientForm.formState.errors.dogName && <p className="text-xs text-destructive mt-1">{addClientForm.formState.errors.dogName.message}</p>}
                </div>
                <div>
                  <Label htmlFor="add-contactEmail">Email</Label>
                  <Input id="add-contactEmail" type="email" {...addClientForm.register("contactEmail")} className={cn("mt-1", addClientForm.formState.errors.contactEmail ? "border-destructive" : "")} disabled={isSubmittingForm}/>
                  {addClientForm.formState.errors.contactEmail && <p className="text-xs text-destructive mt-1">{addClientForm.formState.errors.contactEmail.message}</p>}
                </div>
                <div>
                  <Label htmlFor="add-contactNumber">Number</Label>
                  <Input id="add-contactNumber" type="tel" {...addClientForm.register("contactNumber")} className={cn("mt-1", addClientForm.formState.errors.contactNumber ? "border-destructive" : "")} disabled={isSubmittingForm}/>
                  {addClientForm.formState.errors.contactNumber && <p className="text-xs text-destructive mt-1">{addClientForm.formState.errors.contactNumber.message}</p>}
                </div>
                <div>
                  <Label htmlFor="add-postcode">Postcode</Label>
                  <Input id="add-postcode" {...addClientForm.register("postcode")} className={cn("mt-1", addClientForm.formState.errors.postcode ? "border-destructive" : "")} disabled={isSubmittingForm}/>
                  {addClientForm.formState.errors.postcode && <p className="text-xs text-destructive mt-1">{addClientForm.formState.errors.postcode.message}</p>}
                </div>
                <div className="flex items-center space-x-2">
                   <Controller
                    name="isMember"
                    control={addClientForm.control}
                    render={({ field }) => (
                      <Checkbox
                        id="add-isMember"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmittingForm}
                      />
                    )}
                  />
                  <Label htmlFor="add-isMember" className="text-sm font-normal">Is Member?</Label>
                </div>
                 <div className="flex items-center space-x-2">
                   <Controller
                    name="isActive"
                    control={addClientForm.control}
                    render={({ field }) => (
                      <Checkbox
                        id="add-isActive"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmittingForm}
                      />
                    )}
                  />
                  <Label htmlFor="add-isActive" className="text-sm font-normal">Is Active?</Label>
                </div>
                <input type="hidden" {...addClientForm.register("submissionDate")} />
                <SheetFooter className="mt-4">
                  <SheetClose asChild>
                     <Button type="button" variant="outline" disabled={isSubmittingForm}>Cancel</Button>
                  </SheetClose>
                  <Button type="submit" disabled={isSubmittingForm}>
                    {isSubmittingForm && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Client
                  </Button>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
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
                const displayName = formatFullNameAndDogName(`${client.ownerFirstName} ${client.ownerLastName}`, client.dogName);
                return (
                  <div
                    key={client.id}
                    onClick={() => openViewSheet(client)}
                    className="bg-card shadow-sm rounded-md mb-2 px-4 py-2 hover:bg-muted/50 transition-colors cursor-pointer flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3">
                      {client.isMember && (
                        <Image
                          src="https://iili.io/34300ox.md.jpg" 
                          alt="Member Icon"
                          width={28}
                          height={28}
                          className="rounded-sm"
                          data-ai-hint="company logo"
                        />
                      )}
                      <div>
                        <h3 className="text-sm">{displayName}</h3>
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
        <SheetContent className="sm:max-w-md bg-card">
          <SheetHeader>
            <SheetTitle>Edit Client: {clientToEdit ? formatFullNameAndDogName(`${clientToEdit.ownerFirstName} ${clientToEdit.ownerLastName}`, clientToEdit.dogName) : ''}</SheetTitle>
            <SheetDescription>
              Update the client's contact information and details.
            </SheetDescription>
          </SheetHeader>
          {clientToEdit && (
            <ScrollArea className="max-h-[calc(100vh-150px)] pr-3 mt-4"> 
            <form onSubmit={editClientForm.handleSubmit(handleUpdateClient)} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-ownerFirstName" className="text-right">First Name</Label>
                <Input id="edit-ownerFirstName" {...editClientForm.register("ownerFirstName")} className={cn("col-span-3", editClientForm.formState.errors.ownerFirstName ? "border-destructive" : "")} disabled={isSubmittingForm} />
              </div>
              {editClientForm.formState.errors.ownerFirstName && <p className="col-span-4 text-xs text-destructive mt-1 text-right pr-1">{editClientForm.formState.errors.ownerFirstName.message}</p>}
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-ownerLastName" className="text-right">Last Name</Label>
                <Input id="edit-ownerLastName" {...editClientForm.register("ownerLastName")} className={cn("col-span-3", editClientForm.formState.errors.ownerLastName ? "border-destructive" : "")} disabled={isSubmittingForm} />
              </div>
              {editClientForm.formState.errors.ownerLastName && <p className="col-span-4 text-xs text-destructive mt-1 text-right pr-1">{editClientForm.formState.errors.ownerLastName.message}</p>}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-dogName" className="text-right">Dog's Name</Label>
                <Input id="edit-dogName" {...editClientForm.register("dogName")} className={cn("col-span-3", editClientForm.formState.errors.dogName ? "border-destructive" : "")} disabled={isSubmittingForm}/>
              </div>
              {editClientForm.formState.errors.dogName && <p className="col-span-4 text-xs text-destructive mt-1 text-right pr-1">{editClientForm.formState.errors.dogName.message}</p>}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-contactEmail" className="text-right">Email</Label>
                <Input id="edit-contactEmail" type="email" {...editClientForm.register("contactEmail")} className={cn("col-span-3", editClientForm.formState.errors.contactEmail ? "border-destructive" : "")} disabled={isSubmittingForm}/>
              </div>
              {editClientForm.formState.errors.contactEmail && <p className="col-span-4 text-xs text-destructive mt-1 text-right pr-1">{editClientForm.formState.errors.contactEmail.message}</p>}
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-contactNumber" className="text-right">Number</Label>
                <Input id="edit-contactNumber" type="tel" {...editClientForm.register("contactNumber")} className={cn("col-span-3", editClientForm.formState.errors.contactNumber ? "border-destructive" : "")} disabled={isSubmittingForm}/>
              </div>
              {editClientForm.formState.errors.contactNumber && <p className="col-span-4 text-xs text-destructive mt-1 text-right pr-1">{editClientForm.formState.errors.contactNumber.message}</p>}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-postcode" className="text-right">Postcode</Label>
                <Input id="edit-postcode" {...editClientForm.register("postcode")} className={cn("col-span-3", editClientForm.formState.errors.postcode ? "border-destructive" : "")} disabled={isSubmittingForm}/>
              </div>
              {editClientForm.formState.errors.postcode && <p className="col-span-4 text-xs text-destructive mt-1 text-right pr-1">{editClientForm.formState.errors.postcode.message}</p>}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-isMember" className="text-right col-span-1">Is Member?</Label>
                <div className="col-span-3 flex items-center">
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
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="edit-isActive" className="text-right col-span-1">Is Active?</Label>
                 <div className="col-span-3 flex items-center">
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
                </div>
              </div>
              <SheetFooter className="mt-4 col-span-4"> 
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
      <Sheet open={isViewSheetOpen} onOpenChange={(isOpen) => { setIsViewSheetOpen(isOpen); if (!isOpen) { setClientForViewSheet(null); setSheetViewMode('clientInfo');} }}>
        <SheetContent className="sm:max-w-lg bg-card">
          {clientForViewSheet && (
            <>
            {sheetViewMode === 'clientInfo' && (
                <>
                <SheetHeader>
                    <SheetTitle className="text-xl">
                        {clientForViewSheet.isMember && (
                            <Image
                            src="https://iili.io/34300ox.md.jpg"
                            alt="Member Icon"
                            width={28} 
                            height={28}
                            className="rounded-sm mr-3 inline-block align-middle"
                            data-ai-hint="company logo"
                            />
                        )}
                        {formatFullNameAndDogName(`${clientForViewSheet.ownerFirstName} ${clientForViewSheet.ownerLastName}`, clientForViewSheet.dogName)}
                    </SheetTitle>
                    <Badge variant={clientForViewSheet.isActive ? "default" : "secondary"} className="w-fit !mt-2">
                        <SquareCheck className="mr-1.5 h-3.5 w-3.5" />
                        {clientForViewSheet.isActive ? "Active Client" : "Inactive Client"}
                    </Badge>
                </SheetHeader>
                <ScrollArea className="max-h-[calc(100vh-250px)] pr-3 mt-2">
                    <div className="py-4 space-y-3">
                        <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1"><Label className="text-right font-semibold col-span-1">Email:</Label><div className="col-span-2 text-sm"><a href={`mailto:${clientForViewSheet.contactEmail}`} className="hover:underline">{clientForViewSheet.contactEmail}</a></div></div>
                        <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1"><Label className="text-right font-semibold col-span-1">Number:</Label><div className="col-span-2 text-sm"><a href={`tel:${clientForViewSheet.contactNumber}`} className="hover:underline">{clientForViewSheet.contactNumber}</a></div></div>
                        {clientForViewSheet.address ? (
                            <div className="grid grid-cols-3 items-start gap-x-4 gap-y-1">
                                <Label className="text-right font-semibold col-span-1 pt-0.5">Address:</Label>
                                <div className="col-span-2 text-sm">
                                    {clientForViewSheet.address.addressLine1} <br />
                                    {clientForViewSheet.address.addressLine2 && <>{clientForViewSheet.address.addressLine2} <br /></>}
                                    {clientForViewSheet.address.city}, {clientForViewSheet.postcode} <br /> 
                                    {clientForViewSheet.address.country}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1"><Label className="text-right font-semibold col-span-1">Postcode:</Label><div className="col-span-2 text-sm">{clientForViewSheet.postcode}</div></div>
                        )}
                        {clientForViewSheet.howHeardAboutServices && <div className="grid grid-cols-3 items-start gap-x-4 gap-y-1"><Label className="text-right font-semibold col-span-1 pt-0.5">How heard:</Label><div className="col-span-2 text-sm text-muted-foreground">{clientForViewSheet.howHeardAboutServices}</div></div>}
                        <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1"><Label className="text-right font-semibold col-span-1">Submitted:</Label><div className="col-span-2 text-sm text-muted-foreground">{clientForViewSheet.submissionDate && isValid(parseISO(clientForViewSheet.submissionDate)) ? format(parseISO(clientForViewSheet.submissionDate), 'PPP p') : 'N/A'}</div></div>
                        
                        {clientForViewSheet.behaviouralBriefId && <Button variant="outline" className="w-full mt-4" onClick={openBriefInSheet} disabled={isLoadingBriefForSheet}>{isLoadingBriefForSheet && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}View Behavioural Brief</Button>}
                        {clientForViewSheet.behaviourQuestionnaireId && <Button variant="outline" className="w-full mt-2" onClick={openQuestionnaireInSheet} disabled={isLoadingQuestionnaireForSheet}>{isLoadingQuestionnaireForSheet && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}View Behaviour Questionnaire</Button>}

                        <Card className="mt-4">
                            <CardHeader><CardTitle className="text-lg flex items-center"><Activity className="mr-2 h-5 w-5 text-primary" /> Session History</CardTitle></CardHeader>
                            <CardContent>
                                {clientSessionsForView.length > 0 ? (
                                <ul className="space-y-3">
                                    {clientSessionsForView.map(session => (
                                    <li key={session.id} className="p-3 rounded-md border bg-background hover:bg-muted/50 transition-colors text-sm">
                                        <div className="flex justify-between items-center"><div><span className="font-semibold">{isValid(parseISO(session.date)) ? format(parseISO(session.date), 'PPP') : 'Invalid Date'}</span><span className="text-muted-foreground"> at {session.time}</span></div><Badge variant={session.status === 'Scheduled' ? 'default' : session.status === 'Completed' ? 'secondary' : 'outline'}>{session.status}</Badge></div>
                                        {session.sessionType && <div className="text-xs text-muted-foreground mt-1">Type: {session.sessionType}</div>}
                                        {session.amount !== undefined && <div className="text-xs text-muted-foreground mt-0.5">Amount: £{session.amount.toFixed(2)}</div>}
                                        {session.notes && <p className="mt-1 text-xs text-muted-foreground">Notes: {session.notes}</p>}
                                    </li>))}
                                </ul>
                                ) : <p className="text-sm text-muted-foreground">No session history found for this client.</p>}
                            </CardContent>
                        </Card>
                    </div>
                </ScrollArea>
                <SheetFooter className="pt-4">
                  <Button variant="outline" onClick={() => {openEditSheet(clientForViewSheet)}}>Edit Contact</Button>
                  <Button variant="destructive" onClick={() => handleDeleteRequest(clientForViewSheet)}>Delete Client</Button>
                  <SheetClose asChild><Button variant="outline">Close</Button></SheetClose>
                </SheetFooter>
                </>
            )}
            {sheetViewMode === 'behaviouralBrief' && briefForSheet && (
                <>
                <SheetHeader className="flex flex-row justify-between items-center">
                    <SheetTitle className="text-xl flex items-center"><BookOpen className="mr-2 h-5 w-5 text-primary" /> Behavioural Brief</SheetTitle>
                    <Button variant="ghost" size="icon" onClick={() => setSheetViewMode('clientInfo')}><X className="h-4 w-4" /></Button>
                </SheetHeader>
                <SheetDescription>
                    {formatFullNameAndDogName(`${clientForViewSheet.ownerFirstName} ${clientForViewSheet.ownerLastName}`, briefForSheet.dogName)}
                </SheetDescription>
                <ScrollArea className="max-h-[calc(100vh-200px)] pr-3 mt-2">
                    <div className="py-4 space-y-3 text-sm">
                        <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1"><Label className="text-right font-semibold col-span-1">Dog's Name:</Label><div className="col-span-2">{briefForSheet.dogName}</div></div>
                        <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1"><Label className="text-right font-semibold col-span-1">Breed:</Label><div className="col-span-2">{briefForSheet.dogBreed}</div></div>
                        <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1"><Label className="text-right font-semibold col-span-1">Sex:</Label><div className="col-span-2">{briefForSheet.dogSex}</div></div>
                        {briefForSheet.lifeWithDogAndHelpNeeded && <div className="grid grid-cols-3 items-start gap-x-4 gap-y-1"><Label className="text-right font-semibold col-span-1 pt-0.5">Life & Help:</Label><div className="col-span-2 whitespace-pre-wrap text-muted-foreground">{briefForSheet.lifeWithDogAndHelpNeeded}</div></div>}
                        {briefForSheet.bestOutcome && <div className="grid grid-cols-3 items-start gap-x-4 gap-y-1"><Label className="text-right font-semibold col-span-1 pt-0.5">Best Outcome:</Label><div className="col-span-2 whitespace-pre-wrap text-muted-foreground">{briefForSheet.bestOutcome}</div></div>}
                        {briefForSheet.idealSessionTypes && briefForSheet.idealSessionTypes.length > 0 && <div className="grid grid-cols-3 items-start gap-x-4 gap-y-1"><Label className="text-right font-semibold col-span-1 pt-0.5">Ideal Sessions:</Label><div className="col-span-2"><ul className="list-disc list-inside text-muted-foreground">{briefForSheet.idealSessionTypes.map(type => <li key={type}>{type}</li>)}</ul></div></div>}
                        <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1 pt-2"><Label className="text-right font-semibold col-span-1">Submitted:</Label><div className="col-span-2 text-muted-foreground">{briefForSheet.submissionDate && isValid(parseISO(briefForSheet.submissionDate)) ? format(parseISO(briefForSheet.submissionDate), 'PPP p') : 'N/A'}</div></div>
                    </div>
                </ScrollArea>
                <SheetFooter className="pt-4"><Button variant="outline" onClick={() => setSheetViewMode('clientInfo')}>Back to Client Info</Button></SheetFooter>
                </>
            )}
            {sheetViewMode === 'behaviourQuestionnaire' && questionnaireForSheet && (
                <>
                <SheetHeader className="flex flex-row justify-between items-center">
                    <SheetTitle className="text-xl flex items-center"><IconFileQuestion className="mr-2 h-5 w-5 text-primary" /> Behaviour Questionnaire</SheetTitle>
                    <Button variant="ghost" size="icon" onClick={() => setSheetViewMode('clientInfo')}><X className="h-4 w-4" /></Button>
                </SheetHeader>
                <SheetDescription>{formatFullNameAndDogName(`${clientForViewSheet.ownerFirstName} ${clientForViewSheet.ownerLastName}`, questionnaireForSheet.dogName)}</SheetDescription>
                <ScrollArea className="max-h-[calc(100vh-200px)] pr-3 mt-2">
                    <div className="py-4 space-y-3 text-sm">
                        <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1"><Label className="text-right font-semibold col-span-1">Dog's Name:</Label><div className="col-span-2">{questionnaireForSheet.dogName} ({questionnaireForSheet.dogAge}, {questionnaireForSheet.dogSex})</div></div>
                        <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1"><Label className="text-right font-semibold col-span-1">Breed:</Label><div className="col-span-2">{questionnaireForSheet.dogBreed}</div></div>
                        {/* Add more fields here as needed from BehaviourQuestionnaire type for brevity */}
                        <div className="grid grid-cols-3 items-start gap-x-4 gap-y-1"><Label className="text-right font-semibold col-span-1 pt-0.5">Main Problem:</Label><div className="col-span-2 whitespace-pre-wrap text-muted-foreground">{questionnaireForSheet.mainProblem}</div></div>
                        <div className="grid grid-cols-3 items-start gap-x-4 gap-y-1"><Label className="text-right font-semibold col-span-1 pt-0.5">Ideal Outcome:</Label><div className="col-span-2 whitespace-pre-wrap text-muted-foreground">{questionnaireForSheet.idealTrainingOutcome}</div></div>
                        <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1 pt-2"><Label className="text-right font-semibold col-span-1">Submitted:</Label><div className="col-span-2 text-muted-foreground">{questionnaireForSheet.submissionDate && isValid(parseISO(questionnaireForSheet.submissionDate)) ? format(parseISO(questionnaireForSheet.submissionDate), 'PPP p') : 'N/A'}</div></div>
                    </div>
                </ScrollArea>
                <SheetFooter className="pt-4"><Button variant="outline" onClick={() => setSheetViewMode('clientInfo')}>Back to Client Info</Button></SheetFooter>
                </>
            )}
            {isLoadingBriefForSheet && sheetViewMode === 'behaviouralBrief' && <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Loading Brief...</p></div>}
            {isLoadingQuestionnaireForSheet && sheetViewMode === 'behaviourQuestionnaire' && <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Loading Questionnaire...</p></div>}
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
