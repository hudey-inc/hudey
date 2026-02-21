"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Thin progress bar at the top of the viewport that animates during
 * Next.js client-side navigations. Zero dependencies — pure CSS transitions.
 *
 * Lifecycle:
 *  1. Pathname changes → bar appears at 0% and quickly grows to ~80%
 *  2. New page renders (useEffect fires) → bar jumps to 100%
 *  3. After the 100% transition completes → bar fades out and resets
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [state, setState] = useState<"idle" | "loading" | "completing" | "done">("idle");
  const prevPathRef = useRef(pathname);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect navigation start: pathname changed
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;

      // Clear any pending timeout from a previous navigation
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      // Start loading animation
      setState("loading");

      // After a small delay (let the bar reach ~80%), transition to completing
      timeoutRef.current = setTimeout(() => {
        setState("completing");

        // After the 100% transition, fade out
        timeoutRef.current = setTimeout(() => {
          setState("done");

          // Reset to idle after fade-out
          timeoutRef.current = setTimeout(() => {
            setState("idle");
          }, 300);
        }, 300);
      }, 150);
    }
  }, [pathname]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (state === "idle") return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
      role="progressbar"
      aria-label="Page loading"
      aria-valuenow={state === "loading" ? 80 : state === "completing" ? 100 : 0}
    >
      <div
        className={`h-[2.5px] bg-gradient-to-r from-[#2F4538] via-[#D16B42] to-[#2F4538] transition-all ease-out ${
          state === "loading"
            ? "w-[80%] duration-[600ms] opacity-100"
            : state === "completing"
            ? "w-full duration-200 opacity-100"
            : "w-full duration-200 opacity-0"
        }`}
      />
    </div>
  );
}
