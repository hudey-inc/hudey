export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO date
  category: "product" | "industry" | "guide";
  readTime: string;
  content: string; // HTML content
}

const CATEGORY_LABELS: Record<BlogPost["category"], string> = {
  product: "Product Update",
  industry: "Industry",
  guide: "Guide",
};

export function getCategoryLabel(category: BlogPost["category"]): string {
  return CATEGORY_LABELS[category];
}

/**
 * Blog posts ordered newest-first.
 * Add new posts at the top of the array.
 */
export const posts: BlogPost[] = [
  {
    slug: "introducing-hudey",
    title: "Introducing Hudey: Find, Contact, and Sign Creators Without the Busywork",
    description:
      "We built Hudey to help sustainable brands run influencer campaigns in hours, not weeks. Here\u2019s the problem we\u2019re solving and what\u2019s live now.",
    date: "2026-02-28",
    category: "product",
    readTime: "4 min read",
    content: `
      <p>If you run a sustainable brand, you already know influencer marketing works. The problem is everything around it: finding creators who share your values, writing dozens of personalised messages, negotiating rates over email and DMs, and tracking results across spreadsheets.</p>

      <p>Most teams spend 15\u201320 hours a week just on coordination. By the time you\u2019ve signed one creator, you\u2019ve burned through half your budget on admin.</p>

      <h2>Why We Built Hudey</h2>

      <p>We started Hudey because sustainable brands shouldn\u2019t need a full-time coordinator to run a single influencer campaign. The problem isn\u2019t your team\u2014it\u2019s that the tools weren\u2019t built for how creator marketing actually works today.</p>

      <p>Hudey is an AI-powered platform that handles the repetitive parts: finding creators who fit your brand, writing a unique outreach message for each one, negotiating fair rates, and tracking every deliverable. You stay in control\u2014you approve every message and sign off on every deal\u2014but you stop doing the busywork.</p>

      <h2>What You Can Do Today</h2>

      <ul>
        <li><strong>Find Matching Creators</strong> \u2014 Search by engagement rate, audience demographics, niche, and sustainability values</li>
        <li><strong>Send Personalised Outreach</strong> \u2014 AI writes a unique message for each creator. You review and approve before anything sends</li>
        <li><strong>Negotiate Deals Automatically</strong> \u2014 Hudey handles counter-offers, deal terms, and contract generation</li>
        <li><strong>Track Campaign Results</strong> \u2014 See responses, signed deals, spend, and ROI in a live dashboard</li>
      </ul>

      <h2>What\u2019s Coming Next</h2>

      <p>We\u2019re working with our founding cohort of UK sustainable brands to improve every part of the experience. If you\u2019re spending too much time on influencer coordination and want a faster way to run campaigns, we\u2019d love to hear from you.</p>
    `,
  },
  {
    slug: "why-sustainable-brands-need-better-influencer-tools",
    title: "Why Generic Influencer Platforms Don\u2019t Work for Sustainable Brands",
    description:
      "Most creator tools sort by follower count and engagement rate. They don\u2019t check if a creator promoted fast fashion last week. Here\u2019s what sustainable brands actually need.",
    date: "2026-02-25",
    category: "industry",
    readTime: "5 min read",
    content: `
      <p>Influencer marketing is a \u00a315 billion industry. But almost every tool on the market was designed for mass-market DTC brands, supplement companies, and fast fashion\u2014not for brands that actually care about who represents them.</p>

      <h2>The Wrong Creator Is a Brand Risk</h2>

      <p>When you\u2019re a sustainable brand, partnering with the wrong creator isn\u2019t just a wasted budget\u2014it\u2019s a reputation problem. If a creator promotes fast fashion one week and your eco-friendly line the next, your audience notices. And they stop trusting you.</p>

      <p>Most discovery tools sort by follower count and engagement rate. They don\u2019t check a creator\u2019s past partnerships, flag fake followers, or tell you whether their content actually aligns with sustainability. That means your team is stuck manually scrolling through months of posts to vet each creator before you even reach out.</p>

      <h2>What Sustainable Brands Actually Need</h2>

      <p>For eco, ethical, and wellness brands, vetting isn\u2019t a nice-to-have\u2014it\u2019s the whole point. The right platform should handle:</p>

      <ul>
        <li><strong>Past partnership checks</strong> \u2014 Automatically reviewing a creator\u2019s brand history for conflicts</li>
        <li><strong>Fake follower detection</strong> \u2014 Filtering out inflated audiences and bot engagement</li>
        <li><strong>Sustainability matching</strong> \u2014 Only recommending creators whose content genuinely reflects your values</li>
        <li><strong>Your final approval</strong> \u2014 AI does the research, but you decide who makes the cut</li>
      </ul>

      <p>That\u2019s exactly how Hudey works. Every creator recommendation is vetted, every outreach message is approved by you, and every partnership reflects what your brand actually stands for.</p>
    `,
  },
  {
    slug: "5-mistakes-first-influencer-campaign",
    title: "5 Mistakes That Waste Budget on Your First Influencer Campaign",
    description:
      "Overpaying for followers, sending generic DMs, and skipping contracts. Here are the pitfalls first-time brands hit and how to avoid each one.",
    date: "2026-02-20",
    category: "guide",
    readTime: "6 min read",
    content: `
      <p>Your first influencer campaign is exciting\u2014and it\u2019s where most brands waste the most money. Here are the five mistakes we see again and again, and what to do instead.</p>

      <h2>1. Paying for Followers Instead of Engagement</h2>

      <p>A creator with 500K followers and 0.5% engagement will almost always underperform one with 50K followers and 5% engagement. Smaller creators get better results because their audiences actually trust them. Focus on engagement rate and audience quality, not vanity metrics.</p>

      <h2>2. Sending the Same DM to Every Creator</h2>

      <p>Creators get dozens of brand pitches every week. A generic message that could be sent to anyone gets ignored. The outreach messages that get replies reference the creator\u2019s specific content and explain exactly why they\u2019re a fit for your brand.</p>

      <h2>3. Agreeing to a Deal Without a Contract</h2>

      <p>A handshake deal over DMs is not a contract. Without written terms covering deliverables, deadlines, content usage rights, and payment, you\u2019re setting yourself up for disputes. Put it in writing, even for gifted collaborations.</p>

      <h2>4. Not Deciding What \u201CSuccess\u201D Means Before You Start</h2>

      <p>If you don\u2019t define what a successful campaign looks like upfront, you can\u2019t measure it after. Decide what matters most\u2014reach, engagement, website clicks, or sales\u2014and make sure your tracking is set up before the first post goes live.</p>

      <h2>5. Running Everything from Spreadsheets and DMs</h2>

      <p>Spreadsheets and scattered DMs don\u2019t scale. By your third campaign, you\u2019ll be drowning in message threads, missed follow-ups, and data you can\u2019t find. Use a purpose-built tool from the start\u2014your future self will thank you.</p>
    `,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return posts.map((p) => p.slug);
}
