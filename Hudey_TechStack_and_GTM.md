# Hudey: Tech Stack & Go-to-Market Strategy

*Extracted from Hudey MVP Architecture & GTM Strategy*

---

## Tech Stack Recommendation

### Backend

| Component | Technology | Why |
|-----------|------------|-----|
| Runtime | Python 3.11+ | Best LLM library support |
| Framework | FastAPI | Async-native, great for agent workloads |
| Database | PostgreSQL + Supabase | Free tier, built-in auth, real-time |
| Queue | Redis + Celery | Background agent tasks |
| LLM | Claude API (Anthropic) | Best for complex reasoning |

### Frontend

| Component | Technology | Why |
|-----------|------------|-----|
| Framework | Next.js 14 | Fast, good DX, Vercel deployment |
| Styling | Tailwind CSS | Rapid UI development |
| State | Zustand | Simple, performant |
| Auth | Supabase Auth | Integrated with backend |

### Infrastructure

| Component | Technology | Cost |
|-----------|------------|------|
| Hosting (Backend) | Railway | $5/mo + usage |
| Hosting (Frontend) | Vercel | Free tier |
| Database | Supabase | Free tier (500MB) |
| File Storage | Cloudflare R2 | Free tier (10GB) |
| Email | Instantly | $37/mo |
| Creator Data | Phyllo | Pay per call |

**Estimated Monthly Cost (MVP): £50-100/month** (excluding LLM API usage)

---

## Go-to-Market Strategy

### Target Market Definition

#### Primary ICP (Ideal Customer Profile)

**Company Profile:**
- UK-based D2C or B2C brand
- 10-50 employees (small marketing team)
- £1M-£20M annual revenue
- Already spending on influencer marketing (£5k-50k/year)
- Pain: Managing campaigns manually is time-consuming

**Buyer Persona: "Marketing Manager Maya"**
- Age: 28-38
- Title: Marketing Manager, Head of Digital, Brand Manager
- Reports to: CMO or Founder
- Budget authority: £500-5,000 per campaign
- Pain points:
  - Spending 15+ hours per campaign on manual outreach
  - Struggling to find authentic creators (not bots)
  - Can't prove ROI to leadership
  - Overwhelmed by creator management spreadsheets
- Goals:
  - Run more campaigns with same team size
  - Demonstrate measurable impact
  - Stay ahead of competitors on social

#### Vertical Focus: UK Sustainable Brands

Why this vertical:
1. **Growing market** - UK sustainability sector growing 15%+ annually
2. **Values-driven** - Care about authentic partnerships, not just reach
3. **Underserved** - Generic platforms don't understand sustainability messaging
4. **Network effects** - Sustainability brands know each other, referrals work
5. **Premium pricing** - Willing to pay more for quality

**Sub-segments to target:**
- Sustainable fashion brands (30+ in UK)
- Eco-friendly home/lifestyle brands
- Plant-based food brands
- Clean beauty brands
- Sustainable fintech (ethical banking, green investment)

---

### Competitive Positioning

#### Positioning Statement

*"For UK sustainable brands who struggle with time-consuming influencer campaign management, Hudey is an AI marketing agent that runs your entire campaign autonomously—from finding creators to reporting results—so you can launch 3x more campaigns without hiring more staff."*

#### Key Differentiators vs. Competitors

| Competitor | Their Model | Hudey Difference |
|------------|-------------|------------------|
| Aspire | Platform (you do the work) | Agent (AI does the work) |
| Modash | Database + tools | End-to-end execution |
| Heepsy | Discovery only | Full campaign lifecycle |
| Agencies | £5-15k/campaign | £750-1,500/campaign |

#### Messaging Framework

**Primary Message:**
"Your AI marketing agent that runs influencer campaigns while you sleep."

**Supporting Messages:**
1. "From brief to report in 10 days, not 10 weeks"
2. "Pay for campaigns, not seats you don't use"
3. "Built for sustainability brands who care about authentic partnerships"

**Proof Points:**
- "Our AI personally analyzes every creator's last 50 posts before recommending them"
- "Human approval at every critical decision point—AI speed, human judgment"
- "Average 3.2% engagement rate vs. industry average of 1.9%"

---

### Pricing Strategy

#### Campaign-Based Pricing (MVP Phase)

| Tier | Price | What's Included |
|------|-------|-----------------|
| Starter | £750 | 5-10 nano creators, 1 platform, basic report |
| Growth | £1,500 | 15-25 micro creators, 2 platforms, detailed report |
| Scale | £3,000 | 30-50 creators, all platforms, premium insights |

**Why campaign pricing works for MVP:**
- Lower barrier than monthly subscription
- Immediate cash flow per customer
- Forces you to deliver value each time
- Builds case studies quickly
- Easy to calculate ROI for customers

#### Future: Subscription + Usage

After 30+ successful campaigns:

| Plan | Monthly | Campaigns Included | Additional Campaigns |
|------|---------|-------------------|---------------------|
| Starter | £299/mo | 2 | £300 each |
| Pro | £599/mo | 5 | £250 each |
| Enterprise | Custom | Unlimited | - |

---

### Launch Timeline (12 Weeks)

#### Phase 1: Build (Weeks 1-4)

**Week 1:**
- Set up development environment
- Integrate Claude API
- Build campaign brief intake form
- Design database schema

**Week 2:**
- Integrate Phyllo for creator discovery
- Build agent strategy generation
- Create basic approval workflow

**Week 3:**
- Build outreach message generation
- Integrate Instantly for email
- Create response tracking

**Week 4:**
- Build campaign monitoring
- Create report generation
- Basic dashboard UI

**Deliverable:** Working MVP that can run one campaign end-to-end

---

#### Phase 2: Validate (Weeks 5-8)

**Week 5: Beta Outreach**

Target: 5 beta customers at £250 each (cost price)

**Outreach Volume:**
- 20 DMs per day
- 5 days per week
- 100 DMs total in Week 5
- Expected response rate: 10-15%
- Expected conversion to call: 30-50%
- Expected beta customers: 5-8

**Week 6-8: Run Beta Campaigns**

For each beta customer:

1. **Day 1:** Onboarding call (30 min)
2. **Day 2-3:** Agent creates strategy
3. **Day 4:** Customer approves strategy
4. **Day 5-7:** Outreach execution
5. **Day 8-10:** Campaign execution
6. **Day 11-12:** Reporting

**Track Everything:**
- Time spent per campaign
- Approval turnaround times
- Creator response rates
- Campaign performance metrics
- Customer satisfaction (NPS)

---

#### Phase 3: Launch (Weeks 9-12)

**Week 9:** Case Study Creation (3 detailed case studies from beta)

**Week 10:** Content Marketing Launch — LinkedIn 3x/week (Educational, Case Study, Behind-the-scenes)

**Week 11:** Outbound at Full Price (£750-1,500 per campaign)

**Week 12:** Optimize & Scale
- By now: 5 beta + 3-5 paid campaigns, 3+ case studies, 10-15 warm leads

---

### Customer Acquisition Channels

#### Channel Priority (MVP Phase)

| Channel | Effort | Cost | Expected CAC |
|---------|--------|------|--------------|
| LinkedIn DM | High | Free | £50-100 |
| LinkedIn Content | Medium | Free | £100-200 |
| Cold Email | Medium | £37/mo | £100-150 |
| Referrals | Low | Free | £0-50 |
| Paid Ads | Low | £500+/mo | £200-400 |

**Focus 80% effort on:**
1. LinkedIn DM outreach (direct, personal, free)
2. LinkedIn content (builds authority, compounds)
3. Referrals (after first 5 customers)

---

### Partnership Strategy

#### Creator Communities
1. **The Creator Union** - UK creator advocacy group
2. **Sustainable Influencers UK** - Niche community
3. **SHOUT by UniTaskr** - Largest UK nano/micro agency

#### Sustainability Networks
1. **Sustainable Brands UK**
2. **Fashion Revolution**
3. **B Corp UK**

---

### Metrics to Track

#### Target Metrics (End of Week 12)

| Metric | Target |
|--------|--------|
| Campaigns completed | 10+ |
| Revenue | £8,000+ |
| Gross margin | 60%+ |
| NPS | 50+ |
| Referral rate | 20%+ |
| Average campaign duration | <14 days |

---

### Sales Process

#### Discovery Call Script (15 min)
- **Opening (2 min):** Understand their current influencer marketing
- **Pain Discovery (5 min):** Time, difficulty, measurement challenges
- **Demo/Explanation (5 min):** Show agent workflow, time savings, sample report
- **Close (3 min):** Trial offer with 10-hour savings guarantee

#### Objection Handling
- **"Too expensive"** → Compare to team hourly cost + agency rates (£5-15k)
- **"Want control"** → Approval system at every major decision point
- **"Tried tools before"** → Hudey executes, not just organises; money-back guarantee
- **"Need boss approval"** → Offer one-pager + joint call

---

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| LLM costs spike | Set daily budget caps, optimize prompts |
| Low creator response rates | A/B test messages, improve personalization |
| Customers churn after one campaign | Focus on results, build habit, ask for feedback |
| Competitors copy approach | Move fast, build relationship moat, accumulate data |
| Platform API changes | Monitor API status, have backup data sources |

---

## Summary: Your First 90 Days

**Days 1-30:** Build MVP — Core agent, creator discovery, outreach, basic dashboard

**Days 31-60:** Validate — 5 beta customers at £250, run 5 campaigns, create 3 case studies

**Days 61-90:** Launch — Full price £750-1,500, 5-10 paid customers, £8k+ revenue, referral engine starting

**Success Criteria for Day 90:**
- [ ] 10+ campaigns completed
- [ ] £8,000+ revenue
- [ ] 3+ written case studies
- [ ] NPS > 50
- [ ] Clear path to £30k/month within 6 months

---

## Resource Links

**LLM APIs:**
- Anthropic Claude: https://docs.anthropic.com
- OpenAI: https://platform.openai.com

**Creator Data:**
- Phyllo: https://www.getphyllo.com
- Modash API: https://www.modash.io/api

**Email Infrastructure:**
- Instantly: https://instantly.ai
- Resend: https://resend.com

**Hosting:**
- Railway: https://railway.app
- Vercel: https://vercel.com
- Supabase: https://supabase.com

**UK Sustainability Brands to Target:**
- https://www.wearethebrightside.co.uk (sustainable brand directory)
- https://bcorporation.uk/directory (B Corp UK directory)
