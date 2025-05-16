
"use client";

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation'; 
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  // SidebarTrigger, // Not used in the current headerless layout
} from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/navigation/sidebar-nav';
import { Button } from '@/components/ui/button';
import { Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const isPublicIntakePage = pathname === '/public-intake';
  const isBehaviourQuestionnairePage = pathname === '/behaviour-questionnaire';
  const useSpecialBackground = isPublicIntakePage || isBehaviourQuestionnairePage;

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="sidebar" collapsible="icon" side="left">
        <SidebarHeader className="px-4 py-2 flex flex-col items-center group-data-[collapsible=icon]:items-center">
          {/* Removed RAISING MY RESCUE text */}
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
      <SidebarInset>
        {/* The header element has been removed */}
        <div
          className={cn(
            "flex-1 overflow-auto", 
            useSpecialBackground
              ? "bg-[#4f6749]" 
              : "bg-background p-6" 
          )}
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
