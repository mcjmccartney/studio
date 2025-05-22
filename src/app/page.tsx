
"use client";

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  X,
  CalendarDays as CalendarIconLucide,
  Clock,
  Tag as TagIcon,
  DollarSign,
} from 'lucide-react';
import { DayPicker, type DateFormatter, type DayProps } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import type { Session, Client } from '@/lib/types';
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
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  format,
  parseISO,
  isValid,
  startOfDay,
  isSameDay,
  startOfMonth,
  addMonths,
  subMonths,
  isToday,
  isAfter,
  compareAsc,
  parse,
  isWithinInterval,
  addDays,
  subDays,
} from 'date-fns';
import {
  getClients,
  getSessionsFromFirestore,
  addSessionToFirestore,
  deleteSessionFromFirestore,
  addClientToFirestore as fbAddClient,
  updateSessionInFirestore,
} from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import { cn, formatFullNameAndDogName } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar as ShadCalendar } from '@/components/ui/calendar';

const sessionFormSchema = z.object({
  clientId: z.string().min(1, { message: 'Client selection is required.' }),
  date: z.date({ required_error: 'Session date is required.' }),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Invalid time format. Use HH:MM (24-hour).',
  }),
  sessionType: z.string().min(1, { message: 'Session type is required.' }),
  amount: z.preprocess(
    (val) => (String(val).trim() === '' ? undefined : parseFloat(String(val))),
    z.number().nonnegative({ message: 'Amount must be a positive number.' }).optional()
  ),
});
type SessionFormValues = z.infer<typeof sessionFormSchema>;

const sessionTypeOptions = [
  'In-Person',
  'Online',
  'Training',
  'Online Catchup',
  'Group',
  'Phone Call',
  'RMR Live',
  'Coaching',
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
type InternalClientFormValuesDash = z.infer<typeof internalClientFormSchema>;

const DetailRow: React.FC<{ label: string; value?: string | number | null | React.ReactNode; className?: string; }> = ({ label, value, className }) => {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return null;
  }
  return (
    <div className={cn("flex justify-between items-start py-3 border-b border-border", className)}>
      <span className="text-sm text-muted-foreground pr-2">{label}</span>
      <span className="text-sm text-foreground text-right break-words whitespace-pre-wrap">{value}</span>
    </div>
  );
};

export default function HomePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  const [isAddClientSheetOpen, setIsAddClientSheetOpen] = useState(false);
  const [isAddSessionSheetOpen, setIsAddSessionSheetOpen] = useState(false);
  const [isSubmittingSheet, setIsSubmittingSheet] = useState<boolean>(false);

  const [isEditSessionSheetOpen, setIsEditSessionSheetOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);


  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  const [isSessionSheetOpen, setIsSessionSheetOpen] = useState(false);
  const [selectedSessionForSheet, setSelectedSessionForSheet] = useState<Session | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [isDeleteSessionDialogOpen, setIsDeleteSessionDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { toast } = useToast();

  const addClientForm = useForm<InternalClientFormValuesDash>({
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

  const addSessionForm = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
  });
  
  const { 
    watch: watchAddSessionForm, 
    setValue: setAddSessionValue, 
    control: addSessionFormControl, 
    reset: resetAddSessionForm, 
    formState: { errors: addSessionFormErrors }, 
    handleSubmit: handleAddSessionSubmitHook 
  } = addSessionForm;
  
  useEffect(() => {
    if (isAddSessionSheetOpen) {
      resetAddSessionForm({
        clientId: '',
        date: new Date(),
        time: format(new Date(), "HH:mm"),
        sessionType: '',
        amount: undefined,
      });
    }
  }, [isAddSessionSheetOpen, resetAddSessionForm]);

  const watchedClientIdForAddSession = watchAddSessionForm("clientId");
  const watchedSessionTypeForAddSession = watchAddSessionForm("sessionType");

  useEffect(() => {
    if (watchedClientIdForAddSession && watchedSessionTypeForAddSession && clients.length > 0) {
      const client = clients.find(c => c.id === watchedClientIdForAddSession);
      if (client) {
        let newAmount: number | undefined = undefined;
        const isMember = client.isMember;
        if (watchedSessionTypeForAddSession === "In-Person") newAmount = isMember ? 75 : 95;
        else if (watchedSessionTypeForAddSession === "Online") newAmount = isMember ? 50 : 60;
        else if (watchedSessionTypeForAddSession === "Online Catchup") newAmount = 30;
        else if (watchedSessionTypeForAddSession === "Training") newAmount = isMember ? 50 : 60;
        setAddSessionValue("amount", newAmount);
      }
    }
  }, [watchedClientIdForAddSession, watchedSessionTypeForAddSession, clients, setAddSessionValue]);


  const editSessionForm = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
  });

  const {
    watch: watchEditSessionForm,
    setValue: setEditSessionValue,
    control: editSessionFormControl,
    reset: resetEditSessionForm,
    formState: { errors: editSessionFormErrors },
    handleSubmit: handleEditSessionSubmitHook,
  } = editSessionForm;

  useEffect(() => {
    if (isEditSessionSheetOpen && sessionToEdit) {
      resetEditSessionForm({
        clientId: sessionToEdit.clientId,
        date: parseISO(sessionToEdit.date),
        time: sessionToEdit.time,
        sessionType: sessionToEdit.sessionType,
        amount: sessionToEdit.amount,
      });
    }
  }, [isEditSessionSheetOpen, sessionToEdit, resetEditSessionForm]);

  const watchedClientIdForEditSession = watchEditSessionForm("clientId");
  const watchedSessionTypeForEditSession = watchEditSessionForm("sessionType");

  useEffect(() => {
    if (isEditSessionSheetOpen && watchedClientIdForEditSession && watchedSessionTypeForEditSession && clients.length > 0) {
      const client = clients.find(c => c.id === watchedClientIdForEditSession);
      if (client) {
        let newAmount: number | undefined = undefined;
        const isMember = client.isMember;
        if (watchedSessionTypeForEditSession === "In-Person") newAmount = isMember ? 75 : 95;
        else if (watchedSessionTypeForEditSession === "Online") newAmount = isMember ? 50 : 60;
        else if (watchedSessionTypeForEditSession === "Online Catchup") newAmount = 30;
        else if (watchedSessionTypeForEditSession === "Training") newAmount = isMember ? 50 : 60;
        setEditSessionValue("amount", newAmount);
      }
    }
  }, [isEditSessionSheetOpen, watchedClientIdForEditSession, watchedSessionTypeForEditSession, clients, setEditSessionValue]);



  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        toast({
          title: "Firebase Not Configured",
          description: "Cannot fetch dashboard data.",
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
      const clientNameMatch = session.clientName && session.clientName.toLowerCase().includes(lowerSearchTerm);
      const dogNameMatch = session.dogName && session.dogName.toLowerCase().includes(lowerSearchTerm);
      return clientNameMatch || dogNameMatch;
    });
  }, [sessions, searchTerm]);

  const handleAddClientSubmit: SubmitHandler<InternalClientFormValuesDash> = async (data) => {
    setIsSubmittingSheet(true);
    try {
      const clientDataForFirestore = {
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
      addClientForm.reset({ ownerFirstName: '', ownerLastName: '', contactEmail: '', contactNumber: '', postcode: '', dogName: '', isMember: false, isActive: true, submissionDate: format(new Date(), "yyyy-MM-dd HH:mm:ss") });
      setIsAddClientSheetOpen(false);
    } catch (err) {
      console.error("Error adding client to Firestore:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to add client.";
      toast({ title: "Error Adding Client", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmittingSheet(false);
    }
  };

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
  
  const handleUpdateSession: SubmitHandler<SessionFormValues> = async (data) => {
    if (!sessionToEdit) return;
    setIsSubmittingSheet(true);

    const sessionDataToUpdate: Partial<Omit<Session, 'id' | 'createdAt' | 'clientName' | 'dogName'>> = {
      clientId: data.clientId,
      date: format(data.date, 'yyyy-MM-dd'),
      time: data.time,
      sessionType: data.sessionType,
      amount: data.amount,
    };
    
    const selectedClient = clients.find(c => c.id === data.clientId);

    try {
      await updateSessionInFirestore(sessionToEdit.id, sessionDataToUpdate);
      setSessions(prevSessions => 
        prevSessions.map(s => 
          s.id === sessionToEdit.id 
            ? { 
                ...s, 
                ...sessionDataToUpdate,
                clientName: selectedClient ? `${selectedClient.ownerFirstName} ${selectedClient.ownerLastName}` : s.clientName,
                dogName: selectedClient ? selectedClient.dogName : s.dogName,
              } 
            : s
        ).sort((a, b) => {
             const dateA = parseISO(a.date);
             const dateB = parseISO(b.date);
             if (!isValid(dateA) && !isValid(dateB)) return 0;
             if (!isValid(dateA)) return 1;
             if (!isValid(dateB)) return -1;
             const dateTimeA = new Date(`${format(dateA, 'yyyy-MM-dd')}T${a.time || '00:00'}:00`);
             const dateTimeB = new Date(`${format(dateB, 'yyyy-MM-dd')}T${b.time || '00:00'}:00`);
             return dateTimeB.getTime() - dateTimeA.getTime();
        })
      );
      toast({ title: "Session Updated", description: `Session on ${format(data.date, 'PPP')} at ${data.time} updated.` });
      setIsEditSessionSheetOpen(false);
      setSessionToEdit(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update session.";
      toast({ title: "Error Updating Session", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmittingSheet(false);
    }
  };


  const handleDeleteSessionRequest = (session: Session) => {
    setSessionToDelete(session);
    setIsDeleteSessionDialogOpen(true);
  };

  const handleConfirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    setIsSubmittingSheet(true); // Reuse for dialog submission state
    try {
      await deleteSessionFromFirestore(sessionToDelete.id);
      setSessions(prev => prev.filter(s => s.id !== sessionToDelete.id));
      toast({ title: "Session Deleted", description: "The session has been deleted." });
      setIsSessionSheetOpen(false); // Close view sheet if open
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
              ? "text-[#4e6748] font-semibold" // Updated to new primary color
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
                  className="block w-full text-left text-xs p-1 truncate cursor-pointer bg-primary text-primary-foreground hover:bg-primary/80 rounded-md"
                  onClick={() => {
                    setSelectedSessionForSheet(session);
                    setIsSessionSheetOpen(true);
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
             <Input
                type="search"
                placeholder="Search sessions..."
                className="h-9 w-full max-w-xs sm:max-w-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Sheet open={isAddClientSheetOpen} onOpenChange={setIsAddClientSheetOpen}>
              <SheetTrigger asChild>
                  <Button size="sm">New Client</Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-md bg-card">
                  <SheetHeader>
                  <SheetTitle>New Client</SheetTitle>
                  <SheetDescription>Add essential contact and dog information.</SheetDescription>
                  </SheetHeader>
                  <form onSubmit={addClientForm.handleSubmit(handleAddClientSubmit)} className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="add-ownerFirstName-dash">First Name</Label>
                        <Input id="add-ownerFirstName-dash" {...addClientForm.register("ownerFirstName")} className={cn("mt-1", addClientForm.formState.errors.ownerFirstName ? "border-destructive" : "")} disabled={isSubmittingSheet} />
                        {addClientForm.formState.errors.ownerFirstName && <p className="text-xs text-destructive mt-1">{addClientForm.formState.errors.ownerFirstName.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="add-ownerLastName-dash">Last Name</Label>
                        <Input id="add-ownerLastName-dash" {...addClientForm.register("ownerLastName")} className={cn("mt-1", addClientForm.formState.errors.ownerLastName ? "border-destructive" : "")} disabled={isSubmittingSheet} />
                        {addClientForm.formState.errors.ownerLastName && <p className="text-xs text-destructive mt-1">{addClientForm.formState.errors.ownerLastName.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="add-dogName-dash">Dog's Name</Label>
                        <Input id="add-dogName-dash" {...addClientForm.register("dogName")} className={cn("mt-1", addClientForm.formState.errors.dogName ? "border-destructive" : "")} disabled={isSubmittingSheet} />
                        {addClientForm.formState.errors.dogName && <p className="text-xs text-destructive mt-1">{addClientForm.formState.errors.dogName.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="add-contactEmail-dash">Email</Label>
                        <Input id="add-contactEmail-dash" type="email" {...addClientForm.register("contactEmail")} className={cn("mt-1", addClientForm.formState.errors.contactEmail ? "border-destructive" : "")} disabled={isSubmittingSheet} />
                        {addClientForm.formState.errors.contactEmail && <p className="text-xs text-destructive mt-1">{addClientForm.formState.errors.contactEmail.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="add-contactNumber-dash">Number</Label>
                        <Input id="add-contactNumber-dash" type="tel" {...addClientForm.register("contactNumber")} className={cn("mt-1", addClientForm.formState.errors.contactNumber ? "border-destructive" : "")} disabled={isSubmittingSheet} />
                        {addClientForm.formState.errors.contactNumber && <p className="text-xs text-destructive mt-1">{addClientForm.formState.errors.contactNumber.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="add-postcode-dash">Postcode</Label>
                        <Input id="add-postcode-dash" {...addClientForm.register("postcode")} className={cn("mt-1", addClientForm.formState.errors.postcode ? "border-destructive" : "")} disabled={isSubmittingSheet} />
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
                            disabled={isSubmittingSheet}
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
                            disabled={isSubmittingSheet}
                            />
                        )}
                        />
                        <Label htmlFor="add-isActive-dash" className="text-sm font-normal">Is Active?</Label>
                    </div>
                    <input type="hidden" {...addClientForm.register("submissionDate")} />
                    <SheetFooter className="mt-4">
                        <SheetClose asChild>
                        <Button type="button" variant="outline" disabled={isSubmittingSheet}>Cancel</Button>
                        </SheetClose>
                        <Button type="submit" disabled={isSubmittingSheet}>
                        {isSubmittingSheet && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Client
                        </Button>
                    </SheetFooter>
                  </form>
              </SheetContent>
            </Sheet>
            <Sheet open={isAddSessionSheetOpen} onOpenChange={setIsAddSessionSheetOpen}>
              <SheetTrigger asChild>
                <Button size="sm">New Session</Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-md bg-card">
                <SheetHeader>
                  <SheetTitle>New Session</SheetTitle>
                  <SheetDescription>
                    Schedule a new training session.
                  </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleAddSessionSubmitHook(handleAddSessionSubmit)} className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="clientId-dashboard">Client</Label>
                        <Controller name="clientId" control={addSessionFormControl}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value || ''} disabled={isSubmittingSheet || isLoadingData}>
                            <SelectTrigger id="clientId-dashboard" className={cn("w-full mt-1", addSessionFormErrors.clientId && "border-destructive")}>
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
                        {addSessionFormErrors.clientId && <p className="text-xs text-destructive mt-1">{addSessionFormErrors.clientId.message}</p>}
                    </div>

                    <div>
                        <Label htmlFor="date-dashboard">Date</Label>
                        <div className={cn("mt-1 flex justify-center", addSessionFormErrors.date && "border-destructive border rounded-md")}>
                        <Controller name="date" control={addSessionFormControl}
                            render={({ field }) => (
                            <ShadCalendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={isSubmittingSheet} id="date-dashboard" className={cn("!p-1", addSessionFormErrors.date && "border-destructive")}
                                classNames={{
                                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                  day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-primary hover:text-primary-foreground")
                                }} />
                            )} />
                        </div>
                         {addSessionFormErrors.date && <p className="col-start-2 col-span-3 text-xs text-destructive -mt-2">{addSessionFormErrors.date.message}</p>}
                    </div>


                    <div>
                        <Label htmlFor="time-dashboard">Time (24h)</Label>
                        <Controller name="time" control={addSessionFormControl}
                        render={({ field }) => (<Input id="time-dashboard" type="time" {...field} className={cn("mt-1", addSessionFormErrors.time && "border-destructive")} disabled={isSubmittingSheet} />)} />
                         {addSessionFormErrors.time && <p className="text-xs text-destructive mt-1">{addSessionFormErrors.time.message}</p>}
                    </div>

                    <div>
                        <Label htmlFor="sessionType-dashboard">Type</Label>
                        <Controller name="sessionType" control={addSessionFormControl}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value || ''} disabled={isSubmittingSheet}>
                            <SelectTrigger id="sessionType-dashboard" className={cn("mt-1",addSessionFormErrors.sessionType && "border-destructive")}>
                                <SelectValue placeholder="Select session type" />
                            </SelectTrigger>
                            <SelectContent><SelectGroup><SelectLabel>Session Types</SelectLabel>
                                {sessionTypeOptions.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                            </SelectGroup></SelectContent>
                            </Select>
                        )}
                        />
                        {addSessionFormErrors.sessionType && <p className="text-xs text-destructive mt-1">{addSessionFormErrors.sessionType.message}</p>}
                    </div>


                    <div>
                        <Label htmlFor="amount-dashboard">Amount (£)</Label>
                        <Controller name="amount" control={addSessionFormControl}
                        render={({ field }) => (
                            <Input id="amount-dashboard" type="number" placeholder="e.g. 75.50" step="0.01" {...field} value={field.value === undefined ? '' : String(field.value)} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} className={cn("mt-1", addSessionFormErrors.amount && "border-destructive")} disabled={isSubmittingSheet} />
                        )} />
                        {addSessionFormErrors.amount && <p className="text-xs text-destructive mt-1">{addSessionFormErrors.amount.message}</p>}
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
                day_selected: "bg-primary text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "ring-2 ring-[#4e6748] rounded-md ring-offset-background ring-offset-1", // Updated to new primary color
                day_outside: "text-muted-foreground opacity-50",
              }}
              components={{ DayContent: CustomDayContent }}
            />
          )}
        </CardContent>
      </Card>

      {/* Session Detail Sheet */}
      <Sheet open={isSessionSheetOpen} onOpenChange={setIsSessionSheetOpen}>
        <SheetContent className="sm:max-w-lg bg-card">
          <div className="absolute top-3.5 right-14 flex items-center gap-1 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (selectedSessionForSheet) {
                  setSessionToEdit(selectedSessionForSheet);
                  setIsEditSessionSheetOpen(true);
                  setIsSessionSheetOpen(false); // Close view sheet
                }
              }}
              disabled={!selectedSessionForSheet}
            >
              <Edit className="h-5 w-5" />
              <span className="sr-only">Edit Session</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => selectedSessionForSheet && handleDeleteSessionRequest(selectedSessionForSheet)}
              disabled={!selectedSessionForSheet}
            >
              <Trash2 className="h-5 w-5" />
              <span className="sr-only">Delete Session</span>
            </Button>
          </div>
          <SheetHeader>
            <SheetTitle>Session Details</SheetTitle>
            {selectedSessionForSheet && (
              <SheetDescription>
                {formatFullNameAndDogName(selectedSessionForSheet.clientName, selectedSessionForSheet.dogName)}
              </SheetDescription>
            )}
          </SheetHeader>
          {selectedSessionForSheet && (
            <ScrollArea className="h-[calc(100vh-160px)] pr-3 mt-4">
              <div className="space-y-0">
                <DetailRow label="Date:" value={isValid(parseISO(selectedSessionForSheet.date)) ? format(parseISO(selectedSessionForSheet.date), 'PPP') : 'Invalid Date'} />
                <DetailRow label="Time:" value={selectedSessionForSheet.time} />
                <DetailRow label="Client:" value={formatFullNameAndDogName(selectedSessionForSheet.clientName, selectedSessionForSheet.dogName)} />
                <DetailRow label="Session Type:" value={selectedSessionForSheet.sessionType} />
                {selectedSessionForSheet.amount !== undefined && <DetailRow label="Amount:" value={`£${selectedSessionForSheet.amount.toFixed(2)}`} />}
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Session Sheet */}
      <Sheet open={isEditSessionSheetOpen} onOpenChange={setIsEditSessionSheetOpen}>
        <SheetContent className="sm:max-w-md bg-card">
          <SheetHeader>
            <SheetTitle>Edit Session</SheetTitle>
            {sessionToEdit && (
              <SheetDescription>
                Editing session for {formatFullNameAndDogName(
                  clients.find(c=>c.id === sessionToEdit.clientId)?.ownerFirstName + " " + clients.find(c=>c.id === sessionToEdit.clientId)?.ownerLastName,
                  clients.find(c=>c.id === sessionToEdit.clientId)?.dogName
                )}
              </SheetDescription>
            )}
          </SheetHeader>
          <form onSubmit={handleEditSessionSubmitHook(handleUpdateSession)} className="space-y-4 py-4">
             <div>
                <Label htmlFor="edit-clientId-dashboard">Client</Label>
                <Controller name="clientId" control={editSessionFormControl}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ''} disabled={isSubmittingSheet || isLoadingData}>
                    <SelectTrigger id="edit-clientId-dashboard" className={cn("w-full mt-1", editSessionFormErrors.clientId && "border-destructive")}>
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
                {editSessionFormErrors.clientId && <p className="text-xs text-destructive mt-1">{editSessionFormErrors.clientId.message}</p>}
            </div>
            <div>
                <Label htmlFor="edit-date-dashboard">Date</Label>
                <div className={cn("mt-1 flex justify-center", editSessionFormErrors.date && "border-destructive border rounded-md")}>
                <Controller name="date" control={editSessionFormControl}
                    render={({ field }) => (
                    <ShadCalendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={isSubmittingSheet} id="edit-date-dashboard" className={cn("!p-1", editSessionFormErrors.date && "border-destructive")}
                        classNames={{
                          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                          day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-primary hover:text-primary-foreground")
                        }} />
                    )} />
                </div>
                  {editSessionFormErrors.date && <p className="col-start-2 col-span-3 text-xs text-destructive -mt-2">{editSessionFormErrors.date.message}</p>}
            </div>
            <div>
                <Label htmlFor="edit-time-dashboard">Time (24h)</Label>
                <Controller name="time" control={editSessionFormControl}
                render={({ field }) => (<Input id="edit-time-dashboard" type="time" {...field} className={cn("mt-1", editSessionFormErrors.time && "border-destructive")} disabled={isSubmittingSheet} />)} />
                  {editSessionFormErrors.time && <p className="text-xs text-destructive mt-1">{editSessionFormErrors.time.message}</p>}
            </div>
            <div>
                <Label htmlFor="edit-sessionType-dashboard">Type</Label>
                <Controller name="sessionType" control={editSessionFormControl}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ''} disabled={isSubmittingSheet}>
                    <SelectTrigger id="edit-sessionType-dashboard" className={cn("mt-1",editSessionFormErrors.sessionType && "border-destructive")}>
                        <SelectValue placeholder="Select session type" />
                    </SelectTrigger>
                    <SelectContent><SelectGroup><SelectLabel>Session Types</SelectLabel>
                        {sessionTypeOptions.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                    </SelectGroup></SelectContent>
                    </Select>
                )}
                />
                {editSessionFormErrors.sessionType && <p className="text-xs text-destructive mt-1">{editSessionFormErrors.sessionType.message}</p>}
            </div>
            <div>
                <Label htmlFor="edit-amount-dashboard">Amount (£)</Label>
                <Controller name="amount" control={editSessionFormControl}
                render={({ field }) => (
                    <Input id="edit-amount-dashboard" type="number" placeholder="e.g. 75.50" step="0.01" {...field} value={field.value === undefined ? '' : String(field.value)} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} className={cn("mt-1", editSessionFormErrors.amount && "border-destructive")} disabled={isSubmittingSheet} />
                )} />
                {editSessionFormErrors.amount && <p className="text-xs text-destructive mt-1">{editSessionFormErrors.amount.message}</p>}
            </div>
            <SheetFooter className="mt-4">
              <SheetClose asChild><Button type="button" variant="outline" disabled={isSubmittingSheet}>Cancel</Button></SheetClose>
              <Button type="submit" disabled={isSubmittingSheet}>
                {isSubmittingSheet && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
              </Button>
            </SheetFooter>
          </form>
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



    