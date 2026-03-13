"use client";

import React from "react";
import { motion } from "motion/react";

export type TestimonialItem = {
  text: string;
  name: string;
  initials: string;
  role: string;
};

const avatarBg = ["bg-[#2F4538]/10", "bg-[#D16B42]/10", "bg-[#f3f1ea]"];
const avatarText = ["text-[#2F4538]", "text-[#D16B42]", "text-gray-600"];

export function TestimonialsColumn({
  className,
  testimonials,
  duration = 10,
}: {
  className?: string;
  testimonials: TestimonialItem[];
  duration?: number;
}) {
  return (
    <div className={className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[...new Array(2)].map((_, index) => (
          <React.Fragment key={index}>
            {testimonials.map((t, i) => (
              <div
                className="p-8 rounded-3xl border border-black/[0.06] shadow-lg shadow-gray-900/5 max-w-xs w-full"
                key={i}
              >
                <p className="font-serif text-base text-gray-600 leading-relaxed italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3 mt-5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${avatarBg[i % avatarBg.length]}`}>
                    <span className={`text-xs font-semibold ${avatarText[i % avatarText.length]}`}>
                      {t.initials}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <div className="font-medium text-sm text-gray-900 tracking-tight leading-5">
                      {t.name}
                    </div>
                    <div className="text-xs text-gray-400 leading-5 tracking-tight">
                      {t.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}
