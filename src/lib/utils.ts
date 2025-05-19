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
