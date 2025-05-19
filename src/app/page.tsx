
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, ChevronLeft, ChevronRight, Search as SearchIcon, Edit, Trash2, Info, X, PawPrint, Tag as TagIcon, ClipboardList, Clock, CalendarDays as CalendarIconLucide, Users as UsersIcon, DollarSign } from "lucide-react";
import { DayPicker, type DateFormatter, type DayProps } from "react-day-picker";
import 'react-day-picker/dist/style.css';
import type { Session, Client } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger,
  SheetFooter,
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
import { format, parseISO, isValid, startOfDay, isSameDay, startOfMonth, addMonths, subMonths, isToday, isFuture, compareAsc, parse, addDays, endOfDay, getDay, differenceInCalendarDays, closestTo } from 'date-fns';
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
  cost: z.preprocess(
    (val) => (String(val).trim() === '' ? undefined : parseFloat(String(val))),
    z.number().nonnegative({ message: "Cost must be a positive number." }).optional()
  ),
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
  const [isAddSessionSheetOpen, setIsAddSessionSheetOpen] = useState(false);
  const [isSubmittingSheet, setIsSubmittingSheet] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  const [isSessionDetailSheetOpen, setIsSessionDetailSheetOpen] = useState(false);
  const [selectedSessionForSheet, setSelectedSessionForSheet] = useState<Session | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [isDeleteSessionDialogOpen, setIsDeleteSessionDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');


  const { toast } = useToast();

  const addSessionForm = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      date: undefined,
      time: '',
      clientId: '',
      sessionType: '',
      cost: undefined,
    }
  });

  useEffect(() => {
    if (isAddSessionSheetOpen) {
        addSessionForm.reset({
            date: new Date(),
            time: format(new Date(), "HH:mm"),
            clientId: '',
            sessionType: '',
            cost: undefined,
        });
    }
  }, [isAddSessionSheetOpen, addSessionForm]);


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
        setClients(firestoreClients.sort((a, b) => (a.ownerLastName > b.ownerLastName) ? 1 : (a.ownerLastName === b.ownerLastName ? ((a.ownerFirstName > b.ownerFirstName) ? 1 : -1) : -1)));
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
      return clientNameMatch || dogNameMatch;
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

    const ownerFullName = `${selectedClient.ownerFirstName} ${selectedClient.ownerLastName}`.trim();
    const sessionData: Omit<Session, 'id' | 'createdAt'> = {
      clientId: data.clientId,
      clientName: ownerFullName,
      dogName: selectedClient.dogName || undefined,
      date: format(data.date, 'yyyy-MM-dd'),
      time: data.time, // Already in HH:mm
      status: 'Scheduled',
      sessionType: data.sessionType,
      cost: data.cost,
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
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-4 w-4" /></Button>
                <h2 className="text-lg font-semibold text-center min-w-[120px]">{format(currentMonth, 'MMMM yyyy')}</h2>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search sessions..."
                        className="h-9 pl-8 w-full max-w-xs sm:max-w-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
              <Sheet open={isAddSessionSheetOpen} onOpenChange={setIsAddSessionSheetOpen}>
                <SheetTrigger asChild>
                  <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add Session</Button>
                </SheetTrigger>
                <SheetContent className="sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Add New Session</SheetTitle>
                    <SheetDescription>Schedule a new session. Select a client, date, time, and session type.</SheetDescription>
                  </SheetHeader>
                  <form onSubmit={addSessionForm.handleSubmit(handleAddSessionSubmit)} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="clientId-dashboard" className="text-right">Client</Label>
                      <div className="col-span-3">
                        <Controller
                          name="clientId" control={addSessionForm.control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value} disabled={isSubmittingSheet || isLoadingData}>
                              <SelectTrigger id="clientId-dashboard" className={cn("w-full", addSessionForm.formState.errors.clientId && "border-destructive")}>
                                <SelectValue placeholder="Select a client" />
                              </SelectTrigger>
                              <SelectContent><SelectGroup><SelectLabel>Clients</SelectLabel>
                                {clients.map(client => (
                                  <SelectItem key={client.id} value={client.id}>
                                    {formatFullNameAndDogName(client.ownerFirstName + " " + client.ownerLastName, client.dogName)}
                                  </SelectItem>
                                ))}
                              </SelectGroup></SelectContent>
                            </Select>
                          )}
                        />
                        {addSessionForm.formState.errors.clientId && <p className="text-xs text-destructive mt-1 col-start-2 col-span-3">{addSessionForm.formState.errors.clientId.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label htmlFor="date-dashboard" className="text-right col-span-1 pt-2 self-start">Date</Label>
                      <div className="col-span-3">
                        <Controller name="date" control={addSessionForm.control}
                          render={({ field }) => (
                            <ShadCalendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              disabled={isSubmittingSheet}
                              id="date-dashboard"
                              className={cn("rounded-md border w-full", addSessionForm.formState.errors.date && "border-destructive")}
                            />
                          )}
                        />
                        {addSessionForm.formState.errors.date && <p className="text-xs text-destructive mt-1">{addSessionForm.formState.errors.date.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="time-dashboard" className="text-right">Time (24h)</Label>
                      <div className="col-span-3">
                      <Controller name="time" control={addSessionForm.control}
                        render={({ field }) => (<Input id="time-dashboard" type="time" {...field} className={cn("w-full", addSessionForm.formState.errors.time && "border-destructive")} disabled={isSubmittingSheet} />)}
                      />
                      {addSessionForm.formState.errors.time && <p className="text-xs text-destructive mt-1 col-start-2 col-span-3">{addSessionForm.formState.errors.time.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="sessionType-dashboard" className="text-right">Type</Label>
                      <div className="col-span-3">
                      <Controller name="sessionType" control={addSessionForm.control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value} disabled={isSubmittingSheet}>
                            <SelectTrigger id="sessionType-dashboard" className={cn("w-full", addSessionForm.formState.errors.sessionType && "border-destructive")}>
                              <SelectValue placeholder="Select session type" />
                            </SelectTrigger>
                            <SelectContent><SelectGroup><SelectLabel>Session Types</SelectLabel>
                              {sessionTypeOptions.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                            </SelectGroup></SelectContent>
                          </Select>
                        )}
                      />
                      {addSessionForm.formState.errors.sessionType && <p className="text-xs text-destructive mt-1 col-start-2 col-span-3">{addSessionForm.formState.errors.sessionType.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cost-dashboard" className="text-right">Cost (£)</Label>
                        <div className="col-span-3">
                        <Controller name="cost" control={addSessionForm.control}
                            render={({ field }) => (
                            <Input 
                                id="cost-dashboard" 
                                type="number" 
                                placeholder="e.g. 75.50"
                                {...field} 
                                value={field.value === undefined ? '' : field.value}
                                onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                                className={cn("w-full", addSessionForm.formState.errors.cost && "border-destructive")} 
                                disabled={isSubmittingSheet} 
                            />
                            )}
                        />
                        {addSessionForm.formState.errors.cost && <p className="text-xs text-destructive mt-1 col-start-2 col-span-3">{addSessionForm.formState.errors.cost.message}</p>}
                        </div>
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
                caption_label: "hidden", 
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
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "ring-2 ring-[#92351f] rounded-md ring-offset-background ring-offset-1",
                day_outside: "text-muted-foreground opacity-50",
              }}
              components={{ DayContent: CustomDayContent }}
            />
          )}
        </CardContent>
      </Card>

      {/* Session Detail Sheet */}
      <Sheet open={isSessionDetailSheetOpen} onOpenChange={(isOpen) => { setIsSessionDetailSheetOpen(isOpen); if (!isOpen) setSelectedSessionForSheet(null); }}>
        <SheetContent className="sm:max-w-lg w-[90vw] max-w-[600px] p-0">
          {selectedSessionForSheet && (
            <>
              <SheetHeader className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <SheetTitle className="text-xl">Session Details</SheetTitle>
                </div>
                <SheetDescription>
                  {formatFullNameAndDogName(selectedSessionForSheet.clientName, selectedSessionForSheet.dogName)}
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-160px)]"> 
                <div className="p-6 space-y-4">
                  <Card>
                    <CardHeader><CardTitle className="text-base flex items-center"><Clock className="mr-2 h-4 w-4 text-primary" /> Date & Time</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p><strong>Date:</strong> {isValid(parseISO(selectedSessionForSheet.date)) ? format(parseISO(selectedSessionForSheet.date), 'EEEE, MMMM do, yyyy') : 'Invalid Date'}</p>
                      <p><strong>Time:</strong> {selectedSessionForSheet.time}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-base flex items-center"><UsersIcon className="mr-2 h-4 w-4 text-primary" /> Client</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p><strong>Name:</strong> {selectedSessionForSheet.clientName}</p>
                      {selectedSessionForSheet.dogName && <p><strong>Dog:</strong> {selectedSessionForSheet.dogName}</p>}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-base flex items-center"><TagIcon className="mr-2 h-4 w-4 text-primary" /> Session Type</CardTitle></CardHeader>
                    <CardContent className="text-sm"><p>{selectedSessionForSheet.sessionType}</p></CardContent>
                  </Card>
                   {selectedSessionForSheet.cost !== undefined && (
                    <Card>
                        <CardHeader><CardTitle className="text-base flex items-center"><DollarSign className="mr-2 h-4 w-4 text-primary" /> Cost</CardTitle></CardHeader>
                        <CardContent className="text-sm"><p>£{selectedSessionForSheet.cost.toFixed(2)}</p></CardContent>
                    </Card>
                   )}
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
              <SheetFooter className="p-6 border-t flex gap-2">
                <Button variant="outline" onClick={() => handleEditSession(selectedSessionForSheet)} className="flex-1">
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button variant="destructive" onClick={() => handleDeleteSessionRequest(selectedSessionForSheet)} className="flex-1" disabled={isSubmittingSheet}>
                  {isSubmittingSheet && sessionToDelete?.id === selectedSessionForSheet.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  Delete
                </Button>
              </SheetFooter>
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
