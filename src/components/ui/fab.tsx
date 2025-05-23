
"use client";

import * as React from "react";
import { Menu, X, Users, CalendarDays, LayoutDashboard } from "lucide-react"; // Added LayoutDashboard
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Added usePathname

interface FabProps extends ButtonProps {
  // No specific extra props needed for this version
}

const Fab = React.forwardRef<HTMLButtonElement, FabProps>(
  ({ className, ...props }, ref) => {
    const [actionsOpen, setActionsOpen] = React.useState(false);
    const pathname = usePathname(); // Get current pathname

    const actionButtonClasses = "h-12 w-12 rounded-full shadow-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center";

    let firstActionIcon = <Users className="h-6 w-6" />;
    let firstActionHref = "/clients";
    let firstActionLabel = "Go to Clients";

    if (pathname === "/clients") {
      firstActionIcon = <LayoutDashboard className="h-6 w-6" />;
      firstActionHref = "/";
      firstActionLabel = "Go to Dashboard";
    }

    let secondActionIcon = <CalendarDays className="h-6 w-6" />;
    let secondActionHref = "/sessions";
    let secondActionLabel = "Go to Sessions";

    if (pathname === "/sessions") {
      secondActionIcon = <LayoutDashboard className="h-6 w-6" />;
      secondActionHref = "/";
      secondActionLabel = "Go to Dashboard";
    }
    
    // If on dashboard, ensure both actions point to their respective pages
    // and are not duplicated if already on dashboard (though above logic handles this well)
    // This explicit check is mostly for clarity if needed, but current logic is fine.
    // if (pathname === "/") {
    //   // Default actions are already set correctly for the dashboard
    // }


    return (
      <div className="fixed bottom-6 right-6 z-40 md:hidden">
        <div className="relative flex flex-col items-center gap-3">
          {actionsOpen && (
            <>
             {/* First Action Button - Context Aware */}
              <Link href={firstActionHref} passHref legacyBehavior>
                <a
                  className={cn(
                    actionButtonClasses,
                    "transition-all duration-300 ease-out",
                    actionsOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                  )}
                  onClick={() => setActionsOpen(false)}
                  aria-label={firstActionLabel}
                >
                  {firstActionIcon}
                </a>
              </Link>

              {/* Second Action Button - Context Aware */}
              {/* Only show second button if its target is different from first button's target,
                  or if we are on a page that isn't clients or sessions to avoid duplicate dashboard links */}
              { (firstActionHref !== secondActionHref || (pathname !== "/clients" && pathname !== "/sessions" )) && (
                <Link href={secondActionHref} passHref legacyBehavior>
                  <a
                    className={cn(
                      actionButtonClasses,
                      "transition-all duration-200 ease-out delay-75", 
                      actionsOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                    )}
                    onClick={() => setActionsOpen(false)}
                    aria-label={secondActionLabel}
                  >
                    {secondActionIcon}
                  </a>
                </Link>
              )}
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
