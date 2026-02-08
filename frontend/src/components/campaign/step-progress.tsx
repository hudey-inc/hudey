/** Pipeline steps in execution order */
const STEPS = [
  { key: "brief_received", label: "Brief" },
  { key: "strategy_draft", label: "Strategy" },
  { key: "creator_discovery", label: "Creators" },
  { key: "outreach_draft", label: "Outreach" },
  { key: "campaign_active", label: "Active" },
  { key: "completed", label: "Done" },
] as const;

/** Maps agent_state → the step it corresponds to (or falls under) */
const STATE_TO_STEP: Record<string, string> = {
  brief_received: "brief_received",
  strategy_draft: "strategy_draft",
  awaiting_brief_approval: "strategy_draft",
  creator_discovery: "creator_discovery",
  awaiting_creator_approval: "creator_discovery",
  outreach_draft: "outreach_draft",
  awaiting_outreach_approval: "outreach_draft",
  outreach_in_prog: "outreach_draft",
  negotiation: "outreach_draft",
  awaiting_terms_approval: "outreach_draft",
  payment_pending: "campaign_active",
  campaign_active: "campaign_active",
  completed: "completed",
};

export function StepProgress({ agentState, status }: { agentState?: string; status: string }) {
  if (status === "draft" || status === "failed") return null;

  const currentStepKey = status === "completed"
    ? "completed"
    : STATE_TO_STEP[agentState || ""] || "brief_received";

  const currentIdx = STEPS.findIndex((s) => s.key === currentStepKey);

  return (
    <div className="flex items-center gap-1 w-full">
      {STEPS.map((step, i) => {
        const isDone = i < currentIdx || status === "completed";
        const isCurrent = i === currentIdx && status !== "completed";

        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0 last:flex-none">
            {/* Step indicator */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`h-2 w-2 rounded-full flex-shrink-0 transition-colors ${
                  isDone
                    ? "bg-emerald-500"
                    : isCurrent
                    ? "bg-blue-500 ring-4 ring-blue-100"
                    : "bg-stone-200"
                }`}
              />
              <span
                className={`text-[10px] leading-none whitespace-nowrap ${
                  isDone
                    ? "text-emerald-600 font-medium"
                    : isCurrent
                    ? "text-blue-700 font-medium"
                    : "text-stone-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className={`h-px flex-1 mx-1 mt-[-10px] ${
                  i < currentIdx ? "bg-emerald-300" : "bg-stone-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
