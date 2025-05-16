
"use client";

import type { ReactNode } from 'react';
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
import { Logo } from '@/components/icons/logo';
import { Button } from '@/components/ui/button';
import { Settings, LogOut } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="sidebar" collapsible="icon" side="left">
        <SidebarHeader className="p-4 flex flex-col items-center group-data-[collapsible=icon]:items-center">
          <div className="flex items-center gap-2">
            <Logo className="text-sidebar-primary w-8 h-8" />
            <h1 className="text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              Raising My Rescue
            </h1>
          </div>
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
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            {/* Breadcrumbs or page title can go here */}
          </div>
        </header>
        <main className="flex-1 px-6 pb-6 pt-2 overflow-auto"> {/* Changed p-6 to px-6 pb-6 pt-2 */}
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
