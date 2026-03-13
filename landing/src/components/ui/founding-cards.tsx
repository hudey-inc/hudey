"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";

function PricePulse() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const interval = setInterval(() => {
      setScale((prev) => (prev === 1 ? 1.12 : 1));
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <motion.span
        className="text-5xl md:text-6xl font-semibold text-[#D16B42] tabular-nums"
        animate={{ scale }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        £250
      </motion.span>
      <span className="text-xs text-gray-400 font-medium">per campaign</span>
    </div>
  );
}

function TeamPulse() {
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      setConnected((prev) => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex items-center justify-center h-full gap-4">
      <motion.div
        className="w-12 h-12 rounded-full bg-[#f3f1ea] flex items-center justify-center"
        animate={{ scale: connected ? 1.1 : 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="text-[10px] font-semibold text-gray-600">You</span>
      </motion.div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#2F4538]"
            animate={{
              scale: connected ? 1 : 0.4,
              opacity: connected ? 0.6 : 0.15,
            }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          />
        ))}
      </div>
      <motion.div
        className="w-12 h-12 rounded-full bg-[#f3f1ea] flex items-center justify-center"
        animate={{ scale: connected ? 1.1 : 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="text-[10px] font-semibold text-gray-600">Team</span>
      </motion.div>
    </div>
  );
}

function BuildBlocks() {
  const [layout, setLayout] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setLayout((prev) => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(interval);
  }, []);
  const layouts = [
    "grid-cols-2 grid-rows-2",
    "grid-cols-3 grid-rows-1",
    "grid-cols-1 grid-rows-3",
  ];
  return (
    <div className="h-full p-4 flex items-center justify-center">
      <motion.div
        className={`grid ${layouts[layout]} gap-2 w-full max-w-[140px]`}
        layout
      >
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="bg-[#2F4538]/20 rounded-md min-h-[30px]"
            layout
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      </motion.div>
    </div>
  );
}

const cards = [
  {
    Visual: PricePulse,
    title: "Founding Rate",
    description: "Locked-in pricing that won\u2019t change",
  },
  {
    Visual: TeamPulse,
    title: "Direct Access",
    description: "Work directly with the founding team",
  },
  {
    Visual: BuildBlocks,
    title: "Shape the Product",
    description: "Your feedback drives what we build next",
  },
];

export function FoundingCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={i}
          className="bg-white rounded-xl p-6 sm:p-8 min-h-[280px] flex flex-col border border-black/[0.06] [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05)]"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
          whileHover={{ scale: 0.98 }}
          whileTap={{ scale: 0.96 }}
        >
          <div className="flex-1">
            <card.Visual />
          </div>
          <div className="mt-4 text-center">
            <h3 className="font-semibold text-gray-900">{card.title}</h3>
            <p className="text-sm text-gray-400 mt-1">{card.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
