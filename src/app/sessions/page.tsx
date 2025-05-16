
"use client";

import { useState, useEffect } from 'react';
import type { Session, Client } from '@/lib/types';
import { mockSessions as initialMockSessions, mockClients, addSession as apiAddSession, deleteSession as apiDeleteSession } from '@/lib/mockData'; // Added deleteSession
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isValid } from 'date-fns';
import { PlusCircle, Clock, CalendarDays as CalendarIconLucide, ArrowLeft, Users, PawPrint, Info, ClipboardList, MoreHorizontal, Edit, Trash2, Loader2 } from 'lucide-react'; // Added MoreHorizontal, Edit, Trash2
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
} from "@/components/ui/alert-dialog"; // Added AlertDialog
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Added DropdownMenu
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';

const sessionFormSchema = z.object({
  clientId: z.string().min(1, { message: "Client selection is required." }),
  date: z.date({ required_error: "Session date is required." }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s(AM|PM)$/i, { message: "Invalid time format. Use HH:MM AM/PM." }),
});

type SessionFormValues = z.infer<typeof sessionFormSchema>;

interface GroupedSessions {
  [monthYear: string]: Session[];
}

// Session Detail View Component
interface SessionDetailViewProps {
  session: Session;
  onBack: () => void;
  onDelete: (session: Session) => void; // Add onDelete prop
}

function SessionDetailView({ session, onBack, onDelete }: SessionDetailViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Session Details</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => alert("Edit session functionality to be implemented.")}>
            <Edit className="mr-2 h-4 w-4" /> Edit Session
          </Button>
           <Button variant="destructive" onClick={() => onDelete(session)}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete Session
          </Button>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sessions
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)] pr-4">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Users className="mr-2 h-5 w-5 text-primary" /> Client & Dog
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><strong>Client:</strong> {session.clientName}</div>
              <div><strong>Dog:</strong> {session.dogName} <PawPrint className="inline h-4 w-4 ml-1 text-muted-foreground" /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <CalendarIconLucide className="mr-2 h-5 w-5 text-primary" /> Date & Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><strong>Date:</strong> {isValid(parseISO(session.date)) ? format(parseISO(session.date), 'EEEE, MMMM do, yyyy') : 'Invalid Date'}</div>
              <div><strong>Time:</strong> {session.time}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Info className="mr-2 h-5 w-5 text-primary" /> Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                variant={
                  session.status === 'Scheduled' ? 'default' :
                  session.status === 'Completed' ? 'secondary' : 'outline'
                }
                className="text-sm px-3 py-1"
              >
                {session.status}
              </Badge>
            </CardContent>
          </Card>

          {session.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <ClipboardList className="mr-2 h-5 w-5 text-primary" /> Session Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="whitespace-pre-wrap text-muted-foreground">{session.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}


export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>(initialMockSessions);
  const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [isSessionDeleteDialogOpen, setIsSessionDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      date: new Date(),
      time: format(new Date(), "hh:mm a")
    }
  });

  useEffect(() => {
    setSessions(initialMockSessions.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()));
  }, []);

  const handleAddSession: SubmitHandler<SessionFormValues> = (data) => {
    const selectedClient = mockClients.find(c => c.id === data.clientId);
    if (!selectedClient) {
      toast({ title: "Error", description: "Selected client not found.", variant: "destructive" });
      return;
    }
    
    const sessionData = {
      clientId: data.clientId,
      date: format(data.date, 'yyyy-MM-dd'),
      time: data.time,
    };

    const newSession = apiAddSession(sessionData, selectedClient);
    setSessions(prevSessions => [...prevSessions, newSession].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()));
    
    toast({
      title: "Session Added",
      description: `Session with ${selectedClient.ownerFirstName} ${selectedClient.ownerLastName} on ${format(data.date, 'PPP')} at ${data.time} has been scheduled.`,
    });
    reset({ date: new Date(), time: format(new Date(), "hh:mm a"), clientId: '' });
    setIsAddSessionModalOpen(false);
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
  
  const handleDeleteSession = (session: Session | null) => {
    if (!session) return;
    setSessionToDelete(session);
    setIsSessionDeleteDialogOpen(true);
  };

  const handleConfirmDeleteSession = () => {
    if (!sessionToDelete) return;
    apiDeleteSession(sessionToDelete.id); // This will modify mockSessions in mockData.ts
    setSessions(prevSessions => prevSessions.filter(s => s.id !== sessionToDelete.id));
    toast({
      title: "Session Deleted",
      description: `Session with ${sessionToDelete.clientName} on ${format(parseISO(sessionToDelete.date), 'PPP')} has been deleted.`,
    });
    setIsSessionDeleteDialogOpen(false);
    setSessionToDelete(null);
    if (selectedSession && selectedSession.id === sessionToDelete.id) {
      setSelectedSession(null); // Go back to list if the detailed view session was deleted
    }
  };


  if (selectedSession) {
    return <SessionDetailView session={selectedSession} onBack={handleBackToSessionList} onDelete={handleDeleteSession} />;
  }

  const groupedSessions = groupSessionsByMonth(sessions);
  const sortedMonthKeys = Object.keys(groupedSessions).sort((a,b) => {
    const dateA = parseISO(`01 ${a}`); 
    const dateB = parseISO(`01 ${b}`);
    return dateB.getTime() - dateA.getTime(); 
  });


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Session Management</h1>
        <Dialog open={isAddSessionModalOpen} onOpenChange={setIsAddSessionModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-5 w-5" />
              Add New Session
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Add New Session</DialogTitle>
              <DialogDescription>
                Schedule a new training session. Select a client, date, and time.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleAddSession)} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clientId" className="text-right">Client</Label>
                <div className="col-span-3">
                  <Controller
                    name="clientId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                        <SelectTrigger className={cn(errors.clientId ? "border-destructive" : "")}>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Clients</SelectLabel>
                            {mockClients.map(client => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.ownerFirstName} {client.ownerLastName} (Dog: {client.dogName || 'N/A'})
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.clientId && <p className="text-xs text-destructive mt-1">{errors.clientId.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">Date</Label>
                <div className="col-span-3">
                  <Controller
                    name="date"
                    control={control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground",
                              errors.date ? "border-destructive" : ""
                            )}
                            disabled={isSubmitting}
                          >
                            <CalendarIconLucide className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <ShadCalendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            disabled={isSubmitting}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {errors.date && <p className="text-xs text-destructive mt-1">{errors.date.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className="text-right">Time</Label>
                <div className="col-span-3">
                   <Controller
                    name="time"
                    control={control}
                    render={({ field }) => (
                        <Input 
                            id="time" 
                            type="time" 
                            value={field.value ? format(parseISO(`1970-01-01T${field.value.replace(/( AM| PM)/i, '')}`), 'HH:mm') : ''}
                            onChange={(e) => {
                                const time24 = e.target.value; 
                                if (time24) {
                                    const [hours, minutes] = time24.split(':');
                                    const dateForFormatting = new Date(1970,0,1, parseInt(hours), parseInt(minutes));
                                    field.onChange(format(dateForFormatting, "hh:mm a"));
                                } else {
                                    field.onChange('');
                                }
                            }}
                            className={cn("w-full", errors.time ? "border-destructive" : "")}
                            disabled={isSubmitting}
                        />
                    )}
                  />
                  {errors.time && <p className="text-xs text-destructive mt-1">{errors.time.message}</p>}
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                   <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Session
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Sessions</CardTitle>
          <CardDescription>Browse sessions organized by month. Click a session to view details.</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedMonthKeys.length > 0 ? (
            <Accordion type="multiple" className="w-full" defaultValue={sortedMonthKeys.length > 0 ? [sortedMonthKeys[0]] : []}>
              {sortedMonthKeys.map((monthYear) => (
                <AccordionItem value={monthYear} key={monthYear}>
                  <AccordionTrigger className="text-lg font-medium hover:no-underline">
                    {monthYear} ({groupedSessions[monthYear].length} sessions)
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-4 pt-2">
                      {groupedSessions[monthYear]
                        .sort((a,b) => parseISO(a.date).getDate() - parseISO(b.date).getDate()) 
                        .map(session => (
                        <li 
                          key={session.id} 
                          className="p-4 rounded-md border bg-card hover:bg-muted/50 transition-colors shadow-sm"
                        >
                          <div className="flex justify-between items-start">
                            <div className="cursor-pointer flex-grow" onClick={() => handleSessionClick(session)}>
                              <h3 className="font-semibold text-base">{session.clientName} & {session.dogName}</h3>
                              <p className="text-sm text-muted-foreground">
                                <CalendarIconLucide className="inline-block mr-1.5 h-4 w-4" />
                                {isValid(parseISO(session.date)) ? format(parseISO(session.date), 'EEEE, MMMM do, yyyy') : 'Invalid Date'}
                                <Clock className="inline-block ml-3 mr-1.5 h-4 w-4" />
                                {session.time}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={session.status === 'Scheduled' ? 'default' : 'secondary'} className="mt-1 whitespace-nowrap">
                                {session.status}
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
                                    <DropdownMenuItem onClick={(e) => {e.stopPropagation(); handleSessionClick(session)}}>
                                        <Info className="mr-2 h-4 w-4" />
                                        View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => {e.stopPropagation(); alert('Edit session functionality to be implemented.');}}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Session
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                        className="text-destructive data-[highlighted]:bg-destructive data-[highlighted]:text-destructive-foreground"
                                        onClick={(e) => {e.stopPropagation(); handleDeleteSession(session);}}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Session
                                    </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                          </div>
                          {session.notes && (
                            <p className="mt-2 text-sm text-muted-foreground border-t pt-2 cursor-pointer" onClick={() => handleSessionClick(session)}>Notes: {session.notes}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-muted-foreground text-center py-10">No sessions scheduled yet. Add a new session to get started.</p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isSessionDeleteDialogOpen} onOpenChange={setIsSessionDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the session
              with {sessionToDelete?.clientName} on {sessionToDelete ? format(parseISO(sessionToDelete.date), 'PPP') : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSessionToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteSession} className="bg-destructive hover:bg-destructive/90">
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    