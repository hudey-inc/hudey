import Link from "next/link";
import { FloatingHeader } from "@/components/ui/floating-header";
import { Badge } from "@/components/ui/badge";
import { Heart, Shield, Target, Zap } from "lucide-react";
import { Footer } from "@/components/ui/footer";

export const metadata = {
  title: "About | Hudey",
  description:
    "Hudey helps sustainable brands run influencer campaigns in days instead of weeks. Learn why we built it and who it's for.",
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
    title: "Sustainability vetting is the default",
    description:
      "Every recommendation checks content history, past partnerships, and audience values. Not just what\u2019s in someone\u2019s bio.",
  },
  {
    icon: Shield,
    title: "Nothing sends without your sign-off",
    description:
      "Hudey drafts outreach and negotiation messages. You read, edit, and approve before anything goes to a creator.",
  },
  {
    icon: Target,
    title: "One vertical, done well",
    description:
      "We only work with eco, ethical, and wellness brands. The product is built around the problems those teams actually have.",
  },
  {
    icon: Zap,
    title: "Days, not weeks",
    description:
      "Campaign brief to signed creators in under 48 hours. The vetting still happens. The personalisation still happens. You just skip the admin.",
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
              Creator partnerships that
              <br />
              <em>actually fit your brand</em>
            </h1>
            <p className="text-lg leading-relaxed tracking-tight text-gray-400 max-w-xl text-center mx-auto">
              Hudey finds creators, writes the outreach, and closes the deal.
              You decide who represents your brand.
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
              We talked to 40+ UK sustainable brand founders about how they run
              influencer campaigns. The same story kept coming up: three weeks
              to sign one creator. Most of that time spent on research, DMs
              that go nowhere, and rate negotiations across four different apps.
            </p>
            <p>
              The bigger problem? Generic discovery tools don&apos;t filter for
              values. So brands end up partnering with creators who look right
              on paper but don&apos;t actually align with their mission. One bad
              partnership can undo months of brand building.
            </p>
            <p>
              Hudey fixes both. AI does the research, writes
              outreach that references each creator&apos;s actual content, and
              proposes fair rates. You see everything before it goes out. The
              result: campaigns that launch in days, with creators who genuinely
              fit.
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
              What we <em>believe</em>
            </h2>
            <p className="text-base sm:text-lg text-gray-400 max-w-xl mx-auto">
              Four things that shape how the product works.
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
            10 spots for UK sustainable brands. Hands-on onboarding,
            &pound;250/campaign locked in, and a direct line to our team.
          </p>
          <a
            href={`${APP_URL}/signup`}
            className="inline-flex items-center gap-3 bg-[#2F4538] hover:bg-[#253b2e] text-white px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl font-medium text-sm sm:text-base transition-colors"
          >
            Join the Founding Cohort
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

      <Footer />
    </div>
  );
}
