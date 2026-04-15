"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to whatever error reporting is wired up (Vercel, Sentry, etc.)
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.error("Landing error boundary caught:", error);
    }
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f3f1ea] px-6">
      <div className="max-w-md w-full text-center">
        <p className="text-sm font-medium text-[#D16B42] tracking-wide uppercase mb-4">
          Something went wrong
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl tracking-tight leading-[1.08] text-[#2F4538] mb-5">
          We hit an <em>unexpected error</em>
        </h1>
        <p className="text-gray-600 mb-8">
          This has been logged and we&apos;re on it. You can try again or head
          back to the homepage.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-xl bg-[#2F4538] text-white font-medium text-sm px-6 py-3 hover:bg-[#253629] transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-[#2F4538]/20 text-[#2F4538] font-medium text-sm px-6 py-3 hover:bg-[#2F4538]/[0.04] transition-colors"
          >
            Go home
          </Link>
        </div>
        {error.digest && (
          <p className="mt-8 text-xs text-gray-400 font-mono">
            Ref: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
