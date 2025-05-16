
"use client";

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import * as React from 'react'; // Ensure React is imported for useState, useEffect
import Image from 'next/image'; // Import next/image
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger, // Re-added SidebarTrigger
} from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/navigation/sidebar-nav';
import { Button } from '@/components/ui/button';
import { Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileBottomNav } from '@/components/navigation/mobile-bottom-nav';


interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const isPublicIntakePage = pathname === '/public-intake';
  const isBehaviourQuestionnairePage = pathname === '/behaviour-questionnaire';
  const useSpecialBackground = isPublicIntakePage || isBehaviourQuestionnairePage;

  const isMobile = useIsMobile();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <SidebarProvider defaultOpen>
      {mounted && !isMobile && (
        <Sidebar variant="sidebar" collapsible="icon" side="left">
          <SidebarHeader className="px-4 py-2 flex flex-col items-center group-data-[collapsible=icon]:items-center">
            <Image
              src="https://placehold.co/40x40.png"
              alt="Raising My Rescue Logo"
              width={40}
              height={40}
              className="rounded-md"
              data-ai-hint="dog paw"
            />
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarNav />
          </SidebarContent>
          <SidebarFooter className="p-2 mt-auto">
            <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center">
              <Settings className="h-5 w-5" />
              <span className="group-data-[collapsible=icon]:hidden">Settings</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center">
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
            "flex-1 overflow-auto", // Base class

            // Styles applied *before* client-side mount (SSR and initial client render)
            !mounted && "bg-background p-6",

            // Styles applied *after* client-side mount
            mounted && (
              useSpecialBackground 
                ? "bg-[#4f6749]" // For special pages, green bg. Page itself handles padding.
                : "bg-background p-6" // For other pages, theme default bg with p-6 from layout.
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
