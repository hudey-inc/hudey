import Link from "next/link";
import { FloatingHeader } from "@/components/ui/floating-header";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Clock } from "lucide-react";

export const metadata = {
  title: "Contact | Hudey",
  description:
    "Get in touch with the Hudey team. Whether you have questions about the platform, want to join our founding cohort, or need support.",
};

const APP_URL = "https://app.hudey.co";

const navItems = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
  { label: "Founding Cohort", href: "/#founding-cohort" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
];

const channels = [
  {
    icon: Mail,
    title: "General Enquiries",
    description: "Questions about the platform, partnerships, or press.",
    value: "hello@hudey.co",
    href: "mailto:hello@hudey.co",
  },
  {
    icon: MessageSquare,
    title: "Campaign Support",
    description:
      "Need help with your account, a campaign, or a creator issue?",
    value: "support@hudey.co",
    href: "mailto:support@hudey.co",
  },
  {
    icon: Clock,
    title: "We Reply Fast",
    description: "Every message gets a response within one business day.",
    value: "< 24 hours",
    href: null,
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-clip">
      {/* Navigation */}
      <FloatingHeader navItems={navItems} appUrl={APP_URL} />

      {/* Hero */}
      <section className="pt-10 sm:pt-16 pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="flex text-center justify-center items-center gap-4 flex-col">
          <Badge>Contact</Badge>
          <div className="flex gap-2 flex-col">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl tracking-tight text-center text-gray-900 leading-[1.08]">
              Get in <em>touch</em>
            </h1>
            <p className="text-lg leading-relaxed tracking-tight text-gray-400 max-w-xl text-center mx-auto">
              Want to join our founding cohort, ask about a feature, or report
              an issue? We&apos;d love to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="pb-14 sm:pb-20 lg:pb-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {channels.map((ch, i) => {
            const Icon = ch.icon;
            const isLink = !!ch.href;
            const Tag = isLink ? "a" : "div";
            const linkProps = isLink
              ? {
                  href: ch.href!,
                  ...(ch.href!.startsWith("mailto")
                    ? {}
                    : { target: "_blank", rel: "noopener noreferrer" }),
                }
              : {};

            return (
              <Tag
                key={i}
                {...linkProps}
                className="bg-white rounded-2xl border border-gray-200 p-6 text-center hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#2F4538]/[0.06] flex items-center justify-center mx-auto mb-5">
                  <Icon className="w-5 h-5 text-[#2F4538]" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {ch.title}
                </h3>
                <p className="text-sm text-gray-400 mb-3 leading-relaxed">
                  {ch.description}
                </p>
                <span className="text-sm font-medium text-[#2F4538] group-hover:text-[#253b2e] transition-colors">
                  {ch.value}
                </span>
              </Tag>
            );
          })}
        </div>
      </section>

      {/* Help Centre CTA */}
      <section className="pb-14 sm:pb-20 lg:pb-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-gray-50 rounded-2xl border border-gray-200 p-8 sm:p-12 text-center">
          <h2 className="font-serif text-2xl sm:text-3xl text-gray-900 mb-3 tracking-tight">
            Need a quick <em>answer?</em>
          </h2>
          <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed">
            Our Help Centre has step-by-step guides for getting started,
            running campaigns, and managing your account.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/help"
              className="inline-flex items-center gap-2 bg-[#2F4538] hover:bg-[#253b2e] text-white px-7 py-3.5 rounded-xl font-medium text-sm transition-colors"
            >
              Visit Help Centre
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
            </Link>
            <Link
              href="/#faq"
              className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-7 py-3.5 rounded-xl font-medium text-sm hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              View FAQs
            </Link>
          </div>
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
