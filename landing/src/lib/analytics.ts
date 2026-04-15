/**
 * Google Analytics event tracking for the landing site.
 *
 * All public trackers are rate-limited per (event, key) so a user who
 * rapid-clicks a CTA or a section that passes in/out of view during scroll
 * doesn't spam GA with duplicate events. Same-event + same-key within the
 * dedupe window are dropped; a different key restarts the window.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// How long a given (event, key) pair stays "hot" and suppresses further sends.
// 1.5s is long enough to absorb fat-finger double clicks and short bursts of
// IntersectionObserver thrash, but short enough that a genuine second action
// still registers as one event.
const DEDUPE_WINDOW_MS = 1500;

const lastSentAt = new Map<string, number>();

function sendEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
  dedupeKey?: string,
) {
  if (typeof window === "undefined" || !window.gtag) return;

  if (dedupeKey !== undefined) {
    const cacheKey = `${name}::${dedupeKey}`;
    const now = Date.now();
    const last = lastSentAt.get(cacheKey) ?? 0;
    if (now - last < DEDUPE_WINDOW_MS) return;
    lastSentAt.set(cacheKey, now);
  }

  window.gtag("event", name, params);
}

/** Track CTA button clicks with location context. */
export function trackCTAClick(location: string) {
  sendEvent("cta_click", { location }, location);
}

/** Track when user scrolls to a specific section. */
export function trackSectionView(section: string) {
  sendEvent("section_view", { section }, section);
}
