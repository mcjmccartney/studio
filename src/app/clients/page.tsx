
"use client";

import { useState, useEffect } from 'react';
import type { Client } from '@/lib/types';
// Removed initialMockClients import, will fetch from Firestore
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, MoreHorizontal, CalendarDays, Loader2 } from 'lucide-react';
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
import { getClients, addClientToFirestore } from '@/lib/firebase'; // Firebase functions

const clientFormSchema = z.object({
  name: z.string().min(2, { message: "Client name must be at least 2 characters." }),
  dogName: z.string().min(1, { message: "Dog name is required." }),
  dogBreed: z.string().min(2, { message: "Dog breed must be at least 2 characters." }),
  contactEmail: z.string().email({ message: "Invalid email address." }),
  contactPhone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  behaviorHistory: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
  });

  useEffect(() => {
    const fetchClients = async () => {
      if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        toast({
          title: "Firebase Not Configured",
          description: "Firebase project ID is missing. Cannot fetch clients.",
          variant: "destructive",
        });
        setIsLoading(false);
        setClients([]); // Set to empty or load mock data if preferred
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const firestoreClients = await getClients();
        setClients(firestoreClients);
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
  }, [toast]);

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
      // Type assertion for data to match the expected input for addClientToFirestore
      const clientDataForFirestore: Omit<Client, 'id' | 'lastSession' | 'nextSession' | 'createdAt'> = data;
      const newClient = await addClientToFirestore(clientDataForFirestore);
      setClients(prevClients => [...prevClients, newClient]);
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
          <CardDescription>Manage your clients and their dogs.</CardDescription>
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
                  <TableRow key={client.id}>
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
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Client
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CalendarDays className="mr-2 h-4 w-4" />
                            Schedule Session
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive hover:!bg-destructive/10">
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
