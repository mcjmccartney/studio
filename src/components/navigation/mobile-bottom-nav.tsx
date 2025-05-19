
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems } from '@/lib/nav-items';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const pathname = usePathname();

  // Filter out public items for the logged-in user's mobile bottom navigation
  const privateNavItems = navItems.filter(item => !item.isPublic);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-sidebar-border bg-sidebar md:hidden">
      {privateNavItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-md text-xs w-1/4", // Adjusted for 4 items if privateNavItems.length is 4
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
