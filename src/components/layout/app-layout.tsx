
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
} from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/navigation/sidebar-nav';
import { Button } from '@/components/ui/button';
import { Settings, LogOut, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileBottomNav } from '@/components/navigation/mobile-bottom-nav';
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

  // If on a path that should never show the sidebar (like login, or the public forms)
  // or if user is not logged in and it's a public path, render children directly.
  if (hideSidebarForCurrentPath || (!user && publicPaths.includes(pathname))) {
    return (
      <main className={cn(
        useSpecialBackground ? "bg-[#4f6749]" : "bg-background",
        // Ensure public form pages also get min-h-screen if they are the direct children
        (pathname === '/behavioural-brief' || pathname === '/behaviour-questionnaire') && "min-h-screen"
      )}>
        {children}
      </main>
    );
  }
  
  // If user is logged in and it's not a noSidebarPath, render with layout
  if (user) {
    return (
      <SidebarProvider defaultOpen={false}>
        {mounted && !isMobile && (
          <Sidebar variant="sidebar" collapsible="icon" side="left">
            <SidebarHeader className="px-4 py-2 flex flex-col items-center group-data-[collapsible=icon]:items-center">
              {/* Removed Image logo from here */}
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
          {/* Header removed as per previous request */}
          <div
            className={cn(
              "flex-1 overflow-auto", // Base class, always applied
              // Styles applied *before* client-side mount (SSR and initial client render)
              !mounted && "bg-background p-6",
              // Styles applied *after* client-side mount
              mounted && (
                useSpecialBackground 
                  ? "bg-[#4f6749]" // For special pages, green bg. Page itself handles padding.
                  : "bg-[#fafafa] p-6" // For other pages, #fafafa bg with p-6 from layout.
              ),
              // Mobile-specific padding, applied only after mount when isMobile is reliable
              mounted && isMobile && "pb-16" 
            )}
          >
            {children}
          </div>
        </SidebarInset>

        {mounted && isMobile && <MobileBottomNav />}
      </SidebarProvider>
    );
  }

  // Fallback for unhandled cases (e.g., public path but user is somehow undefined after loading)
  // This also covers the case where user is null and it's a public path, but it's cleaner
  // to handle it with the main content rendering logic directly.
  return <main className={cn(useSpecialBackground ? "bg-[#4f6749]" : "bg-background")}>{children}</main>;
}
