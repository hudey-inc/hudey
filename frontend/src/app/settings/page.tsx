"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { PageSkeleton, SkeletonPageHeader, SkeletonFormCard } from "@/components/skeleton";
import { getBrand, updateBrand, getBilling, createPortalSession } from "@/lib/api";
import type { Brand, BillingData } from "@/lib/api";
import { INDUSTRY_OPTIONS } from "@/lib/constants";
import {
  Settings,
  User,
  Bell,
  Shield,
  Building2,
  Mail,
  Briefcase,
  Calendar,
  Lock,
  LogOut,
  AlertTriangle,
  Check,
  Loader2,
  CreditCard,
  Receipt,
  ExternalLink,
  PoundSterling,
} from "lucide-react";

// ── Constants ────────────────────────────────────────────────

type TabKey = "profile" | "notifications" | "security" | "billing";

function getPasswordStrength(pw: string): { score: number; label: string; color: string; tips: string[] } {
  if (!pw) return { score: 0, label: "", color: "", tips: [] };
  let score = 0;
  const tips: string[] = [];
  if (pw.length >= 8) score++; else tips.push("At least 8 characters");
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++; else tips.push("Mix upper & lowercase");
  if (/\d/.test(pw)) score++; else tips.push("Add a number");
  if (/[^a-zA-Z0-9]/.test(pw)) score++; else tips.push("Add a special character");
  if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500", tips };
  if (score <= 2) return { score: 2, label: "Fair", color: "bg-orange-500", tips };
  if (score <= 3) return { score: 3, label: "Good", color: "bg-yellow-500", tips };
  if (score <= 4) return { score: 4, label: "Strong", color: "bg-emerald-500", tips };
  return { score: 5, label: "Very strong", color: "bg-emerald-600", tips };
}

// ── Component ────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, checking } = useRequireAuth();
  const supabase = createClient();

  // Tabs
  const [activeTab, setActiveTab] = useState<TabKey>("profile");

  // Brand data
  const [brand, setBrand] = useState<Brand | null>(null);
  const [brandLoading, setBrandLoading] = useState(true);

  // Profile form
  const [profileName, setProfileName] = useState("");
  const [profileIndustry, setProfileIndustry] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Notifications form
  const [notifApprovals, setNotifApprovals] = useState(true);
  const [notifResponses, setNotifResponses] = useState(true);
  const [notifCompletion, setNotifCompletion] = useState(true);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState(false);
  const [notifError, setNotifError] = useState("");

  // Security form
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");

  // Billing
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingLoaded, setBillingLoaded] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState("");

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // ── Load brand ──────────────────────────────────────────────

  const loadBrand = useCallback(async () => {
    try {
      setBrandLoading(true);
      const b = await getBrand();
      setBrand(b);
      setProfileName(b.name || "");
      setProfileIndustry(b.industry || "");
      setProfileEmail(b.contact_email || "");
      // Load notification preferences from brand_voice
      const prefs = (b.brand_voice as Record<string, unknown>)?.notification_preferences as Record<string, boolean> | undefined;
      if (prefs) {
        setNotifApprovals(prefs.campaign_approvals !== false);
        setNotifResponses(prefs.creator_responses !== false);
        setNotifCompletion(prefs.campaign_completion !== false);
      }
    } catch {
      // Brand not available yet
    } finally {
      setBrandLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadBrand();
  }, [user, loadBrand]);

  // ── Load billing (lazy, on tab click) ─────────────────────

  useEffect(() => {
    if (activeTab !== "billing" || billingLoaded) return;
    let cancelled = false;
    (async () => {
      setBillingLoading(true);
      try {
        const data = await getBilling();
        if (!cancelled) {
          setBilling(data);
          setBillingLoaded(true);
        }
      } catch {
        // billing not available
      } finally {
        if (!cancelled) setBillingLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeTab, billingLoaded]);

  // ── Dirty tracking ─────────────────────────────────────────

  const profileDirty =
    brand !== null &&
    (profileName !== (brand.name || "") ||
      profileIndustry !== (brand.industry || "") ||
      profileEmail !== (brand.contact_email || ""));

  const notifDirty = (() => {
    if (!brand) return false;
    const prefs = (brand.brand_voice as Record<string, unknown>)?.notification_preferences as Record<string, boolean> | undefined;
    const orig = {
      campaign_approvals: prefs?.campaign_approvals !== false,
      creator_responses: prefs?.creator_responses !== false,
      campaign_completion: prefs?.campaign_completion !== false,
    };
    return (
      notifApprovals !== orig.campaign_approvals ||
      notifResponses !== orig.creator_responses ||
      notifCompletion !== orig.campaign_completion
    );
  })();

  // ── Save profile ───────────────────────────────────────────

  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess(false);
    try {
      const updated = await updateBrand({
        name: profileName.trim(),
        industry: profileIndustry,
        contact_email: profileEmail.trim(),
      });
      setBrand(updated);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (e: unknown) {
      setProfileError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Save notifications ─────────────────────────────────────

  const saveNotifications = async () => {
    setNotifSaving(true);
    setNotifError("");
    setNotifSuccess(false);
    try {
      const currentVoice = (brand?.brand_voice as Record<string, unknown>) || {};
      const updated = await updateBrand({
        brand_voice: {
          ...currentVoice,
          notification_preferences: {
            campaign_approvals: notifApprovals,
            creator_responses: notifResponses,
            campaign_completion: notifCompletion,
          },
        },
      });
      setBrand(updated);
      setNotifSuccess(true);
      setTimeout(() => setNotifSuccess(false), 3000);
    } catch (e: unknown) {
      setNotifError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setNotifSaving(false);
    }
  };

  // ── Change password ────────────────────────────────────────

  const changePassword = async () => {
    if (newPassword.length < 8) {
      setPwError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match");
      return;
    }
    setPwSaving(true);
    setPwError("");
    setPwSuccess(false);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPwSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (e: unknown) {
      setPwError(e instanceof Error ? e.message : "Failed to update password");
    } finally {
      setPwSaving(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────

  if (checking || brandLoading) {
    return (
      <PageSkeleton>
        <SkeletonPageHeader tabs={4} />
        <div className="max-w-2xl space-y-6">
          <SkeletonFormCard fields={3} withSectionHeader />
          <SkeletonFormCard fields={3} withSectionHeader />
        </div>
      </PageSkeleton>
    );
  }

  // ── Tabs definition ────────────────────────────────────────

  const tabs: { key: TabKey; label: string; icon: typeof User }[] = [
    { key: "profile", label: "Profile", icon: User },
    { key: "billing", label: "Billing", icon: CreditCard },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "security", label: "Security", icon: Shield },
  ];

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                Settings
              </h1>
              <p className="text-gray-500 text-sm mt-1">Manage your account and preferences</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b border-gray-200 -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`pb-3 px-1 font-medium text-sm transition-colors relative flex items-center gap-2 ${
                    activeTab === tab.key
                      ? "text-[#2F4538]"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.key && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2F4538]"></div>
                  )}
                </button>
              );
            })}
          </div>
      </div>

      {/* Content */}
      <div>
        <div className="max-w-2xl">
          {/* ─── Profile Tab ─────────────────────────────── */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              {/* Brand Information — editable */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-900">Brand Information</h2>
                </div>
                <div className="p-5 space-y-5">
                  {/* Brand Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand Name
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Your brand name"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2F4538] focus:border-[#2F4538] outline-none transition-colors"
                    />
                  </div>

                  {/* Industry */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industry
                    </label>
                    <select
                      value={profileIndustry}
                      onChange={(e) => setProfileIndustry(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2F4538] focus:border-[#2F4538] outline-none transition-colors bg-white"
                    >
                      <option value="">Select an industry</option>
                      {INDUSTRY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Contact Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      placeholder="contact@yourbrand.com"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2F4538] focus:border-[#2F4538] outline-none transition-colors"
                    />
                  </div>

                  {/* Success / Error */}
                  {profileSuccess && (
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-sm" role="status">
                      <Check className="w-4 h-4" />
                      Brand profile saved
                    </div>
                  )}
                  {profileError && (
                    <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm" role="alert">
                      <AlertTriangle className="w-4 h-4" />
                      {profileError}
                    </div>
                  )}

                  {/* Save button */}
                  {profileDirty && (
                    <button
                      onClick={saveProfile}
                      disabled={profileSaving}
                      className="bg-[#2F4538] hover:bg-[#243a2d] text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {profileSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Account — read-only */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-900">Account</h2>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <label className="block text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">
                        Email
                      </label>
                      <p className="text-sm text-gray-900">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <label className="block text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">
                        Account ID
                      </label>
                      <p className="text-sm text-gray-500 font-mono text-[13px]">{user?.id}</p>
                    </div>
                  </div>
                  {brand?.created_at && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <label className="block text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">
                          Member Since
                        </label>
                        <p className="text-sm text-gray-900">
                          {new Date(brand.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── Billing Tab ─────────────────────────────── */}
          {activeTab === "billing" && (
            <div className="space-y-6">
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <PoundSterling className="w-4 h-4 text-gray-400" />
                    <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">Total Spent</span>
                  </div>
                  {billingLoading ? (
                    <div className="h-7 bg-gray-100 rounded w-20 animate-pulse mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      {"\u00A3"}{(billing?.summary.total_spent ?? 0).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Receipt className="w-4 h-4 text-gray-400" />
                    <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">Campaigns Paid</span>
                  </div>
                  {billingLoading ? (
                    <div className="h-7 bg-gray-100 rounded w-10 animate-pulse mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{billing?.summary.campaigns_paid ?? 0}</p>
                  )}
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">Last Payment</span>
                  </div>
                  {billingLoading ? (
                    <div className="h-7 bg-gray-100 rounded w-28 animate-pulse mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      {billing?.summary.last_payment_at
                        ? new Date(billing.summary.last_payment_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                        : "\u2014"}
                    </p>
                  )}
                </div>
              </div>

              {/* Payment History */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-900">Payment History</h2>
                </div>

                {billingLoading ? (
                  <div className="p-5 space-y-4 animate-pulse">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-100 rounded w-40" />
                          <div className="h-3 bg-gray-100 rounded w-24" />
                        </div>
                        <div className="h-5 bg-gray-100 rounded w-16" />
                      </div>
                    ))}
                  </div>
                ) : billing && billing.transactions.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {billing.transactions.map((txn) => (
                      <div
                        key={txn.campaign_id}
                        className="px-5 py-4 flex items-center justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{txn.campaign_name}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            {txn.paid_at && (
                              <span className="text-[13px] text-gray-500">
                                {new Date(txn.paid_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            )}
                            {txn.transaction_id && (
                              <span className="text-[11px] text-gray-400 font-mono">
                                {txn.transaction_id.length > 20 ? `${txn.transaction_id.slice(0, 20)}...` : txn.transaction_id}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 border border-green-200">
                            Paid
                          </span>
                          <span className="text-sm font-semibold text-gray-900 tabular-nums">
                            {"\u00A3"}{txn.amount.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">No payments yet</p>
                    <p className="text-[13px] text-gray-400 mt-1">Your payment history will appear here once you run your first campaign.</p>
                  </div>
                )}
              </div>

              {/* Payment method / Paddle portal */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-900">Payment Method</h2>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-500 mb-4">
                    Payments are processed securely through Paddle. You can manage your payment
                    methods, view invoices, and update billing details from the Paddle customer portal.
                  </p>
                  {portalError && (
                    <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm mb-4" role="status">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      {portalError}
                    </div>
                  )}
                  <button
                    onClick={async () => {
                      setPortalLoading(true);
                      setPortalError("");
                      try {
                        const { url } = await createPortalSession();
                        window.open(url, "_blank", "noopener,noreferrer");
                      } catch (e) {
                        setPortalError(
                          e instanceof Error && e.message.includes("No payment history")
                            ? "A billing portal link will be available after your first campaign payment."
                            : "Unable to open billing portal. Please try again or contact support@hudey.co."
                        );
                      } finally {
                        setPortalLoading(false);
                      }
                    }}
                    disabled={portalLoading}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {portalLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Opening...
                      </>
                    ) : (
                      <>
                        Manage Billing
                        <ExternalLink className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Refund info */}
              <div className="bg-[#faf9f6] rounded-xl border border-[#E8DCC8]/60 p-5">
                <p className="text-[13px] text-gray-600">
                  <span className="font-medium text-gray-700">30-day money-back guarantee.</span>{" "}
                  If you&apos;re not satisfied with a campaign, contact{" "}
                  <a href="mailto:support@hudey.co" className="text-[#2F4538] underline hover:no-underline">
                    support@hudey.co
                  </a>{" "}
                  within 30 days for a full refund. See our{" "}
                  <a href="/refund" className="text-[#2F4538] underline hover:no-underline">
                    refund policy
                  </a>{" "}
                  for details.
                </p>
              </div>
            </div>
          )}

          {/* ─── Notifications Tab ───────────────────────── */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-900">Notification Preferences</h2>
                </div>
                <div className="p-5 space-y-4">
                  {/* Campaign approvals */}
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="text-sm text-gray-900 font-medium">Campaign approvals</p>
                      <p className="text-[13px] text-gray-500 mt-0.5">Get notified when campaigns need your approval</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifApprovals}
                      onClick={() => setNotifApprovals(!notifApprovals)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        notifApprovals ? "bg-[#2F4538]" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                          notifApprovals ? "translate-x-4" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </label>

                  <div className="border-t border-gray-100" />

                  {/* Creator responses */}
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="text-sm text-gray-900 font-medium">Creator responses</p>
                      <p className="text-[13px] text-gray-500 mt-0.5">Get notified when creators respond to outreach</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifResponses}
                      onClick={() => setNotifResponses(!notifResponses)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        notifResponses ? "bg-[#2F4538]" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                          notifResponses ? "translate-x-4" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </label>

                  <div className="border-t border-gray-100" />

                  {/* Campaign completion */}
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="text-sm text-gray-900 font-medium">Campaign completion</p>
                      <p className="text-[13px] text-gray-500 mt-0.5">Get notified when campaigns finish running</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifCompletion}
                      onClick={() => setNotifCompletion(!notifCompletion)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        notifCompletion ? "bg-[#2F4538]" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                          notifCompletion ? "translate-x-4" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </label>

                  {/* Success / Error */}
                  {notifSuccess && (
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-sm" role="status">
                      <Check className="w-4 h-4" />
                      Notification preferences saved
                    </div>
                  )}
                  {notifError && (
                    <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm" role="alert">
                      <AlertTriangle className="w-4 h-4" />
                      {notifError}
                    </div>
                  )}

                  {/* Save button */}
                  {notifDirty && (
                    <button
                      onClick={saveNotifications}
                      disabled={notifSaving}
                      className="bg-[#2F4538] hover:bg-[#243a2d] text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {notifSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Preferences"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── Security Tab ────────────────────────────── */}
          {activeTab === "security" && (
            <div className="space-y-6">
              {/* Change Password */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-900">Change Password</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2F4538] focus:border-[#2F4538] outline-none transition-colors"
                    />
                    {/* Password strength meter */}
                    {newPassword && (() => {
                      const strength = getPasswordStrength(newPassword);
                      return (
                        <div className="mt-2.5 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                  key={i}
                                  className={`flex-1 rounded-full transition-colors ${
                                    i <= strength.score ? strength.color : "bg-gray-100"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className={`text-xs font-medium whitespace-nowrap ${
                              strength.score <= 1 ? "text-red-600" :
                              strength.score <= 2 ? "text-orange-600" :
                              strength.score <= 3 ? "text-yellow-600" :
                              "text-emerald-600"
                            }`}>
                              {strength.label}
                            </span>
                          </div>
                          {strength.tips.length > 0 && (
                            <p className="text-[11px] text-gray-400">
                              {strength.tips.join(" · ")}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2F4538] focus:border-[#2F4538] outline-none transition-colors"
                    />
                  </div>

                  {/* Success / Error */}
                  {pwSuccess && (
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-sm" role="status">
                      <Check className="w-4 h-4" />
                      Password updated successfully
                    </div>
                  )}
                  {pwError && (
                    <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm" role="alert">
                      <AlertTriangle className="w-4 h-4" />
                      {pwError}
                    </div>
                  )}

                  <button
                    onClick={changePassword}
                    disabled={pwSaving || !newPassword || !confirmPassword}
                    className="bg-[#2F4538] hover:bg-[#243a2d] text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {pwSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </button>
                </div>
              </div>

              {/* Sign Out */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                  <LogOut className="w-4 h-4 text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-900">Sign Out</h2>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-500 mb-4">
                    Sign out of your account on this device.
                  </p>
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      window.location.href = "/login";
                    }}
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-red-100 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <h2 className="text-sm font-semibold text-red-700">Danger Zone</h2>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-500 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    disabled
                    className="rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 opacity-50 cursor-not-allowed"
                  >
                    Delete Account — Coming soon
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
                <p className="text-sm text-gray-500">This action is permanent</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Type <span className="font-mono font-bold text-red-700">DELETE</span> to confirm account deletion.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder='Type "DELETE"'
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white opacity-50 cursor-not-allowed"
              >
                Coming soon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
