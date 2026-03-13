/**
 * Custom icon set inspired by the Streamline Flex Solid style.
 * Characteristics: solid filled shapes, organic curvy forms, swelling curves,
 * generous negative space, friendly and modern personality.
 *
 * All icons accept className for Tailwind sizing/coloring (e.g. "w-6 h-6 text-gray-700").
 * They use "currentColor" so text-* classes control the fill color.
 */

import { type SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function IconTarget({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 16.5c-3.58 0-6.5-2.92-6.5-6.5S8.42 5.5 12 5.5s6.5 2.92 6.5 6.5-2.92 6.5-6.5 6.5z" />
      <path d="M12 8.5c-1.93 0-3.5 1.57-3.5 3.5s1.57 3.5 3.5 3.5 3.5-1.57 3.5-3.5-1.57-3.5-3.5-3.5z" />
    </svg>
  );
}

export function IconSparkles({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M9.5 2c.3 0 .5.2.6.5l1.4 4.2c.2.7.8 1.3 1.5 1.5l4.2 1.4c.3.1.5.3.5.6s-.2.5-.5.6l-4.2 1.4c-.7.2-1.3.8-1.5 1.5L10.1 16c-.1.3-.3.5-.6.5s-.5-.2-.6-.5l-1.4-4.2c-.2-.7-.8-1.3-1.5-1.5L1.8 8.9c-.3-.1-.5-.3-.5-.6s.2-.5.5-.6l4.2-1.4c.7-.2 1.3-.8 1.5-1.5L8.9 2.5c.1-.3.3-.5.6-.5z" />
      <path d="M18 13c.2 0 .4.1.4.4l.8 2.4c.1.4.4.7.8.8l2.4.8c.2.1.4.2.4.4s-.1.4-.4.4l-2.4.8c-.4.1-.7.4-.8.8l-.8 2.4c-.1.2-.2.4-.4.4s-.4-.1-.4-.4l-.8-2.4c-.1-.4-.4-.7-.8-.8l-2.4-.8c-.2-.1-.4-.2-.4-.4s.1-.4.4-.4l2.4-.8c.4-.1.7-.4.8-.8l.8-2.4c0-.3.2-.4.4-.4z" />
    </svg>
  );
}

export function IconMessage({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M20.5 3h-17C2.12 3 1 4.12 1 5.5v10C1 16.88 2.12 18 3.5 18H7l3.6 3.6c.4.4.9.4 1.3 0L15.5 18h5c1.38 0 2.5-1.12 2.5-2.5v-10C23 4.12 21.88 3 20.5 3z" />
    </svg>
  );
}

export function IconChart({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <rect x="2" y="13" width="4.5" height="9" rx="2" />
      <rect x="9.75" y="8" width="4.5" height="14" rx="2" />
      <rect x="17.5" y="2" width="4.5" height="20" rx="2" />
    </svg>
  );
}

export function IconUsers({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <circle cx="9" cy="7" r="3.5" />
      <path d="M2 18.5c0-3.04 2.46-5.5 5.5-5.5h3c3.04 0 5.5 2.46 5.5 5.5 0 .83-.67 1.5-1.5 1.5h-11C2.67 20 2 19.33 2 18.5z" />
      <circle cx="18" cy="8.5" r="2.5" />
      <path d="M22 18c0-2.21-1.79-4-4-4h-.5c-.16 0-.32.01-.48.04.73 1.13 1.18 2.46 1.23 3.89.01.24.01.47-.02.7.09.01.18.02.27.02H21c.55 0 1-.45 1-1z" />
    </svg>
  );
}

export function IconDollar({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.75 15.5v.75c0 .41-.34.75-.75.75s-.75-.34-.75-.75V17.4c-1.62-.26-2.87-1.28-3.08-2.62-.09-.56.36-1.03.93-1.03h.12c.43 0 .78.31.87.73.18.83 1.02 1.27 2.16 1.27 1.42 0 2-.67 2-1.37 0-.71-.4-1.26-2.23-1.72-2.06-.52-3.52-1.34-3.52-3.14 0-1.46 1.18-2.6 2.75-2.87V5.75c0-.41.34-.75.75-.75s.75.34.75.75v.88c1.36.3 2.38 1.16 2.63 2.32.1.48-.28.93-.77.93h-.15c-.41 0-.74-.28-.84-.68-.22-.82-.96-1.2-1.87-1.2-1.18 0-1.93.58-1.93 1.37 0 .64.44 1.13 2.24 1.58 2.06.51 3.5 1.26 3.5 3.27 0 1.57-1.2 2.71-2.81 2.98v.8z" />
    </svg>
  );
}

export function IconShield({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M12 1.5c-.3 0-.5.1-.7.2L4 5.5C3.4 5.8 3 6.4 3 7v4.5c0 5.25 3.83 10.16 9 11.34 5.17-1.18 9-6.09 9-11.34V7c0-.6-.4-1.2-1-1.5l-7.3-3.8c-.2-.1-.4-.2-.7-.2zm-1.5 14.7l-3-3c-.4-.4-.4-1 0-1.4s1-.4 1.4 0l2.1 2.1 4.6-4.6c.4-.4 1-.4 1.4 0s.4 1 0 1.4l-5.3 5.3c-.2.2-.5.3-.7.3-.3-.1-.5-.2-.5-.3z" />
    </svg>
  );
}

export function IconZap({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M13.5 2c.4 0 .7.3.7.6l-.1.4-3 7h5.4c.5 0 .9.4.9.9 0 .2-.1.3-.1.5l-6.5 10.4c-.2.3-.5.5-.9.4-.4-.1-.6-.4-.6-.8l.1-.4 3-7H7.1c-.5 0-.9-.4-.9-.9 0-.2.1-.3.1-.5L12.8 2.5c.2-.3.5-.5.7-.5z" />
    </svg>
  );
}

export function IconQuote({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M9.5 4C6.46 4 4 6.46 4 9.5c0 1.83.9 3.45 2.27 4.45-.15 1.35-.73 2.55-1.73 3.55-.3.3-.1.82.32.87h.14c1.82 0 3.47-.72 4.7-1.88.56.12 1.15.18 1.74.18 3.04 0 5.5-2.46 5.5-5.5V9.5C16.94 6.1 13.67 4 9.5 4z" />
      <path d="M20.5 8.67c-.73-.42-1.55-.67-2.42-.67.06.48.09.98.09 1.5v1.67c0 3.59-2.6 6.57-6.02 7.16.95.72 2.1 1.17 3.35 1.17.45 0 .9-.05 1.33-.14.94.88 2.2 1.44 3.6 1.44h.1c.33-.04.5-.44.25-.67-.77-.77-1.21-1.68-1.33-2.72A4.52 4.52 0 0022 13.5v-1.17c0-1.46-.58-2.77-1.5-3.66z" />
    </svg>
  );
}

export function IconChevronDown({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M12 16c-.4 0-.7-.1-1-.4l-6.3-6.3c-.5-.5-.5-1.4 0-1.9s1.4-.5 1.9 0L12 12.8l5.4-5.4c.5-.5 1.4-.5 1.9 0s.5 1.4 0 1.9l-6.3 6.3c-.3.3-.6.4-1 .4z" />
    </svg>
  );
}

export function IconCheck({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M9.5 17.5c-.4 0-.7-.1-1-.4l-4.3-4.3c-.5-.5-.5-1.4 0-1.9s1.4-.5 1.9 0L9.5 14.3l8.4-8.4c.5-.5 1.4-.5 1.9 0s.5 1.4 0 1.9l-9.3 9.3c-.3.3-.6.4-1 .4z" />
    </svg>
  );
}

export function IconArrowRight({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M13.3 5.3c.5-.5 1.4-.5 1.9 0l5.5 5.5c.3.3.4.6.4 1s-.1.7-.4 1l-5.5 5.5c-.5.5-1.4.5-1.9 0s-.5-1.4 0-1.9l3.2-3.2H4.2c-.7 0-1.3-.6-1.3-1.3s.6-1.3 1.3-1.3h12.3l-3.2-3.2c-.5-.6-.5-1.4 0-2z" />
    </svg>
  );
}
