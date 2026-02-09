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
} from "lucide-react";

const APP_URL = "https://app.hudey.co";

const benefits = [
  "AI finds perfect creators",
  "AI writes personalized outreach",
  "AI negotiates on your behalf",
  "AI monitors every campaign",
  "AI generates insights & reports",
];

const stats = [
  { value: "10,000+", label: "Verified Creators", sublabel: "in our network" },
  { value: "500+", label: "Active Campaigns", sublabel: "running monthly" },
  { value: "95%", label: "Success Rate", sublabel: "campaign completion" },
  { value: "3.2x", label: "Average ROI", sublabel: "for our clients" },
];

const steps = [
  {
    number: "01",
    title: "Submit Brief",
    description:
      "Tell us your goals, audience, and budget in minutes. Our AI instantly analyzes your brand voice and campaign objectives.",
  },
  {
    number: "02",
    title: "AI Discovers",
    description:
      "Our agent finds and ranks creators based on authenticity, audience fit, and proven performance data.",
  },
  {
    number: "03",
    title: "Auto Outreach",
    description:
      "Personalized messages sent, responses managed, and deals negotiated autonomously while you focus on strategy.",
  },
  {
    number: "04",
    title: "Track & Report",
    description:
      "Real-time monitoring, compliance checks, and comprehensive insights delivered to your dashboard.",
  },
];

const features = [
  {
    icon: Users,
    title: "Smart Creator Matching",
    description:
      "AI analyzes millions of data points to find creators that perfectly align with your brand values and target audience.",
    stat: "98% match accuracy",
  },
  {
    icon: Zap,
    title: "Automated Negotiation",
    description:
      "AI agents negotiate favorable deals on your behalf, optimizing for both budget efficiency and campaign performance.",
    stat: "Save 30% on average",
  },
  {
    icon: TrendingUp,
    title: "Real-Time Analytics",
    description:
      "Track every metric that matters with detailed insights, predictive analytics, and actionable recommendations.",
    stat: "24/7 monitoring",
  },
  {
    icon: Shield,
    title: "Compliance & Safety",
    description:
      "Automated verification ensures all campaigns meet legal requirements and maintain your brand standards.",
    stat: "100% compliant",
  },
];

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "CMO, StyleCo",
    company: "Fashion Brand",
    initials: "SM",
    color: "bg-rose-100 text-rose-700",
    content:
      "Hudey transformed our influencer strategy. What used to take our team 3 weeks now happens in 48 hours. The AI negotiation alone saved us $120K last quarter.",
    results: "+340% ROI",
  },
  {
    name: "Marcus Chen",
    role: "Growth Lead, TechFlow",
    company: "SaaS Startup",
    initials: "MC",
    color: "bg-blue-100 text-blue-700",
    content:
      "The automated outreach feels surprisingly human and professional. Response rates went from 12% to 67%. This is the future of influencer marketing.",
    results: "5.6x response rate",
  },
  {
    name: "Emma Rodriguez",
    role: "Marketing Director, WellnessHub",
    company: "Health & Wellness",
    initials: "ER",
    color: "bg-emerald-100 text-emerald-700",
    content:
      "Real-time reporting changed everything. We can pivot campaigns mid-flight based on AI insights. Our influencer CAC dropped 45% in two months.",
    results: "-45% CAC",
  },
];

const logos = [
  { name: "TechCorp", width: "w-24" },
  { name: "StyleBrand", width: "w-28" },
  { name: "WellCo", width: "w-20" },
  { name: "FitHub", width: "w-24" },
  { name: "BeautyLab", width: "w-28" },
  { name: "FoodCo", width: "w-20" },
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
                href="#features"
                className="text-sm font-medium text-gray-700 hover:text-[#2F4538] transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-sm font-medium text-gray-700 hover:text-[#2F4538] transition-colors"
              >
                How It Works
              </a>
              <a
                href="#testimonials"
                className="text-sm font-medium text-gray-700 hover:text-[#2F4538] transition-colors"
              >
                Case Studies
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
                Start Free Trial
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
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <button className="bg-white border-2 border-gray-200 hover:border-[#2F4538] text-gray-900 px-8 py-4 rounded-full font-semibold text-lg transition-all flex items-center justify-center gap-2 hover:shadow-lg group">
                <Play className="w-5 h-5" />
                Watch Demo
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

      {/* Social Proof - Logos */}
      <section className="py-12 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-gray-500 mb-8 uppercase tracking-wider">
            Trusted by leading brands
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-40">
            {logos.map((logo, index) => (
              <div
                key={index}
                className={`${logo.width} h-8 bg-gray-300 rounded`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 lg:py-28 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
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
              From brief to results in 4 steps
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Launch your campaign in minutes, not weeks
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

      {/* CTA Section */}
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
              Start Free Trial
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
              <span>Cancel anytime</span>
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
                The AI-powered platform transforming how brands discover,
                engage, and measure influencer campaigns.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#testimonials" className="hover:text-white transition-colors">
                    Case Studies
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
                  <a href="mailto:support@hudey.com" className="hover:text-white transition-colors">
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
