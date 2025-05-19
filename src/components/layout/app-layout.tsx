
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

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const useSpecialBackground = pathname === '/behavioural-brief' || pathname === '/behaviour-questionnaire';

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

  if (!user && !publicPaths.includes(pathname)) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
        </div>
    );
  }
  
  if (pathname === '/login') {
    return <main>{children}</main>;
  }


  return (
    <SidebarProvider defaultOpen>
      {mounted && !isMobile && !publicPaths.includes(pathname) && user && (
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
        {/* Header removed as per previous request */}
        <div
          className={cn(
            "flex-1 overflow-auto",
            !mounted && "bg-background p-6", 
            mounted && (
              useSpecialBackground 
                ? "bg-[#4f6749]" 
                : "bg-background p-6" // Reverted to bg-background for general pages
            ),
            mounted && isMobile && user && !publicPaths.includes(pathname) && "pb-16"
          )}
        >
          {children}
        </div>
      </SidebarInset>

      {mounted && isMobile && user && !publicPaths.includes(pathname) && <MobileBottomNav />}
    </SidebarProvider>
  );
}
