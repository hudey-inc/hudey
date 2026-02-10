"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Mail,
  Lock,
  User,
  Building,
  ArrowRight,
  Check,
  Sparkles,
  Star,
  TrendingUp,
  Loader2,
} from "lucide-react";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    company: "",
    password: "",
    acceptTerms: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/");
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGoogleSignup() {
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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: formData.fullName,
          company: formData.company,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  const benefits = [
    "AI-powered creator discovery",
    "Automated campaign management",
    "Real-time analytics dashboard",
    "24/7 email & chat support",
    "No credit card required",
  ];

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-4 py-8 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-[#E8DCC8]/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-[#D16B42]/10 rounded-full blur-3xl" />
        </div>
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5 sm:p-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#2F4538] to-[#1f2f26] rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Check your email
            </h1>
            <p className="text-gray-600 mb-6">
              We sent a confirmation link to{" "}
              <span className="font-semibold text-gray-900">{formData.email}</span>.
              Click the link to activate your account.
            </p>
            <Link
              href="/login"
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

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Left Side — Benefits (desktop only) */}
        <div className="hidden lg:block">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-[#2F4538] rounded-lg flex items-center justify-center text-white text-sm font-bold">
                H
              </div>
              <span className="font-bold text-xl text-gray-900">Hudey</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
              Start running campaigns<br />that actually convert
            </h1>
            <p className="text-lg text-gray-600">
              Join 500+ marketing teams using AI to scale their influencer programs
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-[#2F4538] rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white stroke-[3]" />
                </div>
                <span className="text-base font-medium text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Social Proof */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex -space-x-2">
                {["/testimonials/sarah.jpg", "/testimonials/marcus.jpg", "/testimonials/emma.jpg"].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="w-10 h-10 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              <div>
                <div className="flex gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#D16B42] text-[#D16B42]" />
                  ))}
                </div>
                <p className="text-sm font-semibold text-gray-900">Loved by 2,000+ users</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed italic">
              &ldquo;Hudey cut our campaign setup time from 3 weeks to 2 days. The ROI is incredible.&rdquo;
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">— Sarah M., CMO at StyleCo</span>
              <div className="inline-flex items-center gap-1 bg-[#2F4538] text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                <TrendingUp className="w-3 h-3" />
                312% ROI
              </div>
            </div>
          </div>
        </div>

        {/* Right Side — Signup Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#2F4538] rounded-lg flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                H
              </div>
              <span className="font-bold text-lg sm:text-xl text-gray-900">Hudey</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1.5 sm:mb-2">Create your account</h1>
            <p className="text-sm sm:text-base text-gray-600">Start your 14-day free trial</p>
          </div>

          <div className="hidden lg:block text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h2>
            <p className="text-gray-600">Start your 14-day free trial</p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5 sm:p-8">
            {/* Social Signup Button */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm text-gray-700 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </button>

            {/* Divider */}
            <div className="relative my-4 sm:my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-3 sm:px-4 bg-white text-gray-500">Or sign up with email</span>
              </div>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSignup}>
              {/* Full Name */}
              <div className="mb-3 sm:mb-4">
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2">
                  Full name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    className="w-full pl-11 sm:pl-12 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2F4538] focus:border-transparent outline-none transition-all text-sm sm:text-base text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="mb-3 sm:mb-4">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2">
                  Work email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@company.com"
                    required
                    className="w-full pl-11 sm:pl-12 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2F4538] focus:border-transparent outline-none transition-all text-sm sm:text-base text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Company */}
              <div className="mb-3 sm:mb-4">
                <label htmlFor="company" className="block text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2">
                  Company name
                </label>
                <div className="relative">
                  <Building className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    id="company"
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Acme Inc."
                    required
                    className="w-full pl-11 sm:pl-12 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2F4538] focus:border-transparent outline-none transition-all text-sm sm:text-base text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mb-3 sm:mb-4">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                    required
                    minLength={6}
                    className="w-full pl-11 sm:pl-12 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2F4538] focus:border-transparent outline-none transition-all text-sm sm:text-base text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">Must be at least 6 characters</p>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start mb-4 sm:mb-6">
                <input
                  id="acceptTerms"
                  name="acceptTerms"
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  required
                  className="w-4 h-4 text-[#2F4538] border-gray-300 rounded focus:ring-[#2F4538] mt-0.5"
                />
                <label htmlFor="acceptTerms" className="ml-2 text-sm text-gray-700">
                  I agree to the{" "}
                  <Link href="/terms" className="font-medium text-[#2F4538] hover:text-[#1f2f26] underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="font-medium text-[#2F4538] hover:text-[#1f2f26] underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>

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
                className="w-full bg-[#2F4538] hover:bg-[#1f2f26] disabled:bg-gray-400 text-white py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base transition-all hover:shadow-lg hover:shadow-[#2F4538]/20 flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Create account
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Trial Info */}
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-[#E8DCC8]/30 border border-[#E8DCC8] rounded-xl">
              <div className="flex items-center sm:items-start gap-2.5 sm:gap-3">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#D16B42] flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">14-day free trial included</p>
                  <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5">No credit card required. Cancel anytime.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Login Link */}
          <p className="text-center mt-4 sm:mt-6 text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#2F4538] hover:text-[#1f2f26] transition-colors"
            >
              Sign in
            </Link>
          </p>

          {/* Trust Indicators */}
          <div className="mt-4 sm:mt-6 flex items-center justify-center gap-4 sm:gap-6 text-[11px] sm:text-xs text-gray-500">
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
    </div>
  );
}
