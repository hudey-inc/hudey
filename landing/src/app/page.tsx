"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  ArrowRight,
  Users,
  Zap,
  Shield,
  Play,
  ChevronRight,
  Sparkles,
  Clock,
  DollarSign,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import { HudeyLogo } from "@/components/hudey-logo";

const APP_URL = "https://app.hudey.co";

const benefits = [
  "AI-powered creator discovery",
  "Personalised outreach, drafted for you",
  "You approve every step",
  "Live campaign tracking",
  "Built for sustainable brands",
];

const whyHudey = [
  { value: "AI-First", label: "Discovery", sublabel: "Matched on engagement, audience, and brand fit" },
  { value: "Your Call", label: "Outreach", sublabel: "AI drafts. You review. Nothing sends without you." },
  { value: "Smart", label: "Negotiation", sublabel: "Market-informed rates, optimised to your budget" },
  { value: "Live", label: "Reporting", sublabel: "Campaign metrics, updated in real time" },
];

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
      "Find creators based on engagement authenticity, audience demographics, and brand fit — not just follower counts.",
  },
  {
    icon: MessageSquare,
    title: "Personalised Outreach",
    description:
      "AI drafts messages that reference each creator\u2019s content and pitch your brand naturally. You review before anything sends.",
  },
  {
    icon: DollarSign,
    title: "AI-Powered Negotiation",
    description:
      "Negotiate rates, deliverables, and timelines using market data. You approve the final terms before any deal closes.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Reporting",
    description:
      "Campaign performance, creator deliverables, and spend tracking — all in one dashboard, updated automatically.",
  },
  {
    icon: Shield,
    title: "Brand Safety",
    description:
      "Every creator is vetted for content history, audience authenticity, and values alignment before they reach your shortlist.",
  },
  {
    icon: Sparkles,
    title: "Built for Sustainable Brands",
    description:
      "Search by sustainability categories, filter for ethical creators, and ensure every partnership reflects your values.",
  },
];


const painPoints = [
  {
    icon: Clock,
    before: "Weeks finding creators",
    after: "Matched in minutes",
  },
  {
    icon: MessageSquare,
    before: "Generic outreach",
    after: "Personalised messages",
  },
  {
    icon: DollarSign,
    before: "Manual rate negotiation",
    after: "Market-informed deals",
  },
  {
    icon: BarChart3,
    before: "Spreadsheet tracking",
    after: "Live dashboard reporting",
  },
];

export default function LandingPage() {
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <HudeyLogo className="w-7 h-7 sm:w-8 sm:h-8" />
              <span className="font-bold text-lg sm:text-xl text-gray-900">Hudey</span>
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

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 lg:pt-40 pb-14 sm:pb-20 lg:pb-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-[#E8DCC8]/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-[#D16B42]/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-6 sm:mb-8 shadow-sm">
              <div className="w-2 h-2 bg-[#D16B42] rounded-full animate-pulse" />
              <span className="text-gray-700">
                Now accepting UK sustainable brands for our founding cohort
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-4 sm:mb-6 leading-[1.1] tracking-tight">
              Influencer marketing,
              <br />
              <span className="bg-gradient-to-r from-[#2F4538] via-[#3a5745] to-[#D16B42] bg-clip-text text-transparent">
                handled by AI
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-xl lg:text-2xl text-gray-600 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-2">
              Hudey finds creators, drafts outreach, and negotiates
              deals&mdash;you approve every step.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 px-2">
              <a
                href={`${APP_URL}/signup`}
                className="bg-[#2F4538] hover:bg-[#1f2f26] text-white px-6 py-3.5 sm:px-8 sm:py-4 rounded-full font-semibold text-base sm:text-lg flex items-center justify-center gap-2 transition-all hover:shadow-xl hover:shadow-[#2F4538]/20 hover:scale-105 group"
              >
                Apply for Early Access
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <button className="bg-white border-2 border-gray-200 hover:border-[#2F4538] text-gray-900 px-6 py-3.5 sm:px-8 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-all flex items-center justify-center gap-2 hover:shadow-lg group">
                <Play className="w-5 h-5" />
                See It In Action
              </button>
            </div>

            {/* Benefits Checklist */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center gap-x-8 gap-y-2 sm:gap-y-3 max-w-3xl mx-auto">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#2F4538] rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-white stroke-[3]" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pain Point → Solution Section */}
      <section className="py-10 sm:py-16 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs sm:text-sm font-semibold text-[#D16B42] mb-2 uppercase tracking-wider">
            Before &amp; After
          </p>
          <h2 className="text-center text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-8 sm:mb-10">
            Replace the manual work
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {painPoints.map((point, index) => {
              const Icon = point.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#E8DCC8] rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#2F4538]" />
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400 line-through mb-1">
                    {point.before}
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-[#2F4538]">
                    {point.after}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Hudey Section */}
      <section className="py-14 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <p className="text-base sm:text-lg text-gray-600">
              One agent, every step of the campaign
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
            {whyHudey.map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-br from-[#2F4538] to-[#D16B42] bg-clip-text text-transparent mb-1 sm:mb-2">
                  {item.value}
                </div>
                <div className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5 sm:mb-1">
                  {item.label}
                </div>
                <div className="text-xs sm:text-sm text-gray-500">{item.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="py-14 sm:py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 bg-[#E8DCC8] px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold text-[#2F4538] mb-4 sm:mb-6">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              How It Works
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
              From brief to live campaign
            </h2>
            <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Four steps. You stay in control the entire way.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative group">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 h-full hover:border-[#D16B42] hover:shadow-xl transition-all duration-300">
                  <div className="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-br from-[#D16B42] to-[#b85a36] rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-lg sm:text-xl mb-4 sm:mb-6 shadow-lg shadow-[#D16B42]/20">
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
                    <ChevronRight className="w-8 h-8 text-[#D16B42]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-14 sm:py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16 lg:mb-20">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              One platform, end to end
            </h2>
            <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Discovery, outreach, negotiation, and reporting — all in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group bg-white border border-gray-200 rounded-2xl p-5 sm:p-8 hover:border-[#2F4538] hover:shadow-2xl transition-all duration-300"
                >
                  <div className="mb-4 sm:mb-6">
                    <div className="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-br from-[#2F4538] to-[#1f2f26] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-lg text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Founding Cohort */}
      <section
        id="founding-cohort"
        className="py-14 sm:py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white"
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#E8DCC8] px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold text-[#2F4538] mb-4 sm:mb-6">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Founding Cohort
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            Be one of the first 10 brands
          </h2>
          <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8 sm:mb-10">
            We&apos;re working with a small group of UK sustainable brands to build Hudey together. Founding members get hands-on support, locked-in pricing, and a direct line to our team.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
            <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6">
              <div className="w-10 h-10 bg-[#E8DCC8] rounded-lg flex items-center justify-center mx-auto mb-3">
                <Shield className="w-5 h-5 text-[#2F4538]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Founding Rate</h3>
              <p className="text-sm text-gray-500">Locked-in pricing that won&apos;t change</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6">
              <div className="w-10 h-10 bg-[#E8DCC8] rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-5 h-5 text-[#2F4538]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Direct Access</h3>
              <p className="text-sm text-gray-500">Work directly with the founding team</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6">
              <div className="w-10 h-10 bg-[#E8DCC8] rounded-lg flex items-center justify-center mx-auto mb-3">
                <Zap className="w-5 h-5 text-[#2F4538]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Shape the Product</h3>
              <p className="text-sm text-gray-500">Your feedback drives what we build next</p>
            </div>
          </div>
          <a
            href={`${APP_URL}/signup`}
            className="inline-flex items-center gap-2 bg-[#2F4538] hover:bg-[#1f2f26] text-white px-6 py-3.5 sm:px-8 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-all hover:shadow-xl hover:shadow-[#2F4538]/20 hover:scale-105 group"
          >
            Apply for Early Access
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-14 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#2F4538] via-[#1f2f26] to-[#2F4538] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-60 sm:w-96 h-60 sm:h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-60 sm:w-96 h-60 sm:h-96 bg-[#D16B42] rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 px-2">
            Join the founding cohort
          </h2>
          <p className="text-base sm:text-xl text-[#E8DCC8] mb-8 sm:mb-10 max-w-2xl mx-auto">
            We&apos;re working with 10 UK sustainable brands to shape Hudey from the ground up.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-xl mx-auto mb-6 sm:mb-8">
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

          <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-3 sm:gap-6 text-xs sm:text-sm text-[#E8DCC8]">
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
              <span>£250 per campaign, locked in</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8 lg:gap-12 mb-8 sm:mb-12">
            <div className="col-span-2">
              <a href="https://hudey.co" className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
                <HudeyLogo className="w-7 h-7" bg="bg-white" fill="#111827" />
                <span className="font-bold text-lg text-white">Hudey</span>
              </a>
              <p className="text-gray-500 mb-6 max-w-sm">
                AI-powered influencer marketing for brands that care about who represents them.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#how-it-works" className="hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <a href="#founding-cohort" className="hover:text-white transition-colors">
                    Founding Cohort
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href={`${APP_URL}/signup`} className="hover:text-white transition-colors">
                    Apply for Early Access
                  </a>
                </li>
                <li>
                  <a href={`${APP_URL}/login`} className="hover:text-white transition-colors">
                    Sign In
                  </a>
                </li>
                <li>
                  <a href="mailto:hello@hudey.co" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/refund" className="hover:text-white transition-colors">
                    Refund Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Hudey All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
