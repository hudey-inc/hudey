"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { listCampaigns, getOutreachInboxCount, getBrand } from "@/lib/api";
import type { CampaignSummary, Brand } from "@/lib/api";
import type { User } from "@supabase/supabase-js";
import {
  Home,
  Target,
  Plus,
  ChevronDown,
  LogOut,
  Mail,
  BarChart3,
  Search,
  Bell,
  Settings,
  LayoutGrid,
  Command,
  Bot,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { HudeyLogo } from "@/components/hudey-logo";

const AUTH_ROUTES = ["/login", "/signup", "/auth/callback", "/terms", "/privacy", "/refund", "/onboarding", "/verify-email"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  }, []);

  if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">{children}</div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebar} />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="max-w-[1400px] mx-auto px-4 py-6 sm:p-8">{children}</div>
      </main>
    </div>
  );
}

// ── Search Modal ────────────────────────────────────────────────

function SearchModal({
  open,
  onClose,
  campaigns,
}: {
  open: boolean;
  onClose: () => void;
  campaigns: CampaignSummary[];
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const filtered = query.trim()
    ? campaigns.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase())
      )
    : campaigns.slice(0, 5);

  function handleSelect(c: CampaignSummary) {
    onClose();
    router.push(`/campaigns/${c.short_id || c.id}`);
  }

  return (
    <div className="absolute inset-x-0 top-0 z-50 px-3 pt-3">
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search campaigns..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter" && filtered.length > 0) handleSelect(filtered[0]);
            }}
            className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
          />
          <kbd className="text-[10px] text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 font-mono">
            ESC
          </kbd>
        </div>
        <div className="max-h-[240px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              No campaigns found
            </div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelect(c)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
              >
                <Target className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900 truncate">{c.name}</p>
                  <p className="text-[11px] text-gray-400">
                    {c.short_id || c.id.slice(0, 8)}
                  </p>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                    c.status === "running"
                      ? "bg-green-100 text-green-700"
                      : c.status === "completed"
                      ? "bg-gray-100 text-gray-600"
                      : c.status === "awaiting_approval"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {c.status.replace(/_/g, " ")}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ─────────────────────────────────────────────────────

function Sidebar({ collapsed, onToggleCollapse }: { collapsed: boolean; onToggleCollapse: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showCampaignsSub, setShowCampaignsSub] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [inboxCount, setInboxCount] = useState(0);
  const [brand, setBrand] = useState<Brand | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch campaigns for search + brand for sidebar/onboarding
  useEffect(() => {
    if (user) {
      listCampaigns().then(setCampaigns).catch(() => {});
      getOutreachInboxCount().then(setInboxCount).catch(() => {});
      getBrand()
        .then((b) => {
          setBrand(b);
          // Redirect to onboarding if not completed
          const voice = b.brand_voice as Record<string, unknown> | null;
          if (!voice?.onboarding_completed) {
            router.replace("/onboarding");
          }
        })
        .catch(() => {});
    }
  }, [user, router]);

  // Global Cmd+K shortcut
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") setSearchOpen(false);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleCloseSearch = useCallback(() => setSearchOpen(false), []);

  // Close notifications on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    if (notificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [notificationsOpen]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const isHome = pathname === "/";
  const isCampaignDetail =
    pathname.startsWith("/campaigns/") && pathname !== "/campaigns/new";
  const isNewCampaign = pathname === "/campaigns/new";
  const isOutreach = pathname === "/outreach";
  const isAnalytics = pathname === "/analytics";
  const isNegotiator = pathname === "/negotiator";
  const isSettings = pathname === "/settings";

  // Memoized campaign subsets for notifications
  const awaitingCampaigns = useMemo(() => campaigns.filter((c) => c.status === "awaiting_approval"), [campaigns]);
  const runningCampaigns = useMemo(() => campaigns.filter((c) => c.status === "running"), [campaigns]);
  const awaitingCount = awaitingCampaigns.length;

  // Mobile sidebar always shows full content (not collapsed)
  const mobileSidebarContent = (
    <>
      {/* Brand */}
      <div className="p-4">
        <Link
          href="/"
          className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-lg transition-colors"
        >
          <HudeyLogo />
          <div>
            <span className="font-semibold text-sm text-gray-900">Hudey</span>
            <div className="text-[11px] text-gray-400 truncate max-w-[120px]">{brand?.name || "All Campaigns"}</div>
          </div>
        </Link>
      </div>

      {/* Create button */}
      <div className="px-4 mb-3">
        <Link
          href="/campaigns/new"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create New</span>
        </Link>
      </div>

      {/* Search bar */}
      <div className="px-4 mb-3">
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center gap-2 bg-gray-100 hover:bg-gray-200/70 rounded-lg px-3 py-1.5 text-sm text-gray-400 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="text-[10px] bg-white rounded px-1.5 py-0.5 font-mono text-gray-400 border border-gray-200">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <Link
          href="/"
          className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg mb-1 transition-colors ${
            isHome
              ? "bg-gray-100 text-gray-900 font-medium"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>

        <div className="mb-1">
          <button
            onClick={() => setShowCampaignsSub(!showCampaignsSub)}
            className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-colors ${
              isCampaignDetail || isNewCampaign
                ? "bg-gray-100 text-gray-900 font-medium"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Campaigns</span>
            <ChevronDown
              className={`w-3 h-3 ml-auto transition-transform ${
                showCampaignsSub ? "rotate-0" : "-rotate-90"
              }`}
            />
          </button>
          {showCampaignsSub && (
            <div className="ml-9 mt-1 space-y-1">
              <Link
                href="/campaigns"
                className="block w-full text-left px-3 py-1.5 text-sm rounded text-gray-500 hover:bg-gray-50 transition-colors"
              >
                All Campaigns
              </Link>
              <Link
                href="/campaigns?filter=active"
                className="block w-full text-left px-3 py-1.5 text-sm rounded text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Active
              </Link>
              <Link
                href="/campaigns?filter=completed"
                className="block w-full text-left px-3 py-1.5 text-sm rounded text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Completed
              </Link>
              <Link
                href="/campaigns?filter=draft"
                className="block w-full text-left px-3 py-1.5 text-sm rounded text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Drafts
              </Link>
            </div>
          )}
        </div>

        <Link
          href="/outreach"
          className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg mb-1 transition-colors ${
            isOutreach
              ? "bg-gray-100 text-gray-900 font-medium"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Outreach</span>
          {inboxCount > 0 && (
            <span className="ml-auto bg-red-500 text-white text-[10px] rounded-full h-4 min-w-[16px] flex items-center justify-center px-1 font-medium">
              {inboxCount}
            </span>
          )}
        </Link>

        <Link
          href="/analytics"
          className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg mb-1 transition-colors ${
            isAnalytics
              ? "bg-gray-100 text-gray-900 font-medium"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics</span>
        </Link>

        <Link
          href="/negotiator"
          className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg mb-1 transition-colors ${
            isNegotiator
              ? "bg-gray-100 text-gray-900 font-medium"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>AI Negotiator</span>
          <span className="ml-auto bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-semibold">
            NEW
          </span>
        </Link>
      </nav>

      {/* Bottom toolbar */}
      <div className="px-3 py-2 border-t border-[#ebebeb] relative">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className={`p-2 rounded-lg transition-colors ${
              isHome ? "bg-gray-100" : "hover:bg-gray-100"
            }`}
            title="Dashboard"
          >
            <LayoutGrid className={`w-4 h-4 ${isHome ? "text-gray-700" : "text-gray-400"}`} />
          </Link>
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className={`p-2 rounded-lg transition-colors relative ${
                notificationsOpen ? "bg-gray-100" : "hover:bg-gray-100"
              }`}
              title="Notifications"
            >
              <Bell className={`w-4 h-4 ${notificationsOpen ? "text-gray-700" : "text-gray-400"}`} />
              {awaitingCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>
            {notificationsOpen && (
              <div className="fixed bottom-14 left-3 w-[210px] bg-white rounded-xl border border-gray-200 shadow-xl z-[60]">
                <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-900">Notifications</p>
                  {awaitingCount > 0 && (
                    <span className="bg-red-100 text-red-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                      {awaitingCount}
                    </span>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto overscroll-contain">
                  {awaitingCampaigns.length > 0 ? (
                    awaitingCampaigns.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setNotificationsOpen(false);
                            router.push(`/campaigns/${c.short_id || c.id}`);
                          }}
                          className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                        >
                          <span className="mt-1.5 h-2 w-2 rounded-full bg-purple-500 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] text-gray-900 truncate font-medium leading-tight">{c.name}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Awaiting your approval</p>
                          </div>
                        </button>
                      ))
                  ) : runningCampaigns.length > 0 ? (
                    runningCampaigns.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setNotificationsOpen(false);
                            router.push(`/campaigns/${c.short_id || c.id}`);
                          }}
                          className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                        >
                          <span className="mt-1.5 h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] text-gray-900 truncate font-medium leading-tight">{c.name}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Campaign running</p>
                          </div>
                        </button>
                      ))
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <Bell className="w-5 h-5 text-gray-300 mx-auto mb-1.5" />
                      <p className="text-[13px] text-gray-400">All caught up</p>
                      <p className="text-[11px] text-gray-300 mt-0.5">No pending actions</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <Link
            href="/settings"
            className={`p-2 rounded-lg transition-colors ${
              isSettings ? "bg-gray-100" : "hover:bg-gray-100"
            }`}
            title="Settings"
          >
            <Settings className={`w-4 h-4 ${isSettings ? "text-gray-700" : "text-gray-400"}`} />
          </Link>
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Command (⌘K)"
          >
            <Command className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* User & settings */}
      <div className="p-4 border-t border-[#ebebeb]">
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700 flex-shrink-0">
              {(user.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-700 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        )}
      </div>

      {/* Search overlay */}
      <SearchModal
        open={searchOpen}
        onClose={handleCloseSearch}
        campaigns={campaigns}
      />
    </>
  );

  // Desktop sidebar content (collapsed-aware)
  const desktopSidebarContent = (
    <>
      {/* Brand */}
      <div className={collapsed ? "p-2 pt-4" : "p-4"}>
        <Link
          href="/"
          className={`flex items-center hover:bg-gray-100 rounded-lg transition-colors ${
            collapsed ? "justify-center p-2" : "gap-2 p-2"
          }`}
          title={collapsed ? `Hudey — ${brand?.name || "All Campaigns"}` : undefined}
        >
          <HudeyLogo />
          {!collapsed && (
            <div>
              <span className="font-semibold text-sm text-gray-900">Hudey</span>
              <div className="text-[11px] text-gray-400 truncate max-w-[120px]">{brand?.name || "All Campaigns"}</div>
            </div>
          )}
        </Link>
      </div>

      {/* Create button */}
      <div className={collapsed ? "px-2 mb-3" : "px-4 mb-3"}>
        <Link
          href="/campaigns/new"
          className={`bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center font-medium transition-colors ${
            collapsed
              ? "w-10 h-10 justify-center mx-auto"
              : "w-full px-4 py-2 gap-2 text-sm"
          }`}
          title={collapsed ? "Create New Campaign" : undefined}
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Create New</span>}
        </Link>
      </div>

      {/* Search bar */}
      <div className={collapsed ? "px-2 mb-3" : "px-4 mb-3"}>
        <button
          onClick={() => setSearchOpen(true)}
          className={`flex items-center bg-gray-100 hover:bg-gray-200/70 rounded-lg text-gray-400 transition-colors ${
            collapsed
              ? "w-10 h-8 justify-center mx-auto"
              : "w-full gap-2 px-3 py-1.5 text-sm"
          }`}
          title={collapsed ? "Search (⌘K)" : undefined}
        >
          <Search className="w-3.5 h-3.5 flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Search...</span>
              <kbd className="text-[10px] bg-white rounded px-1.5 py-0.5 font-mono text-gray-400 border border-gray-200">
                ⌘K
              </kbd>
            </>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto ${collapsed ? "px-2" : "px-3"}`}>
        <Link
          href="/"
          className={`flex items-center w-full rounded-lg mb-1 transition-colors ${
            isHome
              ? "bg-gray-100 text-gray-900 font-medium"
              : "text-gray-500 hover:bg-gray-50"
          } ${collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2 text-sm"}`}
          title={collapsed ? "Home" : undefined}
        >
          <Home className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Home</span>}
        </Link>

        <div className="mb-1">
          {collapsed ? (
            <Link
              href="/"
              className={`flex items-center justify-center w-full p-2.5 rounded-lg transition-colors ${
                isCampaignDetail || isNewCampaign
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
              title="Campaigns"
            >
              <Target className="w-4 h-4 flex-shrink-0" />
            </Link>
          ) : (
            <>
              <button
                onClick={() => setShowCampaignsSub(!showCampaignsSub)}
                className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                  isCampaignDetail || isNewCampaign
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Target className="w-4 h-4" />
                <span>Campaigns</span>
                <ChevronDown
                  className={`w-3 h-3 ml-auto transition-transform ${
                    showCampaignsSub ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </button>
              {showCampaignsSub && (
                <div className="ml-9 mt-1 space-y-1">
                  <Link
                    href="/campaigns"
                    className="block w-full text-left px-3 py-1.5 text-sm rounded text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    All Campaigns
                  </Link>
                  <Link
                    href="/campaigns?filter=active"
                    className="block w-full text-left px-3 py-1.5 text-sm rounded text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Active
                  </Link>
                  <Link
                    href="/campaigns?filter=completed"
                    className="block w-full text-left px-3 py-1.5 text-sm rounded text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Completed
                  </Link>
                  <Link
                    href="/campaigns?filter=draft"
                    className="block w-full text-left px-3 py-1.5 text-sm rounded text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Drafts
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        <Link
          href="/outreach"
          className={`flex items-center w-full rounded-lg mb-1 transition-colors relative ${
            isOutreach
              ? "bg-gray-100 text-gray-900 font-medium"
              : "text-gray-500 hover:bg-gray-50"
          } ${collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2 text-sm"}`}
          title={collapsed ? "Outreach" : undefined}
        >
          <Mail className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Outreach</span>}
          {inboxCount > 0 && (
            <span className={`bg-red-500 text-white text-[10px] rounded-full h-4 min-w-[16px] flex items-center justify-center px-1 font-medium ${
              collapsed ? "absolute -top-1 -right-1" : "ml-auto"
            }`}>
              {inboxCount}
            </span>
          )}
        </Link>

        <Link
          href="/analytics"
          className={`flex items-center w-full rounded-lg mb-1 transition-colors ${
            isAnalytics
              ? "bg-gray-100 text-gray-900 font-medium"
              : "text-gray-500 hover:bg-gray-50"
          } ${collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2 text-sm"}`}
          title={collapsed ? "Analytics" : undefined}
        >
          <BarChart3 className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Analytics</span>}
        </Link>

        <Link
          href="/negotiator"
          className={`flex items-center w-full rounded-lg mb-1 transition-colors relative ${
            isNegotiator
              ? "bg-gray-100 text-gray-900 font-medium"
              : "text-gray-500 hover:bg-gray-50"
          } ${collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2 text-sm"}`}
          title={collapsed ? "AI Negotiator" : undefined}
        >
          <Bot className="w-4 h-4 flex-shrink-0" />
          {!collapsed && (
            <>
              <span>AI Negotiator</span>
              <span className="ml-auto bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-semibold">
                NEW
              </span>
            </>
          )}
          {collapsed && (
            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-indigo-500 to-purple-500 w-2.5 h-2.5 rounded-full" />
          )}
        </Link>
      </nav>

      {/* Bottom toolbar */}
      <div className={`py-2 border-t border-[#ebebeb] relative ${collapsed ? "px-1" : "px-3"}`}>
        <div className={`flex items-center ${collapsed ? "flex-col gap-1" : "justify-between"}`}>
          <Link
            href="/"
            className={`p-2 rounded-lg transition-colors ${
              isHome ? "bg-gray-100" : "hover:bg-gray-100"
            }`}
            title="Dashboard"
          >
            <LayoutGrid className={`w-4 h-4 ${isHome ? "text-gray-700" : "text-gray-400"}`} />
          </Link>
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className={`p-2 rounded-lg transition-colors relative ${
                notificationsOpen ? "bg-gray-100" : "hover:bg-gray-100"
              }`}
              title="Notifications"
            >
              <Bell className={`w-4 h-4 ${notificationsOpen ? "text-gray-700" : "text-gray-400"}`} />
              {awaitingCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>
            {notificationsOpen && (
              <div className={`fixed bottom-14 w-[210px] bg-white rounded-xl border border-gray-200 shadow-xl z-[60] ${
                collapsed ? "left-[68px]" : "left-3"
              }`}>
                <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-900">Notifications</p>
                  {awaitingCount > 0 && (
                    <span className="bg-red-100 text-red-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                      {awaitingCount}
                    </span>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto overscroll-contain">
                  {awaitingCampaigns.length > 0 ? (
                    awaitingCampaigns.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setNotificationsOpen(false);
                            router.push(`/campaigns/${c.short_id || c.id}`);
                          }}
                          className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                        >
                          <span className="mt-1.5 h-2 w-2 rounded-full bg-purple-500 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] text-gray-900 truncate font-medium leading-tight">{c.name}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Awaiting your approval</p>
                          </div>
                        </button>
                      ))
                  ) : runningCampaigns.length > 0 ? (
                    runningCampaigns.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setNotificationsOpen(false);
                            router.push(`/campaigns/${c.short_id || c.id}`);
                          }}
                          className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                        >
                          <span className="mt-1.5 h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] text-gray-900 truncate font-medium leading-tight">{c.name}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Campaign running</p>
                          </div>
                        </button>
                      ))
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <Bell className="w-5 h-5 text-gray-300 mx-auto mb-1.5" />
                      <p className="text-[13px] text-gray-400">All caught up</p>
                      <p className="text-[11px] text-gray-300 mt-0.5">No pending actions</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <Link
            href="/settings"
            className={`p-2 rounded-lg transition-colors ${
              isSettings ? "bg-gray-100" : "hover:bg-gray-100"
            }`}
            title="Settings"
          >
            <Settings className={`w-4 h-4 ${isSettings ? "text-gray-700" : "text-gray-400"}`} />
          </Link>
          {!collapsed && (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Command (⌘K)"
            >
              <Command className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <div className={`py-2 border-t border-[#ebebeb] ${collapsed ? "px-2" : "px-3"}`}>
        <button
          onClick={onToggleCollapse}
          className={`flex items-center w-full rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 ${
            collapsed ? "justify-center p-2" : "gap-2 px-3 py-2 text-xs"
          }`}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronsRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronsLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>

      {/* User & settings */}
      <div className={`border-t border-[#ebebeb] ${collapsed ? "p-2" : "p-4"}`}>
        {user && (
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-2"}`}>
            <div
              className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700 flex-shrink-0 cursor-pointer"
              title={collapsed ? `${user.email}\nClick to sign out` : undefined}
              onClick={collapsed ? handleSignOut : undefined}
            >
              {(user.email || "U").charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 truncate">{user.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Search overlay */}
      <SearchModal
        open={searchOpen}
        onClose={handleCloseSearch}
        campaigns={campaigns}
      />
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <HudeyLogo />
          <span className="font-semibold text-sm text-gray-900">Hudey</span>
        </Link>
        <button
          onClick={() => setSearchOpen(true)}
          className="p-1.5 -mr-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Search className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Mobile search overlay */}
      {searchOpen && (
        <div className="md:hidden fixed inset-0 z-[70] bg-black/40" onClick={handleCloseSearch}>
          <div className="px-4 pt-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  autoFocus
                  onChange={(e) => {
                    const q = e.target.value;
                    void q;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") handleCloseSearch();
                  }}
                  className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
                />
                <button onClick={handleCloseSearch} className="p-1">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="max-h-[50vh] overflow-y-auto">
                {campaigns.slice(0, 8).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      handleCloseSearch();
                      router.push(`/campaigns/${c.short_id || c.id}`);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <Target className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900 truncate">{c.name}</p>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                        c.status === "running"
                          ? "bg-green-100 text-green-700"
                          : c.status === "completed"
                          ? "bg-gray-100 text-gray-600"
                          : c.status === "awaiting_approval"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {c.status.replace(/_/g, " ")}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="w-[280px] h-full bg-[#fbfbfb] border-r border-[#ebebeb] flex flex-col relative shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            {mobileSidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex bg-[#fbfbfb] border-r border-[#ebebeb] flex-col flex-shrink-0 relative transition-all duration-200 ease-in-out ${
          collapsed ? "w-[64px]" : "w-[220px]"
        }`}
      >
        {desktopSidebarContent}
      </aside>
    </>
  );
}
