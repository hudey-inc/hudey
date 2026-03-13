import Link from "next/link";
import { FloatingHeader } from "@/components/ui/floating-header";
import { Badge } from "@/components/ui/badge";
import { Heart, Shield, Target, Zap } from "lucide-react";

export const metadata = {
  title: "About | Hudey",
  description:
    "Hudey is an AI-powered influencer marketing platform built for sustainable brands. Learn about our mission, values, and the team behind the product.",
};

const APP_URL = "https://app.hudey.co";

const navItems = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
  { label: "Founding Cohort", href: "/#founding-cohort" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
];

const values = [
  {
    icon: Heart,
    title: "Your Values, Protected",
    description:
      "Every creator recommendation is checked against your brand\u2019s sustainability standards. No more accidental partnerships that undermine your message.",
  },
  {
    icon: Shield,
    title: "You Stay in Control",
    description:
      "AI does the research, writes the outreach, and suggests deals. But you approve every message, every offer, and every partnership before anything happens.",
  },
  {
    icon: Target,
    title: "Built Only for Sustainable Brands",
    description:
      "We don\u2019t serve fast fashion or mass-market DTC. Hudey is designed specifically for eco, ethical, and wellness brands who need creator vetting they can trust.",
  },
  {
    icon: Zap,
    title: "Weeks of Work in Hours",
    description:
      "Go from campaign brief to signed creators in under 48 hours. Every creator is still vetted, every message is still personalised \u2014 it just happens faster.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-clip">
      {/* Navigation */}
      <FloatingHeader navItems={navItems} appUrl={APP_URL} />

      {/* Hero */}
      <section className="pt-10 sm:pt-16 pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="flex text-center justify-center items-center gap-4 flex-col">
          <Badge>About</Badge>
          <div className="flex gap-2 flex-col">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl tracking-tight text-center text-gray-900 leading-[1.08]">
              Influencer marketing that
              <br />
              <em>matches your mission</em>
            </h1>
            <p className="text-lg leading-relaxed tracking-tight text-gray-400 max-w-xl text-center mx-auto">
              Hudey helps sustainable brands find, contact, and sign the right
              creators — without spending weeks on manual research, outreach,
              and negotiation.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="pb-14 sm:pb-20 lg:pb-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-gray-900 mb-8 sm:mb-10 tracking-tight leading-[1.08]">
            Why we started <em>Hudey</em>
          </h2>
          <div className="space-y-6 text-base sm:text-lg text-gray-600 leading-relaxed">
            <p>
              Influencer marketing works. But if you run a sustainable brand,
              the process is painful. Most discovery tools don&apos;t let you
              filter by values. Outreach means copy-pasting the same DM dozens
              of times. Negotiations drag on across email, Instagram, and
              WhatsApp. By the time you&apos;ve signed one creator, you&apos;ve
              burned half your budget on coordination.
            </p>
            <p>
              We built Hudey because sustainable brands shouldn&apos;t have to
              choose between growing through creators and protecting their
              brand. You need a tool that understands why vetting matters, that
              checks a creator&apos;s content history before you reach out, and
              that frees you up to focus on creative direction instead of admin.
            </p>
            <p>
              Hudey uses AI to find the right creators, write personalised
              outreach, negotiate fair rates, and track every
              deliverable&mdash;while you stay in control of every decision.
              You approve every message. You sign off on every partnership.
              Nothing happens without you.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="pb-14 sm:pb-20 lg:pb-28 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto pt-14 sm:pt-20">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-gray-400 font-medium mb-6 sm:mb-8">
              Our Principles
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-gray-900 mb-4 tracking-tight leading-[1.08]">
              How we build <em>Hudey</em>
            </h2>
            <p className="text-base sm:text-lg text-gray-400 max-w-xl mx-auto">
              The principles behind every feature and decision.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#2F4538]/[0.06] flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-[#2F4538]" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {v.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
                    {v.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-gray-900 mb-4 tracking-tight leading-[1.08]">
            Join the founding <em>cohort</em>
          </h2>
          <p className="text-base sm:text-lg text-gray-400 max-w-xl mx-auto mb-8 sm:mb-10">
            10 spots for UK sustainable brands who want better influencer
            campaigns without the manual work.
          </p>
          <a
            href={`${APP_URL}/signup`}
            className="inline-flex items-center gap-3 bg-[#2F4538] hover:bg-[#253b2e] text-white px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl font-medium text-sm sm:text-base transition-colors"
          >
            Apply for Early Access
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
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2F4538] text-white/60 py-10 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} Hudey. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
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
    </div>
  );
}
