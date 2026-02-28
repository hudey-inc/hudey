import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, ArrowLeft } from "lucide-react";
import { posts, getCategoryLabel } from "@/lib/blog";
import { HudeyLogo } from "@/components/hudey-logo";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Insights on influencer marketing, sustainable brand growth, and product updates from the Hudey team.",
  openGraph: {
    title: "Blog | Hudey",
    description:
      "Insights on influencer marketing, sustainable brand growth, and product updates from the Hudey team.",
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  product: "bg-[#2F4538] text-white",
  industry: "bg-[#E8DCC8] text-[#2F4538]",
  guide: "bg-[#D16B42]/10 text-[#D16B42]",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-200 bg-white/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <HudeyLogo className="w-7 h-7" />
            <span className="font-bold text-lg text-gray-900">Hudey</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Header */}
      <header className="pt-16 pb-10 px-5 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Blog
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Insights on influencer marketing, sustainable brand growth, and
            product updates from the Hudey team.
          </p>
        </div>
      </header>

      {/* Posts */}
      <main className="px-5 sm:px-8 pb-20">
        <div className="max-w-4xl mx-auto space-y-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block border-2 border-gray-200 rounded-2xl p-6 sm:p-8 hover:border-gray-300 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${CATEGORY_COLORS[post.category] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {getCategoryLabel(post.category)}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  {post.readTime}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(post.date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 group-hover:text-[#2F4538] transition-colors">
                {post.title}
              </h2>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4">
                {post.description}
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-[#2F4538] group-hover:gap-2 transition-all">
                Read more
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-5 sm:px-8 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} Hudey. All rights reserved.
      </footer>
    </div>
  );
}
