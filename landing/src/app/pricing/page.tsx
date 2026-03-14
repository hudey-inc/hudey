import Link from "next/link";
import { FloatingHeader } from "@/components/ui/floating-header";
import { Badge } from "@/components/ui/badge";
import { PricingComparison } from "@/components/ui/pricing-comparison";
import { Footer } from "@/components/ui/footer";

export const metadata = {
  title: "Pricing | Hudey",
  description:
    "Per-campaign pricing for AI-powered influencer marketing. Pay only when you launch.",
};

const APP_URL = "https://app.hudey.co";

const navItems = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
  { label: "Founding Cohort", href: "/#founding-cohort" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-clip">
      {/* Navigation */}
      <FloatingHeader navItems={navItems} appUrl={APP_URL} />

      {/* Hero */}
      <section className="pt-10 sm:pt-16 pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="flex text-center justify-center items-center gap-4 flex-col">
          <Badge>Pricing</Badge>
          <div className="flex gap-2 flex-col">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl tracking-tight text-center text-gray-900 leading-[1.08]">
              Pay per campaign, not per month
            </h1>
            <p className="text-lg leading-relaxed tracking-tight text-gray-400 max-w-xl text-center mx-auto">
              No monthly subscriptions. No hidden fees. You pay once when you
              launch a campaign.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Grid */}
      <section className="pb-14 sm:pb-20 lg:pb-28 px-4 sm:px-6 lg:px-8">
        <PricingComparison />

        {/* Trust note */}
        <div className="max-w-2xl mx-auto mt-12 sm:mt-16 text-center">
          <p className="text-sm text-gray-500">
            Founding cohort rate:{" "}
            <strong className="text-[#D16B42]">£250 per campaign</strong> for
            our first 10 brands. Protected by our{" "}
            <Link
              href="/refund"
              className="text-[#2F4538] hover:underline"
            >
              30-day money-back guarantee
            </Link>
            . Payments processed securely by{" "}
            <a
              href="https://www.paddle.com"
              className="text-[#2F4538] hover:underline"
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
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-gray-900 text-center mb-10 sm:mb-14 tracking-tight">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "How does per-campaign pricing work?",
                a: "You pay a one-time fee when you launch a campaign. The price depends on the tier you choose, which sets how many creators you can contact and which features you get. There are no recurring charges or subscriptions.",
              },
              {
                q: "What is the founding cohort rate?",
                a: "Our first 10 brands pay just £250 per campaign, regardless of which tier they pick. This rate stays locked in for as long as you're part of the founding cohort — it won't go up as we grow.",
              },
              {
                q: "Can I run multiple campaigns at once?",
                a: "Yes. Each campaign is priced separately. Launch as many as you need, whenever you need them.",
              },
              {
                q: "What if I'm not happy — can I get a refund?",
                a: "Yes. We offer a 30-day money-back guarantee on every campaign purchase. If you're not satisfied, email us within 30 days for a full refund.",
              },
              {
                q: "How are payments processed?",
                a: "All payments go through Paddle, a trusted payment provider that handles billing, VAT, and compliance. Your card details are never stored on our servers.",
              },
              {
                q: "How do I join the founding cohort?",
                a: "Click 'Apply for Early Access' and tell us about your brand. We're looking for UK-based sustainable brands who are actively running or planning influencer campaigns.",
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

      <Footer />
    </div>
  );
}
