
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
import { Settings, LogOut, Loader2, Menu as MenuIcon, UserPlus, CalendarPlus, Search as SearchIcon, X as XIcon } from 'lucide-react'; // Corrected import
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
  
  const useSpecialBackground =
    pathname === '/behavioural-brief' || pathname === '/behaviour-questionnaire';
  const hideMainAppLayout = noSidebarPaths.includes(pathname);

  const isMobileHook = useIsMobile(); // Renamed to avoid conflict with context isMobile
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
        !mounted && "bg-background", 
        mounted && ( 
          useSpecialBackground 
            ? "bg-[#4f6749]" 
            : "bg-background" 
        ),
      )}>
        {children}
      </main>
    );
  }
  
  const AppLayoutContent = () => {
    const { isMobile: sidebarIsMobileContext, open: desktopOpen, toggleSidebar } = useSidebar(); 
    const isIconOnly = sidebarIsMobileContext || !desktopOpen;

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

    return (
      <>
        <Sidebar variant="sidebar" collapsible="icon" side="left" defaultOpen={false}>
            <SidebarHeader className="px-4 py-2 flex flex-col items-center group-data-[collapsible=icon]:items-center">
              {/* Logo placeholder/text removed as per previous requests */}
            </SidebarHeader>
            <SidebarContent className="p-2">
              <SidebarNav />
            </SidebarContent>
            <SidebarFooter className="p-2 mt-auto">
              <Button 
                variant="ghost" 
                className={cn(
                  "w-full gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isIconOnly ? '!justify-center !size-8 !p-2' : 'justify-start'
                )}
              >
                <Settings className="h-5 w-5" /> {/* Explicit h-5 w-5, overridden by button variant to size-4 */}
                <span className={cn(isIconOnly && "hidden")}>Settings</span>
              </Button>
              <Button 
                variant="ghost" 
                className={cn(
                  "w-full gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isIconOnly ? '!justify-center !size-8 !p-2' : 'justify-start'
                )}
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" /> {/* Explicit h-5 w-5, overridden by button variant to size-4 */}
                <span className={cn(isIconOnly && "hidden")}>Log Out</span>
              </Button>
            </SidebarFooter>
          </Sidebar>

        <SidebarInset>
          <div
            className={cn(
              "flex-1 overflow-auto",
              !mounted && "bg-background p-6", 
              mounted && (
                useSpecialBackground
                  ? "bg-[#4f6749]" 
                  : isMobileHook ? "bg-[#fafafa] px-4 py-6" : "bg-[#fafafa] p-6" 
              ),
            )}
          >
            {children}
          </div>
        </SidebarInset>
        
        {mounted && isMobileHook && user && !hideMainAppLayout && (
          <Fab />
        )}
      </>
    );
  };

  if (user && !hideMainAppLayout) { 
    return (
      <SidebarProvider defaultOpen={false}> {/* Default to collapsed */}
        <AppLayoutContent />
      </SidebarProvider>
    );
  }

  return <main className={cn(
    "flex-1 overflow-auto",
    !mounted && "bg-background", 
    mounted && (
      useSpecialBackground 
        ? "bg-[#4f6749]" 
        : "bg-background" 
    )
  )}>{children}</main>;
}

