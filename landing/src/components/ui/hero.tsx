"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { HeroGlow } from "@/components/ui/hero-glow";

interface HeroProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  subtitle?: string;
  eyebrow?: React.ReactNode;
  ctaText?: string;
  ctaLink?: string;
  onCtaClick?: () => void;
  ctaSlot?: React.ReactNode;
  dashboardPreview?: React.ReactNode;
}

const Hero = React.forwardRef<HTMLDivElement, HeroProps>(
  (
    {
      className,
      title,
      subtitle,
      eyebrow,
      ctaText,
      ctaLink,
      onCtaClick,
      ctaSlot,
      dashboardPreview,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center relative overflow-hidden",
          "bg-[#f3f1ea]",
          "pt-12 sm:pt-16 lg:pt-20 pb-0 px-5 sm:px-8",
          className,
        )}
        {...props}
      >
        {/* Background glow */}
        <HeroGlow />

        <div className="max-w-5xl mx-auto w-full text-center relative z-10">
          {/* Eyebrow — pill component or text */}
          {eyebrow && (
            <div className="flex justify-center mb-8 sm:mb-10">
              {eyebrow}
            </div>
          )}

          {/* Title — large Instrument Serif */}
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-gray-900 mb-6 sm:mb-8 leading-[1.08] tracking-tight animate-appear opacity-0 delay-100">
            {title}
          </h1>

          {/* Subtitle — clean sans-serif */}
          {subtitle && (
            <p className="font-sans text-lg sm:text-xl lg:text-2xl text-gray-600 mb-10 sm:mb-14 max-w-2xl mx-auto leading-relaxed animate-appear opacity-0 delay-300">
              {subtitle}
            </p>
          )}

          {/* CTA */}
          {(ctaSlot || (ctaText && ctaLink)) && (
            <div className="mb-16 sm:mb-20 lg:mb-24 animate-appear opacity-0 delay-500">
              {ctaSlot || (
                <Link
                  href={ctaLink!}
                  onClick={onCtaClick}
                  className="inline-flex items-center gap-3 bg-[#2F4538] hover:bg-[#253b2e] text-white px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl font-medium text-sm sm:text-base transition-colors"
                >
                  {ctaText}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 3L11 8L6 13"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              )}
            </div>
          )}

          {/* Dashboard mockup — full width, rounded top, no bottom border */}
          {dashboardPreview && (
            <div className="relative w-full animate-appear opacity-0 delay-700">
              <div className="relative w-full rounded-t-2xl sm:rounded-t-3xl border border-black/[0.08] border-b-0 shadow-[0_-4px_60px_rgba(0,0,0,0.08)] overflow-hidden bg-white">
                {dashboardPreview}
              </div>
              {/* Fade-out gradient at bottom */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[120px] sm:h-[200px] lg:h-[300px] pointer-events-none z-10"
                style={{
                  background:
                    "linear-gradient(to top, #f3f1ea 0%, rgba(243,241,234,0) 100%)",
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  },
);

Hero.displayName = "Hero";

export { Hero };
export type { HeroProps };
