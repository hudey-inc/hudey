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
    title: "Introducing Hudey: AI-Powered Influencer Marketing for Sustainable Brands",
    description:
      "We built Hudey because sustainable brands deserve better tools. Here\u2019s why we started and what\u2019s coming next.",
    date: "2026-02-28",
    category: "product",
    readTime: "4 min read",
    content: `
      <p>Running influencer campaigns as a sustainable brand shouldn\u2019t mean choosing between your values and your growth targets. But for most teams, that\u2019s exactly the trade-off.</p>

      <p>Discovery takes weeks. Outreach is manual and repetitive. Negotiations stall in DMs. And by the time you\u2019ve signed a creator, you\u2019ve burned through half your budget on coordination alone.</p>

      <h2>Why We Built Hudey</h2>

      <p>We started Hudey after watching brand teams spend 15\u201320 hours a week on tasks that should take minutes. The problem wasn\u2019t a lack of talent\u2014it was a lack of tooling designed for how modern influencer marketing actually works.</p>

      <p>So we built an AI agent that handles the heavy lifting: finding the right creators, writing personalised outreach, negotiating fair deals, and tracking every result. You stay in control\u2014you approve every message, every offer, every partnership\u2014but you stop doing the busywork.</p>

      <h2>What\u2019s Live Now</h2>

      <ul>
        <li><strong>AI-Powered Discovery</strong> \u2014 Surface creators matched on engagement data, audience overlap, and brand alignment</li>
        <li><strong>Smart Outreach</strong> \u2014 Personalised messages drafted for each creator, approved by you before sending</li>
        <li><strong>Negotiation Agent</strong> \u2014 Counter-offers, deal terms, and contract generation handled automatically</li>
        <li><strong>Campaign Analytics</strong> \u2014 Real-time tracking of deliverables, engagement, and ROI</li>
      </ul>

      <h2>What\u2019s Next</h2>

      <p>We\u2019re working with our founding cohort of UK sustainable brands to refine every part of the experience. If you\u2019re running influencer campaigns and want a smarter way to do it, we\u2019d love to hear from you.</p>
    `,
  },
  {
    slug: "why-sustainable-brands-need-better-influencer-tools",
    title: "Why Sustainable Brands Need Better Influencer Marketing Tools",
    description:
      "Generic platforms don\u2019t account for values alignment. Here\u2019s what\u2019s different when your brand actually stands for something.",
    date: "2026-02-25",
    category: "industry",
    readTime: "5 min read",
    content: `
      <p>The influencer marketing industry is worth over \u00a315 billion globally. But most of the tooling was built for fast fashion, supplement brands, and mass-market DTC\u2014not for brands that care about where their products come from and who represents them.</p>

      <h2>The Values Alignment Problem</h2>

      <p>When you\u2019re a sustainable brand, choosing the wrong creator isn\u2019t just a wasted campaign\u2014it\u2019s a brand risk. A creator who promotes fast fashion one week and your eco-friendly line the next undermines your entire message.</p>

      <p>Generic discovery tools sort by follower count and engagement rate. They don\u2019t filter by content history, values alignment, or audience authenticity. That leaves your team doing manual vetting\u2014scrolling through months of posts to check if a creator actually lives the values they\u2019d be promoting.</p>

      <h2>What Better Tooling Looks Like</h2>

      <p>The right platform for sustainable brands needs to understand that vetting isn\u2019t optional\u2014it\u2019s the entire point. That means:</p>

      <ul>
        <li><strong>Content history analysis</strong> \u2014 Checking past partnerships and brand associations automatically</li>
        <li><strong>Audience authenticity scoring</strong> \u2014 Filtering out inflated follower counts and bot engagement</li>
        <li><strong>Values-based matching</strong> \u2014 Surfacing creators whose content genuinely aligns with sustainability</li>
        <li><strong>Human-in-the-loop approval</strong> \u2014 AI handles the research, but you make the final call</li>
      </ul>

      <p>That\u2019s the approach we\u2019re taking with Hudey. Every recommendation is vetted, every message is approved by you, and every partnership reflects your brand\u2019s actual values.</p>
    `,
  },
  {
    slug: "5-mistakes-first-influencer-campaign",
    title: "5 Mistakes Brands Make on Their First Influencer Campaign",
    description:
      "From overpaying for reach to skipping contracts, here are the most common pitfalls and how to avoid them.",
    date: "2026-02-20",
    category: "guide",
    readTime: "6 min read",
    content: `
      <p>Your first influencer campaign is exciting\u2014and it\u2019s where most brands learn the hard way. Here are the five mistakes we see most often, and what to do instead.</p>

      <h2>1. Prioritising Follower Count Over Engagement</h2>

      <p>A creator with 500K followers and 0.5% engagement will almost always underperform one with 50K followers and 5% engagement. Micro and mid-tier creators consistently deliver better ROI because their audiences are more engaged and trusting.</p>

      <h2>2. Sending Generic Outreach</h2>

      <p>Creators receive dozens of brand pitches weekly. A templated message that could be sent to anyone will be ignored. Personalisation\u2014referencing specific content, explaining why <em>this</em> creator fits <em>your</em> brand\u2014is what gets responses.</p>

      <h2>3. Skipping the Contract</h2>

      <p>A handshake deal in the DMs isn\u2019t a contract. Without clear terms on deliverables, timelines, usage rights, and payment, you\u2019re setting yourself up for disputes. Always formalise the agreement, even for gifted collaborations.</p>

      <h2>4. Not Defining Success Metrics Upfront</h2>

      <p>If you don\u2019t know what success looks like before the campaign starts, you can\u2019t measure it afterward. Define your KPIs\u2014whether that\u2019s reach, engagement, click-throughs, or conversions\u2014and make sure your tracking is in place.</p>

      <h2>5. Trying to Manage Everything Manually</h2>

      <p>Spreadsheets and DMs don\u2019t scale. By your third campaign, you\u2019ll be drowning in threads, missed follow-ups, and scattered data. Invest in proper tooling early\u2014your future self will thank you.</p>
    `,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return posts.map((p) => p.slug);
}
