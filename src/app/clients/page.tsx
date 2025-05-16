
"use client";

import { useState, useEffect } from 'react';
import type { Client, Session } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, MoreHorizontal, CalendarDays, Loader2, User, Dog, Mail, Phone, ClipboardList, History as HistoryIcon, X, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"; // Kept for Add Client Modal
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
import { Textarea } from '@/components/ui/textarea';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
import { getClients, addClientToFirestore } from '@/lib/firebase'; 
import { mockSessions } from '@/lib/mockData'; 
import { format, parseISO, isValid } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

const clientFormSchema = z.object({
  name: z.string().min(2, { message: "Client name must be at least 2 characters." }),
  dogName: z.string().min(1, { message: "Dog name is required." }),
  dogBreed: z.string().min(2, { message: "Dog breed must be at least 2 characters." }),
  contactEmail: z.string().email({ message: "Invalid email address." }),
  contactPhone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  behaviorHistory: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

// Client Detail View Component (can be in the same file or separate)
interface ClientDetailViewProps {
  client: Client;
  sessions: Session[];
  onBack: () => void;
}

function ClientDetailView({ client, sessions, onBack }: ClientDetailViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          {client.name} &amp; {client.dogName}
        </h2>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Client List
        </Button>
      </div>
      
      <ScrollArea className="h-[calc(100vh-200px)] pr-4"> {/* Adjust height as needed */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <User className="mr-2 h-5 w-5 text-primary" /> Client & Dog Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div><strong>Client Name:</strong> {client.name}</div>
                <div><strong>Dog's Name:</strong> {client.dogName}</div>
                <div><strong>Dog's Breed:</strong> {client.dogBreed}</div>
              </div>
              <div className="text-sm pt-2">
                <strong className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground"/>Email:</strong> {client.contactEmail}
              </div>
              <div className="text-sm">
                <strong className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground"/>Phone:</strong> {client.contactPhone}
              </div>
              {client.behaviorHistory && (
                <div className="text-sm pt-2">
                  <strong className="flex items-center"><ClipboardList className="mr-2 h-4 w-4 text-muted-foreground"/>Behavior History:</strong>
                  <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{client.behaviorHistory}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <HistoryIcon className="mr-2 h-5 w-5 text-primary" /> Session History
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
                          <span className="text-muted-foreground"> at {session.time}</span>
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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
  });

  useEffect(() => {
    if (!selectedClient) { // Only fetch clients if no client is selected (i.e., we are in list view)
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
          setClients(firestoreClients.sort((a, b) => (a.name > b.name) ? 1 : -1));
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
  }, [toast, selectedClient]); // Add selectedClient to dependency array

  const handleAddClient: SubmitHandler<ClientFormValues> = async (data) => {
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
      const clientDataForFirestore: Omit<Client, 'id' | 'lastSession' | 'nextSession' | 'createdAt'> = data;
      const newClient = await addClientToFirestore(clientDataForFirestore);
      setClients(prevClients => [...prevClients, newClient].sort((a, b) => (a.name > b.name) ? 1 : -1));
      toast({
        title: "Client Added",
        description: `${newClient.name} has been successfully added.`,
      });
      reset();
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
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Fill in the details below to add a new client to your records.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleAddClient)} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Client Name</Label>
                <div className="col-span-3">
                  <Input id="name" {...register("name")} className={errors.name ? "border-destructive" : ""} disabled={isSubmitting} />
                  {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dogName" className="text-right">Dog's Name</Label>
                 <div className="col-span-3">
                  <Input id="dogName" {...register("dogName")} className={errors.dogName ? "border-destructive" : ""} disabled={isSubmitting} />
                  {errors.dogName && <p className="text-xs text-destructive mt-1">{errors.dogName.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dogBreed" className="text-right">Dog's Breed</Label>
                 <div className="col-span-3">
                  <Input id="dogBreed" {...register("dogBreed")} className={errors.dogBreed ? "border-destructive" : ""} disabled={isSubmitting} />
                  {errors.dogBreed && <p className="text-xs text-destructive mt-1">{errors.dogBreed.message}</p>}
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
                <Label htmlFor="contactPhone" className="text-right">Phone</Label>
                <div className="col-span-3">
                  <Input id="contactPhone" type="tel" {...register("contactPhone")} className={errors.contactPhone ? "border-destructive" : ""} disabled={isSubmitting}/>
                  {errors.contactPhone && <p className="text-xs text-destructive mt-1">{errors.contactPhone.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="behaviorHistory" className="text-right pt-2">Behavior History</Label>
                <div className="col-span-3">
                  <Textarea id="behaviorHistory" {...register("behaviorHistory")} placeholder="Optional: Notes on behavior, training goals, etc." rows={3} disabled={isSubmitting} />
                </div>
              </div>
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
          <CardDescription>Manage your clients and their dogs. Click a row to view details.</CardDescription>
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
              No clients found. Add a new client to get started.
              {!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && " (Firebase may not be configured)"}
            </p>
          )}
          {!isLoading && !error && clients.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Dog Name</TableHead>
                  <TableHead>Dog Breed</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Next Session</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id} onClick={() => handleRowClick(client)} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.dogName}</TableCell>
                    <TableCell>{client.dogBreed}</TableCell>
                    <TableCell>
                      <div>{client.contactEmail}</div>
                      <div className="text-xs text-muted-foreground">{client.contactPhone}</div>
                    </TableCell>
                    <TableCell>
                      {client.nextSession !== 'Not Scheduled' ? (
                        <Badge variant="default">{client.nextSession}</Badge>
                      ) : (
                        <Badge variant="secondary">{client.nextSession}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()} /* Prevents row click */>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={(e) => e.stopPropagation() /* TODO: Implement Edit */}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Client
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => e.stopPropagation() /* TODO: Implement Schedule */}>
                            <CalendarDays className="mr-2 h-4 w-4" />
                            Schedule Session
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive hover:!bg-destructive/10" onClick={(e) => e.stopPropagation() /* TODO: Implement Delete */}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Client
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
