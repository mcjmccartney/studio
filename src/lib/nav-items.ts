
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  DollarSign,
  ClipboardPlus,
  FileQuestion,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  isPublic?: boolean; // Added for public forms
}

export const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/sessions', label: 'Sessions', icon: CalendarDays },
  { href: '/finance', label: 'Finance', icon: DollarSign },
  { href: '/public-intake', label: 'Behavioural Brief', icon: ClipboardPlus, isPublic: true },
  { href: '/behaviour-questionnaire', label: 'Behaviour Questionnaire', icon: FileQuestion, isPublic: true },
];
