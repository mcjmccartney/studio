import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="currentColor"
      width="40"
      height="40"
      aria-label="PawsitiveTracker Logo"
      {...props}
    >
      <path d="M50 10C27.9 10 10 27.9 10 50s17.9 40 40 40 40-17.9 40-40S72.1 10 50 10zm0 72c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32z" />
      <path d="M50 25c-8.3 0-15 6.7-15 15 0 8.3 6.7 15 15 15s15-6.7 15-15c0-8.3-6.7-15-15-15zm0 22c-3.9 0-7-3.1-7-7s3.1-7 7-7 7 3.1 7 7-3.1 7-7 7z" />
      <path d="M68 56h-7.6c-2.2-4-6.4-6.8-11.4-6.8s-9.2 2.8-11.4 6.8H32c-1.1 0-2 .9-2 2s.9 2 2 2h36c1.1 0 2-.9 2-2s-.9-2-2-2z" />
    </svg>
  );
}
