const STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  draft: { bg: "bg-stone-100", text: "text-stone-600", dot: "bg-stone-400" },
  running: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  awaiting_approval: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  completed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  failed: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STYLES[status] || STYLES.draft;
  const label = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const pulse = status === "running" || status === "awaiting_approval";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot} ${pulse ? "animate-pulse" : ""}`} />
      {label}
    </span>
  );
}
