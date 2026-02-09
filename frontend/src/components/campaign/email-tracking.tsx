"use client";

import { useEffect, useState } from "react";
import type { EmailDeliverySummary } from "@/lib/api";
import { getEmailEvents } from "@/lib/api";
import { Card } from "./section";

const STATUS_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  clicked: { icon: "🔗", color: "text-emerald-600", label: "Clicked" },
  opened: { icon: "👁", color: "text-green-600", label: "Opened" },
  delivered: { icon: "✓✓", color: "text-blue-600", label: "Delivered" },
  sent: { icon: "✓", color: "text-gray-400", label: "Sent" },
  bounced: { icon: "✗", color: "text-red-500", label: "Bounced" },
  complained: { icon: "⚠", color: "text-red-500", label: "Complained" },
};

function StatusIcon({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.sent;
  return (
    <span className={`text-[12px] font-mono ${cfg.color}`} title={cfg.label}>
      {cfg.icon}
    </span>
  );
}

export function EmailTracking({ campaignId }: { campaignId: string }) {
  const [data, setData] = useState<EmailDeliverySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEmailEvents(campaignId)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [campaignId]);

  if (loading) return null;
  if (!data || data.total_sent === 0) return null;

  return (
    <div className="space-y-3">
      {/* Summary stats */}
      <div className="flex items-center gap-4 text-[13px]">
        <span className="text-gray-900 font-medium">{data.total_sent} sent</span>
        {data.delivered > 0 && (
          <span className="text-blue-600">{data.delivered} delivered</span>
        )}
        {data.opened > 0 && (
          <span className="text-green-600">{data.opened} opened</span>
        )}
        {data.clicked > 0 && (
          <span className="text-emerald-600">{data.clicked} clicked</span>
        )}
        {data.bounced > 0 && (
          <span className="text-red-500">{data.bounced} bounced</span>
        )}
      </div>

      {/* Per-creator breakdown */}
      {data.per_creator.length > 0 && (
        <Card className="!p-0 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider border-b border-gray-50">
                <th className="px-4 py-2.5">Recipient</th>
                <th className="px-4 py-2.5">Creator</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.per_creator.map((c, i) => {
                const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.sent;
                return (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 text-gray-500 font-mono text-[12px]">
                      {c.recipient || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-gray-700">
                      {c.creator_id || "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1.5 ${cfg.color}`}>
                        <StatusIcon status={c.status} />
                        <span className="text-[12px]">{cfg.label}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
