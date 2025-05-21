
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Session, Client } from '@/lib/types';
import {
  getSessionsFromFirestore,
  addSessionToFirestore,
  deleteSessionFromFirestore,
  getClients
} from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isValid, parse } from 'date-fns';
import { PlusCircle, Clock, CalendarDays as CalendarIconLucide, Users, Tag as TagIcon, Info, ClipboardList, MoreHorizontal, Edit, Trash2, Loader2, X, DollarSign } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as ShadCalendar } from "@/components/ui/calendar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn, formatFullNameAndDogName } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';


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
  "In-Person",
  "Online",
  "Training",
  "Online Catchup",
  "Group",
  "Phone Call",
  "RMR Live",
  "Coaching"
];

interface GroupedSessions {
  [monthYear: string]: Session[];
}

interface SessionDetailViewProps {
  session: Session;
  onBack: () => void;
  onDelete: (session: Session) => void;
  onEdit: (session: Session) => void;
}

function SessionDetailView({ session, onBack, onDelete, onEdit }: SessionDetailViewProps) {
  const displayName = formatFullNameAndDogName(session.clientName, session.dogName);
  return (
     <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onBack()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Session Details</DialogTitle>
          <DialogDescription>
            {displayName}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-3">
          <div className="py-4 space-y-3">
            <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
              <Label className="text-right font-semibold col-span-1">Date:</Label>
              <div className="col-span-2 text-sm">{isValid(parseISO(session.date)) ? format(parseISO(session.date), 'EEEE, MMMM do, yyyy') : 'Invalid Date'}</div>
            </div>
            <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
              <Label className="text-right font-semibold col-span-1">Time:</Label>
              <div className="col-span-2 text-sm">{session.time}</div>
            </div>
            <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
              <Label className="text-right font-semibold col-span-1">Client:</Label>
              <div className="col-span-2 text-sm">{session.clientName}</div>
            </div>
            {session.dogName && (
              <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
                <Label className="text-right font-semibold col-span-1">Dog:</Label>
                <div className="col-span-2 text-sm">{session.dogName}</div>
              </div>
            )}
            <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
              <Label className="text-right font-semibold col-span-1">Type:</Label>
              <div className="col-span-2 text-sm">{session.sessionType}</div>
            </div>
            {session.amount !== undefined && (
              <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
                <Label className="text-right font-semibold col-span-1">Amount:</Label>
                <div className="col-span-2 text-sm">£{session.amount.toFixed(2)}</div>
              </div>
            )}
            <div className="grid grid-cols-3 items-start gap-x-4 gap-y-1">
              <Label className="text-right font-semibold col-span-1 pt-0.5">Status:</Label>
              <div className="col-span-2">
                <Badge variant={session.status === 'Scheduled' ? 'default' : session.status === 'Completed' ? 'secondary' : 'outline'}>
                  {session.status}
                </Badge>
              </div>
            </div>
            {session.notes && (
              <div className="grid grid-cols-3 items-start gap-x-4 gap-y-1">
                <Label className="text-right font-semibold col-span-1 pt-0.5">Notes:</Label>
                <div className="col-span-2 text-sm whitespace-pre-wrap text-muted-foreground">{session.notes}</div>
              </div>
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onEdit(session)} className="flex-1 sm:flex-none">
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="destructive" onClick={() => onDelete(session)} className="flex-1 sm:flex-none">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
          <DialogClose asChild>
             <Button variant="outline" className="flex-1 sm:flex-none">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isAddSessionDialogOpen, setIsAddSessionDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [isSessionDeleteDialogOpen, setIsSessionDeleteDialogOpen] = useState(false);
  const [isSubmittingDialog, setIsSubmittingDialog] = useState<boolean>(false);

  const { toast } = useToast();

  const addSessionForm = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      clientId: '',
      date: undefined,
      time: '',
      sessionType: '',
      amount: undefined,
    }
  });
  
  useEffect(() => {
    if (isAddSessionDialogOpen) {
      addSessionForm.reset({
        clientId: '',
        date: new Date(),
        time: format(new Date(), "HH:mm"),
        sessionType: '',
        amount: undefined,
      });
    }
  }, [isAddSessionDialogOpen, addSessionForm]);

  const { watch: watchSessionForm, setValue: setSessionValue } = addSessionForm;
  const watchedClientId = watchSessionForm("clientId");
  const watchedSessionType = watchSessionForm("sessionType");

  useEffect(() => {
    if (watchedClientId && watchedSessionType && clients.length > 0) {
      const client = clients.find(c => c.id === watchedClientId);
      if (client) {
        let newAmount: number | undefined = undefined;
        const isMember = client.isMember;

        if (watchedSessionType === "In-Person") {
          newAmount = isMember ? 75 : 95;
        } else if (watchedSessionType === "Online") {
          newAmount = isMember ? 50 : 60;
        } else if (watchedSessionType === "Online Catchup") {
          newAmount = 30;
        } else if (watchedSessionType === "Training") {
          newAmount = isMember ? 50 : 60;
        }
        setSessionValue("amount", newAmount);
      }
    }
  }, [watchedClientId, watchedSessionType, clients, setSessionValue]);


  useEffect(() => {
    const fetchData = async () => {
      if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        toast({ title: "Firebase Not Configured", description: "Cannot fetch data.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const [firestoreSessions, firestoreClients] = await Promise.all([
          getSessionsFromFirestore(),
          getClients()
        ]);
        setSessions(firestoreSessions.sort((a, b) => {
            const dateA = parseISO(a.date);
            const dateB = parseISO(b.date);
            if (!isValid(dateA) && !isValid(dateB)) return 0;
            if (!isValid(dateA)) return 1;
            if (!isValid(dateB)) return -1;
            return dateB.getTime() - dateA.getTime();
        }));
        setClients(firestoreClients.sort((a, b) => {
          const nameA = formatFullNameAndDogName(`${a.ownerFirstName} ${a.ownerLastName}`, a.dogName).toLowerCase();
          const nameB = formatFullNameAndDogName(`${b.ownerFirstName} ${b.ownerLastName}`, b.dogName).toLowerCase();
          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          return 0;
        }));
      } catch (err) {
        console.error("Error fetching data:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to load data.";
        setError(errorMessage);
        toast({ title: "Error Loading Data", description: errorMessage, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const handleAddSession: SubmitHandler<SessionFormValues> = async (data) => {
    setIsSubmittingDialog(true);
    const selectedClient = clients.find(c => c.id === data.clientId);
    if (!selectedClient) {
      toast({ title: "Error", description: "Selected client not found.", variant: "destructive" });
      setIsSubmittingDialog(false);
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
      status: 'Scheduled', 
    };

    try {
      const newSession = await addSessionToFirestore(sessionData);
      setSessions(prevSessions => [...prevSessions, newSession].sort((a, b) => {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        if (!isValid(dateA) && !isValid(dateB)) return 0;
        if (!isValid(dateA)) return 1;
        if (!isValid(dateB)) return -1;
        return dateB.getTime() - dateA.getTime();
      }));

      toast({
        title: "Session Added",
        description: `Session with ${formatFullNameAndDogName(sessionData.clientName, sessionData.dogName)} on ${format(data.date, 'PPP')} at ${data.time} has been scheduled.`,
      });
      setIsAddSessionDialogOpen(false);
    } catch (err) {
      console.error("Error adding session to Firestore:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to add session.";
      toast({ title: "Error Adding Session", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmittingDialog(false);
    }
  };

  const groupSessionsByMonth = (sessionsToGroup: Session[]): GroupedSessions => {
    return sessionsToGroup.reduce((acc, session) => {
      const sessionDate = parseISO(session.date);
      if (!isValid(sessionDate)) return acc;
      const monthYear = format(sessionDate, 'MMMM yyyy');
      if (!acc[monthYear]) {
        acc[monthYear] = [];
      }
      acc[monthYear].push(session);
      return acc;
    }, {} as GroupedSessions);
  };

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
  };

  const handleBackToSessionList = () => {
    setSelectedSession(null);
  };

  const handleDeleteSessionRequest = (session: Session | null) => {
    if (!session) return;
    setSessionToDelete(session);
    setIsSessionDeleteDialogOpen(true);
  };

  const handleConfirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    setIsSubmittingDialog(true);
    try {
      await deleteSessionFromFirestore(sessionToDelete.id);
      setSessions(prevSessions => prevSessions.filter(s => s.id !== sessionToDelete.id));
      toast({
        title: "Session Deleted",
        description: `Session with ${formatFullNameAndDogName(sessionToDelete.clientName, sessionToDelete.dogName)} on ${isValid(parseISO(sessionToDelete.date)) ? format(parseISO(sessionToDelete.date), 'PPP') : ''} has been deleted.`,
      });
      if (selectedSession && selectedSession.id === sessionToDelete.id) {
        setSelectedSession(null);
      }
    } catch (err) {
      console.error("Error deleting session from Firestore:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to delete session.";
      toast({ title: "Error Deleting Session", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSessionDeleteDialogOpen(false);
      setSessionToDelete(null);
      setIsSubmittingDialog(false);
    }
  };

  const handleEditSession = (session: Session) => {
    toast({
      title: "Edit Session",
      description: `Edit session for "${formatFullNameAndDogName(session.clientName, session.dogName)} - ${isValid(parseISO(session.date)) ? format(parseISO(session.date), 'PPP') : ''}" (Feature not fully implemented).`,
    });
  };


  if (selectedSession && !isAddSessionDialogOpen && !isSessionDeleteDialogOpen) {
    return <SessionDetailView session={selectedSession} onBack={handleBackToSessionList} onDelete={handleDeleteSessionRequest} onEdit={handleEditSession} />;
  }

  const groupedSessions = groupSessionsByMonth(sessions);
  const sortedMonthKeys = Object.keys(groupedSessions).sort((a, b) => {
    try {
      const dateA = parse(a, 'MMMM yyyy', new Date());
      const dateB = parse(b, 'MMMM yyyy', new Date());
      if (!isValid(dateA) || !isValid(dateB)) return 0;
      return dateB.getTime() - dateA.getTime();
    } catch (e) {
      console.error("Error parsing month keys for sorting:", a, b, e);
      return 0;
    }
  });


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Session Management</h1>
        <Dialog open={isAddSessionDialogOpen} onOpenChange={(isOpen) => {
          setIsAddSessionDialogOpen(isOpen);
          if (isOpen) {
            addSessionForm.reset({
              clientId: '',
              date: new Date(),
              time: format(new Date(), "HH:mm"),
              sessionType: '',
              amount: undefined,
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-5 w-5" />
              Add New Session
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Session</DialogTitle>
              <DialogDescription>
                Schedule a new training session.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={addSessionForm.handleSubmit(handleAddSession)} className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="clientId-sessionpage" className="text-right">Client</Label>
                  <div className="col-span-3">
                    <Controller
                      name="clientId"
                      control={addSessionForm.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} disabled={isSubmittingDialog || isLoading}>
                          <SelectTrigger id="clientId-sessionpage" className={cn("w-full", addSessionForm.formState.errors.clientId ? "border-destructive" : "")}>
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Clients</SelectLabel>
                              {clients.map(client => (
                                <SelectItem key={client.id} value={client.id}>
                                  {formatFullNameAndDogName(`${client.ownerFirstName} ${client.ownerLastName}`, client.dogName)}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {addSessionForm.formState.errors.clientId && <p className="text-xs text-destructive mt-1">{addSessionForm.formState.errors.clientId.message}</p>}
                  </div>
                </div>

               <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="date-sessionpage" className="text-right col-span-1 pt-2 self-start">Date</Label>
                <div className="col-span-3">
                  <Controller
                    name="date"
                    control={addSessionForm.control}
                    render={({ field }) => (
                      <ShadCalendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        disabled={isSubmittingDialog}
                        id="date-sessionpage"
                        className={cn("!p-1 rounded-md border w-full", addSessionForm.formState.errors.date ? "border-destructive" : "")}
                      />
                    )}
                  />
                  {addSessionForm.formState.errors.date && <p className="text-xs text-destructive mt-1">{addSessionForm.formState.errors.date.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time-sessionpage" className="text-right">Time (24h)</Label>
                <div className="col-span-3">
                  <Controller
                    name="time"
                    control={addSessionForm.control}
                    render={({ field }) => (
                      <Input
                        id="time-sessionpage"
                        type="time"
                        {...field}
                        className={cn("w-full", addSessionForm.formState.errors.time ? "border-destructive" : "")}
                        disabled={isSubmittingDialog}
                      />
                    )}
                  />
                  {addSessionForm.formState.errors.time && <p className="text-xs text-destructive mt-1">{addSessionForm.formState.errors.time.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sessionType-sessionpage" className="text-right">Type</Label>
                <div className="col-span-3">
                  <Controller
                    name="sessionType"
                    control={addSessionForm.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value} disabled={isSubmittingDialog}>
                        <SelectTrigger id="sessionType-sessionpage" className={cn("w-full", addSessionForm.formState.errors.sessionType ? "border-destructive" : "")}>
                          <SelectValue placeholder="Select session type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Session Types</SelectLabel>
                            {sessionTypeOptions.map(type => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {addSessionForm.formState.errors.sessionType && <p className="text-xs text-destructive mt-1">{addSessionForm.formState.errors.sessionType.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount-sessionpage" className="text-right">Amount (£)</Label>
                <div className="col-span-3">
                <Controller name="amount" control={addSessionForm.control}
                    render={({ field }) => (
                    <Input 
                        id="amount-sessionpage" 
                        type="number" 
                        placeholder="e.g. 75.50"
                        step="0.01"
                        {...field} 
                        value={field.value === undefined ? '' : String(field.value)}
                        onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                        className={cn("w-full", addSessionForm.formState.errors.amount && "border-destructive")}
                        disabled={isSubmittingDialog} 
                    />
                    )}
                />
                {addSessionForm.formState.errors.amount && <p className="text-xs text-destructive mt-1">{addSessionForm.formState.errors.amount.message}</p>}
                </div>
              </div>


              <DialogFooter className="mt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={isSubmittingDialog}>Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmittingDialog}>
                  {isSubmittingDialog && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Session
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Loading sessions...</p>
        </div>
      )}
      {!isLoading && error && (
        <div className="text-destructive text-center py-10">
          <p>Error loading sessions: {error}</p>
          <p>Please ensure Firebase is configured correctly and you are online.</p>
        </div>
      )}
      {!isLoading && !error && sortedMonthKeys.length === 0 && (
        <p className="text-muted-foreground text-center py-10">No sessions scheduled yet. Add a new session to get started.</p>
      )}
      {!isLoading && !error && sortedMonthKeys.length > 0 && (
        <Accordion type="multiple" className="w-full space-y-0" defaultValue={sortedMonthKeys.length > 0 ? [sortedMonthKeys[0]] : []}>
          {sortedMonthKeys.map((monthYear) => (
            <AccordionItem value={monthYear} key={monthYear} className="bg-card shadow-sm rounded-md mb-2">
              <AccordionTrigger className="text-lg hover:no-underline px-4 py-3 font-semibold">
                {monthYear} ({groupedSessions[monthYear].length} sessions)
              </AccordionTrigger>
              <AccordionContent className="px-4">
                <ul className="space-y-3 pt-2 pb-3">
                  {groupedSessions[monthYear]
                    .sort((a, b) => {
                        const dateA = parseISO(a.date);
                        const dateB = parseISO(b.date);
                        if (!isValid(dateA) || !isValid(dateB)) return 0;
                        const dayDiff = dateA.getDate() - dateB.getDate();
                        if (dayDiff !== 0) return dayDiff;
                        
                        try {
                            const timeA = parse(a.time, 'HH:mm', new Date());
                            const timeB = parse(b.time, 'HH:mm', new Date());
                            return timeA.getTime() - timeB.getTime();
                        } catch { return 0; }
                    })
                    .map(session => (
                      <li
                        key={session.id}
                        className="p-3 rounded-md border bg-background hover:bg-muted/50 transition-colors shadow-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div className="cursor-pointer flex-grow" onClick={() => handleSessionClick(session)}>
                            <h3 className="font-semibold text-base">{formatFullNameAndDogName(session.clientName, session.dogName)}</h3>
                             <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center">
                                    <CalendarIconLucide className="inline-block mr-1.5 h-4 w-4" />
                                    {isValid(parseISO(session.date)) ? format(parseISO(session.date), 'PPP') : 'Invalid Date'}
                                </span>
                                <span className="flex items-center">
                                    <Clock className="inline-block mr-1.5 h-4 w-4" />
                                    {session.time}
                                </span>
                                {session.amount !== undefined && (
                                    <span className="flex items-center">
                                        <DollarSign className="inline-block mr-1.5 h-4 w-4" />
                                        £{session.amount.toFixed(2)}
                                    </span>
                                )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <Badge 
                                variant="default"
                                className="mt-1 whitespace-nowrap"
                              >
                                {session.sessionType}
                              </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSessionClick(session) }}>
                                  <Info className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditSession(session); }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Session
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:bg-destructive focus:text-destructive-foreground data-[highlighted]:bg-destructive data-[highlighted]:text-destructive-foreground"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteSessionRequest(session); }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Session
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      
                      </li>
                    ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <AlertDialog open={isSessionDeleteDialogOpen} onOpenChange={setIsSessionDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the session
              with {sessionToDelete ? formatFullNameAndDogName(sessionToDelete.clientName, sessionToDelete.dogName) : ''} on {sessionToDelete && isValid(parseISO(sessionToDelete.date)) ? format(parseISO(sessionToDelete.date), 'PPP') : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setSessionToDelete(null); setIsSessionDeleteDialogOpen(false); }} disabled={isSubmittingDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteSession} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isSubmittingDialog}>
              {isSubmittingDialog && sessionToDelete ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
