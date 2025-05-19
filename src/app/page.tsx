
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, CalendarDays, DollarSign as IconDollarSign, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import type { Session, Client } from '@/lib/types'; // Added Client
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isValid, addDays, startOfDay, isWithinInterval } from 'date-fns'; // Added date-fns functions
import { mockSessions } from '@/lib/mockData'; 
import { getClients } from '@/lib/firebase'; // Added getClients
import { useToast } from "@/hooks/use-toast"; // Added useToast

export default function HomePage() {
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(new Date());
  const [currentSessions, setCurrentSessions] = useState<Session[]>(mockSessions); // Keep using mock for sessions for now
  
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchClientsForDashboard = async () => {
      if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        // No need to toast here, clients page already handles this.
        // Keep dashboard functional with mock/default counts.
        setIsLoadingClients(false);
        return;
      }
      try {
        setIsLoadingClients(true);
        const firestoreClients = await getClients();
        setClients(firestoreClients);
      } catch (err) {
        console.error("Error fetching clients for dashboard:", err);
        // Optionally toast, or just log and let counts be based on empty/mock.
        toast({
          title: "Error Loading Client Data",
          description: "Could not fetch client data for dashboard stats.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingClients(false);
      }
    };
    fetchClientsForDashboard();
  }, [toast]);

  const selectedDateString = selectedCalendarDate && isValid(selectedCalendarDate) ? format(selectedCalendarDate, 'yyyy-MM-dd') : null;
  const sessionsOnSelectedDate = selectedDateString 
    ? currentSessions.filter(s => s.date === selectedDateString)
    : [];
  
  const allSessionDates = currentSessions.map(s => parseISO(s.date)).filter(isValid);

  // Calculate stats
  const activeClientsCount = isLoadingClients ? 0 : clients.filter(client => client.isActive === true || client.isActive === undefined).length;
  
  const today = startOfDay(new Date());
  const oneWeekFromToday = addDays(today, 6); // 7-day window from today

  const upcomingSessionsCount = currentSessions.filter(session => {
    if (session.status !== 'Scheduled') return false;
    const sessionDate = parseISO(session.date);
    if (!isValid(sessionDate)) return false;
    return isWithinInterval(startOfDay(sessionDate), { start: today, end: oneWeekFromToday });
  }).length;
  
  const incomeThisMonth = 2350.00; // Placeholder, real calculation needed

  return (
    <div className="flex flex-col gap-8"> 
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingClients ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary my-1" />
            ) : (
                <div className="text-2xl font-bold">{activeClientsCount}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Manage your client base
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/clients">Manage Clients</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingSessionsCount} This Week</div>
            <p className="text-xs text-muted-foreground">
              View your schedule
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/sessions">View Sessions</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finance Overview</CardTitle>
            <IconDollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{incomeThisMonth.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Income this month
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/finance">Track Finances</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Session Calendar Overview</CardTitle>
          <CardDescription>Quick view of your scheduled sessions. For detailed management, go to the Sessions page.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 shadow-md">
              <CardContent className="p-2 md:p-4 flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedCalendarDate}
                  onSelect={setSelectedCalendarDate}
                  className="rounded-md"
                  modifiers={{ 
                    scheduled: allSessionDates
                  }}
                  modifiersStyles={{ 
                    scheduled: { border: "2px solid hsl(var(--primary))", borderRadius: 'var(--radius)'}
                  }}
                />
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>
                  {selectedCalendarDate && isValid(selectedCalendarDate) ? format(selectedCalendarDate, 'MMMM d, yyyy') : 'Select a date'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sessionsOnSelectedDate.length > 0 ? (
                  <ul className="space-y-3">
                    {sessionsOnSelectedDate.map(session => (
                      <li key={session.id} className="p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors">
                        <div className="font-semibold">{session.clientName} & {session.dogName}</div>
                        <div className="text-sm text-muted-foreground">{session.time}</div>
                        <Badge variant={session.status === 'Scheduled' ? 'default' : 'secondary'} className="mt-1">{session.status}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No sessions scheduled for this day.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
