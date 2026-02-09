"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  Home,
  Target,
  Plus,
  ChevronDown,
  LogOut,
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

// ── Sidebar ─────────────────────────────────────────────────

function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showCampaignsSub, setShowCampaignsSub] = useState(true);
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

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const isHome = pathname === "/";
  const isCampaignDetail =
    pathname.startsWith("/campaigns/") && pathname !== "/campaigns/new";
  const isNewCampaign = pathname === "/campaigns/new";

  return (
    <aside className="w-[220px] bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      {/* Brand */}
      <div className="p-4">
        <Link
          href="/"
          className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded-lg transition-colors"
        >
          <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center text-white text-xs font-bold">
            H
          </div>
          <div>
            <span className="font-semibold text-sm text-gray-900">Hudey</span>
            <div className="text-[11px] text-gray-500">All Campaigns</div>
          </div>
        </Link>
      </div>

      {/* Create button */}
      <div className="px-4 mb-4">
        <Link
          href="/campaigns/new"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create New</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <Link
          href="/"
          className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg mb-1 transition-colors ${
            isHome
              ? "bg-gray-100 text-gray-900 font-medium"
              : "text-gray-600 hover:bg-gray-50"
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
                : "text-gray-600 hover:bg-gray-50"
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
                className="block w-full text-left px-3 py-1.5 text-sm rounded text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Active
              </Link>
              <Link
                href="/?filter=completed"
                className="block w-full text-left px-3 py-1.5 text-sm rounded text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Completed
              </Link>
              <Link
                href="/?filter=draft"
                className="block w-full text-left px-3 py-1.5 text-sm rounded text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Drafts
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* User & settings */}
      <div className="p-4 border-t border-gray-200">
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
    </aside>
  );
}
