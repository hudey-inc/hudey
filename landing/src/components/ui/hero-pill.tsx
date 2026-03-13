"use client";

import { motion } from "motion/react";

interface HeroPillProps {
  href?: string;
  label: string;
  announcement: string;
  className?: string;
}

export function HeroPill({
  href,
  label,
  announcement,
  className = "",
}: HeroPillProps) {
  const Wrapper = href ? motion.a : motion.div;
  const wrapperProps = href
    ? { href, target: "_blank" as const, rel: "noopener noreferrer" as const }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`flex w-auto items-center space-x-2 rounded-full bg-gray-900/[0.06] ring-1 ring-gray-900/[0.08] px-2 py-1 whitespace-pre ${className}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="w-fit rounded-full bg-[#2F4538] px-2.5 py-0.5">
        <span className="text-xs font-medium text-white">{label}</span>
      </div>
      <p className="text-xs font-medium text-gray-500">{announcement}</p>
      <svg
        width="12"
        height="12"
        className="ml-1"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8.78141 5.33312L5.20541 1.75712L6.14808 0.814453L11.3334 5.99979L6.14808 11.1851L5.20541 10.2425L8.78141 6.66645H0.666748V5.33312H8.78141Z"
          fill="currentColor"
          className="text-gray-500"
        />
      </svg>
    </Wrapper>
  );
}
