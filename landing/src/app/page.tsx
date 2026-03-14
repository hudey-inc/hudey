"use client";

import { useState } from "react";
import Link from "next/link";
import { HudeyLogo } from "@/components/hudey-logo";
import {
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
import { TestimonialsColumn } from "@/components/ui/testimonials-columns";
import { Marquee } from "@/components/ui/marquee";
import InteractiveHoverButton from "@/components/ui/interactive-hover-button";
import { Footer } from "@/components/ui/footer";
import { Badge } from "@/components/ui/badge";
import { Heart, Shield, Target, Zap } from "lucide-react";
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
    icon: IconSparkles,
    animatedIcon: HeartIcon,
    title: "Values-First Matching",
    description:
      "Every creator is screened for sustainability alignment. Not just bio keywords \u2014 actual content history, past partnerships, and audience values.",
  },
  {
    icon: IconUsers,
    animatedIcon: SuccessIcon,
    title: "Creator Discovery",
    description:
      "Filter by niche, engagement, location, or audience size. Find creators your customers already follow.",
  },
  {
    icon: IconMessage,
    animatedIcon: SendIcon,
    title: "Personalised Outreach",
    description:
      "Every message references the creator\u2019s recent posts, tone, and niche. You review before it sends.",
  },
  {
    icon: IconDollar,
    animatedIcon: ToggleIcon,
    title: "Rate Negotiation",
    description:
      "Fair rates based on reach, engagement history, and what similar partnerships cost. You set the ceiling.",
  },
  {
    icon: IconShield,
    animatedIcon: LockUnlockIcon,
    title: "Creator Vetting",
    description:
      "Fake followers, past brand conflicts, misaligned content. All flagged before you ever reach out.",
  },
  {
    icon: IconChart,
    animatedIcon: NotificationIcon,
    title: "Live Dashboard",
    description:
      "See who\u2019s been contacted, who\u2019s replied, what\u2019s been agreed, and what you\u2019ve spent. Export a report when you need it.",
  },
];

const marqueeQuestions = [
  "How do I find creators who share my values?",
  "How do I vet creators for sustainability?",
  "How long should outreach take?",
  "What\u2019s a fair rate for a nano-creator?",
  "How do I scale campaigns without more headcount?",
  "Can AI write outreach that sounds like my brand?",
  "How do I know if a creator\u2019s audience is real?",
  "What platforms work best for eco brands?",
  "How do I negotiate rates fairly?",
  "How do I track campaign ROI?",
  "Should I work with micro or macro creators?",
  "How do I manage DMs across four platforms?",
];

const whyFeatures = [
  {
    icon: Heart,
    title: "Discovery tools don\u2019t filter for values",
    description:
      "Most platforms rank creators by reach. Nobody checks whether their content or audience actually cares about sustainability.",
  },
  {
    icon: Shield,
    title: "One off-brand DM can cost you",
    description:
      "Other tools send messages you never see. A single tone-deaf outreach can burn a creator relationship before it starts.",
  },
  {
    icon: Target,
    title: "Generic tools, generic results",
    description:
      "Platforms built for every industry end up solving none of them well. Sustainable brands have vetting needs most tools ignore.",
  },
  {
    icon: Zap,
    title: "Three weeks for one creator",
    description:
      "Research, outreach, negotiation, follow-ups. Most teams burn 15+ hours a week before signing anyone.",
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
    text: "The AI negotiation tool alone saved us 15 hours a week. We ran three campaigns at once without hiring anyone new.",
    name: "Marcus Williams",
    initials: "MW",
    role: "Brand Manager, GreenThread",
  },
  {
    text: "Finally a platform that gets sustainable brands aren\u2019t just a niche. The creator vetting is exactly what we needed.",
    name: "Emma Clarke",
    initials: "EC",
    role: "Head of Partnerships, Bloom & Wild",
  },
  {
    text: "Every creator recommendation actually matched our sustainability values, not just follower count. That\u2019s what sold us.",
    name: "Priya Sharma",
    initials: "PS",
    role: "CMO, EcoRevive",
  },
  {
    text: "We went from zero influencer presence to three signed partnerships in our first week. Onboarding took maybe 20 minutes.",
    name: "James O\u2019Brien",
    initials: "JO",
    role: "Founder, NatureBox UK",
  },
  {
    text: "The outreach messages sounded like us, not like a bot. Creators responded because it felt like a real person wrote it.",
    name: "Amara Osei",
    initials: "AO",
    role: "Marketing Lead, PureEarth",
  },
  {
    text: "One dashboard for every conversation, deal, and campaign metric. We stopped toggling between four apps.",
    name: "Tom Richardson",
    initials: "TR",
    role: "Growth Manager, WildKind",
  },
  {
    text: "Other platforms flooded us with irrelevant creators. Hudey\u2019s shortlist was right from the first campaign.",
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
      "Hudey checks engagement rates, audience demographics, content history, and past partnerships to shortlist creators whose followers look like your customers. For sustainable brands, it also checks whether the creator\u2019s content backs up their eco or ethical positioning.",
  },
  {
    question: "Do I have control over what gets sent to creators?",
    answer:
      "Yes. Hudey drafts every outreach and negotiation message, but nothing sends until you say so. Edit the copy, change the offer, or rewrite the whole thing.",
  },
  {
    question: "Which social platforms does Hudey support?",
    answer:
      "Instagram, TikTok, YouTube, and X. You can target one or all platforms when setting up a campaign.",
  },
  {
    question: "Is this a beta, or am I paying to be a test user?",
    answer:
      "Hudey is fully functional today. The founding cohort isn\u2019t a beta \u2014 it\u2019s a small group of brands we work with closely so we can build the best product for UK sustainable brands. You get a working platform and more attention from our team than any customer will get again.",
  },
  {
    question: "Can I bring in creators I already work with?",
    answer:
      "Yes. Add existing partnerships to Hudey and track their campaigns alongside new creators the platform finds for you.",
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
            Creator partnerships,
            <br />
            <em>handled by AI</em>
          </>
        }
        subtitle="Hudey finds the right creators, writes personalised outreach, and negotiates fair rates. You approve everything before it goes out."
        ctaSlot={
          <InteractiveHoverButton
            text="Join the Founding Cohort"
            href={`${APP_URL}/signup`}
            onClick={() => trackCTAClick("hero")}
          />
        }
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
              Four steps. You stay
              <br />
              <em>in control</em>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto px-4">
              From campaign brief to signed creators. Nothing goes out without your sign-off.
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
                    <h2 className="text-lg font-medium text-gray-900">Set Your Brief</h2>
                    <p className="text-gray-500 text-sm">Campaign goal, target audience, budget. Takes five minutes. Hudey uses this to shortlist creators who fit.</p>
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
                    <h2 className="text-lg font-medium text-gray-900">Get a Vetted Shortlist</h2>
                    <p className="text-gray-500 text-sm">Hudey pulls engagement data, audience demographics, and content history to recommend creators worth your time.</p>
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
                      <p className="text-gray-500 text-sm">Hudey drafts the outreach and handles back-and-forth on rates. You read every message before it goes.</p>
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
                      <h2 className="text-lg font-medium text-gray-900">Track Deals and ROI</h2>
                      <p className="text-gray-500 text-sm">Responses, deals, and spend update live in your dashboard. No spreadsheets required.</p>
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
              Replace the agency,
              <br />
              <em>the spreadsheets, the inbox</em>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto px-4">
              Discovery, outreach, negotiation, and reporting. One platform.
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

      {/* ─── Why We Built This ─── */}
      <section className="reveal-section relative bg-white py-20 sm:py-28 lg:py-36 overflow-hidden">
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
        <div className="relative z-[2] mx-auto max-w-5xl px-5 sm:px-8">
          <AnimatedContainer className="mx-auto flex flex-col items-center justify-center space-y-4 text-center">
            <p className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-gray-400 font-medium">
              Why we built this
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-gray-900 leading-[1.08] tracking-tight max-w-3xl">
              The questions brands <em>kept asking</em>
            </h2>
            <p className="max-w-xl text-base sm:text-lg text-gray-400">
              We talked to 40+ UK sustainable brand founders. The same problems
              came up every time. So we built a platform to solve them.
            </p>
          </AnimatedContainer>

          <AnimatedContainer delay={0.3} className="relative mx-auto max-w-3xl overflow-hidden mt-8 sm:mt-12">
            <div className="absolute left-0 z-10 h-full w-20 bg-gradient-to-r from-white pointer-events-none" />
            <div className="absolute right-0 z-10 h-full w-20 bg-gradient-to-l from-white pointer-events-none" />
            <div className="flex flex-col gap-2">
              <Marquee className="[--duration:45s]" repeat={4}>
                {marqueeQuestions.slice(0, 4).map((q) => (
                  <Badge
                    className="rounded-lg border-[#2F4538]/15 bg-[#2F4538]/[0.06] text-gray-700 whitespace-nowrap"
                    key={q}
                    size="lg"
                    variant="outline"
                  >
                    {q}
                  </Badge>
                ))}
              </Marquee>
              <Marquee className="[--duration:50s]" repeat={4} reverse>
                {marqueeQuestions.slice(4, 8).map((q) => (
                  <Badge
                    className="rounded-lg border-[#2F4538]/15 bg-[#2F4538]/[0.06] text-gray-700 whitespace-nowrap"
                    key={q}
                    size="lg"
                    variant="outline"
                  >
                    {q}
                  </Badge>
                ))}
              </Marquee>
              <Marquee className="[--duration:42s]" repeat={4}>
                {marqueeQuestions.slice(8).map((q) => (
                  <Badge
                    className="rounded-lg border-[#2F4538]/15 bg-[#2F4538]/[0.06] text-gray-700 whitespace-nowrap"
                    key={q}
                    size="lg"
                    variant="outline"
                  >
                    {q}
                  </Badge>
                ))}
              </Marquee>
            </div>
          </AnimatedContainer>

          <div className="mt-10 sm:mt-16 grid grid-cols-1 divide-y divide-dashed divide-gray-200 border-t border-dashed border-gray-200 sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
            {whyFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  className="flex flex-col gap-4 px-5 py-8 lg:px-6 lg:py-10"
                  key={feature.title}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#2F4538]/[0.06] flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#2F4538]" />
                  </div>
                  <div className="flex flex-col gap-2 pt-4 sm:pt-6">
                    <h3 className="text-sm md:text-base font-medium text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="text-xs font-light text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
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
              From our brands
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-gray-900 mb-4 sm:mb-6 leading-[1.08] tracking-tight px-4">
              What our brands <em>say</em>
            </h2>
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
              We&apos;re building Hudey with a small group of UK sustainable
              brands. Founding members get hands-on onboarding, &pound;250/campaign locked in, and a direct line to our team.
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
              Join the Founding Cohort
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
              What you control, what Hudey handles, and what it costs.
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
                      Email us at hello@hudey.co. We respond within one business
                      day.
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
                Founding Cohort
              </p>

              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white mb-4 sm:mb-6 leading-[1.08] tracking-tight px-4">
                10 spots. <em>First come, first served.</em>
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-white/60 mb-10 sm:mb-14 max-w-2xl mx-auto px-4">
                UK sustainable brands only. Founding members get hands-on
                onboarding and a locked-in rate that won&apos;t come back.
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
                Join Now
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

        <div className="relative z-10">
          <Footer />
        </div>
      </section>
    </div>
  );
}
