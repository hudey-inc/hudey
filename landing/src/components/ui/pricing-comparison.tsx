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
    return <p className="text-gray-500 text-sm">{value}</p>;
  }
  if (value) {
    return <Check className="w-4 h-4 text-[#2F4538]" />;
  }
  return <Minus className="w-4 h-4 text-gray-300" />;
}

function PricingComparison() {
  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto">
        {/* Plan headers + pricing */}
        <div className="grid text-left w-full grid-cols-3 lg:grid-cols-4 divide-x divide-gray-100">
          {/* Empty top-left cell */}
          <div className="col-span-3 lg:col-span-1 hidden lg:block" />

          {plans.map((plan) => (
            <div
              key={plan.name}
              className="px-3 py-4 md:px-6 md:py-6 gap-2 flex flex-col"
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
              <p className="flex flex-col lg:flex-row lg:items-center gap-1 mt-6">
                <span className="text-3xl sm:text-4xl font-semibold text-gray-900">
                  {plan.price}
                </span>
                <span className="text-sm text-gray-400">{plan.period}</span>
              </p>
              {plan.name === "Scale" ? (
                <Button variant="outline" className="gap-3 mt-6" asChild>
                  <a href={plan.ctaHref}>
                    {plan.cta} <PhoneCall className="w-4 h-4" />
                  </a>
                </Button>
              ) : plan.highlight ? (
                <Button className="gap-3 mt-6" asChild>
                  <a href={plan.ctaHref}>
                    {plan.cta} <MoveRight className="w-4 h-4" />
                  </a>
                </Button>
              ) : (
                <Button variant="outline" className="gap-3 mt-6" asChild>
                  <a href={plan.ctaHref}>
                    {plan.cta} <MoveRight className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </div>
          ))}

          {/* Feature rows */}
          {features.map((group) => (
            <>
              {/* Category header */}
              <div
                key={`cat-${group.category}`}
                className="px-3 lg:px-6 col-span-3 lg:col-span-1 py-4 border-t border-gray-100"
              >
                <b className="text-sm text-gray-900">{group.category}</b>
              </div>
              <div className="border-t border-gray-100" />
              <div className="border-t border-gray-100" />
              <div className="border-t border-gray-100" />

              {group.rows.map((row) => (
                <>
                  <div
                    key={`label-${row.name}`}
                    className="px-3 lg:px-6 col-span-3 lg:col-span-1 py-3 text-sm text-gray-600"
                  >
                    {row.name}
                  </div>
                  <div
                    key={`starter-${row.name}`}
                    className="px-3 py-2 md:px-6 md:py-3 flex justify-center items-center"
                  >
                    <FeatureCell value={row.starter} />
                  </div>
                  <div
                    key={`growth-${row.name}`}
                    className="px-3 py-2 md:px-6 md:py-3 flex justify-center items-center"
                  >
                    <FeatureCell value={row.growth} />
                  </div>
                  <div
                    key={`scale-${row.name}`}
                    className="px-3 py-2 md:px-6 md:py-3 flex justify-center items-center"
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
