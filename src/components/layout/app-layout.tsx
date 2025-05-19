
"use client";

import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation'; // Import useRouter
import * as React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/navigation/sidebar-nav';
import { Button } from '@/components/ui/button';
import { Settings, LogOut, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileBottomNav } from '@/components/navigation/mobile-bottom-nav';
import { useAuth } from '@/contexts/auth-context'; // Import useAuth
import { signOutUser } from '@/lib/firebase'; // Import signOutUser
import { useToast } from '@/hooks/use-toast';


interface AppLayoutProps {
  children: ReactNode;
}

const publicPaths = ['/login', '/public-intake', '/behaviour-questionnaire'];

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const useSpecialBackground = pathname === '/public-intake' || pathname === '/behaviour-questionnaire';

  const isMobile = useIsMobile();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted || authLoading) return; // Wait for mount and auth state to load

    if (!user && !publicPaths.includes(pathname)) {
      router.replace('/login');
    } else if (user && pathname === '/login') {
      router.replace('/');
    }
  }, [user, authLoading, pathname, router, mounted]);


  const handleLogout = async () => {
    try {
      await signOutUser();
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.replace('/login'); // Ensure redirect after sign out
    } catch (error) {
      console.error("Logout error:", error);
      toast({ title: "Logout Failed", description: "Could not log you out. Please try again.", variant: "destructive" });
    }
  };
  
  // If auth is loading and not mounted yet, show a global loader or nothing to prevent flicker
  if (authLoading || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated and not a public path, render nothing (or login) to prevent layout flash
  if (!user && !publicPaths.includes(pathname)) {
     // This case should be handled by the redirect, but as a fallback:
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
             {/* Optionally show a loader or minimal content while redirecting */}
        </div>
    );
  }
  
  // Login page should not have the main app layout
  if (pathname === '/login') {
    return <main className="flex-1">{children}</main>;
  }


  return (
    <SidebarProvider defaultOpen>
      {mounted && !isMobile && !publicPaths.includes(pathname) && user && ( // Only show sidebar if logged in and not on public path
        <Sidebar variant="sidebar" collapsible="icon" side="left">
          <SidebarHeader className="px-4 py-2 flex flex-col items-center group-data-[collapsible=icon]:items-center">
            {/* Placeholder for potential logo if added back */}
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarNav />
          </SidebarContent>
          <SidebarFooter className="p-2 mt-auto">
            <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center">
              <Settings className="h-5 w-5" />
              <span className="group-data-[collapsible=icon]:hidden">Settings</span>
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span className="group-data-[collapsible=icon]:hidden">Log Out</span>
            </Button>
          </SidebarFooter>
        </Sidebar>
      )}

      <SidebarInset>
        {/* Header removed as per user request */}
        <div
          className={cn(
            "flex-1 overflow-auto", 
            !mounted && "bg-background p-6",
            mounted && (
              useSpecialBackground 
                ? "bg-[#4f6749]" 
                : "bg-[#fafafa] p-6" 
            ),
            mounted && isMobile && user && !publicPaths.includes(pathname) && "pb-16" // Add pb-16 for mobile nav only if user is logged in and not on public path
          )}
        >
          {children}
        </div>
      </SidebarInset>

      {mounted && isMobile && user && !publicPaths.includes(pathname) && <MobileBottomNav />} {/* Only show mobile nav if logged in and not on public path */}
    </SidebarProvider>
  );
}
