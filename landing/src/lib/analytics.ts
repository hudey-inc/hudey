/**
 * Google Analytics event tracking for the landing site.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function sendEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", name, params);
  }
}

/** Track CTA button clicks with location context. */
export function trackCTAClick(location: string) {
  sendEvent("cta_click", { location });
}

/** Track when user scrolls to a specific section. */
export function trackSectionView(section: string) {
  sendEvent("section_view", { section });
}
