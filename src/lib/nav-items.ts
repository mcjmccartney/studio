
import React from 'react'; // Ensure React is imported
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  ClipboardPlus,
  FileQuestion,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';

// Custom Pound Sterling Icon
const IconPoundSterling = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ color = "currentColor", size = 24, strokeWidth = 2, className, ...rest }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth as number} // Cast to number; Lucide handles string conversion if necessary internally
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className} // Pass className from LucideProps
      {...rest} // Spread the rest of the SVG props from LucideProps
    >
      <path d="M6 3h12" />
      <path d="M6 12h12" />
      <path d="M17 21H7S4 18 4 12 7 3 7 3" />
    </svg>
  )
);
IconPoundSterling.displayName = 'IconPoundSterling';


export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  isPublic?: boolean;
}

export const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/sessions', label: 'Sessions', icon: CalendarDays },
  { href: '/finance', label: 'Finance', icon: IconPoundSterling },
  { href: '/behavioural-brief', label: 'Behavioural Brief', icon: ClipboardPlus, isPublic: true },
  { href: '/behaviour-questionnaire', label: 'Behaviour Questionnaire', icon: FileQuestion, isPublic: true },
];
