
"use client";

import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger, // Ensure SidebarTrigger is imported if used in header
} from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/navigation/sidebar-nav';
import { Button } from '@/components/ui/button';
import { Settings, LogOut, Loader2, PanelLeft } from 'lucide-react'; // Added PanelLeft for header
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
// Removed import for MobileBottomNav as it's being deleted
import { useAuth } from '@/contexts/auth-context';
import { signOutUser } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';


interface AppLayoutProps {
  children: ReactNode;
}

const publicPaths = ['/login', '/behavioural-brief', '/behaviour-questionnaire'];
const noSidebarPaths = ['/behavioural-brief', '/behaviour-questionnaire', '/login'];

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const useSpecialBackground = pathname === '/behavioural-brief' || pathname === '/behaviour-questionnaire';
  const hideSidebarForCurrentPath = noSidebarPaths.includes(pathname);

  const isMobile = useIsMobile();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted || authLoading) return;

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
      router.replace('/login');
    } catch (error) {
      console.error("Logout error:", error);
      toast({ title: "Logout Failed", description: "Could not log you out. Please try again.", variant: "destructive" });
    }
  };
  
  if (authLoading || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (hideSidebarForCurrentPath || (!user && publicPaths.includes(pathname))) {
    return (
      <main className={cn(
        useSpecialBackground ? "bg-[#4f6749]" : "bg-background",
        (pathname === '/behavioural-brief' || pathname === '/behaviour-questionnaire') && "min-h-screen"
      )}>
        {children}
      </main>
    );
  }
  
  if (user) {
    return (
      <SidebarProvider defaultOpen={false}>
        {mounted && !isMobile && !hideSidebarForCurrentPath && (
          <Sidebar variant="sidebar" collapsible="icon" side="left">
            <SidebarHeader className="px-4 py-2 flex flex-col items-center group-data-[collapsible=icon]:items-center">
              {/* Logo image removed previously */}
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
           {/* Header with mobile trigger can be added here if needed for non-noSidebarPaths on mobile */}
           {mounted && isMobile && !hideSidebarForCurrentPath && (
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
              <SidebarTrigger className="md:hidden" /> {/* Ensure SidebarTrigger is from ui/sidebar */}
              <div className="flex-1">
                {/* You can add a page title here if desired */}
              </div>
            </header>
           )}
          <div
            className={cn(
              "flex-1 overflow-auto",
              !mounted && "bg-background p-6",
              mounted && (
                useSpecialBackground 
                  ? "bg-[#4f6749]"
                  : "bg-[#fafafa] p-6"
              ),
              // Removed mobile-specific padding: mounted && isMobile && "pb-16" 
            )}
          >
            {children}
          </div>
        </SidebarInset>

        {/* MobileBottomNav component rendering removed */}
      </SidebarProvider>
    );
  }

  return <main className={cn(useSpecialBackground ? "bg-[#4f6749]" : "bg-background")}>{children}</main>;
}
