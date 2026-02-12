import { MetricCard } from "./metric-card";
import { Card } from "./section";
import { ShoppingCart, MessageCircle, TrendingUp, Users } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function InsightList({ items, color }: { items: string[]; color: "emerald" | "amber" | "stone" | "blue" }) {
  const dot = {
    emerald: "bg-emerald-400",
    amber: "bg-amber-400",
    stone: "bg-stone-300",
    blue: "bg-blue-400",
  }[color];

  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-stone-700">
          <span className={`mt-[7px] h-1.5 w-1.5 rounded-full ${dot} flex-shrink-0`} />
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Score ring with color coding. */
function ScoreRing({ score, label, size = "md" }: { score: number; label: string; size?: "sm" | "md" }) {
  const color =
    score >= 70 ? "text-emerald-600" : score >= 40 ? "text-amber-600" : "text-red-500";
  const ringColor =
    score >= 70 ? "border-emerald-200 bg-emerald-50" : score >= 40 ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50";
  const sz = size === "sm" ? "w-14 h-14" : "w-20 h-20";
  const textSz = size === "sm" ? "text-lg" : "text-2xl";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`${sz} rounded-full border-2 ${ringColor} flex items-center justify-center`}>
        <span className={`${textSz} font-bold ${color}`}>{Math.round(score)}</span>
      </div>
      <span className="text-[10px] font-medium text-stone-400 uppercase tracking-wider text-center">{label}</span>
    </div>
  );
}

/** Small horizontal bar for sentiment or distribution. */
function SentimentBar({ positive, neutral, negative }: { positive: number; neutral: number; negative: number }) {
  const total = positive + neutral + negative;
  if (total === 0) return null;
  const pPct = (positive / total) * 100;
  const nPct = (neutral / total) * 100;
  const negPct = (negative / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex h-2.5 rounded-full overflow-hidden bg-stone-100">
        {pPct > 0 && <div className="bg-emerald-400 transition-all" style={{ width: `${pPct}%` }} />}
        {nPct > 0 && <div className="bg-stone-300 transition-all" style={{ width: `${nPct}%` }} />}
        {negPct > 0 && <div className="bg-red-400 transition-all" style={{ width: `${negPct}%` }} />}
      </div>
      <div className="flex justify-between text-[11px] text-stone-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Positive {Math.round(pPct)}%</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-stone-300 inline-block" /> Neutral {Math.round(nPct)}%</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Negative {Math.round(negPct)}%</span>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CampaignReport({ result }: { result: Record<string, any> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const report = (result.report || result) as Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metrics = (report.metrics || result.metrics || {}) as Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insights = (report.insights || result.insights || {}) as Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const outreachSent = (result.outreach_sent || {}) as Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const campaignInsights = (report.campaign_insights || result.campaign_insights || {}) as Record<string, any>;

  const creatorsTotal = metrics.creators_total || result.creators_count || 0;
  const postsLive = metrics.posts_live || 0;
  const likes = metrics.likes || 0;
  const comments = metrics.comments || 0;
  const shares = metrics.shares || 0;
  const saves = metrics.saves || 0;
  const sentCount = outreachSent.sent_count || 0;

  const hasMetrics = creatorsTotal > 0 || postsLive > 0 || likes > 0;
  const hasInsights = insights.executive_summary || insights.highlights || insights.recommendations;

  // Campaign insights data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const purchaseIntent = (campaignInsights.purchase_intent || {}) as Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const commentsRelevance = (campaignInsights.comments_relevance || {}) as Record<string, any>;
  const postsAnalyzed = campaignInsights.posts_analyzed || 0;
  const hasCampaignInsights = postsAnalyzed > 0 && (purchaseIntent.avg_score != null || commentsRelevance.avg_relevance_pct != null);

  // AI-generated summaries from insights
  const purchaseIntentSummary = insights.purchase_intent_summary;
  const commentsRelevanceSummary = insights.comments_relevance_summary;

  return (
    <div className="space-y-6">
      {/* ── Metrics ── */}
      {hasMetrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard label="Creators" value={creatorsTotal} accent="blue" />
          <MetricCard
            label="Posts Live"
            value={postsLive}
            sub={creatorsTotal > 0 ? `${Math.round((postsLive / creatorsTotal) * 100)}% posted` : undefined}
            accent="emerald"
          />
          <MetricCard label="Likes" value={likes} />
          <MetricCard label="Comments" value={comments} />
          <MetricCard label="Shares" value={shares} />
          <MetricCard label="Saves" value={saves} />
        </div>
      )}

      {/* ── Campaign Insights (Purchase Intent + Comments Relevance) ── */}
      {hasCampaignInsights && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-[#2F4538]" />
            <h3 className="text-base font-bold text-stone-900">Audience Insights</h3>
            <span className="text-[11px] text-stone-400 ml-1">{postsAnalyzed} posts analyzed</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Purchase Intent Card */}
            {purchaseIntent.avg_score != null && (
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-900">Purchase Intent</p>
                    <p className="text-[11px] text-stone-400">Buying interest from comments</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 mb-4">
                  <ScoreRing score={Number(purchaseIntent.avg_score)} label="Avg Score" />
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">Intent comments</span>
                      <span className="font-semibold text-stone-900">{purchaseIntent.total_intent_comments || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">Total analyzed</span>
                      <span className="font-semibold text-stone-900">{purchaseIntent.total_comments_analyzed || 0}</span>
                    </div>
                    {purchaseIntent.total_comments_analyzed > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-500">Intent rate</span>
                        <span className="font-semibold text-purple-600">
                          {Math.round(((purchaseIntent.total_intent_comments || 0) / purchaseIntent.total_comments_analyzed) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Per-creator breakdown */}
                {Array.isArray(purchaseIntent.by_creator) && purchaseIntent.by_creator.length > 0 && (
                  <div className="border-t border-stone-100 pt-3 mt-3">
                    <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-2">By Creator</p>
                    <div className="space-y-1.5">
                      {(purchaseIntent.by_creator as { username: string; avg_score: number; posts: number }[]).map((c) => (
                        <div key={c.username} className="flex items-center justify-between text-[13px]">
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-stone-300" />
                            <span className="text-stone-700">@{c.username}</span>
                            <span className="text-[10px] text-stone-400">{c.posts} post{c.posts !== 1 ? "s" : ""}</span>
                          </div>
                          <span className={`font-semibold ${
                            c.avg_score >= 70 ? "text-emerald-600" : c.avg_score >= 40 ? "text-amber-600" : "text-red-500"
                          }`}>
                            {Math.round(c.avg_score)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Summary */}
                {purchaseIntentSummary && String(purchaseIntentSummary) !== "" && (
                  <div className="border-t border-stone-100 pt-3 mt-3">
                    <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-1.5">AI Summary</p>
                    <p className="text-[13px] text-stone-600 leading-relaxed">{String(purchaseIntentSummary)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Comments Relevance Card */}
            {commentsRelevance.avg_relevance_pct != null && (
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-900">Comments Relevance</p>
                    <p className="text-[11px] text-stone-400">Product-related engagement</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 mb-4">
                  <ScoreRing score={Number(commentsRelevance.avg_relevance_pct)} label="Relevance" />
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">Relevant comments</span>
                      <span className="font-semibold text-stone-900">{commentsRelevance.total_relevant || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">Total analyzed</span>
                      <span className="font-semibold text-stone-900">{commentsRelevance.total_analyzed || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Sentiment breakdown */}
                {commentsRelevance.sentiment && (
                  <div className="mb-4">
                    <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-2">Sentiment</p>
                    <SentimentBar
                      positive={commentsRelevance.sentiment.positive || 0}
                      neutral={commentsRelevance.sentiment.neutral || 0}
                      negative={commentsRelevance.sentiment.negative || 0}
                    />
                  </div>
                )}

                {/* Per-creator breakdown */}
                {Array.isArray(commentsRelevance.by_creator) && commentsRelevance.by_creator.length > 0 && (
                  <div className="border-t border-stone-100 pt-3 mt-3">
                    <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-2">By Creator</p>
                    <div className="space-y-1.5">
                      {(commentsRelevance.by_creator as { username: string; avg_relevance_pct: number; posts: number }[]).map((c) => (
                        <div key={c.username} className="flex items-center justify-between text-[13px]">
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-stone-300" />
                            <span className="text-stone-700">@{c.username}</span>
                            <span className="text-[10px] text-stone-400">{c.posts} post{c.posts !== 1 ? "s" : ""}</span>
                          </div>
                          <span className={`font-semibold ${
                            c.avg_relevance_pct >= 70 ? "text-emerald-600" : c.avg_relevance_pct >= 40 ? "text-amber-600" : "text-red-500"
                          }`}>
                            {Math.round(c.avg_relevance_pct)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Summary */}
                {commentsRelevanceSummary && String(commentsRelevanceSummary) !== "" && (
                  <div className="border-t border-stone-100 pt-3 mt-3">
                    <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-1.5">AI Summary</p>
                    <p className="text-[13px] text-stone-600 leading-relaxed">{String(commentsRelevanceSummary)}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Outreach ── */}
      {sentCount > 0 && (
        <Card>
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-1">Outreach</p>
              <p className="text-lg font-semibold text-stone-900">{sentCount} emails sent</p>
            </div>
            <div className="flex items-center gap-2">
              {outreachSent.skipped_count > 0 && (
                <span className="text-xs text-stone-400">{outreachSent.skipped_count} skipped</span>
              )}
              {outreachSent.simulated && (
                <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                  Simulated
                </span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ── Insights ── */}
      {hasInsights && (
        <div className="space-y-4">
          {/* Executive Summary */}
          {Array.isArray(insights.executive_summary) && insights.executive_summary.length > 0 && (
            <Card>
              <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-3">Executive Summary</p>
              <InsightList items={insights.executive_summary as string[]} color="stone" />
            </Card>
          )}

          {/* Highlights + Improvements side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.isArray(insights.highlights) && insights.highlights.length > 0 && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-5">
                <p className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider mb-3">What Worked</p>
                <InsightList items={insights.highlights as string[]} color="emerald" />
              </div>
            )}
            {Array.isArray(insights.improvements) && insights.improvements.length > 0 && (
              <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-5">
                <p className="text-[11px] font-medium text-amber-600 uppercase tracking-wider mb-3">To Improve</p>
                <InsightList items={insights.improvements as string[]} color="amber" />
              </div>
            )}
          </div>

          {/* ROI */}
          {insights.roi && String(insights.roi) !== "N/A" && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-5">
              <p className="text-[11px] font-medium text-blue-600 uppercase tracking-wider mb-2">ROI / Impact</p>
              <p className="text-[13px] text-stone-800 leading-relaxed">{String(insights.roi)}</p>
            </div>
          )}

          {/* Recommendations */}
          {Array.isArray(insights.recommendations) && insights.recommendations.length > 0 && (
            <Card>
              <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-3">Recommendations</p>
              <ol className="space-y-2.5">
                {(insights.recommendations as string[]).map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[13px] leading-relaxed text-stone-700">
                    <span className="flex-shrink-0 h-5 w-5 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-semibold text-stone-500 mt-0.5">
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
