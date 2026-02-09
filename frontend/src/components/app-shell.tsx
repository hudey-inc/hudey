"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { listCampaigns } from "@/lib/api";
import type { CampaignSummary } from "@/lib/api";
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
} from "lucide-react";

const AUTH_ROUTES = ["/login", "/signup", "/auth/callback"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">{children}</div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto p-8">{children}</div>
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

function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showCampaignsSub, setShowCampaignsSub] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
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

  // Fetch campaigns for search
  useEffect(() => {
    if (user) {
      listCampaigns().then(setCampaigns).catch(() => {});
    }
  }, [user]);

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

  // Count for outreach notification badge
  const awaitingCount = campaigns.filter(
    (c) => c.status === "awaiting_approval"
  ).length;

  return (
    <aside className="w-[220px] bg-[#fbfbfb] border-r border-[#ebebeb] flex flex-col flex-shrink-0 relative">
      {/* Brand */}
      <div className="p-4">
        <Link
          href="/"
          className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-lg transition-colors"
        >
          <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center text-white text-xs font-bold">
            H
          </div>
          <div>
            <span className="font-semibold text-sm text-gray-900">Hudey</span>
            <div className="text-[11px] text-gray-400">All Campaigns</div>
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
                href="/?filter=active"
                className="block w-full text-left px-3 py-1.5 text-sm rounded text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Active
              </Link>
              <Link
                href="/?filter=completed"
                className="block w-full text-left px-3 py-1.5 text-sm rounded text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Completed
              </Link>
              <Link
                href="/?filter=draft"
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
          {awaitingCount > 0 && (
            <span className="ml-auto bg-red-500 text-white text-[10px] rounded-full h-4 min-w-[16px] flex items-center justify-center px-1 font-medium">
              {awaitingCount}
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
      <div className="px-3 py-2 border-t border-[#ebebeb]">
        <div className="flex items-center justify-between">
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Apps"
          >
            <LayoutGrid className="w-4 h-4 text-gray-400" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-gray-400" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-gray-400" />
          </button>
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
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700">
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
    </aside>
  );
}
