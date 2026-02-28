import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Target, Heart, Zap, Shield } from "lucide-react";
import { HudeyLogo } from "@/components/hudey-logo";

const APP_URL = "https://app.hudey.co";

export const metadata: Metadata = {
  title: "About",
  description:
    "Hudey is an AI-powered influencer marketing platform built for sustainable brands. Learn about our mission, values, and the team behind the product.",
  openGraph: {
    title: "About | Hudey",
    description:
      "Hudey is an AI-powered influencer marketing platform built for sustainable brands.",
  },
};

const values = [
  {
    icon: Heart,
    title: "Values-First",
    description:
      "We believe every partnership should reflect your brand\u2019s principles. That\u2019s why values alignment is at the core of everything we build.",
    color: "#D16B42",
  },
  {
    icon: Shield,
    title: "Human in the Loop",
    description:
      "AI handles the heavy lifting, but you make the decisions. Every message, every offer, every partnership is approved by you.",
    color: "#2F4538",
  },
  {
    icon: Target,
    title: "Built for Focus",
    description:
      "We\u2019re not trying to serve everyone. We\u2019re building the best influencer marketing tool for brands that genuinely care about sustainability.",
    color: "#8B5CF6",
  },
  {
    icon: Zap,
    title: "Speed Without Shortcuts",
    description:
      "What takes weeks manually takes hours with Hudey. But we never sacrifice quality — every recommendation is vetted, every message is personalised.",
    color: "#10B981",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-200 bg-white/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <HudeyLogo className="w-7 h-7" />
            <span className="font-bold text-lg text-gray-900">Hudey</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="pt-16 sm:pt-20 pb-12 px-5 sm:px-8 bg-gradient-to-b from-[#E8DCC8]/20 to-white">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Smarter campaigns for brands that{" "}
            <span className="text-[#2F4538]">care</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Hudey is an AI-powered influencer marketing platform built
            specifically for sustainable brands. We automate the work so you
            can focus on what matters&mdash;building genuine partnerships that
            reflect your values.
          </p>
        </div>
      </header>

      {/* Story */}
      <section className="py-16 sm:py-20 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Why we started Hudey
          </h2>
          <div className="prose prose-lg prose-gray max-w-none prose-p:text-gray-700 prose-p:leading-relaxed">
            <p>
              Influencer marketing works. But for sustainable brands, the
              process is broken. Discovery tools don&apos;t filter by values.
              Outreach is manual and repetitive. Negotiations happen in
              scattered DMs. And by the time you&apos;ve launched a campaign,
              you&apos;ve spent more hours on coordination than strategy.
            </p>
            <p>
              We built Hudey because we believe sustainable brands deserve
              better tooling. Not a generic platform that treats eco-friendly
              skincare the same as fast fashion&mdash;but a purpose-built system
              that understands vetting isn&apos;t optional, that values
              alignment matters, and that your time is better spent on
              creative direction than copy-pasting DMs.
            </p>
            <p>
              Hudey uses AI to handle the repetitive work&mdash;finding creators,
              writing personalised outreach, negotiating fair terms, tracking
              deliverables&mdash;while keeping you in control of every decision.
              You approve every message. You sign off on every partnership. The
              AI works for you, not the other way around.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-20 px-5 sm:px-8 bg-gradient-to-b from-white via-[#E8DCC8]/10 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              What we stand for
            </h2>
            <p className="text-lg text-gray-600">
              The principles that guide how we build Hudey.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <div
                  key={i}
                  className="bg-white border-2 border-gray-200 rounded-2xl p-6 sm:p-8 hover:border-gray-300 hover:shadow-xl transition-all duration-300"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-lg"
                    style={{ backgroundColor: v.color }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {v.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{v.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="rounded-2xl bg-gradient-to-br from-[#2F4538] to-[#3a5745] p-10 sm:p-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Join the founding cohort
            </h2>
            <p className="text-[#E8DCC8]/80 text-lg mb-8 max-w-md mx-auto">
              We&apos;re working with a small group of UK sustainable brands to
              build Hudey together.
            </p>
            <a
              href={`${APP_URL}/signup`}
              className="inline-flex items-center gap-3 bg-white text-[#2F4538] px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#E8DCC8] transition-colors group"
            >
              Apply for Early Access
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HudeyLogo className="w-5 h-5" />
            <span className="font-semibold text-sm text-gray-900">Hudey</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/blog" className="hover:text-gray-700 transition-colors">Blog</Link>
            <Link href="/contact" className="hover:text-gray-700 transition-colors">Contact</Link>
            <Link href="/terms" className="hover:text-gray-700 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-700 transition-colors">Privacy</Link>
          </div>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Hudey
          </p>
        </div>
      </footer>
    </div>
  );
}
