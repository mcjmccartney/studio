
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems } from '@/lib/nav-items'; // Updated import
import type { LucideIcon } from 'lucide-react';


import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';


export function SidebarNav() {
  const pathname = usePathname();

  // No longer filtering out public items, show all navItems
  // const privateNavItems = navItems.filter(item => !item.isPublic);

  return (
    <SidebarMenu>
      {navItems.map((item) => ( // Map over all navItems
        <SidebarMenuItem key={item.label}>
          <Link href={item.href} passHref legacyBehavior>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
              className={cn(
                'justify-start w-full',
                (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)))
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90'
                  : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
              tooltip={{ children: item.label, className: "bg-popover text-popover-foreground border shadow-md" }}
            >
              <a>
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </a>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

