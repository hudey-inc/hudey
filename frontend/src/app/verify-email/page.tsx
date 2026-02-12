"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { HudeyLogo } from "@/components/hudey-logo";
import { Mail, ArrowRight, Loader2, Check, AlertTriangle } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");

  // ── Check auth state on mount ──────────────────────────────

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error: authError }) => {
      if (authError || !data.user) {
        // No user — go to login
        router.replace("/login");
        return;
      }

      // Already verified — go to dashboard
      if (data.user.email_confirmed_at) {
        router.replace("/");
        return;
      }

      setEmail(data.user.email || "");
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Listen for auth changes (user confirms in another tab) ─

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user?.email_confirmed_at) {
        router.replace("/");
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Resend confirmation email ──────────────────────────────

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setError("");
    setResent(false);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (resendError) {
        setError(resendError.message);
      } else {
        setResent(true);
        setTimeout(() => setResent(false), 5000);
      }
    } catch {
      setError("Failed to resend email");
    } finally {
      setResending(false);
    }
  }

  // ── Loading ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="h-5 w-5 rounded-full border-2 border-gray-200 border-t-gray-500 animate-spin" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-4 py-8 sm:p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-[#E8DCC8]/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-[#D16B42]/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
            <HudeyLogo className="w-7 h-7 sm:w-8 sm:h-8" />
            <span className="font-bold text-lg sm:text-xl text-gray-900">Hudey</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5 sm:p-8 text-center">
          {/* Mail icon */}
          <div className="w-16 h-16 bg-gradient-to-br from-[#2F4538] to-[#1f2f26] rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Verify your email
          </h1>
          <p className="text-gray-600 mb-6">
            We sent a confirmation link to{" "}
            <span className="font-semibold text-gray-900">{email}</span>.
            Click the link to activate your account.
          </p>

          {/* Success banner */}
          {resent && (
            <div className="flex items-center justify-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm mb-4">
              <Check className="w-4 h-4 flex-shrink-0" />
              Confirmation email resent
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="flex items-center justify-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm mb-4">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Resend button */}
          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full bg-[#2F4538] hover:bg-[#1f2f26] disabled:bg-gray-400 text-white py-3.5 rounded-xl font-semibold text-base transition-all hover:shadow-lg hover:shadow-[#2F4538]/20 flex items-center justify-center gap-2 mb-4"
          >
            {resending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Resend confirmation email
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Back to login */}
          <Link
            href="/login"
            onClick={async () => {
              await supabase.auth.signOut();
            }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#2F4538] hover:text-[#1f2f26] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
