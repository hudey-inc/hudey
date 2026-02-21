"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { getBrand, updateBrand } from "@/lib/api";
import type { Brand } from "@/lib/api";
import { INDUSTRY_OPTIONS } from "@/lib/constants";
import { HudeyLogo } from "@/components/hudey-logo";
import { Building2, Briefcase, Mail, ArrowRight, Loader2, AlertTriangle } from "lucide-react";

export default function OnboardingPage() {
  const { user, checking } = useRequireAuth();
  const router = useRouter();

  // Brand data
  const [brand, setBrand] = useState<Brand | null>(null);
  const [brandLoading, setBrandLoading] = useState(true);

  // Form fields
  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // Submit state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Inline validation
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function validateOnboardingField(name: string, value: string): string {
    switch (name) {
      case "brandName":
        if (!value.trim()) return "Brand name is required";
        if (value.trim().length < 2) return "Must be at least 2 characters";
        return "";
      case "industry":
        if (!value) return "Please select your industry";
        return "";
      case "contactEmail":
        if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return "Enter a valid email address";
        return "";
      default:
        return "";
    }
  }

  function handleOnboardingBlur(name: string, value: string) {
    setTouched((p) => ({ ...p, [name]: true }));
    const err = validateOnboardingField(name, value);
    setFieldErrors((p) => ({ ...p, [name]: err }));
  }

  function clearOnboardingFieldError(name: string) {
    if (fieldErrors[name]) setFieldErrors((p) => ({ ...p, [name]: "" }));
  }

  // ── Load brand & check if already onboarded ───────────────

  const loadBrand = useCallback(async () => {
    try {
      setBrandLoading(true);
      const b = await getBrand();
      setBrand(b);

      // Already onboarded → go to dashboard
      if (
        (b.brand_voice as Record<string, unknown>)?.onboarding_completed ===
        true
      ) {
        router.replace("/");
        return;
      }

      // Pre-fill form
      setBrandName(b.name || "");
      setIndustry(b.industry || "");
    } catch {
      // Brand fetch failed — will show empty form
    } finally {
      setBrandLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (user) {
      loadBrand();
      // Pre-fill contact email from auth user
      if (user.email) setContactEmail(user.email);
    }
  }, [user, loadBrand]);

  // ── Submit ─────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate all fields
    const fields = { brandName, industry, contactEmail };
    const errors: Record<string, string> = {};
    const allTouched: Record<string, boolean> = {};
    for (const [name, value] of Object.entries(fields)) {
      allTouched[name] = true;
      const err = validateOnboardingField(name, value);
      if (err) errors[name] = err;
    }
    setTouched(allTouched);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const currentVoice =
        (brand?.brand_voice as Record<string, unknown>) || {};
      await updateBrand({
        name: brandName.trim(),
        industry,
        contact_email: contactEmail.trim() || undefined,
        brand_voice: {
          ...currentVoice,
          onboarding_completed: true,
        },
      });
      router.replace("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  // ── Loading ────────────────────────────────────────────────

  if (checking || brandLoading) {
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
        {/* Logo + Welcome */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
            <HudeyLogo className="w-7 h-7 sm:w-8 sm:h-8" />
            <span className="font-bold text-lg sm:text-xl text-gray-900">
              Hudey
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1.5 sm:mb-2">
            Welcome to Hudey
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Let&apos;s set up your brand profile to get started
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5 sm:p-8">
          <form onSubmit={handleSubmit}>
            {/* Brand Name */}
            <div className="mb-4">
              <label
                htmlFor="brandName"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Brand Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="brandName"
                  type="text"
                  value={brandName}
                  onChange={(e) => { setBrandName(e.target.value); clearOnboardingFieldError("brandName"); }}
                  onBlur={() => handleOnboardingBlur("brandName", brandName)}
                  placeholder="Your brand name"
                  required
                  className={`w-full pl-12 pr-4 py-3 border ${touched.brandName && fieldErrors.brandName ? "border-red-300" : "border-gray-300"} rounded-xl focus:ring-2 focus:ring-[#2F4538] focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400`}
                />
              </div>
              {touched.brandName && fieldErrors.brandName && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.brandName}</p>
              )}
            </div>

            {/* Industry */}
            <div className="mb-4">
              <label
                htmlFor="industry"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Industry
              </label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  id="industry"
                  value={industry}
                  onChange={(e) => { setIndustry(e.target.value); clearOnboardingFieldError("industry"); }}
                  onBlur={() => handleOnboardingBlur("industry", industry)}
                  required
                  className={`w-full pl-12 pr-4 py-3 border ${touched.industry && fieldErrors.industry ? "border-red-300" : "border-gray-300"} rounded-xl focus:ring-2 focus:ring-[#2F4538] focus:border-transparent outline-none transition-all text-gray-900 bg-white appearance-none`}
                >
                  <option value="">Select your industry</option>
                  {INDUSTRY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {/* Dropdown arrow */}
                <svg
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              {touched.industry && fieldErrors.industry && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.industry}</p>
              )}
            </div>

            {/* Contact Email */}
            <div className="mb-6">
              <label
                htmlFor="contactEmail"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Contact Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => { setContactEmail(e.target.value); clearOnboardingFieldError("contactEmail"); }}
                  onBlur={() => handleOnboardingBlur("contactEmail", contactEmail)}
                  placeholder="contact@yourbrand.com"
                  className={`w-full pl-12 pr-4 py-3 border ${touched.contactEmail && fieldErrors.contactEmail ? "border-red-300" : "border-gray-300"} rounded-xl focus:ring-2 focus:ring-[#2F4538] focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400`}
                />
              </div>
              {touched.contactEmail && fieldErrors.contactEmail && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.contactEmail}</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm mb-4" role="alert">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#2F4538] hover:bg-[#1f2f26] disabled:bg-gray-400 text-white py-3.5 rounded-xl font-semibold text-base transition-all hover:shadow-lg hover:shadow-[#2F4538]/20 flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
