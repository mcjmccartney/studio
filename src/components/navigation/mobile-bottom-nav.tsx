
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems } from '@/lib/nav-items';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const pathname = usePathname();

  // No longer filtering out public items, show all navItems
  // const privateNavItems = navItems.filter(item => !item.isPublic);

  // Dynamically adjust width based on number of items, up to a reasonable max (e.g. 5 items)
  const itemCount = navItems.length;
  const itemWidthClass = itemCount <= 5 ? `w-1/${itemCount}` : 'w-1/5'; // Example: max 5 items, then shrink

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-sidebar-border bg-sidebar md:hidden">
      {navItems.map((item) => { // Map over all navItems
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-md text-xs",
              itemWidthClass, // Apply dynamic width
              isActive ? "text-sidebar-primary" : "text-sidebar-foreground hover:text-sidebar-accent-foreground"
            )}
          >
            <item.icon className="mb-0.5 h-6 w-6" />
            {/* Optional: Add item.label here if you want text below icons */}
            {/* <span className={cn("text-xs", isActive ? "font-semibold" : "font-normal")}>{item.label}</span> */}
          </Link>
        );
      })}
    </nav>
  );
}

