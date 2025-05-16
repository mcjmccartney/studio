
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, CalendarDays, DollarSign as IconDollarSign } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import type { Session } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isValid } from 'date-fns';
import { mockSessions } from '@/lib/mockData'; 

export default function HomePage() {
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(new Date());
  const [currentSessions, setCurrentSessions] = useState<Session[]>([]);

  useEffect(() => {
    // In a real app, fetch sessions, for now using mock.
    setCurrentSessions(mockSessions);
  }, []);

  const selectedDateString = selectedCalendarDate && isValid(selectedCalendarDate) ? format(selectedCalendarDate, 'yyyy-MM-dd') : null;
  const sessionsOnSelectedDate = selectedDateString 
    ? currentSessions.filter(s => s.date === selectedDateString)
    : [];
  
  const allSessionDates = currentSessions.map(s => parseISO(s.date)).filter(isValid);

  // Calculate stats (these are placeholders, you'd fetch real data)
  const activeClientsCount = 12; 
  const upcomingSessionsCount = currentSessions.filter(s => parseISO(s.date) >= new Date() && s.status === 'Scheduled').length;
  const incomeThisMonth = 2350.00;

  return (
    <div className="flex flex-col gap-8"> 
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-serif">Clients</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeClientsCount} Active</div>
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
            <CardTitle className="text-sm font-medium font-serif">Upcoming Sessions</CardTitle>
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
            <CardTitle className="text-sm font-medium font-serif">Finance Overview</CardTitle>
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
          <CardTitle className="font-serif">Session Calendar Overview</CardTitle>
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
                <CardTitle className="font-serif">
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
