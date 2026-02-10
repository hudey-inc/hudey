import Link from "next/link";
import { Check } from "lucide-react";

export const metadata = {
  title: "Pricing | Hudey",
  description:
    "Simple, transparent pricing for AI-powered influencer marketing. Start free, scale as you grow.",
};

const APP_URL = "https://app.hudey.co";

const plans = [
  {
    name: "Starter",
    description: "For small teams testing influencer marketing",
    price: "Free",
    period: "",
    cta: "Get Started Free",
    ctaHref: `${APP_URL}/signup`,
    highlight: false,
    features: [
      "1 active campaign",
      "Up to 25 creator outreaches / month",
      "AI creator discovery",
      "AI-written outreach emails",
      "Basic analytics dashboard",
      "Email support",
    ],
  },
  {
    name: "Growth",
    description: "For teams scaling their influencer programs",
    price: "$99",
    period: "/mo",
    cta: "Start Free Trial",
    ctaHref: `${APP_URL}/signup?plan=growth`,
    highlight: true,
    badge: "Most Popular",
    features: [
      "Unlimited active campaigns",
      "Up to 500 creator outreaches / month",
      "AI creator discovery & vetting",
      "AI-written personalized outreach",
      "AI-powered negotiation",
      "Campaign performance tracking",
      "Advanced analytics & reporting",
      "Priority email support",
    ],
  },
  {
    name: "Agency",
    description: "For agencies managing multiple brands",
    price: "$299",
    period: "/mo",
    cta: "Start Free Trial",
    ctaHref: `${APP_URL}/signup?plan=agency`,
    highlight: false,
    features: [
      "Everything in Growth",
      "Unlimited outreaches",
      "Multi-brand workspaces",
      "Custom AI negotiation rules",
      "White-label reports",
      "API access",
      "Dedicated account manager",
      "Slack & webhook integrations",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 sm:w-8 h-7 sm:h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white text-xs font-bold">
              H
            </div>
            <span className="font-bold text-lg sm:text-xl text-gray-900">
              Hudey
            </span>
          </Link>
          <a
            href={`${APP_URL}/signup`}
            className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all"
          >
            Get Started Free
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 sm:pt-40 pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
            Simple, transparent pricing
          </h1>
          <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Start free. Upgrade when you&apos;re ready. No hidden fees, no
            long-term contracts. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-14 sm:pb-20 lg:pb-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-6 sm:p-8 flex flex-col ${
                plan.highlight
                  ? "border-[#2F4538] shadow-xl shadow-[#2F4538]/10 ring-1 ring-[#2F4538]"
                  : "border-gray-200 hover:shadow-lg"
              } transition-all duration-300`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-[#2F4538] to-[#1f2f26] text-white text-xs font-semibold px-4 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-500">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl sm:text-5xl font-bold text-gray-900">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-gray-500 text-lg">{plan.period}</span>
                )}
              </div>

              <a
                href={plan.ctaHref}
                className={`block w-full text-center py-3 sm:py-3.5 rounded-full font-semibold text-sm sm:text-base transition-all mb-8 ${
                  plan.highlight
                    ? "bg-[#2F4538] hover:bg-[#1f2f26] text-white shadow-lg shadow-[#2F4538]/20"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                }`}
              >
                {plan.cta}
              </a>

              <ul className="space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        plan.highlight ? "text-[#2F4538]" : "text-gray-400"
                      }`}
                    />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trust note */}
        <div className="max-w-2xl mx-auto mt-12 sm:mt-16 text-center">
          <p className="text-sm text-gray-500">
            All plans include a <strong>14-day free trial</strong>. No credit
            card required to start. Protected by our{" "}
            <Link
              href="/refund"
              className="text-indigo-600 hover:underline"
            >
              30-day money-back guarantee
            </Link>
            . Payments processed securely by{" "}
            <a
              href="https://www.paddle.com"
              className="text-indigo-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Paddle
            </a>
            .
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-14 sm:pb-20 lg:pb-28 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto pt-14 sm:pt-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10 sm:mb-14">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "Can I try Hudey for free?",
                a: "Yes. The Starter plan is free forever with up to 25 creator outreaches per month and 1 active campaign. No credit card needed.",
              },
              {
                q: "What happens after the free trial on paid plans?",
                a: "After your 14-day trial, you'll be charged for the plan you selected. You can cancel anytime before the trial ends and won't be charged.",
              },
              {
                q: "Can I change my plan later?",
                a: "Absolutely. You can upgrade or downgrade at any time from your account settings. Changes take effect on your next billing cycle.",
              },
              {
                q: "What is your refund policy?",
                a: "We offer a 30-day money-back guarantee on all purchases. If you're not satisfied, contact us for a full refund within 30 days of your purchase.",
              },
              {
                q: "Who processes payments?",
                a: "All payments are securely processed by Paddle, our Merchant of Record. Paddle handles billing, taxes, and compliance so you don't have to worry about anything.",
              },
              {
                q: "Do you offer annual billing?",
                a: "Yes. Annual plans are available at a discount. Contact us for annual pricing details.",
              },
            ].map((faq) => (
              <details
                key={faq.q}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <summary className="cursor-pointer list-none px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <span className="font-medium text-gray-900 text-sm sm:text-base">
                    {faq.q}
                  </span>
                  <span className="text-gray-400 group-open:rotate-45 transition-transform text-xl ml-4">
                    +
                  </span>
                </summary>
                <div className="px-6 pb-5 text-sm sm:text-base text-gray-600 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
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
