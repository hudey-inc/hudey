"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface InteractiveHoverButtonProps {
  text?: string;
  href?: string;
  containerClassName?: string;
  className?: string;
  onClick?: () => void;
}

export default function InteractiveHoverButton({
  text = "Button",
  href,
  containerClassName,
  onClick,
}: InteractiveHoverButtonProps) {
  return (
    <motion.a
      href={href}
      onClick={onClick}
      className={cn(
        "group relative inline-flex min-w-40 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[#2F4538] p-2 px-7 sm:px-8 py-3.5 sm:py-4 font-medium text-sm sm:text-base text-white",
        containerClassName,
      )}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "h-2 w-2 rounded-full bg-white/25 transition-all duration-500 group-hover:scale-[100]",
          )}
        />
        <span
          className={cn(
            "inline-block transition-all duration-500 group-hover:translate-x-12 group-hover:opacity-0",
          )}
        >
          {text}
        </span>
        <div
          className={cn(
            "absolute inset-0 z-10 flex items-center justify-center gap-2 text-white opacity-0 -translate-x-12 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100",
          )}
        >
          <span>{text}</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </motion.a>
  );
}
