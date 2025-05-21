
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, ChevronLeft, ChevronRight, Search as SearchIcon, Edit, Trash2, Info, X, Users as UsersIcon, DollarSign, ClipboardList, Clock, CalendarDays as CalendarIconLucide, FileQuestion, PawPrint, Tag as TagIcon, Activity } from "lucide-react";
import { DayPicker, type DateFormatter, type DayProps } from "react-day-picker";
import 'react-day-picker/dist/style.css';
import type { Session, Client, InternalClientFormValues } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO, isValid, startOfDay, isSameDay, startOfMonth, addMonths, subMonths, isToday, isFuture, compareAsc, parse, addDays, endOfDay, getDay, differenceInCalendarDays, closestTo } from 'date-fns';
import { 
  getClients, 
  getSessionsFromFirestore, 
  addSessionToFirestore, 
  deleteSessionFromFirestore,
  addClientToFirestore as fbAddClient 
} from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import { cn, formatFullNameAndDogName } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar as ShadCalendar } from "@/components/ui/calendar";


const sessionFormSchema = z.object({
  clientId: z.string().min(1, { message: "Client selection is required." }),
  date: z.date({ required_error: "Session date is required." }),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format. Use HH:MM (24-hour)." }),
  sessionType: z.string().min(1, { message: "Session type is required." }),
  amount: z.preprocess(
    (val) => (String(val).trim() === '' ? undefined : parseFloat(String(val))),
    z.number().nonnegative({ message: "Amount must be a positive number." }).optional()
  ),
});
type SessionFormValues = z.infer<typeof sessionFormSchema>;

const sessionTypeOptions = [
  "In-Person", "Online", "Training", "Online Catchup",
  "Group", "Phone Call", "RMR Live", "Coaching"
];

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


export default function HomePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  
  const [isAddSessionSheetOpen, setIsAddSessionSheetOpen] = useState(false);
  const [isSubmittingSheet, setIsSubmittingSheet] = useState(false);

  const [isAddClientSheetOpen, setIsAddClientSheetOpen] = useState(false);
  const [isSubmittingClientForm, setIsSubmittingClientForm] = useState<boolean>(false);

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  const [isSessionDetailSheetOpen, setIsSessionDetailSheetOpen] = useState(false);
  const [selectedSessionForSheet, setSelectedSessionForSheet] = useState<Session | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [isDeleteSessionDialogOpen, setIsDeleteSessionDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { toast } = useToast();

  const addSessionForm = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: { date: undefined, time: '', clientId: '', sessionType: '', amount: undefined }
  });
  
  useEffect(() => {
    if (isAddSessionSheetOpen) {
      addSessionForm.reset({
        date: new Date(), 
        time: format(new Date(), "HH:mm"),
        clientId: '',
        sessionType: '',
        amount: undefined,
      });
    }
  }, [isAddSessionSheetOpen, addSessionForm]);

  const { watch: watchSessionForm, setValue: setSessionValue } = addSessionForm;
  const watchedClientId = watchSessionForm("clientId");
  const watchedSessionType = watchSessionForm("sessionType");

  useEffect(() => {
    if (watchedClientId && watchedSessionType && clients.length > 0) {
      const client = clients.find(c => c.id === watchedClientId);
      if (client) {
        let newAmount: number | undefined = undefined;
        const isMember = client.isMember;

        if (watchedSessionType === "In-Person") newAmount = isMember ? 75 : 95;
        else if (watchedSessionType === "Online") newAmount = isMember ? 50 : 60;
        else if (watchedSessionType === "Online Catchup") newAmount = 30;
        else if (watchedSessionType === "Training") newAmount = isMember ? 50 : 60;
        
        setSessionValue("amount", newAmount);
      }
    }
  }, [watchedClientId, watchedSessionType, clients, setSessionValue]);


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

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        toast({
          title: "Firebase Not Configured",
          description: "Cannot fetch dashboard data. Please check your Firebase setup.",
          variant: "destructive",
        });
        setIsLoadingData(false);
        return;
      }
      try {
        setIsLoadingData(true);
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
        setSessions(firestoreSessions.sort((a, b) => {
          const dateA = parseISO(a.date);
          const dateB = parseISO(b.date);
          if (!isValid(dateA) && !isValid(dateB)) return 0;
          if (!isValid(dateA)) return 1;
          if (!isValid(dateB)) return -1;

          const dateTimeA = isValid(dateA) ? new Date(`${format(dateA, 'yyyy-MM-dd')}T${a.time || '00:00'}:00`) : new Date(0);
          const dateTimeB = isValid(dateB) ? new Date(`${format(dateB, 'yyyy-MM-dd')}T${b.time || '00:00'}:00`) : new Date(0);

          if (!isValid(dateTimeA) && !isValid(dateTimeB)) return 0;
          if (!isValid(dateTimeA)) return 1;
          if (!isValid(dateTimeB)) return -1;

          return dateTimeB.getTime() - dateTimeA.getTime();
        }));
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        toast({
          title: "Error Loading Dashboard Data",
          description: "Could not fetch client or session data from Firestore.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchDashboardData();
  }, [toast]);

  const filteredSessionsForCalendar = useMemo(() => {
    if (!searchTerm.trim()) return sessions;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return sessions.filter(session => {
      const ownerFullName = session.clientName || "";
      const clientNameMatch = ownerFullName.toLowerCase().includes(lowerSearchTerm);
      const dogNameMatch = session.dogName && session.dogName.toLowerCase().includes(lowerSearchTerm);
      const sessionTypeMatch = session.sessionType && session.sessionType.toLowerCase().includes(lowerSearchTerm);
      return clientNameMatch || dogNameMatch || sessionTypeMatch;
    });
  }, [sessions, searchTerm]);

  const handleAddSessionSubmit: SubmitHandler<SessionFormValues> = async (data) => {
    setIsSubmittingSheet(true);
    const selectedClient = clients.find(c => c.id === data.clientId);
    if (!selectedClient) {
      toast({ title: "Error", description: "Selected client not found.", variant: "destructive" });
      setIsSubmittingSheet(false);
      return;
    }

    const sessionData: Omit<Session, 'id' | 'createdAt'> = {
      clientId: data.clientId,
      clientName: `${selectedClient.ownerFirstName} ${selectedClient.ownerLastName}`,
      dogName: selectedClient.dogName || undefined,
      date: format(data.date, 'yyyy-MM-dd'),
      time: data.time, 
      status: 'Scheduled',
      sessionType: data.sessionType,
      amount: data.amount,
    };

    try {
      const newSession = await addSessionToFirestore(sessionData);
      setSessions(prev => [newSession, ...prev].sort((a, b) => {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        if (!isValid(dateA) && !isValid(dateB)) return 0;
        if (!isValid(dateA)) return 1;
        if (!isValid(dateB)) return -1;

        const dateTimeA = isValid(dateA) ? new Date(`${format(dateA, 'yyyy-MM-dd')}T${a.time || '00:00'}:00`) : new Date(0);
        const dateTimeB = isValid(dateB) ? new Date(`${format(dateB, 'yyyy-MM-dd')}T${b.time || '00:00'}:00`) : new Date(0);

        if (!isValid(dateTimeA) && !isValid(dateTimeB)) return 0;
        if (!isValid(dateTimeA)) return 1;
        if (!isValid(dateTimeB)) return -1;

        return dateTimeB.getTime() - dateTimeA.getTime();
      }));
      toast({ title: "Session Added", description: `Session on ${format(data.date, 'PPP')} at ${data.time} scheduled.` });
      setIsAddSessionSheetOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add session.";
      toast({ title: "Error Adding Session", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmittingSheet(false);
    }
  };

  const handleAddClientSubmit: SubmitHandler<InternalClientFormValues> = async (data) => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      toast({ title: "Firebase Not Configured", description: "Firebase project ID is missing. Cannot add client.", variant: "destructive" });
      return;
    }
    setIsSubmittingClientForm(true);
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
      setClients(prevClients => [...prevClients, newClient].sort((a, b) => {
        const nameA = formatFullNameAndDogName(`${a.ownerFirstName} ${a.ownerLastName}`, a.dogName).toLowerCase();
        const nameB = formatFullNameAndDogName(`${b.ownerFirstName} ${b.ownerLastName}`, b.dogName).toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      }));
      toast({ title: "Client Added", description: `${formatFullNameAndDogName(data.ownerFirstName + " " + data.ownerLastName, data.dogName)} has been successfully added.` });
      addClientForm.reset({ ownerFirstName: '', ownerLastName: '', contactEmail: '', contactNumber: '', postcode: '', dogName: '', isMember: false, isActive: true, submissionDate: format(new Date(), "yyyy-MM-dd HH:mm:ss")});
      setIsAddClientSheetOpen(false);
    } catch (err) {
      console.error("Error adding client to Firestore:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to add client.";
      toast({ title: "Error Adding Client", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmittingClientForm(false);
    }
  };

  const handleDeleteSessionRequest = (session: Session) => {
    setSessionToDelete(session);
    setIsDeleteSessionDialogOpen(true);
  };

  const handleConfirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    setIsSubmittingSheet(true); 
    try {
      await deleteSessionFromFirestore(sessionToDelete.id);
      setSessions(prev => prev.filter(s => s.id !== sessionToDelete.id));
      toast({ title: "Session Deleted", description: "The session has been deleted." });
      setIsSessionDetailSheetOpen(false);
      setSelectedSessionForSheet(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete session.";
      toast({ title: "Error Deleting Session", description: errorMessage, variant: "destructive" });
    } finally {
      setIsDeleteSessionDialogOpen(false);
      setSessionToDelete(null);
      setIsSubmittingSheet(false);
    }
  };

  const handleEditSession = (session: Session) => {
    toast({
      title: "Edit Session",
      description: `Edit session for ${formatFullNameAndDogName(session.clientName, session.dogName)} on ${isValid(parseISO(session.date)) ? format(parseISO(session.date), 'PPP') : 'Invalid Date'} (Feature not fully implemented).`,
      variant: "default"
    });
  };

  const formatCaption: DateFormatter = (month) => {
    return format(month, 'MMMM yyyy');
  };

  function CustomDayContent(props: DayProps) {
    const daySessions = filteredSessionsForCalendar.filter(s => {
      const sessionDate = parseISO(s.date);
      return isValid(sessionDate) && isSameDay(sessionDate, props.date);
    }).sort((a, b) => {
      try {
        const timeA = parse(a.time, 'HH:mm', new Date());
        const timeB = parse(b.time, 'HH:mm', new Date());
        return compareAsc(timeA, timeB);
      } catch {
        return 0;
      }
    });

    return (
      <div className="relative h-full min-h-[7rem] p-1 flex flex-col items-start text-left">
        <div
          className={cn(
            "absolute top-1 right-1 text-xs",
            isToday(props.date)
              ? "text-[#92351f] font-semibold" 
              : "text-muted-foreground"
          )}
        >
          {format(props.date, "d")}
        </div>

        {daySessions.length > 0 && (
          <ScrollArea className="w-full mt-5 pr-1"> 
            <div className="space-y-1">
              {daySessions.map((session) => (
                <Badge
                  key={session.id}
                  className="block w-full text-left text-xs p-1 truncate cursor-pointer bg-primary text-primary-foreground hover:bg-primary/80"
                  onClick={() => {
                    setSelectedSessionForSheet(session);
                    setIsSessionDetailSheetOpen(true);
                  }}
                >
                  {session.time} -{" "}
                  {formatFullNameAndDogName(
                    session.clientName,
                    session.dogName
                  )}
                </Badge>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-6">
      {isLoadingData && (
          <div className="flex justify-center items-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Loading dashboard data...</p>
          </div>
      )}

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b space-x-4">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-4 w-4" /></Button>
                <h2 className="text-lg font-semibold text-center min-w-[120px]">{format(currentMonth, 'MMMM yyyy')}</h2>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <div className="flex items-center gap-2">
                <Sheet open={isAddClientSheetOpen} onOpenChange={setIsAddClientSheetOpen}>
                    <SheetTrigger asChild>
                        <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" /> New Client</Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-md bg-card">
                        <SheetHeader>
                        <SheetTitle>New Client</SheetTitle>
                        <SheetDescription>Add essential contact and dog information.</SheetDescription>
                        </SheetHeader>
                        <form onSubmit={addClientForm.handleSubmit(handleAddClientSubmit)} className="space-y-4 py-4">
                            <div>
                                <Label htmlFor="add-ownerFirstName-dash">First Name</Label>
                                <Input id="add-ownerFirstName-dash" {...addClientForm.register("ownerFirstName")} className={cn("mt-1", addClientForm.formState.errors.ownerFirstName ? "border-destructive" : "")} disabled={isSubmittingClientForm} />
                                {addClientForm.formState.errors.ownerFirstName && <p className="text-xs text-destructive mt-1">{addClientForm.formState.errors.ownerFirstName.message}</p>}
                            </div>
                             <div>
                                <Label htmlFor="add-ownerLastName-dash">Last Name</Label>
                                <Input id="add-ownerLastName-dash" {...addClientForm.register("ownerLastName")} className={cn("mt-1", addClientForm.formState.errors.ownerLastName ? "border-destructive" : "")} disabled={isSubmittingClientForm} />
                                {addClientForm.formState.errors.ownerLastName && <p className="text-xs text-destructive mt-1">{addClientForm.formState.errors.ownerLastName.message}</p>}
                            </div>
                             <div>
                                <Label htmlFor="add-dogName-dash">Dog's Name</Label>
                                <Input id="add-dogName-dash" {...addClientForm.register("dogName")} className={cn("mt-1", addClientForm.formState.errors.dogName ? "border-destructive" : "")} disabled={isSubmittingClientForm}/>
                                {addClientForm.formState.errors.dogName && <p className="text-xs text-destructive mt-1">{addClientForm.formState.errors.dogName.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="add-contactEmail-dash">Email</Label>
                                <Input id="add-contactEmail-dash" type="email" {...addClientForm.register("contactEmail")} className={cn("mt-1", addClientForm.formState.errors.contactEmail ? "border-destructive" : "")} disabled={isSubmittingClientForm}/>
                                {addClientForm.formState.errors.contactEmail && <p className="text-xs text-destructive mt-1">{addClientForm.formState.errors.contactEmail.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="add-contactNumber-dash">Number</Label>
                                <Input id="add-contactNumber-dash" type="tel" {...addClientForm.register("contactNumber")} className={cn("mt-1", addClientForm.formState.errors.contactNumber ? "border-destructive" : "")} disabled={isSubmittingClientForm}/>
                                {addClientForm.formState.errors.contactNumber && <p className="text-xs text-destructive mt-1">{addClientForm.formState.errors.contactNumber.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="add-postcode-dash">Postcode</Label>
                                <Input id="add-postcode-dash" {...addClientForm.register("postcode")} className={cn("mt-1", addClientForm.formState.errors.postcode ? "border-destructive" : "")} disabled={isSubmittingClientForm}/>
                                {addClientForm.formState.errors.postcode && <p className="text-xs text-destructive mt-1">{addClientForm.formState.errors.postcode.message}</p>}
                            </div>
                            <div className="flex items-center space-x-2">
                                <Controller
                                name="isMember"
                                control={addClientForm.control}
                                render={({ field }) => (
                                    <Checkbox
                                    id="add-isMember-dash"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={isSubmittingClientForm}
                                    />
                                )}
                                />
                                <Label htmlFor="add-isMember-dash" className="text-sm font-normal">Is Member?</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Controller
                                name="isActive"
                                control={addClientForm.control}
                                render={({ field }) => (
                                    <Checkbox
                                    id="add-isActive-dash"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={isSubmittingClientForm}
                                    />
                                )}
                                />
                                <Label htmlFor="add-isActive-dash" className="text-sm font-normal">Is Active?</Label>
                            </div>
                            <input type="hidden" {...addClientForm.register("submissionDate")} />
                            <SheetFooter className="mt-4">
                                <SheetClose asChild>
                                    <Button type="button" variant="outline" disabled={isSubmittingClientForm}>Cancel</Button>
                                </SheetClose>
                                <Button type="submit" disabled={isSubmittingClientForm}>
                                {isSubmittingClientForm && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Client
                                </Button>
                            </SheetFooter>
                        </form>
                    </SheetContent>
                </Sheet>
                <div className="w-full max-w-xs sm:max-w-sm">
                    <Input
                        type="search"
                        placeholder="Search sessions..."
                        className="h-9 pl-8 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              <Sheet open={isAddSessionSheetOpen} onOpenChange={setIsAddSessionSheetOpen}>
                <SheetTrigger asChild>
                  <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" /> New Session</Button>
                </SheetTrigger>
                <SheetContent className="sm:max-w-md bg-card">
                  <SheetHeader>
                    <SheetTitle>New Session</SheetTitle>
                    <SheetDescription>
                      Schedule a new training session.
                    </SheetDescription>
                  </SheetHeader>
                  <form onSubmit={addSessionForm.handleSubmit(handleAddSessionSubmit)} className="space-y-4 py-4">
                     <div>
                        <Label htmlFor="clientId-dashboard">Client</Label>
                        <Controller name="clientId" control={addSessionForm.control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value} disabled={isSubmittingSheet || isLoadingData}>
                                <SelectTrigger id="clientId-dashboard" className={cn("w-full mt-1", addSessionForm.formState.errors.clientId && "border-destructive")}>
                                    <SelectValue placeholder="Select a client" />
                                </SelectTrigger>
                                <SelectContent><SelectGroup><SelectLabel>Clients</SelectLabel>
                                    {clients.map(client => (
                                    <SelectItem key={client.id} value={client.id}>
                                        {formatFullNameAndDogName(`${client.ownerFirstName} ${client.ownerLastName}`, client.dogName)}
                                    </SelectItem>
                                    ))}
                                </SelectGroup></SelectContent>
                                </Select>
                            )}
                            />
                        {addSessionForm.formState.errors.clientId && <p className="text-xs text-destructive mt-1">{addSessionForm.formState.errors.clientId.message}</p>}
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="date-dashboard" className="text-right pt-2 col-span-1">Date</Label>
                        <div className={cn("col-span-3 flex justify-center", addSessionForm.formState.errors.date && "border-destructive border rounded-md")}>
                            <Controller name="date" control={addSessionForm.control}
                                render={({ field }) => (
                                    <ShadCalendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={isSubmittingSheet} id="date-dashboard" className={cn("!p-1 rounded-md border", addSessionForm.formState.errors.date && "border-destructive")} 
                                    classNames={{ day_selected: "bg-primary text-white focus:bg-primary focus:text-white", day: cn( "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-primary hover:text-white" )}} />
                                )} />
                        </div>
                    </div>
                     {addSessionForm.formState.errors.date && <p className="text-xs text-destructive mt-1 col-start-2 col-span-3">{addSessionForm.formState.errors.date.message}</p>}
                    
                    <div>
                        <Label htmlFor="time-dashboard">Time (24h)</Label>
                        <Controller name="time" control={addSessionForm.control}
                            render={({ field }) => ( <Input id="time-dashboard" type="time" {...field} className={cn("w-full mt-1", addSessionForm.formState.errors.time && "border-destructive")} disabled={isSubmittingSheet} /> )} />
                        {addSessionForm.formState.errors.time && <p className="text-xs text-destructive mt-1">{addSessionForm.formState.errors.time.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="sessionType-dashboard">Type</Label>
                      <Controller name="sessionType" control={addSessionForm.control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value} disabled={isSubmittingSheet}>
                            <SelectTrigger id="sessionType-dashboard" className={cn("w-full mt-1", addSessionForm.formState.errors.sessionType && "border-destructive")}>
                              <SelectValue placeholder="Select session type" />
                            </SelectTrigger>
                            <SelectContent><SelectGroup><SelectLabel>Session Types</SelectLabel>
                              {sessionTypeOptions.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                            </SelectGroup></SelectContent>
                          </Select>
                        )}
                      />
                      {addSessionForm.formState.errors.sessionType && <p className="text-xs text-destructive mt-1">{addSessionForm.formState.errors.sessionType.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="amount-dashboard">Amount (£)</Label>
                        <Controller name="amount" control={addSessionForm.control}
                            render={({ field }) => (
                            <Input id="amount-dashboard" type="number" placeholder="e.g. 75.50" step="0.01" {...field} value={field.value === undefined ? '' : String(field.value)} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} className={cn("w-full mt-1", addSessionForm.formState.errors.amount && "border-destructive")} disabled={isSubmittingSheet} />
                            )} />
                        {addSessionForm.formState.errors.amount && <p className="text-xs text-destructive mt-1">{addSessionForm.formState.errors.amount.message}</p>}
                    </div>
                    <SheetFooter className="mt-4">
                      <SheetClose asChild><Button type="button" variant="outline" disabled={isSubmittingSheet}>Cancel</Button></SheetClose>
                      <Button type="submit" disabled={isSubmittingSheet}>
                        {isSubmittingSheet && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Session
                      </Button>
                    </SheetFooter>
                  </form>
                </SheetContent>
              </Sheet>
            </div>
        </CardHeader>
        <CardContent className="p-0"> 
          {isLoadingData ? (
            <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-3">Loading calendar...</p></div>
          ) : (
            <DayPicker
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              showOutsideDays
              fixedWeeks
              formatters={{ formatCaption }}
              className="w-full !p-0 !m-0" 
              classNames={{
                caption: "hidden", 
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 justify-center",
                month: "space-y-4 w-full",
                table: "w-full border-collapse",
                head_row: "flex border-b",
                head_cell: "text-muted-foreground font-normal text-xs w-[14.28%] text-center p-2", 
                row: "flex w-full mt-0 border-b last:border-b-0", 
                cell: cn( 
                  "w-[14.28%] text-center text-sm p-0 relative border-r last:border-r-0 focus-within:relative focus-within:z-20",
                  "[&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
                ),
                day: "h-full w-full p-0", 
                day_selected: "bg-primary text-white focus:bg-primary focus:text-white",
                day_today: "ring-2 ring-[#92351f] rounded-md ring-offset-background ring-offset-1",
                day_outside: "text-muted-foreground opacity-50",
              }}
              components={{ DayContent: CustomDayContent }}
            />
          )}
        </CardContent>
      </Card>

      <Sheet open={isSessionDetailSheetOpen} onOpenChange={(isOpen) => { setIsSessionDetailSheetOpen(isOpen); if (!isOpen) setSelectedSessionForSheet(null); }}>
        <SheetContent className="sm:max-w-lg bg-card">
          {selectedSessionForSheet && (
            <>
              <SheetHeader>
                <SheetTitle className="text-xl">Session Details</SheetTitle>
                <SheetDescription>
                  {formatFullNameAndDogName(selectedSessionForSheet.clientName, selectedSessionForSheet.dogName)}
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="max-h-[calc(100vh-220px)] pr-3"> 
                <div className="py-4 space-y-3">
                  <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1"><Label className="text-right font-semibold col-span-1">Date:</Label><div className="col-span-2 text-sm">{isValid(parseISO(selectedSessionForSheet.date)) ? format(parseISO(selectedSessionForSheet.date), 'EEEE, MMMM do, yyyy') : 'Invalid Date'}</div></div>
                  <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1"><Label className="text-right font-semibold col-span-1">Time:</Label><div className="col-span-2 text-sm">{selectedSessionForSheet.time}</div></div>
                   <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1"><Label className="text-right font-semibold col-span-1">Client:</Label><div className="col-span-2 text-sm">{selectedSessionForSheet.clientName}</div></div>
                  {selectedSessionForSheet.dogName && <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1"><Label className="text-right font-semibold col-span-1">Dog:</Label><div className="col-span-2 text-sm">{selectedSessionForSheet.dogName}</div></div>}
                  <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1"><Label className="text-right font-semibold col-span-1">Type:</Label><div className="col-span-2 text-sm">{selectedSessionForSheet.sessionType}</div></div>
                   {selectedSessionForSheet.amount !== undefined && <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1"><Label className="text-right font-semibold col-span-1">Amount:</Label><div className="col-span-2 text-sm">£{selectedSessionForSheet.amount.toFixed(2)}</div></div>}
                  <div className="grid grid-cols-3 items-start gap-x-4 gap-y-1"><Label className="text-right font-semibold col-span-1 pt-0.5">Status:</Label><div className="col-span-2"><Badge variant={selectedSessionForSheet.status === 'Scheduled' ? 'default' : selectedSessionForSheet.status === 'Completed' ? 'secondary' : 'outline'}>{selectedSessionForSheet.status}</Badge></div></div>
                  {selectedSessionForSheet.notes && <div className="grid grid-cols-3 items-start gap-x-4 gap-y-1"><Label className="text-right font-semibold col-span-1 pt-0.5">Notes:</Label><div className="col-span-2 text-sm whitespace-pre-wrap text-muted-foreground">{selectedSessionForSheet.notes}</div></div>}
                </div>
              </ScrollArea>
              <SheetFooter className="pt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button variant="outline" onClick={() => handleEditSession(selectedSessionForSheet)} className="flex-1 sm:flex-none"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                <Button variant="destructive" onClick={() => handleDeleteSessionRequest(selectedSessionForSheet)} className="flex-1 sm:flex-none" disabled={isSubmittingSheet}>{isSubmittingSheet && sessionToDelete?.id === selectedSessionForSheet.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Delete</Button>
                 <SheetClose asChild><Button variant="outline" className="flex-1 sm:flex-none">Close</Button></SheetClose>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={isDeleteSessionDialogOpen} onOpenChange={setIsDeleteSessionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the session with {sessionToDelete ? formatFullNameAndDogName(sessionToDelete.clientName, sessionToDelete.dogName) : 'this client'} on {sessionToDelete && isValid(parseISO(sessionToDelete.date)) ? format(parseISO(sessionToDelete.date), 'PPP') : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteSessionDialogOpen(false)} disabled={isSubmittingSheet}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteSession} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isSubmittingSheet}>
              {isSubmittingSheet && sessionToDelete ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
