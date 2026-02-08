import { MetricCard } from "./metric-card";
import { Card } from "./section";

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

  const creatorsTotal = metrics.creators_total || result.creators_count || 0;
  const postsLive = metrics.posts_live || 0;
  const likes = metrics.likes || 0;
  const comments = metrics.comments || 0;
  const shares = metrics.shares || 0;
  const saves = metrics.saves || 0;
  const sentCount = outreachSent.sent_count || 0;

  const hasMetrics = creatorsTotal > 0 || postsLive > 0 || likes > 0;
  const hasInsights = insights.executive_summary || insights.highlights || insights.recommendations;

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
