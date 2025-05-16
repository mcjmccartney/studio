import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, CalendarDays, DollarSign, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome to PawsitiveTracker!</h1>
      <p className="text-muted-foreground">
        Manage your clients, sessions, and finances efficiently. Let's get started!
      </p>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 Active</div>
            <p className="text-xs text-muted-foreground">
              +2 this month
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
            <div className="text-2xl font-bold">5 This Week</div>
            <p className="text-xs text-muted-foreground">
              View your schedule
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/calendar">View Calendar</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finance Overview</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2,350.00</div>
            <p className="text-xs text-muted-foreground">
              Income this month
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/finance">Track Finances</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-primary/10 border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Assistant</CardTitle>
            <Sparkles className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm text-muted-foreground mb-2">
              Get help planning your next session.
            </CardDescription>
            <Button asChild variant="default" size="sm" className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/ai-assistant">Get Suggestions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
