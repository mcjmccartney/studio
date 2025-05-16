"use client";

import type { Client } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, MoreHorizontal, CalendarDays } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';

const mockClients: Client[] = [
  { id: '1', name: 'Alice Wonderland', dogName: 'Cheshire', dogBreed: 'British Shorthair (acting as dog)', contactEmail: 'alice@example.com', contactPhone: '555-0101', lastSession: '2024-07-15', nextSession: '2024-07-29' },
  { id: '2', name: 'Bob The Builder', dogName: 'Scoop', dogBreed: 'Labrador Retriever', contactEmail: 'bob@example.com', contactPhone: '555-0102', lastSession: '2024-07-10', nextSession: '2024-07-24' },
  { id: '3', name: 'Charlie Brown', dogName: 'Snoopy', dogBreed: 'Beagle', contactEmail: 'charlie@example.com', contactPhone: '555-0103', lastSession: '2024-07-18', nextSession: '2024-08-01' },
  { id: '4', name: 'Diana Prince', dogName: 'Krypto (visiting)', dogBreed: 'Golden Retriever', contactEmail: 'diana@example.com', contactPhone: '555-0104', lastSession: '2024-06-20', nextSession: 'Not Scheduled' },
];

export default function ClientsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Clients</h1>
        <Button>
          <PlusCircle className="mr-2 h-5 w-5" />
          Add New Client
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Client List</CardTitle>
          <CardDescription>Manage your clients and their dogs.</CardDescription>
        </CardHeader>
        <CardContent>
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
              {mockClients.map((client) => (
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
        </CardContent>
      </Card>
    </div>
  );
}
