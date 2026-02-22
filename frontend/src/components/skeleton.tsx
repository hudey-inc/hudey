/**
 * Shared Skeleton component library.
 *
 * Provides consistent loading-state placeholders across the entire app.
 * Every primitive uses Tailwind's `animate-pulse` with `bg-gray-100`.
 */

import { type ReactNode } from "react";

// ── Base Primitive ─────────────────────────────────────────────

/** A single animated placeholder block. */
export function Skeleton({
  className = "",
}: {
  className?: string;
}) {
  return <div className={`bg-gray-100 animate-pulse ${className}`} />;
}

// ── Page Wrapper ───────────────────────────────────────────────

/** Standard page-level skeleton wrapper with consistent padding. */
export function PageSkeleton({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-4 sm:px-8 py-6 sm:py-8 max-w-7xl mx-auto animate-pulse ${className}`}>
      {children}
    </div>
  );
}

// ── Page Header ────────────────────────────────────────────────

/** Skeleton for a page header: title + subtitle + optional back button & tabs. */
export function SkeletonPageHeader({
  tabs = 0,
  backButton = false,
  actions = 0,
}: {
  tabs?: number;
  backButton?: boolean;
  actions?: number;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          {backButton && <div className="w-9 h-9 bg-gray-100 rounded-lg" />}
          <div>
            <div className="h-7 bg-gray-100 rounded w-40 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-56" />
          </div>
        </div>
        {actions > 0 && (
          <div className="flex gap-2">
            {Array.from({ length: actions }).map((_, i) => (
              <div key={i} className="h-9 bg-gray-100 rounded-lg w-24" />
            ))}
          </div>
        )}
      </div>
      {tabs > 0 && (
        <div className="flex gap-6 border-b border-gray-200 mt-4">
          {Array.from({ length: tabs }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-100 rounded w-20 mb-3" />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Stat Cards ─────────────────────────────────────────────────

/** A single stat card skeleton — icon + label + big number. */
export function SkeletonStatCard({
  withChart = false,
  withBadge = false,
}: {
  withChart?: boolean;
  withBadge?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-gray-100 rounded-lg" />
        {withBadge && <div className="w-14 h-5 bg-gray-100 rounded-full" />}
      </div>
      <div className="h-4 bg-gray-100 rounded w-24 mb-2" />
      <div className="h-8 bg-gray-100 rounded w-16 mb-1" />
      <div className="h-3 bg-gray-100 rounded w-20" />
      {withChart && <div className="h-24 bg-gray-50 rounded mt-3" />}
    </div>
  );
}

/** Grid of stat card skeletons. */
export function SkeletonStatGrid({
  count = 4,
  cols = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  withChart = false,
  withBadge = false,
}: {
  count?: number;
  cols?: string;
  withChart?: boolean;
  withBadge?: boolean;
}) {
  return (
    <div className={`grid ${cols} gap-4 sm:gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStatCard key={i} withChart={withChart} withBadge={withBadge} />
      ))}
    </div>
  );
}

// ── Simple Stat Card (compact — label + value only) ───────────

export function SkeletonStatCardCompact() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse">
      <div className="h-4 bg-gray-100 rounded w-20 mb-3" />
      <div className="h-8 bg-gray-100 rounded w-16" />
    </div>
  );
}

// ── List Row ───────────────────────────────────────────────────

/** A list item skeleton — avatar + title/subtitle + trailing badge. */
export function SkeletonListRow() {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className="w-12 h-12 bg-gray-100 rounded-lg" />
      <div className="flex-1">
        <div className="h-4 bg-gray-100 rounded w-48 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-32" />
      </div>
      <div className="w-24 h-6 bg-gray-100 rounded" />
    </div>
  );
}

/** A card wrapping multiple list row skeletons. */
export function SkeletonListCard({ rows = 4 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonListRow key={i} />
      ))}
    </div>
  );
}

// ── Form Card ──────────────────────────────────────────────────

/** A form-section card skeleton — section title + input placeholders. */
export function SkeletonFormCard({
  fields = 2,
  withSectionHeader = false,
}: {
  fields?: number;
  withSectionHeader?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {withSectionHeader && (
        <div className="px-5 py-3.5 border-b border-gray-100">
          <div className="h-4 bg-gray-100 rounded w-36" />
        </div>
      )}
      <div className="p-5 sm:p-6 space-y-4">
        {fields > 0 && <div className="h-4 bg-gray-100 rounded w-32 mb-2" />}
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i}>
            <div className="h-3 bg-gray-100 rounded w-24 mb-2" />
            <div className="h-10 bg-gray-100 rounded-lg w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Content Block ──────────────────────────────────────────────

/** A content block skeleton — heading + lines of text. */
export function SkeletonContentBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="h-5 bg-gray-100 rounded w-32 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-100 rounded w-full" />
        ))}
      </div>
    </div>
  );
}

// ── Empty Card ─────────────────────────────────────────────────

/** A plain animated card placeholder at a fixed height. */
export function SkeletonEmptyCard({
  height = "h-64",
  className = "",
}: {
  height?: string;
  className?: string;
}) {
  return (
    <div className={`${height} bg-white rounded-xl border border-gray-200 animate-pulse ${className}`} />
  );
}

// ── Card Grid (for contracts-style cards) ──────────────────────

/** Grid of detailed card skeletons with avatar, text lines, and badges. */
export function SkeletonCardGrid({
  count = 3,
  cols = "sm:grid-cols-2 lg:grid-cols-3",
}: {
  count?: number;
  cols?: string;
}) {
  return (
    <div className={`grid gap-4 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gray-100 rounded-lg" />
            <div className="flex-1">
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
            </div>
          </div>
          <div className="h-3 bg-gray-100 rounded w-full mb-2" />
          <div className="h-3 bg-gray-100 rounded w-2/3 mb-4" />
          <div className="flex gap-2 mb-4">
            {[0, 1, 2].map((j) => (
              <div key={j} className="h-5 bg-gray-100 rounded-full w-14" />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="h-3 bg-gray-100 rounded w-20" />
            <div className="h-3 bg-gray-100 rounded w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Auth Spinner ───────────────────────────────────────────────

/** Centered spinner shown during auth checks. */
export function AuthSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-5 w-5 rounded-full border-2 border-gray-200 border-t-gray-500 animate-spin" />
    </div>
  );
}
