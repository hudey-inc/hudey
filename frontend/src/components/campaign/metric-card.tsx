export function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "emerald" | "blue" | "amber";
}) {
  const accentBar = accent
    ? { emerald: "bg-emerald-500", blue: "bg-blue-500", amber: "bg-amber-500" }[accent]
    : "bg-stone-200";

  return (
    <div className="relative rounded-lg border border-stone-100 bg-white p-4 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentBar}`} />
      <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-semibold text-stone-900 mt-1 tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {sub && <p className="text-[11px] text-stone-400 mt-0.5">{sub}</p>}
    </div>
  );
}
