
"use client";

import * as React from "react";
import { Menu, X, Users, CalendarDays } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from 'next/link';

interface FabProps extends ButtonProps {
  // No specific extra props needed for this version
}

const Fab = React.forwardRef<HTMLButtonElement, FabProps>(
  ({ className, ...props }, ref) => {
    const [actionsOpen, setActionsOpen] = React.useState(false);

    const actionButtonClasses = "h-12 w-12 rounded-full shadow-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center";

    return (
      <div className="fixed bottom-6 right-6 z-40 md:hidden">
        <div className="relative flex flex-col items-center gap-3">
          {actionsOpen && (
            <>
              <Link href="/clients" passHref legacyBehavior>
                <a
                  className={cn(
                    actionButtonClasses,
                    "transition-all duration-300 ease-out",
                    actionsOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                  )}
                  onClick={() => setActionsOpen(false)} // Close actions when one is clicked
                  aria-label="Go to Clients"
                >
                  <Users className="h-6 w-6" />
                </a>
              </Link>
              <Link href="/sessions" passHref legacyBehavior>
                <a
                  className={cn(
                    actionButtonClasses,
                    "transition-all duration-200 ease-out delay-75", // Stagger animation slightly
                    actionsOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                  )}
                  onClick={() => setActionsOpen(false)} // Close actions when one is clicked
                  aria-label="Go to Sessions"
                >
                  <CalendarDays className="h-6 w-6" />
                </a>
              </Link>
            </>
          )}
          <Button
            ref={ref}
            variant="default"
            size="icon"
            className={cn(
              "h-14 w-14 rounded-full shadow-lg z-10", // Main FAB on top
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
