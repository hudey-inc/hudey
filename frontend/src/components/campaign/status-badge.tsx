const STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  draft: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  running: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  awaiting_approval: { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
  completed: { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-500" },
  failed: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
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
