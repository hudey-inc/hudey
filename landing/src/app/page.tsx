"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  ArrowRight,
  Users,
  Shield,
  ChevronRight,
  Sparkles,
  DollarSign,
  MessageSquare,
  BarChart3,
  Zap,
} from "lucide-react";
import { HudeyLogo } from "@/components/hudey-logo";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const APP_URL = "https://app.hudey.co";

const steps = [
  {
    number: "01",
    title: "Define Your Brief",
    description:
      "Set your goals, audience, and budget. Hudey builds a targeting strategy around your brand voice.",
  },
  {
    number: "02",
    title: "Discover Creators",
    description:
      "Hudey surfaces creators matched on engagement data, audience overlap, and brand alignment.",
  },
  {
    number: "03",
    title: "Review and Approve",
    description:
      "AI drafts personalised outreach and negotiates terms. Nothing goes out until you approve it.",
  },
  {
    number: "04",
    title: "Track Performance",
    description:
      "Every metric, delivered live to your dashboard. No manual tracking. No spreadsheets.",
  },
];

const features = [
  {
    icon: Users,
    title: "Creator Discovery",
    description:
      "Find creators based on engagement, audience demographics, and brand fit.",
  },
  {
    icon: MessageSquare,
    title: "Personalised Outreach",
    description:
      "AI drafts messages that reference each creator\u2019s content. You review before anything sends.",
  },
  {
    icon: DollarSign,
    title: "AI-Powered Negotiation",
    description:
      "Negotiate rates and deliverables using market data. You approve the final terms.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Reporting",
    description:
      "Campaign performance and spend tracking, all in one dashboard.",
  },
  {
    icon: Shield,
    title: "Brand Safety",
    description:
      "Every creator is vetted for content history and values alignment.",
  },
  {
    icon: Sparkles,
    title: "Built for Sustainable Brands",
    description:
      "Filter by sustainability categories and ensure partnerships reflect your values.",
  },
];

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const scrollRef = useScrollReveal();

  return (
    <div ref={scrollRef} className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <HudeyLogo className="w-7 h-7 sm:w-8 sm:h-8" />
              <span className="font-bold text-lg sm:text-xl text-gray-900">
                Hudey
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-10">
              <a
                href="#how-it-works"
                className="text-sm font-medium text-gray-700 hover:text-[#2F4538] transition-colors"
              >
                How It Works
              </a>
              <a
                href="#features"
                className="text-sm font-medium text-gray-700 hover:text-[#2F4538] transition-colors"
              >
                Features
              </a>
              <a
                href="#founding-cohort"
                className="text-sm font-medium text-gray-700 hover:text-[#2F4538] transition-colors"
              >
                Founding Cohort
              </a>
              <Link
                href="/pricing"
                className="text-sm font-medium text-gray-700 hover:text-[#2F4538] transition-colors"
              >
                Pricing
              </Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <a
                href={`${APP_URL}/login`}
                className="text-sm font-medium text-gray-700 hover:text-[#2F4538] transition-colors hidden sm:block"
              >
                Sign In
              </a>
              <a
                href={`${APP_URL}/signup`}
                className="bg-[#2F4538] hover:bg-[#1f2f26] text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all hover:shadow-lg hover:shadow-[#2F4538]/20"
              >
                Apply for Early Access
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── Dark background, single CTA */}
      <section className="pt-24 sm:pt-36 lg:pt-44 pb-14 sm:pb-32 lg:pb-40 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#2F4538] via-[#1f2f26] to-[#2F4538] relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 -z-0">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#D16B42]/8 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#E8DCC8]/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-6 sm:mb-10 backdrop-blur-sm">
            <div className="w-2 h-2 bg-[#D16B42] rounded-full animate-pulse shrink-0" />
            <span className="text-[#E8DCC8]">
              <span className="sm:hidden">Founding cohort now open</span>
              <span className="hidden sm:inline">Now accepting UK sustainable brands for our founding cohort</span>
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-7 leading-[1.12] sm:leading-[1.08] tracking-tight">
            Influencer marketing,
            <br />
            <span className="text-[#E8DCC8]">handled by AI</span>
          </h1>

          {/* Subheadline */}
          <p className="text-sm sm:text-xl lg:text-2xl text-[#E8DCC8]/80 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-1 sm:px-2">
            Hudey finds creators, drafts outreach, and negotiates
            deals&mdash;you approve every step.
          </p>

          {/* Single CTA */}
          <a
            href={`${APP_URL}/signup`}
            className="inline-flex items-center gap-2 bg-[#D16B42] hover:bg-[#b85a36] text-white px-6 py-3 sm:px-8 sm:py-4 rounded-full font-semibold text-sm sm:text-lg transition-all hover:shadow-xl hover:shadow-[#D16B42]/30 hover:scale-105 group mb-10 sm:mb-16"
          >
            Apply for Early Access
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
          </a>

          {/* Trust indicators */}
          <div className="grid grid-cols-3 sm:flex sm:flex-row sm:flex-wrap sm:justify-center items-center gap-3 sm:gap-10 pt-5 sm:pt-8 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/10 rounded-lg flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E8DCC8]" />
              </div>
              <span className="text-[10px] sm:text-sm text-[#E8DCC8]/70 text-center leading-tight">Human-in-the-loop</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/10 rounded-lg flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E8DCC8]" />
              </div>
              <span className="text-[10px] sm:text-sm text-[#E8DCC8]/70 text-center leading-tight">Live in minutes</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E8DCC8]" />
              </div>
              <span className="text-[10px] sm:text-sm text-[#E8DCC8]/70 text-center leading-tight">Real-time reporting</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section
        id="how-it-works"
        className="py-14 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-white"
      >
        <div className="max-w-7xl mx-auto">
          <div className="reveal text-center mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 bg-[#E8DCC8] px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold text-[#2F4538] mb-4 sm:mb-6">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              How It Works
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              From brief to live campaign
            </h2>
            <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Four steps. You stay in control the entire way.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {steps.map((step, index) => (
              <div key={index} className={`reveal reveal-delay-${index + 1} relative group`}>
                <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 h-full hover:border-[#2F4538] hover:shadow-xl transition-all duration-300">
                  <div className="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-br from-[#2F4538] to-[#1f2f26] rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-lg sm:text-xl mb-4 sm:mb-6 shadow-lg shadow-[#2F4538]/20">
                    {step.number}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ChevronRight className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── 3-column grid */}
      <section
        id="features"
        className="py-14 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="reveal text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              One platform, end to end
            </h2>
            <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Discovery, outreach, negotiation, and reporting — all in one
              place.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`reveal reveal-delay-${Math.min(index + 1, 3)} group bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 hover:border-[#2F4538] hover:shadow-lg transition-all duration-300`}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#E8DCC8] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#2F4538] transition-colors">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#2F4538] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Founding Cohort ─── */}
      <section
        id="founding-cohort"
        className="py-14 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-white"
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="reveal">
            <div className="inline-flex items-center gap-2 bg-[#E8DCC8] px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold text-[#2F4538] mb-4 sm:mb-6">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Founding Cohort
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              Be one of the first 10 brands
            </h2>
            <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8 sm:mb-10">
              We&apos;re working with a small group of UK sustainable brands to
              build Hudey together. Founding members get hands-on support,
              locked-in pricing, and a direct line to our team.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
            <div className="reveal reveal-delay-1 bg-gray-50 border border-gray-200 rounded-xl p-5 sm:p-6">
              <div className="w-10 h-10 bg-[#E8DCC8] rounded-lg flex items-center justify-center mx-auto mb-3">
                <Shield className="w-5 h-5 text-[#2F4538]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Founding Rate
              </h3>
              <p className="text-sm text-gray-500">
                Locked-in pricing that won&apos;t change
              </p>
            </div>
            <div className="reveal reveal-delay-2 bg-gray-50 border border-gray-200 rounded-xl p-5 sm:p-6">
              <div className="w-10 h-10 bg-[#E8DCC8] rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-5 h-5 text-[#2F4538]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Direct Access
              </h3>
              <p className="text-sm text-gray-500">
                Work directly with the founding team
              </p>
            </div>
            <div className="reveal reveal-delay-3 bg-gray-50 border border-gray-200 rounded-xl p-5 sm:p-6">
              <div className="w-10 h-10 bg-[#E8DCC8] rounded-lg flex items-center justify-center mx-auto mb-3">
                <Zap className="w-5 h-5 text-[#2F4538]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Shape the Product
              </h3>
              <p className="text-sm text-gray-500">
                Your feedback drives what we build next
              </p>
            </div>
          </div>
          <div className="reveal">
            <a
              href={`${APP_URL}/signup`}
              className="inline-flex items-center gap-2 bg-[#2F4538] hover:bg-[#1f2f26] text-white px-6 py-3.5 sm:px-8 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-all hover:shadow-xl hover:shadow-[#2F4538]/20 hover:scale-105 group"
            >
              Apply for Early Access
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* ─── Final CTA + Footer ─── Merged dark section */}
      <section className="bg-gradient-to-br from-[#2F4538] via-[#1f2f26] to-[#2F4538] relative overflow-hidden">
        {/* CTA Area */}
        <div className="pt-14 sm:pt-20 lg:pt-28 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <div className="reveal">
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
                Join the founding cohort
              </h2>
              <p className="text-base sm:text-xl text-[#E8DCC8]/80 mb-8 sm:mb-10 max-w-2xl mx-auto">
                We&apos;re working with 10 UK sustainable brands to shape Hudey
                from the ground up.
              </p>
            </div>

            <div className="reveal reveal-delay-1 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-xl mx-auto mb-6 sm:mb-8">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your work email"
                className="flex-1 px-5 py-3.5 sm:px-6 sm:py-4 rounded-full text-gray-900 bg-white/95 backdrop-blur border-2 border-transparent focus:border-[#D16B42] outline-none text-base sm:text-lg"
              />
              <a
                href={`${APP_URL}/signup${email ? `?email=${encodeURIComponent(email)}` : ""}`}
                className="bg-[#D16B42] hover:bg-[#b85a36] text-white px-6 py-3.5 sm:px-8 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-all hover:shadow-xl hover:shadow-[#D16B42]/30 whitespace-nowrap text-center"
              >
                Apply for Early Access
              </a>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-3 sm:gap-6 text-xs sm:text-sm text-[#E8DCC8]/70">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>10 founding spots</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Hands-on onboarding</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>&pound;250 per campaign, locked in</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer — simplified, same dark section */}
        <footer className="border-t border-white/10 px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <HudeyLogo className="w-6 h-6" bg="bg-white" fill="#111827" />
                <span className="font-semibold text-white">Hudey</span>
              </div>

              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[#E8DCC8]/60">
                <a
                  href="#how-it-works"
                  className="hover:text-white transition-colors"
                >
                  How It Works
                </a>
                <a
                  href="#features"
                  className="hover:text-white transition-colors"
                >
                  Features
                </a>
                <Link
                  href="/pricing"
                  className="hover:text-white transition-colors"
                >
                  Pricing
                </Link>
                <Link
                  href="/terms"
                  className="hover:text-white transition-colors"
                >
                  Terms
                </Link>
                <Link
                  href="/privacy"
                  className="hover:text-white transition-colors"
                >
                  Privacy
                </Link>
                <Link
                  href="/refund"
                  className="hover:text-white transition-colors"
                >
                  Refund Policy
                </Link>
              </div>

              <p className="text-xs text-[#E8DCC8]/40">
                &copy; {new Date().getFullYear()} Hudey
              </p>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}
