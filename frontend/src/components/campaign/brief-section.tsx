import { Card } from "./section";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">{label}</p>
      <div className="text-[13px] text-stone-800 mt-0.5 leading-relaxed">{children}</div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function BriefSection({ brief }: { brief: Record<string, any> }) {
  return (
    <Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
        {brief.brand_name && <Field label="Brand">{String(brief.brand_name)}</Field>}
        {brief.industry && <Field label="Industry">{String(brief.industry)}</Field>}

        {brief.objective && (
          <div className="sm:col-span-2">
            <Field label="Objective">{String(brief.objective)}</Field>
          </div>
        )}
        {brief.target_audience && (
          <div className="sm:col-span-2">
            <Field label="Target Audience">{String(brief.target_audience)}</Field>
          </div>
        )}
        {brief.key_message && (
          <div className="sm:col-span-2">
            <Field label="Key Message">{String(brief.key_message)}</Field>
          </div>
        )}

        {Array.isArray(brief.platforms) && (
          <Field label="Platforms">
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(brief.platforms as string[]).map((p) => (
                <span key={p} className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600 capitalize">
                  {p}
                </span>
              ))}
            </div>
          </Field>
        )}

        {Array.isArray(brief.follower_range) && (
          <Field label="Follower Range">
            {Number(brief.follower_range[0]).toLocaleString()} – {Number(brief.follower_range[1]).toLocaleString()}
          </Field>
        )}

        {brief.budget_gbp != null && (
          <Field label="Budget">£{Number(brief.budget_gbp).toLocaleString()}</Field>
        )}
        {brief.timeline && <Field label="Timeline">{String(brief.timeline)}</Field>}

        {Array.isArray(brief.deliverables) && (
          <div className="sm:col-span-2">
            <Field label="Deliverables">
              <ul className="mt-1 space-y-0.5">
                {(brief.deliverables as string[]).map((d, i) => (
                  <li key={i}>• {d}</li>
                ))}
              </ul>
            </Field>
          </div>
        )}

        {brief.brand_voice && (
          <div className="sm:col-span-2">
            <Field label="Brand Voice">{String(brief.brand_voice)}</Field>
          </div>
        )}
      </div>
    </Card>
  );
}
