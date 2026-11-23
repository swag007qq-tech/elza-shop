import React from 'react';

interface IconProps {
  className?: string;
}

export const CatalogGridIcon: React.FC<IconProps> = ({className = 'w-5 h-5'}) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <rect x="3" y="3" width="8" height="8" rx="2.2" />
    <rect x="13" y="3" width="8" height="8" rx="2.2" />
    <rect x="3" y="13" width="8" height="8" rx="2.2" />
    <rect x="13" y="13" width="8" height="8" rx="2.2" />
  </svg>
);

export const StarOutlineIcon: React.FC<IconProps> = ({className = 'w-5 h-5'}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 3.2l2.68 5.43 5.99.87-4.33 4.22 1.02 5.96L12 16.86l-5.36 2.82 1.02-5.96L3.33 9.5l5.99-.87L12 3.2z" />
  </svg>
);

export const StarFilledIcon: React.FC<IconProps> = ({className = 'w-5 h-5'}) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 2.9a.9.9 0 0 1 .81.5l2.54 5.15 5.68.83a.9.9 0 0 1 .5 1.53l-4.11 4.01.97 5.66a.9.9 0 0 1-1.31.95L12 18.86l-5.08 2.67a.9.9 0 0 1-1.31-.95l.97-5.66-4.11-4.01a.9.9 0 0 1 .5-1.53l5.68-.83L11.19 3.4a.9.9 0 0 1 .81-.5z" />
  </svg>
);

export const CrownIcon: React.FC<IconProps> = ({className = 'w-6 h-6'}) => (
  <svg
    viewBox="0 0 28 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M4.5 17.5L3 7.5l6 4.5 5-6.5 5 6.5 6-4.5-1.5 10H4.5z" />
    <path d="M5 20.5h18" />
    <circle cx="3" cy="6.2" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="14" cy="4.2" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="25" cy="6.2" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export const PawIcon: React.FC<IconProps> = ({className = 'w-6 h-6'}) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <ellipse cx="6.2" cy="9.2" rx="2" ry="2.7" transform="rotate(-18 6.2 9.2)" />
    <ellipse cx="10.2" cy="6.1" rx="1.95" ry="2.75" transform="rotate(-6 10.2 6.1)" />
    <ellipse cx="14.9" cy="6.4" rx="1.95" ry="2.75" transform="rotate(10 14.9 6.4)" />
    <ellipse cx="18.6" cy="9.9" rx="1.9" ry="2.6" transform="rotate(24 18.6 9.9)" />
    <path d="M12.2 11.1c-2.9 0-5.4 2.4-5.7 5-.2 1.8 1.2 3.1 2.9 2.9 1-.1 1.9-.5 2.8-.5s1.8.4 2.8.5c1.7.2 3.1-1.1 2.9-2.9-.3-2.6-2.8-5-5.7-5z" />
  </svg>
);

export const CartIcon: React.FC<IconProps> = ({className = 'w-5 h-5'}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M2.5 4h2.6l2.1 10.2a1.4 1.4 0 0 0 1.37 1.12h8.9a1.4 1.4 0 0 0 1.36-1.06l1.42-5.76H6.1" />
    <circle cx="9.5" cy="19.5" r="1.45" fill="currentColor" stroke="none" />
    <circle cx="17.2" cy="19.5" r="1.45" fill="currentColor" stroke="none" />
  </svg>
);

export const HeartIcon: React.FC<IconProps & {filled?: boolean}> = ({
  className = 'w-6 h-6',
  filled = false,
}) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 20.3s-7.4-4.7-9.2-8.7C1.6 8.9 3.1 5.5 6.4 5.1c2-.2 3.8.8 5.6 2.8 1.8-2 3.6-3 5.6-2.8 3.3.4 4.8 3.8 3.6 6.5-1.8 4-9.2 8.7-9.2 8.7z" />
  </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({className = 'w-4 h-4'}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M9 5l7 7-7 7" />
  </svg>
);

export const BurstAccentIcon: React.FC<IconProps> = ({className = 'w-7 h-12'}) => (
  <svg
    viewBox="0 0 32 56"
    fill="none"
    stroke="#7D5E55"
    strokeWidth="2.8"
    strokeLinecap="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M5 17L19 5" />
    <path d="M7 28L25 27" />
    <path d="M6 39L22 50" />
  </svg>
);
