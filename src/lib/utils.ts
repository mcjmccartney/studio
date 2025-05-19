import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFullNameAndDogName(
  ownerFullName: string,
  dogName?: string | null
): string {
  const trimmedDogName = dogName?.trim();
  if (trimmedDogName && trimmedDogName.toLowerCase() !== 'n/a' && trimmedDogName !== '') {
    return `${ownerFullName} w/ ${trimmedDogName}`;
  }
  return ownerFullName;
}

export function getSessionTypeBadgeClasses(sessionType?: string): string {
  const baseClasses = "text-xs font-semibold px-2.5 py-0.5 rounded-full border-transparent";
  const textClass = "text-primary-foreground"; // Using theme's primary foreground (likely white)

  switch (sessionType?.toLowerCase()) {
    case 'in-person':
      return `${baseClasses} ${textClass} bg-[#92351f]`; // Primary color
    case 'online':
      return `${baseClasses} ${textClass} bg-[#a5523f]`; // Slightly Lighter/Warmer variant of primary
    case 'training':
      return `${baseClasses} ${textClass} bg-[#7d2c1a]`; // Darker variant of primary
    case 'online catchup':
      return `${baseClasses} ${textClass} bg-[#b86b5a]`; // More Muted/Lighter variant
    case 'group':
      return `${baseClasses} ${textClass} bg-[#8c4d3f]`; // Slightly Desaturated variant
    case 'phone call':
      return `${baseClasses} ${textClass} bg-[#c77f6f]`; // Even Lighter/Softer variant
    case 'rmr live':
      return `${baseClasses} ${textClass} bg-[#6a2314]`; // Very Dark variant
    case 'coaching':
      return `${baseClasses} ${textClass} bg-[#d2998b]`; // Lightest variant, more towards terracotta
    default:
      // Fallback for unknown session types or if sessionType is undefined
      return `${baseClasses} bg-muted text-muted-foreground border`;
  }
}
