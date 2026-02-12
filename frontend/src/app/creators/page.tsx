"use client";

import { useState, useCallback } from "react";
import {
  Search,
  Heart,
  MapPin,
  Users,
  Instagram,
  Youtube,
  Globe,
  Loader2,
  Sparkles,
} from "lucide-react";
import type { DiscoveredCreator, CreatorSearchParams } from "@/lib/api";
import { searchCreators, getSavedCreators, saveCreator, unsaveCreator } from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";

// ── Constants ────────────────────────────────────────────────

type TabKey = "search" | "saved";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", color: "bg-gradient-to-br from-purple-500 to-pink-500" },
  { id: "tiktok", label: "TikTok", color: "bg-black" },
  { id: "youtube", label: "YouTube", color: "bg-red-600" },
  { id: "x", label: "X / Twitter", color: "bg-gray-900" },
];

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram className="w-3.5 h-3.5" />,
  youtube: <Youtube className="w-3.5 h-3.5" />,
};

// ── Helpers ──────────────────────────────────────────────────

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}

function platformIcon(platform: string) {
  return PLATFORM_ICONS[platform.toLowerCase()] || <Globe className="w-3.5 h-3.5" />;
}

function platformColor(platform: string): string {
  const p = platform.toLowerCase();
  if (p === "instagram") return "bg-gradient-to-br from-purple-500 to-pink-500 text-white";
  if (p === "tiktok") return "bg-black text-white";
  if (p === "youtube") return "bg-red-600 text-white";
  if (p === "x" || p === "twitter") return "bg-gray-900 text-white";
  return "bg-gray-500 text-white";
}

// ── Creator Avatar ───────────────────────────────────────────

function CreatorAvatar({ creator }: { creator: DiscoveredCreator }) {
  const [imgError, setImgError] = useState(false);
  const initial = (creator.display_name || creator.username).charAt(0).toUpperCase();

  if (creator.image_url && !imgError) {
    return (
      <div className="w-14 h-14 rounded-full mx-auto mb-3 overflow-hidden bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={creator.image_url}
          alt={creator.display_name || creator.username}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#2F4538] to-[#1f2f26] flex items-center justify-center text-white text-lg font-bold mx-auto mb-3">
      {initial}
    </div>
  );
}

// ── Creator Card ─────────────────────────────────────────────

function CreatorCard({
  creator,
  onToggleSave,
  saving,
}: {
  creator: DiscoveredCreator;
  onToggleSave: (id: string, saved: boolean) => void;
  saving: string | null;
}) {
  const isSaving = saving === creator.id;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all group relative">
      {/* Platform badge */}
      <div
        className={`absolute top-4 right-4 rounded-full p-1.5 ${platformColor(creator.platform)}`}
      >
        {platformIcon(creator.platform)}
      </div>

      {/* Save toggle */}
      <button
        onClick={() => onToggleSave(creator.id, creator.is_saved)}
        disabled={isSaving}
        className="absolute top-4 left-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
        title={creator.is_saved ? "Remove from saved" : "Save creator"}
      >
        <Heart
          className={`w-4 h-4 transition-colors ${
            creator.is_saved
              ? "fill-red-500 text-red-500"
              : "text-gray-300 group-hover:text-gray-400"
          }`}
        />
      </button>

      {/* Avatar */}
      <CreatorAvatar creator={creator} />

      {/* Name */}
      <div className="text-center mb-3">
        <p className="font-semibold text-gray-900 text-sm truncate">
          {creator.display_name || creator.username}
        </p>
        <p className="text-xs text-gray-400 truncate">@{creator.username}</p>
      </div>

      {/* Metrics */}
      <div className="flex items-center justify-center gap-4 mb-3">
        <div className="text-center">
          <p className="text-sm font-bold text-gray-900">
            {formatFollowers(creator.follower_count)}
          </p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Followers</p>
        </div>
        {creator.engagement_rate != null && (
          <div className="text-center">
            <p className="text-sm font-bold text-gray-900">
              {(creator.engagement_rate * 100).toFixed(1)}%
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Engagement</p>
          </div>
        )}
        {creator.brand_fit_score != null && (
          <div className="text-center">
            <p className={`text-sm font-bold ${
              creator.brand_fit_score >= 70 ? "text-emerald-600" :
              creator.brand_fit_score >= 40 ? "text-amber-600" : "text-red-500"
            }`}>
              {Math.round(creator.brand_fit_score)}
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Brand Fit</p>
          </div>
        )}
      </div>

      {/* Location */}
      {creator.location && (
        <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-2">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{creator.location}</span>
        </div>
      )}

      {/* Categories */}
      {creator.categories.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1">
          {creator.categories.slice(0, 3).map((cat, i) => (
            <span
              key={i}
              className="px-2 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded-full"
            >
              {cat}
            </span>
          ))}
          {creator.categories.length > 3 && (
            <span className="px-2 py-0.5 text-[10px] bg-gray-100 text-gray-400 rounded-full">
              +{creator.categories.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="w-14 h-14 rounded-full bg-gray-100 mx-auto mb-3" />
      <div className="h-4 bg-gray-100 rounded w-24 mx-auto mb-1" />
      <div className="h-3 bg-gray-100 rounded w-16 mx-auto mb-3" />
      <div className="flex justify-center gap-4 mb-3">
        <div className="h-6 bg-gray-100 rounded w-12" />
        <div className="h-6 bg-gray-100 rounded w-12" />
      </div>
      <div className="flex justify-center gap-1">
        <div className="h-4 bg-gray-100 rounded-full w-14" />
        <div className="h-4 bg-gray-100 rounded-full w-14" />
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────

export default function CreatorsPage() {
  const { checking } = useRequireAuth();

  // Tabs
  const [tab, setTab] = useState<TabKey>("search");

  // Search form state
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram"]);
  const [followerMin, setFollowerMin] = useState("10000");
  const [followerMax, setFollowerMax] = useState("500000");
  const [categories, setCategories] = useState("");
  const [locations, setLocations] = useState("");

  // Data state
  const [results, setResults] = useState<DiscoveredCreator[]>([]);
  const [savedCreators, setSavedCreators] = useState<DiscoveredCreator[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSearch = useCallback(async () => {
    if (selectedPlatforms.length === 0) return;
    setSearching(true);
    setError(null);
    setNotConfigured(false);
    try {
      const params: CreatorSearchParams = {
        platforms: selectedPlatforms,
        follower_min: parseInt(followerMin) || 1000,
        follower_max: parseInt(followerMax) || 1_000_000,
      };
      const cats = categories
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (cats.length > 0) params.categories = cats;
      const locs = locations
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (locs.length > 0) params.locations = locs;

      const data = await searchCreators(params);
      setResults(data.creators);
      setHasSearched(true);
      if (!data.configured) setNotConfigured(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }, [selectedPlatforms, followerMin, followerMax, categories, locations]);

  const loadSaved = useCallback(async () => {
    setLoadingSaved(true);
    try {
      const data = await getSavedCreators();
      setSavedCreators(data);
    } catch {
      // silent
    } finally {
      setLoadingSaved(false);
    }
  }, []);

  const handleTabChange = (t: TabKey) => {
    setTab(t);
    if (t === "saved") loadSaved();
  };

  const handleToggleSave = useCallback(
    async (creatorId: string, currentlySaved: boolean) => {
      setSavingId(creatorId);
      try {
        if (currentlySaved) {
          await unsaveCreator(creatorId);
        } else {
          await saveCreator(creatorId);
        }
        // Optimistically update both lists
        setResults((prev) =>
          prev.map((c) => (c.id === creatorId ? { ...c, is_saved: !currentlySaved } : c))
        );
        setSavedCreators((prev) =>
          currentlySaved
            ? prev.filter((c) => c.id !== creatorId)
            : prev // will be refreshed on tab switch
        );
      } catch {
        // silent
      } finally {
        setSavingId(null);
      }
    },
    []
  );

  if (checking) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 rounded-full border-2 border-gray-200 border-t-gray-500 animate-spin" />
      </div>
    );
  }

  const savedCount = savedCreators.length;

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Creator Discovery</h1>
          <p className="text-sm text-gray-500 mt-1">
            Search 250M+ creators across Instagram, TikTok, YouTube, and more
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        <button
          onClick={() => handleTabChange("search")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === "search"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Search
        </button>
        <button
          onClick={() => handleTabChange("saved")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
            tab === "saved"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Saved
          {savedCount > 0 && (
            <span className="bg-red-100 text-red-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">
              {savedCount}
            </span>
          )}
        </button>
      </div>

      {/* Search Tab */}
      {tab === "search" && (
        <>
          {/* Search Form */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            {/* Platforms */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Platforms
              </label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedPlatforms.includes(p.id)
                        ? `${p.color} text-white shadow-sm`
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filters row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  Min Followers
                </label>
                <input
                  type="number"
                  value={followerMin}
                  onChange={(e) => setFollowerMin(e.target.value)}
                  placeholder="10,000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2F4538]/20 focus:border-[#2F4538]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  Max Followers
                </label>
                <input
                  type="number"
                  value={followerMax}
                  onChange={(e) => setFollowerMax(e.target.value)}
                  placeholder="500,000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2F4538]/20 focus:border-[#2F4538]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  Categories
                </label>
                <input
                  type="text"
                  value={categories}
                  onChange={(e) => setCategories(e.target.value)}
                  placeholder="fashion, beauty, fitness"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2F4538]/20 focus:border-[#2F4538]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  value={locations}
                  onChange={(e) => setLocations(e.target.value)}
                  placeholder="UK, US, Germany"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2F4538]/20 focus:border-[#2F4538]"
                />
              </div>
            </div>

            {/* Search button */}
            <button
              onClick={handleSearch}
              disabled={searching || selectedPlatforms.length === 0}
              className="px-5 py-2.5 bg-[#2F4538] hover:bg-[#1f2f26] text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {searching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {searching ? "Searching..." : "Search Creators"}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Not configured */}
          {notConfigured && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center mb-6">
              <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">InsightIQ Not Configured</h3>
              <p className="text-sm text-gray-600">
                Add your <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">PHYLLO_API_KEY</code> to the
                environment to search 250M+ real creator profiles.
              </p>
            </div>
          )}

          {/* Loading */}
          {searching && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Results */}
          {!searching && hasSearched && results.length > 0 && (
            <>
              <p className="text-sm text-gray-500 mb-4">
                {results.length} creator{results.length !== 1 ? "s" : ""} found
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((creator) => (
                  <CreatorCard
                    key={creator.id}
                    creator={creator}
                    onToggleSave={handleToggleSave}
                    saving={savingId}
                  />
                ))}
              </div>
            </>
          )}

          {/* No results */}
          {!searching && hasSearched && results.length === 0 && !notConfigured && (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-700 mb-1">No creators found</h3>
              <p className="text-sm text-gray-500">
                Try adjusting your filters or broadening your search criteria.
              </p>
            </div>
          )}

          {/* Empty state (no search yet) */}
          {!searching && !hasSearched && !notConfigured && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-[#2F4538]/10 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-[#2F4538]" />
              </div>
              <h3 className="font-semibold text-gray-700 mb-1">Find your perfect creators</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Search across Instagram, TikTok, YouTube, and more. Filter by followers,
                engagement, location, and categories to find the right match for your brand.
              </p>
            </div>
          )}
        </>
      )}

      {/* Saved Tab */}
      {tab === "saved" && (
        <>
          {loadingSaved && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          )}

          {!loadingSaved && savedCreators.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedCreators.map((creator) => (
                <CreatorCard
                  key={creator.id}
                  creator={creator}
                  onToggleSave={handleToggleSave}
                  saving={savingId}
                />
              ))}
            </div>
          )}

          {!loadingSaved && savedCreators.length === 0 && (
            <div className="text-center py-16">
              <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-700 mb-1">No saved creators yet</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Search and save creators you&apos;d like to work with. Your saved creators
                will appear here for quick access across campaigns.
              </p>
              <button
                onClick={() => handleTabChange("search")}
                className="mt-4 px-4 py-2 bg-[#2F4538] hover:bg-[#1f2f26] text-white rounded-lg text-sm font-medium transition-colors"
              >
                Start Searching
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
