
"use client";

import * as React from "react"; // Changed from "import type"
import { Menu } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FabProps extends ButtonProps {
  // Add any specific props for your FAB if needed
}

const Fab = React.forwardRef<HTMLButtonElement, FabProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="default" // Uses primary color
        size="icon"
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg md:hidden z-40", // z-40 to be above most content but below modals/sheets
          className
        )}
        {...props}
      >
        {children || <Menu className="h-6 w-6" />}
      </Button>
    );
  }
);
Fab.displayName = "Fab";

export { Fab };
