import { ReactNode } from "react";

/** Consistent section wrapper used throughout the campaign detail page */
export function Section({
  title,
  children,
  badge,
  className = "",
}: {
  title: string;
  children: ReactNode;
  badge?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`mb-8 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">{title}</h2>
        {badge}
      </div>
      {children}
    </section>
  );
}

/** White card with subtle border — used inside sections */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-5 ${className}`}>
      {children}
    </div>
  );
}
