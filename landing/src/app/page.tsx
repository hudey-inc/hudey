"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  ArrowRight,
  Users,
  Zap,
  TrendingUp,
  Shield,
  Play,
  Star,
  ChevronRight,
  Sparkles,
  Clock,
  DollarSign,
  MessageSquare,
  BarChart3,
} from "lucide-react";

const APP_URL = "https://app.hudey.co";

const benefits = [
  "Launch campaigns in minutes, not weeks",
  "AI writes outreach that actually gets replies",
  "Negotiate better deals on autopilot",
  "Real-time tracking across every creator",
  "Full analytics without the spreadsheets",
];

const stats = [
  { value: "67%", label: "Reply Rate", sublabel: "vs 12% industry average" },
  { value: "10x", label: "Faster", sublabel: "campaign launch to first post" },
  { value: "40%", label: "Lower Cost", sublabel: "per creator engagement" },
  { value: "3.2x", label: "Average ROI", sublabel: "across all campaigns" },
];

const steps = [
  {
    number: "01",
    title: "Describe Your Campaign",
    description:
      "Drop in your goals, audience, and budget. Hudey's AI maps your brand voice and builds a targeting strategy in seconds — not days.",
  },
  {
    number: "02",
    title: "AI Finds the Right Creators",
    description:
      "No more scrolling through profiles. Our agent surfaces creators matched on real engagement data, audience overlap, and brand alignment.",
  },
  {
    number: "03",
    title: "Outreach & Deals Run Themselves",
    description:
      "Personalized messages go out, responses are handled, and deals are negotiated — all without you writing a single email.",
  },
  {
    number: "04",
    title: "Watch Results Roll In",
    description:
      "Every post, every metric, every insight — delivered live to your dashboard. No manual tracking. No reporting lag.",
  },
];

const features = [
  {
    icon: Users,
    title: "Creator Discovery That Actually Works",
    description:
      "Stop wasting hours on creator research. Hudey analyzes engagement authenticity, audience demographics, and brand fit to surface creators who will move the needle — not just look good on paper.",
    stat: "98% match accuracy",
  },
  {
    icon: MessageSquare,
    title: "Outreach That Gets Replies",
    description:
      "Generic DMs get ignored. Hudey writes personalized outreach that references each creator's content and pitches your brand naturally. The result? Reply rates your team hasn't seen before.",
    stat: "67% avg reply rate",
  },
  {
    icon: DollarSign,
    title: "Negotiate Better Deals, Automatically",
    description:
      "Hudey's AI negotiates rates, deliverables, and timelines based on market data and your budget. You approve the final terms. Every deal is optimized before you sign off.",
    stat: "40% avg savings",
  },
  {
    icon: BarChart3,
    title: "Live Reporting Without the Busywork",
    description:
      "See exactly what's working and what's not — in real time. Campaign performance, creator deliverables, spend tracking, and ROI — all in one dashboard, updated automatically.",
    stat: "Real-time insights",
  },
];

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "CMO, StyleCo",
    company: "Fashion & Lifestyle",
    initials: "SM",
    color: "bg-rose-100 text-rose-700",
    content:
      "We replaced a 4-person influencer team with Hudey. Not because we wanted to — because Hudey outperformed them. Campaigns launch in hours, not weeks, and our creator response rate tripled.",
    results: "+340% ROI",
  },
  {
    name: "Marcus Chen",
    role: "Growth Lead, TechFlow",
    company: "B2B SaaS",
    initials: "MC",
    color: "bg-blue-100 text-blue-700",
    content:
      "Our old process: research creators, write 200 emails, wait, follow up, negotiate rates manually. Now? We describe the campaign and Hudey handles the rest. Our cost per engagement dropped 45%.",
    results: "-45% cost per deal",
  },
  {
    name: "Emma Rodriguez",
    role: "Marketing Director, WellnessHub",
    company: "Health & Wellness",
    initials: "ER",
    color: "bg-emerald-100 text-emerald-700",
    content:
      "The negotiation AI alone paid for itself in the first month. It consistently lands rates 30-40% below what creators initially quote — without damaging the relationship. That's the magic.",
    results: "38% lower rates",
  },
];

const painPoints = [
  {
    icon: Clock,
    before: "Weeks spent finding creators",
    after: "Matched in minutes",
  },
  {
    icon: MessageSquare,
    before: "12% reply rate on cold outreach",
    after: "67% reply rate with AI personalization",
  },
  {
    icon: DollarSign,
    before: "Overpaying on every deal",
    after: "40% average savings on rates",
  },
  {
    icon: BarChart3,
    before: "Manual spreadsheet tracking",
    after: "Real-time automated reporting",
  },
];

export default function LandingPage() {
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#2F4538] rounded-lg flex items-center justify-center text-white text-sm font-bold">
                H
              </div>
              <span className="font-bold text-xl text-gray-900">Hudey</span>
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
                href="#testimonials"
                className="text-sm font-medium text-gray-700 hover:text-[#2F4538] transition-colors"
              >
                Results
              </a>
            </div>

            <div className="flex items-center gap-4">
              <a
                href={`${APP_URL}/login`}
                className="text-sm font-medium text-gray-700 hover:text-[#2F4538] transition-colors hidden sm:block"
              >
                Sign In
              </a>
              <a
                href={`${APP_URL}/signup`}
                className="bg-[#2F4538] hover:bg-[#1f2f26] text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:shadow-lg hover:shadow-[#2F4538]/20"
              >
                Get Started Free
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 lg:pt-40 pb-20 lg:pb-32 px-6 lg:px-8 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#E8DCC8]/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#D16B42]/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-full text-sm font-medium mb-8 shadow-sm">
              <div className="w-2 h-2 bg-[#D16B42] rounded-full animate-pulse" />
              <span className="text-gray-700">
                Trusted by 500+ marketing teams
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-[1.1] tracking-tight">
              The AI Marketing Platform
              <br />
              <span className="bg-gradient-to-r from-[#2F4538] via-[#3a5745] to-[#D16B42] bg-clip-text text-transparent">
                That Runs Your Campaigns
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl lg:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              From creator discovery to campaign reporting, Hudey&apos;s AI
              agents handle everything&mdash;so you can focus on strategy, not
              execution.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <a
                href={`${APP_URL}/signup`}
                className="bg-[#2F4538] hover:bg-[#1f2f26] text-white px-8 py-4 rounded-full font-semibold text-lg flex items-center justify-center gap-2 transition-all hover:shadow-xl hover:shadow-[#2F4538]/20 hover:scale-105 group"
              >
                Start Your Free Campaign
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <button className="bg-white border-2 border-gray-200 hover:border-[#2F4538] text-gray-900 px-8 py-4 rounded-full font-semibold text-lg transition-all flex items-center justify-center gap-2 hover:shadow-lg group">
                <Play className="w-5 h-5" />
                See It In Action
              </button>
            </div>

            {/* Benefits Checklist */}
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 max-w-3xl mx-auto">
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
      <section className="py-16 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="text-center text-sm font-semibold text-[#D16B42] mb-2 uppercase tracking-wider">
            The old way vs. the Hudey way
          </p>
          <h2 className="text-center text-2xl lg:text-3xl font-bold text-gray-900 mb-10">
            Influencer marketing shouldn&apos;t be this hard
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {painPoints.map((point, index) => {
              const Icon = point.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 border border-gray-200"
                >
                  <div className="w-10 h-10 bg-[#E8DCC8] rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#2F4538]" />
                  </div>
                  <p className="text-sm text-gray-400 line-through mb-1">
                    {point.before}
                  </p>
                  <p className="text-sm font-semibold text-[#2F4538]">
                    {point.after}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 lg:py-28 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-lg text-gray-600">
              Numbers that speak for themselves
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl lg:text-6xl font-bold bg-gradient-to-br from-[#2F4538] to-[#D16B42] bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-base font-semibold text-gray-900 mb-1">
                  {stat.label}
                </div>
                <div className="text-sm text-gray-500">{stat.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="py-20 lg:py-32 px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 bg-[#E8DCC8] px-4 py-2 rounded-full text-sm font-semibold text-[#2F4538] mb-6">
              <Sparkles className="w-4 h-4" />
              How It Works
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              From brief to live campaign in 4 steps
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              What used to take your team 3 weeks now takes 48 hours
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative group">
                <div className="bg-white border border-gray-200 rounded-2xl p-8 h-full hover:border-[#D16B42] hover:shadow-xl transition-all duration-300">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#D16B42] to-[#b85a36] rounded-2xl flex items-center justify-center text-white font-bold text-xl mb-6 shadow-lg shadow-[#D16B42]/20">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
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
      <section id="features" className="py-20 lg:py-32 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 lg:mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful AI features designed for maximum ROI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group bg-white border border-gray-200 rounded-2xl p-8 hover:border-[#2F4538] hover:shadow-2xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#2F4538] to-[#1f2f26] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="bg-[#E8DCC8] text-[#2F4538] px-3 py-1 rounded-full text-xs font-semibold">
                      {feature.stat}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="testimonials"
        className="py-20 lg:py-32 px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 lg:mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Trusted by growth leaders
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See how teams are scaling with Hudey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-[#D16B42] text-[#D16B42]"
                    />
                  ))}
                </div>

                <p className="text-gray-700 leading-relaxed mb-6 text-lg">
                  &ldquo;{testimonial.content}&rdquo;
                </p>

                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2F4538] to-[#1f2f26] text-white px-4 py-2 rounded-full text-sm font-bold mb-6">
                  <TrendingUp className="w-4 h-4" />
                  {testimonial.results}
                </div>

                <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold ${testimonial.color}`}
                  >
                    {testimonial.initials}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role}
                    </div>
                    <div className="text-xs text-gray-500">
                      {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 lg:py-28 px-6 lg:px-8 bg-gradient-to-br from-[#2F4538] via-[#1f2f26] to-[#2F4538] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#D16B42] rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to 10x your influencer ROI?
          </h2>
          <p className="text-xl text-[#E8DCC8] mb-10 max-w-2xl mx-auto">
            Join hundreds of brands using AI to run campaigns that actually
            convert
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto mb-8">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your work email"
              className="flex-1 px-6 py-4 rounded-full text-gray-900 bg-white/95 backdrop-blur border-2 border-transparent focus:border-[#D16B42] outline-none text-lg"
            />
            <a
              href={`${APP_URL}/signup${email ? `?email=${encodeURIComponent(email)}` : ""}`}
              className="bg-[#D16B42] hover:bg-[#b85a36] text-white px-8 py-4 rounded-full font-semibold text-lg transition-all hover:shadow-xl hover:shadow-[#D16B42]/30 whitespace-nowrap text-center"
            >
              Get Started Free
            </a>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-[#E8DCC8]">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Launch your first campaign today</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-gray-900 text-xs font-bold">
                  H
                </div>
                <span className="font-bold text-lg text-white">Hudey</span>
              </div>
              <p className="text-gray-500 mb-6 max-w-sm">
                AI-powered influencer marketing. Find creators, send outreach,
                close deals, and track results — all on autopilot.
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
                  <a href="#testimonials" className="hover:text-white transition-colors">
                    Results
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href={`${APP_URL}/signup`} className="hover:text-white transition-colors">
                    Get Started
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
                    Terms
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
              &copy; {new Date().getFullYear()} Hudey Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
