
"use client";

import * as React from "react";
import { Menu, X, Users, CalendarDays, LayoutDashboard, DollarSign, ClipboardPlus, FileQuestion } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// Removed useRouter, useToast, signOutUser, LogOut as auth is removed

interface FabProps extends ButtonProps {
  // No specific extra props needed for this version
}

const Fab = React.forwardRef<HTMLButtonElement, FabProps>(
  ({ className, ...props }, ref) => {
    const [actionsOpen, setActionsOpen] = React.useState(false);
    const pathname = usePathname();
    // const router = useRouter(); // Removed
    // const { toast } = useToast(); // Removed

    // Removed handleLogout function

    const actionButtonClasses = "h-12 w-12 rounded-full shadow-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center";

    const navActions = [
      { id: 'dashboard', href: '/', icon: LayoutDashboard, label: "Go to Dashboard" },
      { id: 'clients', href: '/clients', icon: Users, label: "Go to Clients" },
      { id: 'sessions', href: '/sessions', icon: CalendarDays, label: "Go to Sessions" },
      { id: 'finance', href: '/finance', icon: DollarSign, label: "Go to Finance" },
      { id: 'behavioural-brief', href: '/behavioural-brief', icon: ClipboardPlus, label: "Go to Behavioural Brief" },
      { id: 'behaviour-questionnaire', href: '/behaviour-questionnaire', icon: FileQuestion, label: "Go to Behaviour Questionnaire" },
    ];

    // const settingsActions = [ // Placeholder for future use
    //   // { id: 'settings', href: '/settings', icon: Settings, label: "Go to Settings" },
    // ];

    let visibleNavActions = navActions.filter(action => action.href !== pathname);
    
    // Ensure Dashboard is always an option if not on the dashboard page
    if (pathname !== '/' && !visibleNavActions.find(a => a.id === 'dashboard')) {
        const dashboardAction = navActions.find(a => a.id === 'dashboard');
        if (dashboardAction) {
            visibleNavActions.unshift(dashboardAction); // Add Dashboard to the beginning
        }
    }
    
    // Now finalNavActions will include all relevant actions, not sliced
    const finalNavActions = visibleNavActions;


    return (
      <div className="fixed bottom-6 right-6 z-40">
        <div className="relative flex flex-col items-center gap-3">
          {actionsOpen && (
            <>
              {/* Removed Logout Button */}

              {/* Settings Button Placeholder - can be enabled later */}
              {/* {settingsActions.map((action, index) => (
                <Link href={action.href} passHref legacyBehavior key={action.id}>
                  <a
                    className={cn(
                      actionButtonClasses,
                      "transition-all duration-300 ease-out",
                      `delay-${(settingsActions.length - 1 - index) * 75}`, 
                      actionsOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                    )}
                    onClick={() => setActionsOpen(false)}
                    aria-label={action.label}
                  >
                    <action.icon className="h-6 w-6" />
                  </a>
                </Link>
              ))} */}
              
              {/* Dynamic Navigation Buttons */}
              {finalNavActions.map((action, index) => (
                <Link href={action.href} passHref legacyBehavior key={action.id}>
                  <a
                    className={cn(
                      actionButtonClasses,
                      "transition-all duration-300 ease-out",
                      // Stagger delay based on total number of buttons including settings/logout
                      `delay-${(finalNavActions.length - 1 - index + 0 + 0) * 75}`, // Adjusted for removed settings/logout
                      actionsOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                    )}
                    onClick={() => setActionsOpen(false)}
                    aria-label={action.label}
                  >
                    <action.icon className="h-6 w-6" />
                  </a>
                </Link>
              ))}
            </>
          )}
          <Button
            ref={ref}
            variant="default"
            size="icon"
            className={cn(
              "h-14 w-14 rounded-full shadow-lg z-10", 
              className
            )}
            onClick={() => setActionsOpen(!actionsOpen)}
            aria-expanded={actionsOpen}
            aria-label={actionsOpen ? "Close actions menu" : "Open actions menu"}
            {...props}
          >
            {actionsOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>
    );
  }
);
Fab.displayName = "Fab";

export { Fab };
