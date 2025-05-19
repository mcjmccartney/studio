
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CalendarDays as CalendarIconLucide, DollarSign as IconDollarSign, Loader2, PlusCircle, ChevronLeft, ChevronRight, Search as SearchIcon, Edit, Trash2, Info, X, PawPrint, Tag as TagIcon, ClipboardList, Clock } from "lucide-react";
import { DayPicker, type DateFormatter, type DayProps } from "react-day-picker";
import 'react-day-picker/dist/style.css'; 
import type { Session, Client } from '@/lib/types'; 
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO, isValid, addDays, startOfDay, isWithinInterval, isSameDay, startOfMonth, addMonths, subMonths, isToday, isFuture, compareAsc } from 'date-fns'; 
import { getClients, getSessionsFromFirestore, addSessionToFirestore, deleteSessionFromFirestore } from '@/lib/firebase'; 
import { useToast } from "@/hooks/use-toast"; 
import { cn, formatFullNameAndDogName } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar as ShadCalendar } from "@/components/ui/calendar";


const sessionFormSchema = z.object({
  clientId: z.string().min(1, { message: "Client selection is required." }),
  date: z.date({ required_error: "Session date is required." }),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format. Use HH:MM (24-hour)." }),
  sessionType: z.string().min(1, { message: "Session type is required." }),
});
type SessionFormValues = z.infer<typeof sessionFormSchema>;

const sessionTypeOptions = [
  "In-Person", "Online", "Training", "Online Catchup", 
  "Group", "Phone Call", "RMR Live", "Coaching"
];

export default function HomePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState(false);
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);
  
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  
  const [isSessionSheetOpen, setIsSessionSheetOpen] = useState(false);
  const [selectedSessionForSheet, setSelectedSessionForSheet] = useState<Session | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [isDeleteSessionDialogOpen, setIsDeleteSessionDialogOpen] = useState(false);

  const { toast } = useToast();

  const addSessionForm = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      date: undefined, 
      time: '',
      clientId: '',
      sessionType: '',
    }
  });

 useEffect(() => {
    if (isAddSessionModalOpen) {
      addSessionForm.reset({
        date: new Date(),
        time: format(new Date(), "HH:mm"),
        clientId: '',
        sessionType: '',
      });
    }
  }, [isAddSessionModalOpen, addSessionForm]);


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
        setClients(firestoreClients);
        setSessions(firestoreSessions.sort((a, b) => {
            const dateA = parseISO(a.date);
            const dateB = parseISO(b.date);
            if (!isValid(dateA) && !isValid(dateB)) return 0;
            if (!isValid(dateA)) return 1; 
            if (!isValid(dateB)) return -1; 
            return dateB.getTime() - dateA.getTime();
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

  const handleAddSessionSubmit: SubmitHandler<SessionFormValues> = async (data) => {
    setIsSubmittingModal(true);
    const selectedClient = clients.find(c => c.id === data.clientId);
    if (!selectedClient) {
      toast({ title: "Error", description: "Selected client not found.", variant: "destructive" });
      setIsSubmittingModal(false);
      return;
    }

    const sessionData: Omit<Session, 'id' | 'createdAt'> = {
      clientId: data.clientId,
      clientName: `${selectedClient.ownerFirstName} ${selectedClient.ownerLastName}`,
      dogName: selectedClient.dogName || 'N/A',
      date: format(data.date, 'yyyy-MM-dd'),
      time: data.time,
      status: 'Scheduled',
      sessionType: data.sessionType,
    };

    try {
      const newSession = await addSessionToFirestore(sessionData);
      setSessions(prev => [newSession, ...prev].sort((a, b) => {
            const dateA = parseISO(a.date);
            const dateB = parseISO(b.date);
            if (!isValid(dateA) && !isValid(dateB)) return 0;
            if (!isValid(dateA)) return 1;
            if (!isValid(dateB)) return -1;
            return dateB.getTime() - dateA.getTime();
        }));
      toast({ title: "Session Added", description: `Session on ${format(data.date, 'PPP')} at ${data.time} scheduled.` });
      setIsAddSessionModalOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add session.";
      toast({ title: "Error Adding Session", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmittingModal(false);
    }
  };

  const handleDeleteSessionRequest = (session: Session) => {
    setSessionToDelete(session);
    setIsDeleteSessionDialogOpen(true);
  };

  const handleConfirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    setIsSubmittingModal(true);
    try {
      await deleteSessionFromFirestore(sessionToDelete.id);
      setSessions(prev => prev.filter(s => s.id !== sessionToDelete.id));
      toast({ title: "Session Deleted", description: "The session has been deleted." });
      setIsSessionSheetOpen(false); 
      setSelectedSessionForSheet(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete session.";
      toast({ title: "Error Deleting Session", description: errorMessage, variant: "destructive" });
    } finally {
      setIsDeleteSessionDialogOpen(false);
      setSessionToDelete(null);
      setIsSubmittingModal(false);
    }
  };
  
  const handleEditSession = (session: Session) => {
     alert(`Edit session for ${formatFullNameAndDogName(session.clientName, session.dogName)} on ${format(parseISO(session.date), 'PPP')} (not implemented).`);
  };
  
  const nextUpcomingSession = useMemo(() => {
    if (!sessions || sessions.length === 0) return null;
    return sessions
      .filter(s => {
          const sessionDate = parseISO(s.date);
          return s.status === 'Scheduled' && 
                 isValid(sessionDate) && 
                 (isToday(sessionDate) || isFuture(sessionDate));
      })
      .sort((a, b) => {
        const dateA = parseISO(a.date);
        const timeA = a.time; // HH:mm
        const dateTimeA = isValid(dateA) ? new Date(`${format(dateA, 'yyyy-MM-dd')}T${timeA}:00`) : new Date(0);

        const dateB = parseISO(b.date);
        const timeB = b.time; // HH:mm
        const dateTimeB = isValid(dateB) ? new Date(`${format(dateB, 'yyyy-MM-dd')}T${timeB}:00`) : new Date(0);
        
        if (!isValid(dateTimeA) && !isValid(dateTimeB)) return 0;
        if (!isValid(dateTimeA)) return 1;
        if (!isValid(dateTimeB)) return -1;
        
        return compareAsc(dateTimeA, dateTimeB);
      })[0] || null;
  }, [sessions]);


  const formatCaption: DateFormatter = (month) => {
    return format(month, 'MMMM yyyy');
  };

  function CustomDayContent(props: DayProps) {
    const daySessions = sessions.filter(s => {
        const sessionDate = parseISO(s.date);
        return isValid(sessionDate) && isSameDay(sessionDate, props.date);
    });
    return (
      <div className="relative h-full min-h-[6rem] p-1 flex flex-col items-start">
        <div className="absolute top-1 right-1 text-xs text-muted-foreground">{format(props.date, 'd')}</div>
        {daySessions.length > 0 && (
          <ScrollArea className="w-full mt-4 pr-1">
            <div className="space-y-1">
            {daySessions.map(session => (
              <Badge
                key={session.id}
                className="block w-full text-left text-xs p-1 truncate cursor-pointer bg-primary text-primary-foreground hover:bg-primary/80"
                onClick={() => { setSelectedSessionForSheet(session); setIsSessionSheetOpen(true); }}
              >
                {session.time} - {formatFullNameAndDogName(session.clientName, session.dogName)}
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
      
      {isLoadingData ? (
        <div className="flex justify-center items-center py-10">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : nextUpcomingSession ? (
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center"><CalendarIconLucide className="mr-2 h-4 w-4 text-primary" />Next Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-semibold">{formatFullNameAndDogName(nextUpcomingSession.clientName, nextUpcomingSession.dogName)}</p>
            <p><Clock className="inline h-4 w-4 mr-1.5 text-muted-foreground" />{format(parseISO(nextUpcomingSession.date), 'PPP')} at {nextUpcomingSession.time}</p>
            <p><TagIcon className="inline h-4 w-4 mr-1.5 text-muted-foreground" />{nextUpcomingSession.sessionType}</p>
          </CardContent>
        </Card>
      ) : (
         <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-3">
             <CardTitle className="text-base font-medium flex items-center"><CalendarIconLucide className="mr-2 h-4 w-4 text-primary" />Next Session</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No upcoming sessions scheduled.</p>
          </CardContent>
        </Card>
      )}


      {/* Large Calendar Section */}
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-x-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <h2 className="text-xl font-semibold text-center min-w-[150px]">{format(currentMonth, 'MMMM yyyy')}</h2>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="flex items-center gap-2">
            <Input type="search" placeholder="Search sessions..." className="h-9 md:w-[200px] lg:w-[250px]" />
            <Button onClick={() => setIsAddSessionModalOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Add Session</Button>
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
              className="w-full p-4"
              classNames={{
                caption: "hidden", 
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 justify-center",
                month: "space-y-4 w-full",
                nav_button: "h-8 w-8",
                nav_button_previous: "absolute left-2 top-1/2 -translate-y-1/2",
                nav_button_next: "absolute right-2 top-1/2 -translate-y-1/2",
                table: "w-full border-collapse",
                head_row: "flex border-b",
                head_cell: "text-muted-foreground font-normal text-xs w-[14.28%] text-center p-2", 
                row: "flex w-full mt-0 border-b last:border-b-0",
                cell: "w-[14.28%] text-center text-sm p-0 relative border-r last:border-r-0 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-full w-full p-0",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "ring-2 ring-destructive ring-offset-background ring-offset-1",
                day_outside: "text-muted-foreground opacity-50",
              }}
              components={{ DayContent: CustomDayContent }}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Session Modal */}
       <Dialog open={isAddSessionModalOpen} onOpenChange={setIsAddSessionModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Add New Session</DialogTitle>
            <DialogDescription>Schedule a new session. Select a client, date, time, and session type.</DialogDescription>
          </DialogHeader>
          <form onSubmit={addSessionForm.handleSubmit(handleAddSessionSubmit)} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clientId-dashboard" className="text-right">Client</Label>
              <div className="col-span-3">
                <Controller
                  name="clientId" control={addSessionForm.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmittingModal || isLoadingData}>
                      <SelectTrigger id="clientId-dashboard" className={cn(addSessionForm.formState.errors.clientId && "border-destructive")}>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent><SelectGroup><SelectLabel>Clients</SelectLabel>
                        {clients.map(client => {
                          const ownerFullName = `${client.ownerFirstName} ${client.ownerLastName}`.trim();
                          return (
                            <SelectItem key={client.id} value={client.id}>
                              {formatFullNameAndDogName(ownerFullName, client.dogName)}
                            </SelectItem>
                          );
                        })}
                      </SelectGroup></SelectContent>
                    </Select>
                  )}
                />
                {addSessionForm.formState.errors.clientId && <p className="text-xs text-destructive mt-1">{addSessionForm.formState.errors.clientId.message}</p>}
              </div>
            </div>
             <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="date-dashboard" className="text-right pt-2">Date</Label>
              <div className="col-span-3">
                <Controller name="date" control={addSessionForm.control}
                  render={({ field }) => (
                    <ShadCalendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={isSubmittingModal} id="date-dashboard" className={cn("rounded-md border w-full inline-block", addSessionForm.formState.errors.date && "border-destructive")} />
                  )}
                />
                {addSessionForm.formState.errors.date && <p className="text-xs text-destructive mt-1">{addSessionForm.formState.errors.date.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time-dashboard" className="text-right">Time (24h)</Label>
              <div className="col-span-3">
                <Controller name="time" control={addSessionForm.control}
                  render={({ field }) => (<Input id="time-dashboard" type="time" {...field} className={cn(addSessionForm.formState.errors.time && "border-destructive")} disabled={isSubmittingModal}/>)}
                />
                {addSessionForm.formState.errors.time && <p className="text-xs text-destructive mt-1">{addSessionForm.formState.errors.time.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sessionType-dashboard" className="text-right">Type</Label>
              <div className="col-span-3">
                <Controller name="sessionType" control={addSessionForm.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmittingModal}>
                      <SelectTrigger id="sessionType-dashboard" className={cn(addSessionForm.formState.errors.sessionType && "border-destructive")}>
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
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmittingModal}>Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmittingModal}>
                {isSubmittingModal && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Session
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Session Detail Sheet */}
      <Sheet open={isSessionSheetOpen} onOpenChange={(isOpen) => { setIsSessionSheetOpen(isOpen); if (!isOpen) setSelectedSessionForSheet(null); }}>
        <SheetContent className="sm:max-w-lg w-[90vw] max-w-[600px] p-0">
          {selectedSessionForSheet && (
            <>
              <SheetHeader className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <SheetTitle className="text-xl">Session Details</SheetTitle>
                  <SheetClose asChild><Button variant="ghost" size="icon" className="h-7 w-7"><X className="h-4 w-4" /></Button></SheetClose>
                </div>
                <SheetDescription>
                  {formatFullNameAndDogName(selectedSessionForSheet.clientName, selectedSessionForSheet.dogName)}
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-160px)]">
                <div className="p-6 space-y-4">
                  <Card>
                    <CardHeader><CardTitle className="text-base flex items-center"><CalendarIconLucide className="mr-2 h-4 w-4 text-primary" /> Date & Time</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p><strong>Date:</strong> {isValid(parseISO(selectedSessionForSheet.date)) ? format(parseISO(selectedSessionForSheet.date), 'EEEE, MMMM do, yyyy') : 'Invalid Date'}</p>
                      <p><strong>Time:</strong> {selectedSessionForSheet.time}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-base flex items-center"><TagIcon className="mr-2 h-4 w-4 text-primary" /> Session Type</CardTitle></CardHeader>
                    <CardContent className="text-sm"><p>{selectedSessionForSheet.sessionType}</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-base flex items-center"><Info className="mr-2 h-4 w-4 text-primary" /> Status</CardTitle></CardHeader>
                    <CardContent>
                      <Badge variant={selectedSessionForSheet.status === 'Scheduled' ? 'default' : selectedSessionForSheet.status === 'Completed' ? 'secondary' : 'outline'}>
                        {selectedSessionForSheet.status}
                      </Badge>
                    </CardContent>
                  </Card>
                  {selectedSessionForSheet.notes && (
                    <Card>
                      <CardHeader><CardTitle className="text-base flex items-center"><ClipboardList className="mr-2 h-4 w-4 text-primary" /> Notes</CardTitle></CardHeader>
                      <CardContent className="text-sm"><p className="whitespace-pre-wrap text-muted-foreground">{selectedSessionForSheet.notes}</p></CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
              <div className="p-6 border-t flex gap-2">
                  <Button variant="outline" onClick={() => handleEditSession(selectedSessionForSheet)} className="flex-1">
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  <Button variant="destructive" onClick={() => handleDeleteSessionRequest(selectedSessionForSheet)} className="flex-1">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Session Confirmation Dialog */}
      <AlertDialog open={isDeleteSessionDialogOpen} onOpenChange={setIsDeleteSessionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the session with {selectedSessionForSheet ? formatFullNameAndDogName(selectedSessionForSheet.clientName, selectedSessionForSheet.dogName) : 'this client'} on {selectedSessionForSheet && isValid(parseISO(selectedSessionForSheet.date)) ? format(parseISO(selectedSessionForSheet.date), 'PPP') : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteSessionDialogOpen(false)} disabled={isSubmittingModal}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteSession} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isSubmittingModal}>
              {isSubmittingModal && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
