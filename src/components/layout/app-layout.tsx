
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
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/navigation/sidebar-nav';
import { Button } from '@/components/ui/button';
import { Settings, LogOut, Loader2, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/auth-context';
import { signOutUser } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Fab } from '@/components/ui/fab';

interface AppLayoutProps {
  children: ReactNode;
}

const publicPaths = ['/login', '/behavioural-brief', '/behaviour-questionnaire'];
const noSidebarPaths = ['/login', '/behavioural-brief', '/behaviour-questionnaire'];

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  // Removed: const sidebarContext = useSidebar(); // This was causing the error

  const useSpecialBackground =
    pathname === '/behavioural-brief' || pathname === '/behaviour-questionnaire';
  const hideMainAppLayout = noSidebarPaths.includes(pathname);

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

  if (hideMainAppLayout || (!user && publicPaths.includes(pathname))) {
    return (
      <main className={cn(
        "flex-1 overflow-auto",
        !mounted && "bg-background p-6", // SSR and initial client render
        mounted && ( // After client-side mount
          useSpecialBackground 
            ? "bg-[#4f6749]" // public-intake, behaviour-questionnaire
            : "bg-background" // All other pages
        ),
        mounted && isMobile && "pb-0" // Remove bottom padding if FAB is present
      )}>
        {children}
      </main>
    );
  }
  
  const AppLayoutContent = () => {
    const { toggleSidebar } = useSidebar();

    return (
      <>
        {mounted && !isMobile && (
          <Sidebar variant="sidebar" collapsible="icon" side="left">
            <SidebarHeader className="px-4 py-2 flex flex-col items-center group-data-[collapsible=icon]:items-center">
              {/* Logo removed */}
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
           {mounted && isMobile && user && (
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
              <SidebarTrigger className="md:hidden" />
              <div className="flex-1">
                {/* Page title could go here */}
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
                  : "bg-background p-6"
              ),
              mounted && isMobile && "pb-0"
            )}
          >
            {children}
          </div>
        </SidebarInset>
        
        {mounted && isMobile && user && (
          <Fab onClick={toggleSidebar} />
        )}
      </>
    );
  };


  if (user) {
    return (
      <SidebarProvider defaultOpen={false}>
        <AppLayoutContent />
      </SidebarProvider>
    );
  }

  return <main className={cn(
    "flex-1 overflow-auto",
    !mounted && "bg-background p-6",
    mounted && (
      useSpecialBackground 
        ? "bg-[#4f6749]"
        : "bg-background"
    ),
    mounted && isMobile && "pb-0"
  )}>{children}</main>;
}
