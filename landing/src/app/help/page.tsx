"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Rocket,
  Users,
  BarChart3,
  FileText,
  Settings,
  CreditCard,
  ChevronDown,
  Mail,
} from "lucide-react";
import { FloatingHeader } from "@/components/ui/floating-header";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/ui/footer";

const APP_URL = "https://app.hudey.co";

const navItems = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
  { label: "Founding Cohort", href: "/#founding-cohort" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
];

interface HelpArticle {
  question: string;
  answer: string;
}

interface HelpCategory {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  articles: HelpArticle[];
}

const categories: HelpCategory[] = [
  {
    icon: Rocket,
    title: "Getting Started",
    description: "Set up your account and launch your first campaign.",
    color: "#2F4538",
    articles: [
      {
        question: "How do I create my first campaign?",
        answer:
          'Sign in, click "New Campaign" on your dashboard, and fill in the basics: what you\u2019re promoting, who you want to reach, your budget, and what you need from creators (e.g. 1 Reel + 2 Stories). Hudey will start finding matching creators. You can also pick a pre-built template to skip the setup.',
      },
      {
        question: "What do I need to set up before launching?",
        answer:
          "Just your brand profile in Settings \u2014 your brand name, industry, and the sustainability values you care about. You can also upload a contract template if you want Hudey to auto-generate agreements when you sign a creator.",
      },
      {
        question: "How long does onboarding take?",
        answer:
          "About 2 minutes. After signing up, you\u2019ll answer a few questions about your brand, industry, and campaign preferences. This helps Hudey recommend the right creators from your very first campaign.",
      },
    ],
  },
  {
    icon: Users,
    title: "Creator Discovery",
    description: "How Hudey finds and recommends creators for your brand.",
    color: "#D16B42",
    articles: [
      {
        question: "How does Hudey find creators?",
        answer:
          "Hudey looks at each creator\u2019s engagement rate, who their followers are (age, location, interests), how authentic their audience is, and whether their content aligns with your brand\u2019s sustainability values. You only see creators who are a genuine match.",
      },
      {
        question: "Can I filter creators by platform?",
        answer:
          "Yes. Hudey supports Instagram, TikTok, YouTube, and X. You can select specific platforms when creating a campaign, or target all platforms at once.",
      },
      {
        question: "What does the follower range filter do?",
        answer:
          "It lets you choose the size of creators you want to work with. Set a minimum and maximum follower count to target nano (1K\u201310K), micro (10K\u2013100K), mid-tier (100K\u2013500K), or macro (500K+) creators. Smaller creators often get better engagement because their audiences are more trusting.",
      },
    ],
  },
  {
    icon: Mail,
    title: "Outreach & Messaging",
    description: "Sending messages, managing replies, and follow-ups.",
    color: "#8B5CF6",
    articles: [
      {
        question: "Does Hudey send messages without me seeing them?",
        answer:
          "No. Hudey writes a personalised draft for each creator, but you see and approve every message before it\u2019s sent. You can edit the wording, change the tone, or rewrite it completely. Nothing goes out until you say so.",
      },
      {
        question: "How do I manage replies from creators?",
        answer:
          'All creator replies appear in your Outreach inbox. You can view conversations, send follow-ups, and update each creator\u2019s status (Negotiating, Agreed, Declined) from a single view.',
      },
      {
        question: "Can I use my own message templates?",
        answer:
          "Yes. You can create, edit, and save message templates in the Outreach \u2192 Templates tab. Templates support variables like creator name and campaign details that get filled in automatically.",
      },
    ],
  },
  {
    icon: BarChart3,
    title: "Analytics & Reporting",
    description: "Track campaign performance and measure ROI.",
    color: "#10B981",
    articles: [
      {
        question: "What metrics does Hudey track?",
        answer:
          "You can see how many outreach emails were sent, opened, and clicked. Your engagement funnel shows how creators move from contacted to responded to negotiating to signed. You also get response rates by platform, how much of your budget you\u2019ve used, and content performance once campaigns go live.",
      },
      {
        question: "Can I export analytics reports?",
        answer:
          "Yes. You can export a PDF report from the Analytics page that includes all key metrics, charts, and campaign comparisons. The report is branded and ready to share with stakeholders.",
      },
    ],
  },
  {
    icon: FileText,
    title: "Contracts & Agreements",
    description: "Create and manage creator contracts.",
    color: "#F59E0B",
    articles: [
      {
        question: "How do contracts work in Hudey?",
        answer:
          "You create a contract template once with your standard terms \u2014 what the creator needs to deliver, deadlines, content usage rights, and payment details. When you agree a deal with a creator, Hudey fills in the specifics automatically and generates a ready-to-sign contract.",
      },
      {
        question: "Can I customise contract templates?",
        answer:
          "Yes. The contract editor supports full rich text editing with clause blocks, variables, and formatting. You can create multiple templates for different campaign types.",
      },
    ],
  },
  {
    icon: Settings,
    title: "Account & Settings",
    description: "Manage your profile, team, and preferences.",
    color: "#6B7280",
    articles: [
      {
        question: "How do I update my brand profile?",
        answer:
          'Go to Settings from the left sidebar. You can update your brand name, company name, industry, and notification preferences. Changes save automatically.',
      },
      {
        question: "How do I reset my password?",
        answer:
          'Click "Forgot?" on the login page and enter your email. You\u2019ll receive a password reset link. If you signed up with Google, you don\u2019t have a password to reset \u2014 just sign in with Google.',
      },
    ],
  },
  {
    icon: CreditCard,
    title: "Billing & Plans",
    description: "Pricing, payments, and subscription management.",
    color: "#EC4899",
    articles: [
      {
        question: "How does pricing work?",
        answer:
          "You pay per campaign, not per month. There are no subscriptions or hidden fees \u2014 you\u2019re only charged when you launch a campaign. Founding cohort members get a locked-in rate of \u00a3250/campaign that won\u2019t increase. Visit our Pricing page for full details.",
      },
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept all major credit and debit cards through our payment provider Paddle. You can manage your payment method and view invoices from Settings \u2192 Billing.",
      },
    ],
  },
];

export default function HelpPage() {
  const [search, setSearch] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    "Getting Started"
  );
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const query = search.toLowerCase().trim();

  const filtered = query
    ? categories
        .map((cat) => ({
          ...cat,
          articles: cat.articles.filter(
            (a) =>
              a.question.toLowerCase().includes(query) ||
              a.answer.toLowerCase().includes(query)
          ),
        }))
        .filter((cat) => cat.articles.length > 0)
    : categories;

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <FloatingHeader navItems={navItems} appUrl={APP_URL} />

      {/* Header + Search */}
      <header className="pt-10 sm:pt-16 pb-10 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <Badge>Help Centre</Badge>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl tracking-tight text-gray-900 leading-[1.08] mb-4">
            How can we <em>help?</em>
          </h1>
          <p className="text-lg leading-relaxed tracking-tight text-gray-400 max-w-xl mx-auto mb-8">
            Step-by-step answers to help you get the most out of Hudey.
          </p>
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#2F4538]/20 focus:border-[#2F4538] transition-colors"
            />
          </div>
        </div>
      </header>

      {/* Categories + Articles */}
      <main className="px-5 sm:px-8 pb-20">
        <div className="max-w-3xl mx-auto space-y-4">
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg mb-2">
                No results for &ldquo;{search}&rdquo;
              </p>
              <p className="text-gray-400 text-sm">
                Try different keywords or{" "}
                <Link href="/contact" className="text-[#2F4538] underline">
                  contact support
                </Link>
                .
              </p>
            </div>
          )}

          {filtered.map((cat) => {
            const Icon = cat.icon;
            const isOpen = query ? true : expandedCategory === cat.title;

            return (
              <div
                key={cat.title}
                className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                {/* Category header */}
                <button
                  onClick={() =>
                    setExpandedCategory(isOpen && !query ? null : cat.title)
                  }
                  className="w-full flex items-center gap-4 p-5 sm:p-6 text-left hover:bg-gray-50/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#2F4538]/[0.06] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-[#2F4538]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-gray-900">{cat.title}</h2>
                    <p className="text-sm text-gray-500">{cat.description}</p>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Articles */}
                {isOpen && (
                  <div className="border-t border-gray-200">
                    {cat.articles.map((article) => {
                      const artKey = `${cat.title}-${article.question}`;
                      const artOpen = expandedArticle === artKey;

                      return (
                        <div
                          key={article.question}
                          className="border-b border-gray-100 last:border-b-0"
                        >
                          <button
                            onClick={() =>
                              setExpandedArticle(artOpen ? null : artKey)
                            }
                            className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 text-left hover:bg-gray-50/50 transition-colors"
                          >
                            <span className="text-sm font-medium text-gray-800">
                              {article.question}
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
                                artOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                          {artOpen && (
                            <div className="px-5 sm:px-6 pb-4">
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {article.answer}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Contact CTA */}
      <section className="px-5 sm:px-8 pb-20">
        <div className="max-w-3xl mx-auto bg-gray-50 rounded-2xl border border-gray-200 p-8 sm:p-12 text-center">
          <h2 className="font-serif text-2xl sm:text-3xl text-gray-900 mb-3 tracking-tight">
            Still need <em>help?</em>
          </h2>
          <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed">
            Our team typically responds within 24 hours.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-[#2F4538] hover:bg-[#253b2e] text-white px-7 py-3.5 rounded-xl font-medium text-sm transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
