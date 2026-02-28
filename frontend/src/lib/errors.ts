/**
 * Centralized error capture utility.
 *
 * Wraps Sentry.captureException so that every catch block
 * reports errors consistently. Falls back to console.error
 * when Sentry is not configured.
 */

import * as Sentry from "@sentry/nextjs";

/**
 * Report an error to Sentry with optional context.
 *
 * Usage:
 *   } catch (err) {
 *     captureError(err, { action: "createCampaign" });
 *   }
 */
export function captureError(
  error: unknown,
  context?: Record<string, string>,
) {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, val]) => {
        scope.setTag(key, val);
      });
      scope.setLevel("error");
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }

  // Always log locally for development visibility
  if (process.env.NODE_ENV !== "production") {
    console.error("[captureError]", context?.action ?? "", error);
  }
}
