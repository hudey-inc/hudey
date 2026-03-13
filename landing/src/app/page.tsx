"use client";

import { useState } from "react";
import Link from "next/link";
import { HudeyLogo } from "@/components/hudey-logo";
import {
  IconTarget,
  IconSparkles,
  IconMessage,
  IconChart,
  IconUsers,
  IconDollar,
  IconShield,
  IconCheck,
  IconArrowRight,
} from "@/components/icons";
import { Hero } from "@/components/ui/hero";
import { HeroPill } from "@/components/ui/hero-pill";
import { FloatingHeader } from "@/components/ui/floating-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  FeatureCard,
  AnimatedContainer,
} from "@/components/ui/grid-feature-cards";
import { FoundingCards } from "@/components/ui/founding-cards";
import { TestimonialsColumn } from "@/components/ui/testimonials-columns";
import {
  CustomAccordion,
  CustomAccordionItem,
  CustomAccordionTrigger,
  CustomAccordionContent,
} from "@/components/ui/faq-accordion";
import {
  HighlightGroup,
  HighlighterItem,
  Particles,
} from "@/components/ui/highlighter";
import { Tiles } from "@/components/ui/tiles";
import { BGPattern } from "@/components/ui/bg-pattern";
import {
  SuccessIcon,
  SendIcon,
  ToggleIcon,
  NotificationIcon,
  LockUnlockIcon,
  HeartIcon,
} from "@/components/ui/animated-state-icons";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { trackCTAClick } from "@/lib/analytics";

const APP_URL = "https://app.hudey.co";

const navItems = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Founding Cohort", href: "#founding-cohort" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
];

const features = [
  {
    icon: IconUsers,
    animatedIcon: SuccessIcon,
    title: "Creator Discovery",
    description:
      "Search by niche, engagement rate, audience location, and follower size. Find creators your customers already follow.",
  },
  {
    icon: IconMessage,
    animatedIcon: SendIcon,
    title: "Personalised Outreach",
    description:
      "AI writes a unique message for each creator, referencing their content. You review and approve before anything sends.",
  },
  {
    icon: IconDollar,
    animatedIcon: ToggleIcon,
    title: "AI Negotiation",
    description:
      "Hudey suggests fair rates based on follower count, engagement, and market benchmarks. You approve the final deal.",
  },
  {
    icon: IconChart,
    animatedIcon: NotificationIcon,
    title: "Live Dashboard",
    description:
      "Track outreach, responses, deals closed, and spend in real time. Export reports for your team in one click.",
  },
  {
    icon: IconShield,
    animatedIcon: LockUnlockIcon,
    title: "Creator Vetting",
    description:
      "Every creator is checked for fake followers, past brand conflicts, and content that clashes with your values.",
  },
  {
    icon: IconSparkles,
    animatedIcon: HeartIcon,
    title: "Built for Sustainability",
    description:
      "Filter creators by eco, ethical, and wellness categories. Only partner with creators who genuinely share your mission.",
  },
];

const testimonials = [
  {
    text: "We used to spend weeks finding creators who actually aligned with our values. Hudey matched us with the right partners in under 48 hours.",
    name: "Sarah Chen",
    initials: "SC",
    role: "Marketing Director, Earthkind Co.",
  },
  {
    text: "The AI negotiation tool alone saved us 15 hours a week. We ran three campaigns simultaneously without hiring extra headcount.",
    name: "Marcus Williams",
    initials: "MW",
    role: "Brand Manager, GreenThread",
  },
  {
    text: "Finally a platform that understands sustainable brands aren\u2019t just a niche. The creator vetting is exactly what we needed.",
    name: "Emma Clarke",
    initials: "EC",
    role: "Head of Partnerships, Bloom & Wild",
  },
  {
    text: "Every creator recommendation actually aligned with our sustainability values, not just follower count. That\u2019s what sold us.",
    name: "Priya Sharma",
    initials: "PS",
    role: "CMO, EcoRevive",
  },
  {
    text: "We went from zero influencer presence to three signed partnerships in our first week. The onboarding was seamless.",
    name: "James O\u2019Brien",
    initials: "JO",
    role: "Founder, NatureBox UK",
  },
  {
    text: "Hudey\u2019s AI drafted outreach messages that sounded exactly like our brand voice. Creators responded because it felt genuine.",
    name: "Amara Osei",
    initials: "AO",
    role: "Marketing Lead, PureEarth",
  },
  {
    text: "The dashboard gives us complete visibility. We track every conversation, deal, and campaign metric in one place.",
    name: "Tom Richardson",
    initials: "TR",
    role: "Growth Manager, WildKind",
  },
  {
    text: "Other platforms flooded us with irrelevant creators. Hudey\u2019s recommendations were spot-on from day one.",
    name: "Laura Bennett",
    initials: "LB",
    role: "Brand Director, Conscious & Co.",
  },
  {
    text: "The negotiation AI suggested rates that were fair for both sides. Creators appreciated the transparency, and so did our budget.",
    name: "Raj Patel",
    initials: "RP",
    role: "Head of Marketing, GreenLeaf Goods",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

const faqs = [
  {
    question: "How does Hudey find the right creators for my brand?",
    answer:
      "Hudey looks at real engagement rates, audience demographics, content topics, and past brand partnerships to recommend creators whose followers match your target customers. For sustainable brands, we also check that the creator\u2019s content genuinely aligns with eco and ethical values.",
  },
  {
    question: "Do I have control over what gets sent to creators?",
    answer:
      "Yes, always. Hudey writes personalised outreach and negotiation messages, but you see and approve every message before it goes out. You can edit anything, adjust the offer, or rewrite the message entirely.",
  },
  {
    question: "Which social platforms does Hudey support?",
    answer:
      "Instagram, TikTok, YouTube, and X. You can target one or all platforms when setting up a campaign, and manage everything from one dashboard.",
  },
  {
    question: "How much time will I actually save?",
    answer:
      "Most teams spend 15\u201320 hours per week on creator research, outreach, and back-and-forth negotiation. With Hudey, you can go from campaign brief to signed creators in under 48 hours.",
  },
  {
    question: "Can I bring in creators I already work with?",
    answer:
      "Yes. You can add existing creator partnerships to Hudey and use the dashboard to track their campaigns alongside new creators that Hudey finds for you.",
  },
];

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const scrollRef = useScrollReveal();

  return (
    <div ref={scrollRef} className="min-h-screen bg-[#f3f1ea] overflow-x-clip">
      {/* Navigation */}
      <FloatingHeader
        navItems={navItems}
        appUrl={APP_URL}
        onCtaClick={() => trackCTAClick("nav")}
      />

      {/* ─── Hero ─── */}
      <Hero
        eyebrow={
          <HeroPill
            label="Founding Cohort"
            announcement="Now open — limited spots"
            href={APP_URL}
          />
        }
        title={
          <>
            Influencer marketing,
            <br />
            <em>handled by AI</em>
          </>
        }
        subtitle="Hudey finds the right creators, writes personalised outreach, and negotiates fair deals — you review and approve every step."
        ctaText="Apply for Early Access"
        ctaLink={`${APP_URL}/signup`}
        onCtaClick={() => trackCTAClick("hero")}
        dashboardPreview={
          <div className="overflow-hidden">
            {/* Browser chrome bar */}
            <div className="bg-[#f8f8f7] border-b border-black/[0.06] px-4 sm:px-5 py-3 sm:py-3.5 flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-[#ff5f57] rounded-full" />
                <div className="w-3 h-3 bg-[#febc2e] rounded-full" />
                <div className="w-3 h-3 bg-[#28c840] rounded-full" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-white border border-black/[0.08] rounded-md px-4 py-1 text-xs text-gray-400 font-mono">
                  app.hudey.co
                </div>
              </div>
              <div className="w-[52px]" />
            </div>
            {/* Dashboard content */}
            <div className="bg-white p-5 sm:p-8 lg:p-10">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-8">
                {[
                  { label: "Active Campaigns", value: "3" },
                  { label: "Creators Contacted", value: "47" },
                  { label: "Response Rate", value: "68%" },
                  { label: "Deals Closed", value: "12" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-black/[0.06] p-3 sm:p-4"
                  >
                    <div className="text-[10px] sm:text-xs text-gray-400 mb-1.5 font-medium">
                      {stat.label}
                    </div>
                    <div className="text-lg sm:text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 sm:gap-5">
                <div className="col-span-2 rounded-xl border border-black/[0.06] p-3 sm:p-5">
                  <div className="text-xs sm:text-sm font-medium text-gray-500 mb-4">
                    Campaign Performance
                  </div>
                  <div className="flex items-end gap-1.5 h-20 sm:h-28">
                    {[35, 55, 42, 72, 48, 85, 62, 78, 55, 92, 68, 82].map(
                      (h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-sm bg-[#2F4538]"
                          style={{
                            height: `${h}%`,
                            opacity: 0.2 + (h / 100) * 0.8,
                          }}
                        />
                      ),
                    )}
                  </div>
                </div>
                <div className="rounded-xl border border-black/[0.06] p-3 sm:p-5">
                  <div className="text-xs sm:text-sm font-medium text-gray-500 mb-4">
                    Top Creators
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: "Sarah M.", pct: 92 },
                      { name: "James K.", pct: 87 },
                      { name: "Lily T.", pct: 74 },
                    ].map((creator) => (
                      <div
                        key={creator.name}
                        className="flex items-center gap-2.5"
                      >
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-100 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] sm:text-xs font-medium text-gray-700 truncate">
                            {creator.name}
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full mt-1">
                            <div
                              className="h-full bg-[#2F4538] rounded-full"
                              style={{
                                width: `${creator.pct}%`,
                                opacity: 0.5,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      />

      {/* ─── How It Works ─── */}
      <section
        id="how-it-works"
        className="relative py-20 sm:py-28 lg:py-36 px-5 sm:px-8 bg-zinc-50 overflow-hidden"
      >
        {/* Tiles background */}
        <div className="absolute inset-0 z-0 opacity-100">
          <Tiles rows={80} cols={14} tileSize="md" />
        </div>
        {/* Fade edges */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 50%, transparent 0%, rgb(250 250 250) 100%)",
          }}
        />
        <div className="relative z-[2] mx-auto max-w-3xl lg:max-w-5xl">
          <AnimatedContainer className="max-w-3xl mx-auto text-center mb-10 sm:mb-14">
            <p className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-gray-400 font-medium mb-6 sm:mb-8">
              How It Works
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-gray-900 mb-4 sm:mb-6 leading-[1.08] tracking-tight px-4">
              Brief to signed creators
              <br />
              <em>in 48 hours</em>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto px-4">
              Four steps. You approve everything along the way.
            </p>
          </AnimatedContainer>

          <AnimatedContainer delay={0.4}>
            <div className="relative grid grid-cols-6 gap-3">
              {/* Card 1 — Speed stat */}
              <Card className="relative col-span-full flex overflow-hidden lg:col-span-2">
                <CardContent className="relative m-auto size-fit pt-6">
                  <div className="relative flex h-24 w-56 items-center">
                    <svg className="text-[#D16B42]/20 absolute inset-0 size-full" viewBox="0 0 254 104" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M112.891 97.7022C140.366 97.0802 171.004 94.6715 201.087 87.5116C210.43 85.2881 219.615 82.6412 228.284 78.2473C232.198 76.3179 235.905 73.9942 239.348 71.3124C241.85 69.2557 243.954 66.7571 245.555 63.9408C249.34 57.3235 248.281 50.5341 242.498 45.6109C239.033 42.7237 235.228 40.2703 231.169 38.3054C219.443 32.7209 207.141 28.4382 194.482 25.534C184.013 23.1927 173.358 21.7755 162.64 21.2989C161.376 21.3512 160.113 21.181 158.908 20.796C158.034 20.399 156.857 19.1682 156.962 18.4535C157.115 17.8927 157.381 17.3689 157.743 16.9139C158.104 16.4588 158.555 16.0821 159.067 15.8066C160.14 15.4683 161.274 15.3733 162.389 15.5286C179.805 15.3566 196.626 18.8373 212.998 24.462C220.978 27.2494 228.798 30.4747 236.423 34.1232C240.476 36.1159 244.202 38.7131 247.474 41.8258C254.342 48.2578 255.745 56.9397 251.841 65.4892C249.793 69.8582 246.736 73.6777 242.921 76.6327C236.224 82.0192 228.522 85.4602 220.502 88.2924C205.017 93.7847 188.964 96.9081 172.738 99.2109C153.442 101.949 133.993 103.478 114.506 103.79C91.1468 104.161 67.9334 102.97 45.1169 97.5831C36.0094 95.5616 27.2626 92.1655 19.1771 87.5116C13.839 84.5746 9.1557 80.5802 5.41318 75.7725C-0.54238 67.7259 -1.13794 59.1763 3.25594 50.2827C5.82447 45.3918 9.29572 41.0315 13.4863 37.4319C24.2989 27.5721 37.0438 20.9681 50.5431 15.7272C68.1451 8.8849 86.4883 5.1395 105.175 2.83669C129.045 0.0992292 153.151 0.134761 177.013 2.94256C197.672 5.23215 218.04 9.01724 237.588 16.3889C240.089 17.3418 242.498 18.5197 244.933 19.6446C246.627 20.4387 247.725 21.6695 246.997 23.615C246.455 25.1105 244.814 25.5605 242.63 24.5811C230.322 18.9961 217.233 16.1904 204.117 13.4376C188.761 10.3438 173.2 8.36665 157.558 7.52174C129.914 5.70776 102.154 8.06792 75.2124 14.5228C60.6177 17.8788 46.5758 23.2977 33.5102 30.6161C26.6595 34.3329 20.4123 39.0673 14.9818 44.658C12.9433 46.8071 11.1336 49.1622 9.58207 51.6855C4.87056 59.5336 5.61172 67.2494 11.9246 73.7608C15.2064 77.0494 18.8775 79.925 22.8564 82.3236C31.6176 87.7101 41.3848 90.5291 51.3902 92.5804C70.6068 96.5773 90.0219 97.7419 112.891 97.7022Z"
                        fill="currentColor"
                      />
                    </svg>
                    <span className="mx-auto block w-fit text-5xl font-semibold text-[#D16B42]">48h</span>
                  </div>
                  <h2 className="mt-6 text-center text-3xl font-semibold">Brief to Signed</h2>
                </CardContent>
              </Card>

              {/* Card 2 — Set your brief */}
              <Card className="relative col-span-full overflow-hidden sm:col-span-3 lg:col-span-2">
                <CardContent className="pt-6">
                  <div className="relative mx-auto flex aspect-square size-32 rounded-full border border-[#2F4538]/20 bg-[#2F4538]/[0.03] before:absolute before:-inset-2 before:rounded-full before:border before:border-[#2F4538]/10">
                    <SuccessIcon size={48} color="#2F4538" className="m-auto" />
                  </div>
                  <div className="relative z-10 mt-6 space-y-2 text-center">
                    <h2 className="text-lg font-medium text-gray-900">Tell Us What You Need</h2>
                    <p className="text-gray-500 text-sm">Set your campaign goal, target audience, and budget. Hudey uses this to find creators who actually fit.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3 — Get matched (chart visual) */}
              <Card className="relative col-span-full overflow-hidden sm:col-span-3 lg:col-span-2">
                <CardContent className="pt-6">
                  <div className="pt-6 lg:px-6">
                    <svg className="text-[#2F4538]/30 w-full" viewBox="0 0 386 123" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="386" height="123" rx="10" />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M3 123C3 123 14.3298 94.153 35.1282 88.0957C55.9266 82.0384 65.9333 80.5508 65.9333 80.5508C65.9333 80.5508 80.699 80.5508 92.1777 80.5508C103.656 80.5508 100.887 63.5348 109.06 63.5348C117.233 63.5348 117.217 91.9728 124.78 91.9728C132.343 91.9728 142.264 78.03 153.831 80.5508C165.398 83.0716 186.825 91.9728 193.761 91.9728C200.697 91.9728 206.296 63.5348 214.07 63.5348C221.844 63.5348 238.653 93.7771 244.234 91.9728C249.814 90.1684 258.8 60 266.19 60C272.075 60 284.1 88.057 286.678 88.0957C294.762 88.2171 300.192 72.9284 305.423 72.9284C312.323 72.9284 323.377 65.2437 335.553 63.5348C347.729 61.8259 348.218 82.07 363.639 80.5508C367.875 80.1335 372.949 82.2017 376.437 87.1008C379.446 91.3274 381.054 97.4325 382.521 104.647C383.479 109.364 382.521 123 382.521 123"
                        fill="url(#paint_hiw_chart)"
                      />
                      <path
                        className="text-[#2F4538]"
                        d="M3 121.077C3 121.077 15.3041 93.6691 36.0195 87.756C56.7349 81.8429 66.6632 80.9723 66.6632 80.9723C66.6632 80.9723 80.0327 80.9723 91.4656 80.9723C102.898 80.9723 100.415 64.2824 108.556 64.2824C116.696 64.2824 117.693 92.1332 125.226 92.1332C132.759 92.1332 142.07 78.5115 153.591 80.9723C165.113 83.433 186.092 92.1332 193 92.1332C199.908 92.1332 205.274 64.2824 213.017 64.2824C220.76 64.2824 237.832 93.8946 243.39 92.1332C248.948 90.3718 257.923 60.5 265.284 60.5C271.145 60.5 283.204 87.7182 285.772 87.756C293.823 87.8746 299.2 73.0802 304.411 73.0802C311.283 73.0802 321.425 65.9506 333.552 64.2824C345.68 62.6141 346.91 82.4553 362.27 80.9723C377.629 79.4892 383 106.605 383 106.605"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <defs>
                        <linearGradient id="paint_hiw_chart" x1="3" y1="60" x2="3" y2="123" gradientUnits="userSpaceOnUse">
                          <stop className="text-[#2F4538]/20" stopColor="currentColor" />
                          <stop offset="1" stopColor="currentColor" stopOpacity="0.1" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="relative z-10 mt-14 space-y-2 text-center">
                    <h2 className="text-lg font-medium text-gray-900">Get Matched with Creators</h2>
                    <p className="text-gray-500 text-sm">AI recommends creators based on real engagement rates, audience fit, and content alignment with your values.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Card 4 — Review and approve (wide) */}
              <Card className="relative col-span-full overflow-hidden lg:col-span-3">
                <CardContent className="grid pt-6 sm:grid-cols-2">
                  <div className="relative z-10 flex flex-col justify-between space-y-12 lg:space-y-6">
                    <div className="relative flex aspect-square size-12 rounded-full border border-[#2F4538]/20 bg-[#2F4538]/[0.03] before:absolute before:-inset-2 before:rounded-full before:border before:border-[#2F4538]/10">
                      <SendIcon size={22} color="#2F4538" className="m-auto" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-lg font-medium text-gray-900">Review and Approve</h2>
                      <p className="text-gray-500 text-sm">AI writes personalised outreach and handles negotiation. You read every message before it sends.</p>
                    </div>
                  </div>
                  <div className="rounded-tl-lg relative -mb-6 -mr-6 mt-6 h-fit border-l border-t border-gray-200 p-6 py-6 sm:ml-6">
                    <div className="absolute left-3 top-2 flex gap-1">
                      <span className="block size-2 rounded-full border border-gray-200" />
                      <span className="block size-2 rounded-full border border-gray-200" />
                      <span className="block size-2 rounded-full border border-gray-200" />
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#f3f1ea] flex-shrink-0" />
                        <span className="text-xs font-medium text-gray-600">@sarah_eco</span>
                      </div>
                      <div className="space-y-1.5 pl-8">
                        <div className="h-2 w-full rounded bg-gray-100" />
                        <div className="h-2 w-5/6 rounded bg-gray-100" />
                        <div className="h-2 w-3/4 rounded bg-gray-100" />
                      </div>
                      <div className="flex gap-2 pl-8 pt-1">
                        <span className="text-[10px] font-medium border border-gray-200 rounded px-2 py-0.5 text-gray-500">Edit</span>
                        <span className="text-[10px] font-medium bg-[#2F4538] text-white rounded px-2 py-0.5">Approve</span>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <div className="w-6 h-6 rounded-full bg-[#f3f1ea] flex-shrink-0" />
                        <span className="text-xs font-medium text-gray-600">@green_living</span>
                      </div>
                      <div className="space-y-1.5 pl-8">
                        <div className="h-2 w-full rounded bg-gray-100" />
                        <div className="h-2 w-2/3 rounded bg-gray-100" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 5 — Track results (wide) */}
              <Card className="relative col-span-full overflow-hidden lg:col-span-3">
                <CardContent className="grid h-full pt-6 sm:grid-cols-2">
                  <div className="relative z-10 flex flex-col justify-between space-y-12 lg:space-y-6">
                    <div className="relative flex aspect-square size-12 rounded-full border border-[#2F4538]/20 bg-[#2F4538]/[0.03] before:absolute before:-inset-2 before:rounded-full before:border before:border-[#2F4538]/10">
                      <NotificationIcon size={22} color="#2F4538" className="m-auto" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-lg font-medium text-gray-900">See Results in Real Time</h2>
                      <p className="text-gray-500 text-sm">Track responses, deals, and campaign ROI from one dashboard. No spreadsheets, no manual updates.</p>
                    </div>
                  </div>
                  <div className="before:bg-gray-200 relative mt-6 before:absolute before:inset-0 before:mx-auto before:w-px sm:-my-6 sm:-mr-6">
                    <div className="relative flex h-full flex-col justify-center space-y-6 py-6">
                      <div className="relative flex w-[calc(50%+0.875rem)] items-center justify-end gap-2">
                        <span className="block h-fit rounded border border-gray-200 px-2 py-1 text-xs shadow-sm text-gray-600">Sarah M.</span>
                        <div className="ring-white size-7 ring-4">
                          <div className="size-full rounded-full bg-[#f3f1ea] flex items-center justify-center">
                            <span className="text-[8px] font-semibold text-gray-600">SM</span>
                          </div>
                        </div>
                      </div>
                      <div className="relative ml-[calc(50%-1rem)] flex items-center gap-2">
                        <div className="ring-white size-8 ring-4">
                          <div className="size-full rounded-full bg-[#f3f1ea] flex items-center justify-center">
                            <span className="text-[8px] font-semibold text-gray-600">JK</span>
                          </div>
                        </div>
                        <span className="block h-fit rounded border border-gray-200 px-2 py-1 text-xs shadow-sm text-gray-600">James K.</span>
                      </div>
                      <div className="relative flex w-[calc(50%+0.875rem)] items-center justify-end gap-2">
                        <span className="block h-fit rounded border border-gray-200 px-2 py-1 text-xs shadow-sm text-gray-600">Lily T.</span>
                        <div className="ring-white size-7 ring-4">
                          <div className="size-full rounded-full bg-[#f3f1ea] flex items-center justify-center">
                            <span className="text-[8px] font-semibold text-gray-600">LT</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </AnimatedContainer>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section
        id="features"
        className="relative py-20 sm:py-28 lg:py-36 px-5 sm:px-8 bg-white overflow-hidden"
      >
        {/* Tiles background */}
        <div className="absolute inset-0 z-0 opacity-100">
          <Tiles rows={80} cols={14} tileSize="md" />
        </div>
        {/* Fade edges */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 50%, transparent 0%, white 100%)",
          }}
        />
        <div className="relative z-[2] max-w-5xl mx-auto space-y-8">
          <AnimatedContainer className="max-w-3xl mx-auto text-center">
            <p className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-gray-400 font-medium mb-6 sm:mb-8">
              Features
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-gray-900 mb-4 sm:mb-6 leading-[1.08] tracking-tight px-4">
              Everything you need,
              <br />
              <em>one agent</em>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto px-4">
              Find creators, send outreach, negotiate deals, and track
              results — without switching tools.
            </p>
          </AnimatedContainer>

          <AnimatedContainer
            delay={0.4}
            className="grid grid-cols-1 divide-x divide-y divide-dashed border border-dashed border-gray-200 divide-gray-200 sm:grid-cols-2 md:grid-cols-3"
          >
            {features.map((feature, i) => (
              <FeatureCard key={i} feature={feature} />
            ))}
          </AnimatedContainer>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="reveal-section relative py-20 sm:py-28 lg:py-36 px-5 sm:px-8 bg-white overflow-hidden">
        <BGPattern
          variant="dots"
          mask="fade-edges"
          size={28}
          fill="rgba(47, 69, 56, 0.12)"
        />
        <div className="relative z-10 max-w-7xl mx-auto">
          <AnimatedContainer className="text-center mb-10 sm:mb-14">
            <p className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-gray-400 font-medium mb-6 sm:mb-8">
              Trusted by Brands
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-gray-900 mb-4 sm:mb-6 leading-[1.08] tracking-tight px-4">
              What our brands <em>say</em>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto px-4">
              See how sustainable brands are saving time and finding better
              creator partners with Hudey.
            </p>
          </AnimatedContainer>

          <div className="flex justify-center gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
            <TestimonialsColumn testimonials={firstColumn} duration={15} />
            <TestimonialsColumn
              testimonials={secondColumn}
              className="hidden md:block"
              duration={19}
            />
            <TestimonialsColumn
              testimonials={thirdColumn}
              className="hidden lg:block"
              duration={17}
            />
          </div>
        </div>
      </section>

      {/* ─── Founding Cohort ─── */}
      <section
        id="founding-cohort"
        className="reveal-section relative py-20 sm:py-28 lg:py-36 px-5 sm:px-8 bg-[#f3f1ea] overflow-hidden"
      >
        <BGPattern
          variant="grid"
          mask="fade-edges"
          size={32}
          fill="rgba(47, 69, 56, 0.06)"
        />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="reveal-item">
            <p className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-gray-400 font-medium mb-6 sm:mb-8">
              Founding Cohort
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-gray-900 mb-4 sm:mb-6 leading-[1.08] tracking-tight px-4">
              Be one of the <em>first 10 brands</em>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto mb-10 sm:mb-14 px-4">
              We&apos;re building Hudey alongside a small group of UK sustainable
              brands. Founding members get personal onboarding, a locked-in
              rate of &pound;250/campaign, and a direct line to our team.
            </p>
          </div>
          <div className="mb-10 sm:mb-14">
            <FoundingCards />
          </div>
          <div className="reveal-item">
            <a
              href={`${APP_URL}/signup`}
              onClick={() => trackCTAClick("founding_cohort")}
              className="inline-flex items-center gap-3 bg-[#2F4538] hover:bg-[#253b2e] text-white px-8 py-4 sm:px-10 sm:py-5 rounded-xl font-medium text-base sm:text-lg transition-colors group"
            >
              Apply for Early Access
              <IconArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* ─── FAQs ─── */}
      <section
        id="faq"
        className="reveal-section relative py-20 sm:py-28 lg:py-36 px-5 sm:px-8 bg-white overflow-hidden"
      >
        <BGPattern
          variant="horizontal-lines"
          mask="fade-edges"
          size={36}
          fill="rgba(47, 69, 56, 0.04)"
        />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="reveal-item text-center mb-14 sm:mb-20">
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-gray-900 mb-4 sm:mb-6 leading-[1.08] tracking-tight px-4">
              Frequently asked <em>questions</em>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-400 px-4">
              Quick answers about how Hudey works, what you control, and what it
              costs.
            </p>
          </div>

          <div className="reveal-item">
            <CustomAccordion
              type="single"
              collapsible
              defaultValue="item-0"
              className="space-y-4"
            >
              {faqs.map((faq, index) => (
                <CustomAccordionItem key={index} value={`item-${index}`}>
                  <CustomAccordionTrigger>
                    {faq.question}
                  </CustomAccordionTrigger>
                  <CustomAccordionContent>
                    {faq.answer}
                  </CustomAccordionContent>
                </CustomAccordionItem>
              ))}
            </CustomAccordion>
          </div>

          {/* Still have questions */}
          <div className="reveal-item mt-14 sm:mt-20">
            <HighlightGroup className="group">
              <HighlighterItem className="rounded-2xl">
                <div className="relative z-20 overflow-hidden rounded-2xl border border-black/[0.06] bg-[#f3f1ea]">
                  <Particles
                    className="absolute inset-0 -z-10 opacity-10 transition-opacity duration-1000 ease-in-out group-hover:opacity-100"
                    quantity={150}
                    color="#2F4538"
                    vy={-0.2}
                  />
                  <div className="p-8 sm:p-12 text-center">
                    <h3 className="font-serif text-2xl sm:text-3xl text-gray-900 mb-3 sm:mb-4">
                      Still have <em>questions?</em>
                    </h3>
                    <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8">
                      Our team is here to help. Get in touch and we&apos;ll
                      answer any questions you have.
                    </p>
                    <a
                      href="mailto:hello@hudey.co"
                      className="inline-flex items-center gap-2 bg-[#2F4538] hover:bg-[#253b2e] text-white px-8 py-3.5 rounded-xl font-medium text-sm sm:text-base transition-colors"
                    >
                      Contact Us
                      <IconArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </HighlighterItem>
            </HighlightGroup>
          </div>
        </div>
      </section>

      {/* ─── Final CTA + Footer ─── */}
      <section className="reveal-section bg-[#2F4538] relative overflow-hidden">
        <BGPattern
          variant="dots"
          mask="fade-edges"
          size={32}
          fill="rgba(255, 255, 255, 0.08)"
        />
        {/* CTA Area */}
        <div className="pt-20 sm:pt-28 lg:pt-36 pb-16 sm:pb-20 px-5 sm:px-8">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="reveal-item">
              <p className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-white/50 font-medium mb-6 sm:mb-8">
                Ready to get started?
              </p>

              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white mb-4 sm:mb-6 leading-[1.08] tracking-tight px-4">
                Join the founding <em>cohort</em>
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-white/60 mb-10 sm:mb-14 max-w-2xl mx-auto px-4">
                10 spots for UK sustainable brands who want to run influencer
                campaigns without the busywork.
              </p>
            </div>

            <div className="reveal-item flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-xl mx-auto mb-10 sm:mb-12 px-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your work email"
                className="flex-1 px-5 sm:px-6 py-4 rounded-xl text-gray-900 bg-white outline-none focus:ring-2 focus:ring-[#D16B42]/40 text-sm sm:text-base"
              />
              <a
                href={`${APP_URL}/signup${email ? `?email=${encodeURIComponent(email)}` : ""}`}
                onClick={() => trackCTAClick("footer")}
                className="bg-white hover:bg-gray-100 text-gray-900 px-8 py-4 rounded-xl font-medium text-sm sm:text-base transition-colors whitespace-nowrap text-center"
              >
                Apply Now
              </a>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 text-xs sm:text-sm text-white/60 px-4">
              {[
                { icon: IconCheck, text: "10 founding spots" },
                { icon: IconCheck, text: "Hands-on onboarding" },
                { icon: IconCheck, text: "\u00a3250 per campaign, locked in" },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-[#D16B42]" />
                    <span className="whitespace-nowrap">{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 px-5 sm:px-8 pt-14 sm:pt-20 pb-8 sm:pb-10 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex w-full flex-col justify-between gap-10 lg:flex-row lg:items-start">
              {/* Left — Brand + Description + Socials */}
              <div className="flex w-full flex-col gap-6 lg:max-w-xs">
                <div className="flex items-center gap-2">
                  <HudeyLogo className="w-7 h-7" bg="bg-white" fill="#111827" />
                  <span className="text-xl font-semibold text-white">Hudey</span>
                </div>
                <p className="text-sm text-white/50 leading-relaxed">
                  AI-powered influencer marketing for sustainable brands. Find creators, send outreach, and close deals — all from one platform.
                </p>
                <ul className="flex items-center gap-5">
                  {/* Instagram */}
                  <li>
                    <a href="https://instagram.com/hudeyco" aria-label="Instagram" className="text-white/40 hover:text-white transition-colors">
                      <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    </a>
                  </li>
                  {/* X (Twitter) */}
                  <li>
                    <a href="https://x.com/hudeyco" aria-label="X" className="text-white/40 hover:text-white transition-colors">
                      <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                  </li>
                  {/* LinkedIn */}
                  <li>
                    <a href="https://linkedin.com/company/hudey" aria-label="LinkedIn" className="text-white/40 hover:text-white transition-colors">
                      <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    </a>
                  </li>
                </ul>
              </div>

              {/* Right — Link columns */}
              <div className="grid w-full grid-cols-2 gap-8 sm:grid-cols-3 lg:max-w-lg lg:gap-16">
                <div>
                  <h3 className="mb-4 text-sm font-semibold text-white">Product</h3>
                  <ul className="space-y-3 text-sm text-white/50">
                    <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                    <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                    <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                    <li><a href="#founding-cohort" className="hover:text-white transition-colors">Founding Cohort</a></li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-4 text-sm font-semibold text-white">Company</h3>
                  <ul className="space-y-3 text-sm text-white/50">
                    <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                    <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                    <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-4 text-sm font-semibold text-white">Resources</h3>
                  <ul className="space-y-3 text-sm text-white/50">
                    <li><Link href="/help" className="hover:text-white transition-colors">Help Centre</Link></li>
                    <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
                    <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                    <li><Link href="/refund" className="hover:text-white transition-colors">Refund Policy</Link></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-12 flex flex-col justify-between gap-4 border-t border-white/10 pt-8 text-xs text-white/40 sm:flex-row sm:items-center">
              <p>&copy; {new Date().getFullYear()} Hudey. All rights reserved.</p>
              <ul className="flex gap-4 sm:gap-6">
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}
