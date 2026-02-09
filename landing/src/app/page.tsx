import Link from "next/link";

const APP_URL = "https://app.hudey.co";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gray-900 rounded flex items-center justify-center text-white text-xs font-bold">
            H
          </div>
          <span className="font-semibold text-lg text-gray-900">Hudey</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href={`${APP_URL}/login`}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Log in
          </Link>
          <Link
            href={`${APP_URL}/signup`}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight tracking-tight">
            Influencer marketing,
            <br />
            powered by AI
          </h1>
          <p className="mt-6 text-lg text-gray-500 max-w-lg mx-auto leading-relaxed">
            Automate creator discovery, outreach, negotiation, and campaign tracking.
            Launch campaigns in minutes, not weeks.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href={`${APP_URL}/signup`}
              className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              Start for free
            </Link>
            <Link
              href={`${APP_URL}/login`}
              className="rounded-lg border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Hudey Inc.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/terms" className="hover:text-gray-600 transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">
              Privacy
            </Link>
            <Link href="/refund" className="hover:text-gray-600 transition-colors">
              Refund Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
