"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  ArrowRight,
  Users,
  Shield,
  Sparkles,
  DollarSign,
  MessageSquare,
  BarChart3,
  Zap,
  Target,
  ChevronDown,
  Quote,
} from "lucide-react";
import { HudeyLogo } from "@/components/hudey-logo";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { trackCTAClick } from "@/lib/analytics";

const APP_URL = "https://app.hudey.co";

const steps = [
  {
    number: "01",
    icon: Target,
    title: "Tell Us What You Need",
    description:
      "Set your campaign goal, target audience, and budget. Hudey uses this to find creators who actually fit your brand.",
    color: "#2F4538",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "Get Matched with Creators",
    description:
      "Hudey recommends creators based on real engagement rates, audience fit, and whether their content aligns with your sustainability values.",
    color: "#D16B42",
  },
  {
    number: "03",
    icon: MessageSquare,
    title: "Review and Approve",
    description:
      "AI writes personalised outreach and handles negotiation. You read every message before it sends.",
    color: "#8B5CF6",
  },
  {
    number: "04",
    icon: BarChart3,
    title: "See Results in Real Time",
    description:
      "Track responses, deals, and campaign ROI from one dashboard. No spreadsheets, no manual updates.",
    color: "#10B981",
  },
];

const features = [
  {
    icon: Users,
    title: "Creator Discovery",
    description:
      "Search by niche, engagement rate, audience location, and follower size. Find creators your customers already follow.",
    stat: "Smart filters",
    gradient: "from-[#2F4538] to-[#3a5745]",
  },
  {
    icon: MessageSquare,
    title: "Personalised Outreach",
    description:
      "AI writes a unique message for each creator, referencing their content. You review and approve before anything sends.",
    stat: "You approve",
    gradient: "from-[#D16B42] to-[#b85a36]",
  },
  {
    icon: DollarSign,
    title: "AI Negotiation",
    description:
      "Hudey suggests fair rates based on follower count, engagement, and market benchmarks. You approve the final deal.",
    stat: "Fair pricing",
    gradient: "from-[#8B5CF6] to-[#7C3AED]",
  },
  {
    icon: BarChart3,
    title: "Live Campaign Dashboard",
    description:
      "Track outreach, responses, deals closed, and spend in real time. Export reports for your team in one click.",
    stat: "Live tracking",
    gradient: "from-[#10B981] to-[#059669]",
  },
  {
    icon: Shield,
    title: "Creator Vetting",
    description:
      "Every creator is checked for fake followers, past brand conflicts, and content that clashes with your values.",
    stat: "Fully vetted",
    gradient: "from-[#F59E0B] to-[#D97706]",
  },
  {
    icon: Sparkles,
    title: "Made for Sustainability",
    description:
      "Filter creators by eco, ethical, and wellness categories. Only partner with creators who genuinely share your mission.",
    stat: "Values-matched",
    gradient: "from-[#EC4899] to-[#DB2777]",
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Marketing Director",
    company: "Earthkind Co.",
    image: "/testimonials/sarah.jpg",
    quote:
      "We used to spend weeks finding creators who actually aligned with our values. Hudey matched us with the right partners in under 48 hours.",
  },
  {
    name: "Marcus Williams",
    role: "Brand Manager",
    company: "GreenThread",
    image: "/testimonials/marcus.jpg",
    quote:
      "The AI negotiation tool alone saved us 15 hours a week. We ran three campaigns simultaneously without hiring extra headcount.",
  },
  {
    name: "Emma Clarke",
    role: "Head of Partnerships",
    company: "Bloom & Wild",
    image: "/testimonials/emma.jpg",
    quote:
      "Finally a platform that understands sustainable brands aren\u2019t just a niche. The creator vetting is exactly what we needed.",
  },
];

const faqs = [
  {
    question: "How does Hudey find the right creators for my brand?",
    answer:
      "Hudey looks at real engagement rates, audience demographics, content topics, and past brand partnerships to recommend creators whose followers match your target customers. For sustainable brands, we also check that the creator\u2019s content genuinely aligns with eco and ethical values.",
  },
  {
    question: "Do I have control over what gets sent to creators?",
    answer:
      "Yes, always. Hudey writes personalised outreach and negotiation messages, but you see and approve every message before it goes out. You can edit anything, adjust the offer, or rewrite the message entirely.",
  },
  {
    question: "Which social platforms does Hudey support?",
    answer:
      "Instagram, TikTok, YouTube, and X. You can target one or all platforms when setting up a campaign, and manage everything from one dashboard.",
  },
  {
    question: "How much time will I actually save?",
    answer:
      "Most teams spend 15\u201320 hours per week on creator research, outreach, and back-and-forth negotiation. With Hudey, you can go from campaign brief to signed creators in under 48 hours.",
  },
  {
    question: "Can I bring in creators I already work with?",
    answer:
      "Yes. You can add existing creator partnerships to Hudey and use the dashboard to track their campaigns alongside new creators that Hudey finds for you.",
  },
];

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const scrollRef = useScrollReveal();

  return (
    <div ref={scrollRef} className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-xl border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-5">
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
              <Link
                href="/blog"
                className="text-sm font-medium text-gray-700 hover:text-[#2F4538] transition-colors"
              >
                Blog
              </Link>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <a
                href={`${APP_URL}/login`}
                className="text-sm font-medium text-gray-700 hover:text-[#2F4538] transition-colors hidden sm:block"
              >
                Sign In
              </a>
              <a
                href={`${APP_URL}/signup`}
                onClick={() => trackCTAClick("nav")}
                className="bg-[#2F4538] hover:bg-[#1f2f26] text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all shadow-lg shadow-[#2F4538]/20"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-5 sm:px-8 relative overflow-hidden bg-gradient-to-b from-[#E8DCC8]/20 via-white to-white">
        {/* Decorative Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(209,107,66,0.15)_0%,transparent_70%)]" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(47,69,56,0.08)_0%,transparent_70%)]" />
          {/* Dot Pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "radial-gradient(circle, #2F4538 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="max-w-5xl mx-auto text-center relative">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2F4538] to-[#3a5745] text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium mb-6 sm:mb-8 shadow-lg shadow-[#2F4538]/30">
              <Sparkles className="w-3 sm:w-4 h-3 sm:h-4" />
              <span className="hidden sm:inline">
                Now accepting UK sustainable brands for our founding cohort
              </span>
              <span className="sm:hidden">Founding cohort now open</span>
              <div className="w-2 h-2 bg-[#D16B42] rounded-full animate-pulse" />
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-4 sm:mb-6 leading-[1.1] tracking-tight">
              Influencer marketing,
              <br />
              <span className="bg-gradient-to-r from-[#2F4538] via-[#3a5745] to-[#D16B42] bg-clip-text text-transparent">
                handled by AI
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-xl lg:text-2xl text-gray-600 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-4">
              Hudey finds the right creators, writes personalised outreach,
              and negotiates fair deals&mdash;you review and approve every step.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 sm:mb-12 px-4">
              <a
                href={`${APP_URL}/signup`}
                onClick={() => trackCTAClick("hero")}
                className="bg-gradient-to-r from-[#2F4538] to-[#3a5745] hover:from-[#1f2f26] hover:to-[#2F4538] text-white px-8 sm:px-10 py-4 sm:py-5 rounded-full font-semibold text-base sm:text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-[#2F4538]/30 hover:shadow-2xl hover:shadow-[#2F4538]/40 hover:scale-105 group"
              >
                Apply for Early Access
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 mb-12 sm:mb-16 px-4">
              {[
                { icon: Shield, text: "You approve everything" },
                { icon: Zap, text: "Launch campaigns in hours" },
                { icon: BarChart3, text: "Track results live" },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-600"
                  >
                    <div className="w-4 sm:w-5 h-4 sm:h-5 bg-[#2F4538] rounded-full flex items-center justify-center">
                      <Icon className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-white" />
                    </div>
                    <span className="whitespace-nowrap">{item.text}</span>
                  </div>
                );
              })}
            </div>

            {/* Dashboard Preview */}
            <div className="relative mt-8 sm:mt-12 px-4">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(47,69,56,0.12)_0%,transparent_70%)]" />
              <div className="relative bg-white rounded-xl sm:rounded-2xl border-2 border-gray-200 shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-[#2F4538] to-[#3a5745] px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-2">
                  <div className="flex gap-1.5 sm:gap-2">
                    <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 bg-red-400 rounded-full" />
                    <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 bg-yellow-400 rounded-full" />
                    <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 bg-green-400 rounded-full" />
                  </div>
                  <div className="flex-1 text-center text-xs sm:text-sm font-medium text-white/80">
                    app.hudey.co/dashboard
                  </div>
                </div>
                {/* Placeholder dashboard */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 sm:p-10">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    {["Campaigns", "Creators", "Response Rate", "Deals"].map(
                      (label) => (
                        <div
                          key={label}
                          className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200"
                        >
                          <div className="text-[8px] sm:text-xs text-gray-400 mb-1">
                            {label}
                          </div>
                          <div className="h-3 sm:h-5 bg-gray-200 rounded w-2/3" />
                        </div>
                      )
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    <div className="col-span-2 bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200">
                      <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/3 mb-3 sm:mb-4" />
                      <div className="flex items-end gap-1 sm:gap-1.5 h-16 sm:h-24">
                        {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map(
                          (h, i) => (
                            <div
                              key={i}
                              className="flex-1 rounded-t bg-gradient-to-t from-[#2F4538] to-[#3a5745]"
                              style={{ height: `${h}%` }}
                            />
                          )
                        )}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200">
                      <div className="h-2 sm:h-3 bg-gray-200 rounded w-2/3 mb-3 sm:mb-4" />
                      <div className="space-y-2 sm:space-y-3">
                        {[70, 55, 40, 25].map((w, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div
                              className="h-2 bg-[#D16B42] rounded"
                              style={{ width: `${w}%` }}
                            />
                            <div className="h-2 bg-gray-100 rounded flex-1" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section
        id="how-it-works"
        className="reveal-section py-16 sm:py-20 lg:py-28 px-5 sm:px-8 bg-gradient-to-b from-white via-[#E8DCC8]/10 to-white"
      >
        <div className="max-w-7xl mx-auto">
          <div className="reveal-item text-center mb-10 sm:mb-16 md:mb-20">
            <div className="inline-flex items-center gap-2 bg-[#E8DCC8] px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold text-[#2F4538] mb-4 sm:mb-6">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              How It Works
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-3 sm:mb-6 px-4">
              Brief to signed creators in 48 hours
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Four steps. You approve everything along the way.
            </p>
          </div>

          <div className="reveal-item grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative group">
                  <div className="bg-white border-2 border-gray-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 h-full hover:border-gray-300 hover:shadow-2xl transition-all duration-300">
                    <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                      <div
                        className="w-12 sm:w-16 h-12 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0"
                        style={{ backgroundColor: step.color }}
                      >
                        <Icon className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs sm:text-sm font-bold text-gray-400 mb-1 sm:mb-2">
                          {step.number}
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                          {step.title}
                        </h3>
                        <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section
        id="features"
        className="reveal-section py-16 sm:py-20 lg:py-28 px-5 sm:px-8 bg-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(209,107,66,0.08)_0%,transparent_70%)]" />

        <div className="max-w-7xl mx-auto relative">
          <div className="reveal-item text-center mb-10 sm:mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-3 sm:mb-6 px-4">
              Everything you need, <span className="text-[#2F4538]">one agent</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Find creators, send outreach, negotiate deals, and track
              results — without switching tools.
            </p>
          </div>

          <div className="reveal-item grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl p-5 sm:p-8 hover:border-gray-300 hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}
                  />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4 sm:mb-6">
                      <div
                        className={`w-12 sm:w-14 h-12 sm:h-14 bg-gradient-to-br ${feature.gradient} rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg`}
                      >
                        <Icon className="w-6 sm:w-7 h-6 sm:h-7 text-white" />
                      </div>
                      <span className="bg-[#E8DCC8] text-[#2F4538] px-2 sm:px-3 py-1 rounded-full text-xs font-bold">
                        {feature.stat}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="reveal-section py-16 sm:py-20 lg:py-28 px-5 sm:px-8 bg-gradient-to-b from-white via-[#E8DCC8]/10 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="reveal-item text-center mb-10 sm:mb-16 md:mb-20">
            <div className="inline-flex items-center gap-2 bg-[#E8DCC8] px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold text-[#2F4538] mb-4 sm:mb-6">
              <Quote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Trusted by Brands
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-3 sm:mb-6 px-4">
              What our brands say
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              See how sustainable brands are saving time and finding better creator partners with Hudey.
            </p>
          </div>

          <div className="reveal-item grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((t, index) => (
              <div
                key={index}
                className="bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl p-6 sm:p-8 hover:border-gray-300 hover:shadow-2xl transition-all duration-300 relative"
              >
                <Quote className="w-8 h-8 text-[#E8DCC8] mb-4" />
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <Image
                    src={t.image}
                    alt={t.name}
                    width={44}
                    height={44}
                    className="rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-xs text-gray-500">
                      {t.role}, {t.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Founding Cohort ─── */}
      <section
        id="founding-cohort"
        className="reveal-section py-16 sm:py-20 lg:py-28 px-5 sm:px-8 bg-gradient-to-b from-[#E8DCC8]/20 to-white"
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="reveal-item">
            <div className="inline-flex items-center gap-2 bg-[#E8DCC8] px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold text-[#2F4538] mb-4 sm:mb-6">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Founding Cohort
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-3 sm:mb-6 px-4">
              Be one of the <span className="text-[#D16B42]">first 10 brands</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8 sm:mb-10 px-4">
              We&apos;re building Hudey alongside a small group of UK sustainable
              brands. Founding members get personal onboarding, a locked-in
              rate of &pound;250/campaign, and a direct line to our team.
            </p>
          </div>
          <div className="reveal-item grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
            {[
              {
                icon: Shield,
                title: "Founding Rate",
                description: "Locked-in pricing that won\u2019t change",
                color: "#2F4538",
              },
              {
                icon: Users,
                title: "Direct Access",
                description: "Work directly with the founding team",
                color: "#D16B42",
              },
              {
                icon: Zap,
                title: "Shape the Product",
                description: "Your feedback drives what we build next",
                color: "#8B5CF6",
              },
            ].map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={index}
                  className="bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl p-5 sm:p-6 hover:border-gray-300 hover:shadow-xl transition-all duration-300"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg"
                    style={{ backgroundColor: card.color }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {card.description}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="reveal-item">
            <a
              href={`${APP_URL}/signup`}
              onClick={() => trackCTAClick("founding_cohort")}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-[#2F4538] to-[#3a5745] hover:from-[#1f2f26] hover:to-[#2F4538] text-white px-8 py-4 sm:px-10 sm:py-5 rounded-full font-semibold text-base sm:text-lg transition-all shadow-xl shadow-[#2F4538]/30 hover:shadow-2xl hover:shadow-[#2F4538]/40 hover:scale-105 group"
            >
              Apply for Early Access
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* ─── FAQs ─── */}
      <section
        id="faq"
        className="reveal-section py-16 sm:py-20 lg:py-28 px-5 sm:px-8 bg-white"
      >
        <div className="max-w-4xl mx-auto">
          <div className="reveal-item text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-3 sm:mb-6 px-4">
              Frequently asked{" "}
              <span className="text-[#2F4538]">questions</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 px-4">
              Quick answers about how Hudey works, what you control, and what it costs.
            </p>
          </div>

          <div className="reveal-item space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden hover:border-gray-300 transition-all duration-200"
              >
                <button
                  onClick={() =>
                    setOpenFaq(openFaq === index ? null : index)
                  }
                  className="w-full px-6 sm:px-8 py-5 sm:py-6 flex items-center justify-between gap-4 text-left group"
                >
                  <span className="font-semibold text-sm sm:text-base md:text-lg text-gray-900 group-hover:text-[#2F4538] transition-colors pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 sm:w-6 sm:h-6 text-[#2F4538] flex-shrink-0 transition-transform duration-200 ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFaq === index ? "max-h-96" : "max-h-0"
                  }`}
                >
                  <div className="px-6 sm:px-8 pb-5 sm:pb-6 text-sm sm:text-base text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Still have questions */}
          <div className="reveal-item mt-12 sm:mt-16 text-center bg-gradient-to-r from-[#E8DCC8]/30 to-[#E8DCC8]/10 rounded-2xl sm:rounded-3xl p-8 sm:p-12 border-2 border-[#E8DCC8]">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
              Still have questions?
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
              Our team is here to help. Get in touch and we&apos;ll answer any
              questions you have.
            </p>
            <a
              href="mailto:hello@hudey.co"
              className="inline-block bg-gradient-to-r from-[#2F4538] to-[#3a5745] hover:from-[#1f2f26] hover:to-[#2F4538] text-white px-8 sm:px-10 py-3 sm:py-4 rounded-full font-semibold text-sm sm:text-base transition-all shadow-lg shadow-[#2F4538]/30 hover:shadow-xl hover:scale-105"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* ─── Final CTA + Footer ─── */}
      <section className="reveal-section bg-gradient-to-br from-[#2F4538] via-[#3a5745] to-[#2F4538] relative overflow-hidden">
        {/* Decorative */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(209,107,66,0.15)_0%,transparent_70%)]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0%,transparent_70%)]" />
        </div>

        {/* CTA Area */}
        <div className="pt-16 sm:pt-20 lg:pt-28 pb-14 sm:pb-16 px-5 sm:px-8">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="reveal-item">
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium text-white mb-6 sm:mb-8">
                <Sparkles className="w-3 sm:w-4 h-3 sm:h-4" />
                <span>Ready to get started?</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 px-4">
                Join the founding cohort
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-[#E8DCC8] mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
                10 spots for UK sustainable brands who want to run influencer
                campaigns without the busywork.
              </p>
            </div>

            <div className="reveal-item flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-xl mx-auto mb-8 sm:mb-10 px-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your work email"
                className="flex-1 px-5 sm:px-6 py-4 sm:py-5 rounded-full text-gray-900 bg-white outline-none focus:ring-4 focus:ring-[#D16B42]/50 text-base sm:text-lg shadow-xl"
              />
              <a
                href={`${APP_URL}/signup${email ? `?email=${encodeURIComponent(email)}` : ""}`}
                onClick={() => trackCTAClick("footer")}
                className="bg-gradient-to-r from-[#D16B42] to-[#b85a36] hover:from-[#b85a36] hover:to-[#D16B42] text-white px-8 sm:px-10 py-4 sm:py-5 rounded-full font-bold text-base sm:text-lg transition-all shadow-xl hover:shadow-2xl hover:scale-105 whitespace-nowrap text-center"
              >
                Apply Now
              </a>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-8 text-xs sm:text-sm text-white/90 px-4">
              {[
                { icon: Check, text: "10 founding spots" },
                { icon: Check, text: "Hands-on onboarding" },
                { icon: Check, text: "\u00a3250 per campaign, locked in" },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex items-center gap-2">
                    <Icon className="w-3 sm:w-4 h-3 sm:h-4" />
                    <span className="whitespace-nowrap">{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 px-5 sm:px-8 py-8 sm:py-10 relative z-10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            {/* Left — Logo + Copyright */}
            <div className="flex flex-col items-center md:items-start gap-3">
              <div className="flex items-center gap-2">
                <HudeyLogo className="w-6 h-6" bg="bg-white" fill="#111827" />
                <span className="font-semibold text-white">Hudey</span>
              </div>
              <p className="text-xs text-[#E8DCC8]/40">
                &copy; {new Date().getFullYear()} Hudey
              </p>
            </div>

            {/* Right — Links: 2-col mobile, 2-row desktop */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 md:flex md:flex-wrap md:justify-end md:gap-x-6 md:gap-y-2 md:max-w-xl text-sm text-[#E8DCC8]/60">
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
                href="/blog"
                className="hover:text-white transition-colors"
              >
                Blog
              </Link>
              <Link
                href="/about"
                className="hover:text-white transition-colors"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="hover:text-white transition-colors"
              >
                Contact
              </Link>
              <Link
                href="/help"
                className="hover:text-white transition-colors"
              >
                Help
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
          </div>
        </footer>
      </section>
    </div>
  );
}
