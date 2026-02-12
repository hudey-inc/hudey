"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { listCampaigns, getOutreachInboxCount } from "@/lib/api";
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
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

const AUTH_ROUTES = ["/login", "/signup", "/auth/callback", "/terms", "/privacy", "/refund"];

function HudeyLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`${className} bg-[#2F4538] rounded-lg flex items-center justify-center flex-shrink-0`}>
      <svg viewBox="250 280 560 500" className="w-[80%] h-[80%]" fill="white" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(283,312)">
          <path d="M511.007,379.495C506.944,395.372 506.96,395.355 498.91,409.711C494.788,417.062 485.295,428.286 480.76,430.918C475.33,434.069 470.099,444.218 440.635,451.973C415.039,458.709 386.598,450.006 382.354,446.706C380.434,445.212 375.643,445.145 369.336,439.704C368.683,439.14 341.523,424.129 331.039,391.652C325.358,374.056 326.142,373.689 326.1,268.5C326.095,255.667 328.473,254.86 317.069,232.719C305.771,210.786 300.614,204.442 298.822,202.236C295.092,197.646 296.059,197.097 292.301,192.667C274.019,171.115 272.341,172.883 265.771,166.228C258.437,158.8 241.775,148.303 247.342,148.062C257.932,147.602 325.847,149.396 325.968,146.751C327.784,106.935 320.874,83.485 334.771,55.636C341.721,41.71 342.229,42.07 350.305,32.33C358.953,21.902 360.215,23.425 370.751,14.805C371.322,14.338 386.92,6.524 389.444,6.185C393.083,5.698 449.146,-15.273 493.191,37.763C493.279,37.87 501.916,51.036 502.262,51.618C502.96,52.796 508.099,66.191 508.588,67.465C513.544,80.384 512.852,88.369 512.851,272.5C512.851,355.766 512.961,355.786 512.055,362.445C511.892,363.643 512.641,363.63 510.864,377.51C510.844,377.668 510.875,377.657 511.007,379.495L353.009,88.499C349.335,126.559 354.557,172.913 350.591,173.832C347.928,174.449 315.565,173.677 312.52,173.604C307.777,173.491 317.287,179.216 323.922,192.27C325.602,195.574 328.8,200.002 329.266,200.646C332.45,205.054 343.097,226.365 344.231,228.637C350.374,240.933 351.916,240.671 351.915,254.5C351.912,372.888 350.717,373.795 359.223,390.641C378.699,429.215 423.024,435.549 451.26,420.041C474.167,407.459 481.501,385.377 482.753,381.604C486.621,369.956 486.139,369.773 486.145,245.5C486.153,85.507 486.369,85.347 484.16,78.579C479.853,65.384 477.64,58.559 462.771,44.216C460.756,42.273 428.904,15.074 387.701,35.907C368.242,45.745 352.254,72.43 353.009,88.499L511.007,379.495Z" fillOpacity="0.99"/>
          <path d="M83.5,454.005C71.215,452.179 67.413,451.642 50.445,443.591C47.82,442.346 40.479,436.897 39.641,436.275C13.965,417.215 12.468,401.24 6.785,394.272C5.865,393.144 4.224,382.313 3.41,379.532C0.826,370.697 1.137,343.478 1.137,110.5C1.137,81.216 4.06,77.198 4.987,68.507C5.018,68.209 10.926,51.796 11.784,50.729C14.135,47.803 18.9,39.778 21.783,36.764C24.601,33.818 23.514,32.771 37.759,20.802C48.227,12.007 61.133,7.752 63.341,7.024C68.633,5.28 68.243,4.049 73.513,3.955C74.701,3.934 79.185,1.879 95.498,1.994C98.348,2.014 116.647,2.142 130.529,8.442C134.572,10.277 159.786,21.719 172.919,44.267C173.473,45.219 178.471,50.787 184.577,69.471C189.281,83.863 187.078,84.265 187.897,202.499C187.936,208.184 203.827,243.45 230.672,271.337C234.539,275.354 233.56,276.079 246.231,288.769C246.76,289.299 252.248,296.238 261.708,305.318C265.103,308.577 259.904,308.009 223.5,308.011C189.735,308.012 188.77,307.631 188.445,309.486C183.665,336.785 201.322,385.998 161.677,425.674C143.702,443.662 140.639,441.605 130.363,447.22C129.063,447.93 115.218,452.642 113.542,452.791C107.447,453.336 107.579,453.828 101.504,453.878C96.967,453.916 97.014,455.319 92.588,454.259C89.612,453.547 89.62,453.914 83.5,454.005L201.081,277.734C200.209,276.55 192.485,266.055 189.772,263.246C187.243,260.629 179.899,248.073 179.104,246.714C172.006,234.58 172.458,234.343 171.736,233.359C168.53,228.989 163.447,214.409 163.092,213.684C162.198,211.853 162.068,211.832 162.086,102.5C162.091,73.255 155.754,68.639 152.425,61.546C149.295,54.875 145.963,52.452 145.815,52.23C144.59,50.391 139.232,42.343 124.304,34.909C105.863,25.725 84.553,28.098 79.572,29.809C78.929,30.03 71.96,32.424 71.526,32.563C52.943,38.493 43.244,53.06 41.654,54.645C35.508,60.773 30.238,78.342 29.582,80.53C27.653,86.959 27.844,87.094 27.852,317.5C27.853,367.451 24.625,385.155 48.655,409.341C65.527,426.322 90.801,430.775 107.595,426.756C132.818,420.721 135.86,412.116 139.443,410.413C143.276,408.591 143.692,406.056 145.341,404.349C149.885,399.648 148.942,399.021 150.809,396.75C156.636,389.664 158.348,380.607 158.406,380.464C162.694,369.722 160.662,368.217 161.42,365.472C162.797,360.487 161.832,317.633 162.088,284.481C162.128,279.275 179.467,283.883 200.54,281.552C201.277,279.704 201.398,279.768 201.081,277.734L83.5,454.005L201.081,277.734C201.398,279.768 201.277,279.704 200.54,281.552C200.787,281.678 207.122,284.922 203.396,279.578C202.216,277.885 201.896,278.384 201.081,277.734L83.5,454.005Z" fillOpacity="0.98"/>
        </g>
      </svg>
    </div>
  );
}

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

  // Fetch campaigns for search
  useEffect(() => {
    if (user) {
      listCampaigns().then(setCampaigns).catch(() => {});
      getOutreachInboxCount().then(setInboxCount).catch(() => {});
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
          title={collapsed ? "Hudey — All Campaigns" : undefined}
        >
          <HudeyLogo />
          {!collapsed && (
            <div>
              <span className="font-semibold text-sm text-gray-900">Hudey</span>
              <div className="text-[11px] text-gray-400">All Campaigns</div>
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
