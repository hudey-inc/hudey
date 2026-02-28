import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, MessageSquare, Clock } from "lucide-react";
import { HudeyLogo } from "@/components/hudey-logo";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the Hudey team. Whether you have questions about the platform, want to join our founding cohort, or need support.",
  openGraph: {
    title: "Contact | Hudey",
    description: "Get in touch with the Hudey team.",
  },
};

const channels = [
  {
    icon: Mail,
    title: "General Enquiries",
    description: "Questions about the platform, partnerships, or press.",
    value: "hello@hudey.co",
    href: "mailto:hello@hudey.co",
    color: "#2F4538",
  },
  {
    icon: MessageSquare,
    title: "Campaign Support",
    description: "Need help with your account, a campaign, or a creator issue?",
    value: "support@hudey.co",
    href: "mailto:support@hudey.co",
    color: "#D16B42",
  },
  {
    icon: Clock,
    title: "We Reply Fast",
    description: "Every message gets a response within one business day.",
    value: "< 24 hours",
    href: null,
    color: "#8B5CF6",
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Nav */}
      <nav className="border-b border-gray-200 bg-white/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
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

      {/* Header */}
      <header className="pt-16 sm:pt-20 pb-12 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Get in touch
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Want to join our founding cohort, ask about a feature, or report
            an issue? We&apos;d love to hear from you.
          </p>
        </div>
      </header>

      {/* Contact Cards */}
      <section className="px-5 sm:px-8 pb-16">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {channels.map((ch, i) => {
            const Icon = ch.icon;
            const Wrapper = ch.href ? "a" : "div";
            const wrapperProps = ch.href
              ? { href: ch.href, target: ch.href.startsWith("mailto") ? undefined : "_blank" }
              : {};
            return (
              <Wrapper
                key={i}
                {...wrapperProps}
                className="bg-white border-2 border-gray-200 rounded-2xl p-6 text-center hover:border-gray-300 hover:shadow-xl transition-all duration-300"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                  style={{ backgroundColor: ch.color }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{ch.title}</h3>
                <p className="text-sm text-gray-500 mb-3">{ch.description}</p>
                <span className="text-sm font-semibold text-[#2F4538]">
                  {ch.value}
                </span>
              </Wrapper>
            );
          })}
        </div>
      </section>

      {/* FAQ shortcut */}
      <section className="px-5 sm:px-8 pb-20">
        <div className="max-w-3xl mx-auto rounded-2xl bg-[#E8DCC8]/30 border-2 border-[#E8DCC8]/50 p-8 sm:p-10 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Need a quick answer?
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Our Help Center has step-by-step guides for getting started,
            running campaigns, and managing your account.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/help"
              className="inline-flex items-center gap-2 bg-[#2F4538] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#1f2f26] transition-colors"
            >
              Visit Help Center
            </Link>
            <Link
              href="/#faq"
              className="inline-flex items-center gap-2 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-full font-semibold hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              View FAQs
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-5 sm:px-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HudeyLogo className="w-5 h-5" />
            <span className="font-semibold text-sm text-gray-900">Hudey</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/about" className="hover:text-gray-700 transition-colors">About</Link>
            <Link href="/blog" className="hover:text-gray-700 transition-colors">Blog</Link>
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
