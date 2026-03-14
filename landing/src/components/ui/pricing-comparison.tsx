import { Check, Minus, MoveRight, PhoneCall } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const APP_URL = "https://app.hudey.co";

const plans = [
  {
    name: "Starter",
    description:
      "Perfect for your first influencer campaign. AI finds and contacts creators for you.",
    price: "£750",
    period: "/ campaign",
    cta: "Apply for Early Access",
    ctaHref: `${APP_URL}/signup`,
    highlight: false,
  },
  {
    name: "Growth",
    description:
      "For brands running multiple campaigns a quarter with full AI negotiation.",
    price: "£1,500",
    period: "/ campaign",
    cta: "Apply for Early Access",
    ctaHref: `${APP_URL}/signup?plan=growth`,
    highlight: true,
  },
  {
    name: "Scale",
    description:
      "For teams running campaigns across multiple brands with dedicated support.",
    price: "£3,000",
    period: "/ campaign",
    cta: "Contact Us",
    ctaHref: `${APP_URL}/signup?plan=scale`,
    highlight: false,
  },
];

type FeatureValue = boolean | string;

interface FeatureRow {
  name: string;
  starter: FeatureValue;
  growth: FeatureValue;
  scale: FeatureValue;
}

const features: { category: string; rows: FeatureRow[] }[] = [
  {
    category: "Discovery & Outreach",
    rows: [
      {
        name: "AI creator discovery",
        starter: true,
        growth: true,
        scale: true,
      },
      {
        name: "Personalised outreach",
        starter: true,
        growth: true,
        scale: true,
      },
      {
        name: "Creator contacts",
        starter: "Up to 25",
        growth: "Up to 100",
        scale: "Unlimited",
      },
      {
        name: "Values & brand-safety vetting",
        starter: false,
        growth: true,
        scale: true,
      },
    ],
  },
  {
    category: "Negotiation & Deals",
    rows: [
      {
        name: "AI rate negotiation",
        starter: false,
        growth: true,
        scale: true,
      },
      {
        name: "Custom negotiation rules",
        starter: false,
        growth: false,
        scale: true,
      },
    ],
  },
  {
    category: "Analytics & Reporting",
    rows: [
      {
        name: "Campaign dashboard",
        starter: true,
        growth: true,
        scale: true,
      },
      {
        name: "Live performance tracking",
        starter: false,
        growth: true,
        scale: true,
      },
      {
        name: "Exportable reports",
        starter: false,
        growth: true,
        scale: true,
      },
      {
        name: "White-label reports",
        starter: false,
        growth: false,
        scale: true,
      },
    ],
  },
  {
    category: "Support & Integrations",
    rows: [
      {
        name: "Email support",
        starter: true,
        growth: "Priority",
        scale: "Priority",
      },
      {
        name: "Dedicated account manager",
        starter: false,
        growth: false,
        scale: true,
      },
      {
        name: "Slack & webhook integrations",
        starter: false,
        growth: false,
        scale: true,
      },
    ],
  },
];

function FeatureCell({ value }: { value: FeatureValue }) {
  if (typeof value === "string") {
    return (
      <p className="text-gray-500 text-[11px] sm:text-sm text-center">
        {value}
      </p>
    );
  }
  if (value) {
    return <Check className="w-4 h-4 text-[#2F4538]" />;
  }
  return <Minus className="w-4 h-4 text-gray-300" />;
}

function PricingComparison() {
  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* ── Plan cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-0 sm:divide-x sm:divide-gray-100 mb-8 sm:mb-0">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className="px-5 py-5 sm:px-6 sm:py-6 flex flex-col gap-2 rounded-xl sm:rounded-none border sm:border-0 border-gray-100"
          >
            <div className="flex items-center gap-2">
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                {plan.name}
              </p>
              {plan.highlight && (
                <Badge className="text-[10px] px-2 py-0">Popular</Badge>
              )}
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {plan.description}
            </p>
            <p className="flex items-center gap-1 mt-4 sm:mt-6">
              <span className="text-3xl sm:text-4xl font-semibold text-gray-900">
                {plan.price}
              </span>
              <span className="text-sm text-gray-400">{plan.period}</span>
            </p>
            {plan.name === "Scale" ? (
              <Button variant="outline" className="gap-3 mt-4 sm:mt-6" asChild>
                <a href={plan.ctaHref}>
                  {plan.cta} <PhoneCall className="w-4 h-4" />
                </a>
              </Button>
            ) : plan.highlight ? (
              <Button className="gap-3 mt-4 sm:mt-6" asChild>
                <a href={plan.ctaHref}>
                  {plan.cta} <MoveRight className="w-4 h-4" />
                </a>
              </Button>
            ) : (
              <Button variant="outline" className="gap-3 mt-4 sm:mt-6" asChild>
                <a href={plan.ctaHref}>
                  {plan.cta} <MoveRight className="w-4 h-4" />
                </a>
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* ── Feature comparison table ── */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-[minmax(120px,1.4fr)_repeat(3,1fr)] sm:grid-cols-4">
          {/* Column headers (plan names) */}
          <div className="px-3 sm:px-6 py-3 border-b border-gray-200" />
          {plans.map((plan) => (
            <div
              key={`header-${plan.name}`}
              className="px-2 sm:px-6 py-3 border-b border-gray-200 text-center"
            >
              <span className="text-xs sm:text-sm font-semibold text-gray-900">
                {plan.name}
              </span>
            </div>
          ))}

          {/* Feature rows */}
          {features.map((group) => (
            <>
              {/* Category header */}
              <div
                key={`cat-${group.category}`}
                className="col-span-4 px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gray-50/50"
              >
                <b className="text-xs sm:text-sm text-gray-900">
                  {group.category}
                </b>
              </div>

              {group.rows.map((row) => (
                <>
                  <div
                    key={`label-${row.name}`}
                    className="px-3 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-600 border-b border-gray-50 flex items-center"
                  >
                    {row.name}
                  </div>
                  <div
                    key={`starter-${row.name}`}
                    className="px-2 sm:px-6 py-2.5 sm:py-3 flex justify-center items-center border-b border-gray-50"
                  >
                    <FeatureCell value={row.starter} />
                  </div>
                  <div
                    key={`growth-${row.name}`}
                    className="px-2 sm:px-6 py-2.5 sm:py-3 flex justify-center items-center border-b border-gray-50"
                  >
                    <FeatureCell value={row.growth} />
                  </div>
                  <div
                    key={`scale-${row.name}`}
                    className="px-2 sm:px-6 py-2.5 sm:py-3 flex justify-center items-center border-b border-gray-50"
                  >
                    <FeatureCell value={row.scale} />
                  </div>
                </>
              ))}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}

export { PricingComparison };
