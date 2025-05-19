
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, CalendarDays as CalendarIconLucide, DollarSign as IconDollarSign, Loader2, PlusCircle, ChevronLeft, ChevronRight, Search as SearchIcon, Edit, Trash2, Info, X, PawPrint, Tag as TagIcon, ClipboardList } from "lucide-react";
import { DayPicker, type DateFormatter, type DayProps } from "react-day-picker";
import 'react-day-picker/dist/style.css'; // Base styles for DayPicker
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
  DialogTrigger,
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
import { format, parseISO, isValid, addDays, startOfDay, isWithinInterval, isSameDay, startOfMonth, addMonths, subMonths } from 'date-fns'; 
import { getClients, getSessionsFromFirestore, addSessionToFirestore, deleteSessionFromFirestore } from '@/lib/firebase'; 
import { useToast } from "@/hooks/use-toast"; 
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

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
        setSessions(firestoreSessions.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()));
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        toast({
          title: "Error Loading Dashboard Data",
          description: "Could not fetch client or session data.",
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
      setSessions(prev => [newSession, ...prev].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()));
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
      setIsSessionSheetOpen(false); // Close sheet if open
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
     alert(`Edit session for ${session.clientName} on ${format(parseISO(session.date), 'PPP')} (not implemented).`);
  };

  const activeClientsCount = isLoadingData ? 0 : clients.filter(client => client.isActive === true || client.isActive === undefined).length;
  
  const today = startOfDay(new Date());
  const oneWeekFromToday = addDays(today, 6); 

  const upcomingSessionsCount = isLoadingData ? 0 : sessions.filter(session => {
    if (session.status !== 'Scheduled') return false;
    const sessionDate = parseISO(session.date);
    if (!isValid(sessionDate)) return false;
    return isWithinInterval(startOfDay(sessionDate), { start: today, end: oneWeekFromToday });
  }).length;
  
  const incomeThisMonth = 2350.00; // Placeholder

  const formatCaption: DateFormatter = (month) => {
    return format(month, 'MMMM yyyy');
  };

  function CustomDayContent(props: DayProps) {
    const daySessions = sessions.filter(s => isSameDay(parseISO(s.date), props.date));
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
                {session.time} - {session.clientName}
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
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingData ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary my-1" />
            ) : (
                <div className="text-2xl font-bold">{activeClientsCount}</div>
            )}
            <p className="text-xs text-muted-foreground">Manage your client base</p>
            <Button asChild variant="outline" size="sm" className="mt-4"><Link href="/clients">Manage Clients</Link></Button>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
            <CalendarIconLucide className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoadingData ? ( <Loader2 className="h-6 w-6 animate-spin text-primary my-1" /> ) : ( <div className="text-2xl font-bold">{upcomingSessionsCount} This Week</div> )}
            <p className="text-xs text-muted-foreground">View your schedule</p>
            <Button asChild variant="outline" size="sm" className="mt-4"><Link href="/sessions">View Sessions</Link></Button>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finance Overview</CardTitle>
            <IconDollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{incomeThisMonth.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Income this month</p>
            <Button asChild variant="outline" size="sm" className="mt-4"><Link href="/finance">Track Finances</Link></Button>
          </CardContent>
        </Card>
      </div>

      {/* New Large Calendar Section */}
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-x-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <h2 className="text-xl font-semibold text-center min-w-[150px]">{format(currentMonth, 'MMMM yyyy')}</h2>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="flex items-center gap-2">
            {/* <Input type="search" placeholder="Search sessions..." className="h-9 md:w-[200px] lg:w-[250px]" /> */}
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
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 justify-center",
                month: "space-y-4 w-full",
                caption_label: "hidden", // Hidden as we have custom month/year display
                nav_button: "h-8 w-8",
                nav_button_previous: "absolute left-2 top-1/2 -translate-y-1/2",
                nav_button_next: "absolute right-2 top-1/2 -translate-y-1/2",
                table: "w-full border-collapse",
                head_row: "flex border-b",
                head_cell: "text-muted-foreground font-normal text-xs w-[14.28%] text-center p-2", // Adjusted width for 7 days
                row: "flex w-full mt-0 border-b last:border-b-0",
                cell: "w-[14.28%] text-center text-sm p-0 relative border-r last:border-r-0 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-full w-full p-0",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
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
              <Label htmlFor="clientId" className="text-right">Client</Label>
              <div className="col-span-3">
                <Controller
                  name="clientId" control={addSessionForm.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmittingModal || isLoadingData}>
                      <SelectTrigger className={cn(addSessionForm.formState.errors.clientId && "border-destructive")}>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent><SelectGroup><SelectLabel>Clients</SelectLabel>
                        {clients.map(client => (<SelectItem key={client.id} value={client.id}>{client.ownerFirstName} {client.ownerLastName} (Dog: {client.dogName || 'N/A'})</SelectItem>))}
                      </SelectGroup></SelectContent>
                    </Select>
                  )}
                />
                {addSessionForm.formState.errors.clientId && <p className="text-xs text-destructive mt-1">{addSessionForm.formState.errors.clientId.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="date" className="text-right pt-2">Date</Label>
              <div className="col-span-3">
                <Controller name="date" control={addSessionForm.control}
                  render={({ field }) => (
                    <DayPicker mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={isSubmittingModal} className={cn("rounded-md border w-full inline-block", addSessionForm.formState.errors.date && "border-destructive")} />
                  )}
                />
                {addSessionForm.formState.errors.date && <p className="text-xs text-destructive mt-1">{addSessionForm.formState.errors.date.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">Time (24h)</Label>
              <div className="col-span-3">
                <Controller name="time" control={addSessionForm.control}
                  render={({ field }) => (<Input id="time" type="time" {...field} className={cn(addSessionForm.formState.errors.time && "border-destructive")} disabled={isSubmittingModal}/>)}
                />
                {addSessionForm.formState.errors.time && <p className="text-xs text-destructive mt-1">{addSessionForm.formState.errors.time.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sessionType" className="text-right">Type</Label>
              <div className="col-span-3">
                <Controller name="sessionType" control={addSessionForm.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmittingModal}>
                      <SelectTrigger className={cn(addSessionForm.formState.errors.sessionType && "border-destructive")}>
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
                  {selectedSessionForSheet.clientName} & {selectedSessionForSheet.dogName}
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-160px)]"> {/* Adjusted height */}
                <div className="p-6 space-y-4">
                  <Card>
                    <CardHeader><CardTitle className="text-base flex items-center"><CalendarIconLucide className="mr-2 h-4 w-4 text-primary" /> Date & Time</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p><strong>Date:</strong> {format(parseISO(selectedSessionForSheet.date), 'EEEE, MMMM do, yyyy')}</p>
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
              This will permanently delete the session with {sessionToDelete?.clientName} on {sessionToDelete && isValid(parseISO(sessionToDelete.date)) ? format(parseISO(sessionToDelete.date), 'PPP') : ''}.
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

    