"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, ArrowRight, Check, Sparkles, Loader2 } from "lucide-react";

type AuthMode = "password" | "magic-link";
type View = "login" | "forgot" | "magic-sent" | "reset-sent";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [mode, setMode] = useState<AuthMode>("password");
  const [view, setView] = useState<View>("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/");
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setView("magic-sent");
    setLoading(false);
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setView("reset-sent");
    setLoading(false);
  }

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  // ── Email sent confirmation screens ───────────────────────
  if (view === "magic-sent" || view === "reset-sent") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-4 py-8 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-[#E8DCC8]/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-[#D16B42]/10 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5 sm:p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#2F4538] to-[#1f2f26] rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Check your email</h2>
            <p className="text-gray-600 mb-6">
              {view === "magic-sent"
                ? "We've sent a magic link to"
                : "We've sent a password reset link to"}
              <br />
              <span className="font-semibold text-gray-900">{email}</span>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {view === "magic-sent"
                ? "Click the link in the email to sign in. The link will expire in 15 minutes."
                : "Click the link to reset your password. The link will expire in 1 hour."}
            </p>
            <button
              onClick={() => {
                setView("login");
                setError("");
              }}
              className="text-[#2F4538] font-medium hover:underline text-sm"
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Forgot Password form ──────────────────────────────────
  if (view === "forgot") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-4 py-8 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-[#E8DCC8]/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-[#D16B42]/10 rounded-full blur-3xl" />
        </div>

        <Link
          href="https://hudey.co"
          className="absolute top-4 left-4 sm:top-6 sm:left-6 text-sm font-medium text-gray-600 hover:text-[#2F4538] transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="hidden sm:inline">Back to Home</span>
        </Link>

        <div className="w-full max-w-md">
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#2F4538] rounded-lg flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                H
              </div>
              <span className="font-bold text-lg sm:text-xl text-gray-900">Hudey</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1.5 sm:mb-2">Reset password</h1>
            <p className="text-sm sm:text-base text-gray-600">Enter your email and we&apos;ll send a reset link</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5 sm:p-8">
            <form onSubmit={handleForgotPassword}>
              <div className="mb-6">
                <label htmlFor="reset-email" className="block text-sm font-semibold text-gray-900 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2F4538] focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2F4538] hover:bg-[#1f2f26] disabled:bg-gray-400 text-white py-3.5 rounded-xl font-semibold text-base transition-all hover:shadow-lg hover:shadow-[#2F4538]/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Send reset link
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <button
              onClick={() => {
                setView("login");
                setError("");
              }}
              className="w-full text-center mt-4 text-sm font-medium text-[#2F4538] hover:text-[#1f2f26] transition-colors"
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Login Form ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-4 py-8 sm:p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-[#E8DCC8]/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-[#D16B42]/10 rounded-full blur-3xl" />
      </div>

      {/* Back to Home */}
      <Link
        href="https://hudey.co"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 text-sm font-medium text-gray-600 hover:text-[#2F4538] transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="hidden sm:inline">Back to Home</span>
      </Link>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#2F4538] rounded-lg flex items-center justify-center text-white text-xs sm:text-sm font-bold">
              H
            </div>
            <span className="font-bold text-lg sm:text-xl text-gray-900">Hudey</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1.5 sm:mb-2">Welcome back</h1>
          <p className="text-sm sm:text-base text-gray-600">Sign in to your account to continue</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5 sm:p-8">
          <form onSubmit={mode === "password" ? handlePasswordLogin : handleMagicLink}>
            {/* Tab Toggle */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setMode("password")}
                className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  mode === "password"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => setMode("magic-link")}
                className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  mode === "magic-link"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Magic Link
              </button>
            </div>

            {/* Email Field */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2F4538] focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Password Field */}
            {mode === "password" && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-900">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setView("forgot");
                      setError("");
                    }}
                    className="text-sm font-medium text-[#2F4538] hover:text-[#1f2f26] transition-colors"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2F4538] focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>
            )}

            {/* Remember Me (password mode only) */}
            {mode === "password" && (
              <div className="flex items-center mb-6">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[#2F4538] border-gray-300 rounded focus:ring-[#2F4538]"
                />
                <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
                  Remember me for 30 days
                </label>
              </div>
            )}

            {/* Magic Link Description */}
            {mode === "magic-link" && (
              <div className="mb-6 p-4 bg-[#E8DCC8]/30 border border-[#E8DCC8] rounded-xl">
                <p className="text-sm text-gray-700">
                  We&apos;ll send a secure login link to your email. No password needed!
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2F4538] hover:bg-[#1f2f26] disabled:bg-gray-400 text-white py-3.5 rounded-xl font-semibold text-base transition-all hover:shadow-lg hover:shadow-[#2F4538]/20 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === "magic-link" ? "Send Magic Link" : "Sign In"}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider + Google Login */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm text-gray-700 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Sign Up Link */}
        <p className="text-center mt-6 text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-[#2F4538] hover:text-[#1f2f26] transition-colors"
          >
            Sign up for free
          </Link>
        </p>

        {/* Trust Indicators */}
        <div className="mt-6 sm:mt-8 flex items-center justify-center gap-4 sm:gap-6 text-[11px] sm:text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2F4538]" />
            <span>256-bit encryption</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2F4538]" />
            <span>GDPR compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}
