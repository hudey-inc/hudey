import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { posts, getCategoryLabel, type BlogPost } from "@/lib/blog";
import { FloatingHeader } from "@/components/ui/floating-header";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/ui/footer";

const APP_URL = "https://app.hudey.co";

const navItems = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
  { label: "Founding Cohort", href: "/#founding-cohort" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
];

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

// Keyed on the narrow BlogPost["category"] union so the type checker
// enforces exhaustive coverage whenever a new category is introduced.
const CATEGORY_COLORS: Record<BlogPost["category"], string> = {
  product: "bg-[#2F4538] text-white",
  industry: "bg-[#E8DCC8] text-[#2F4538]",
  guide: "bg-[#D16B42]/10 text-[#D16B42]",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <FloatingHeader navItems={navItems} appUrl={APP_URL} />

      {/* Header */}
      <section className="pt-10 sm:pt-16 pb-14 sm:pb-20 px-5 sm:px-8">
        <div className="flex text-center justify-center items-center gap-4 flex-col">
          <Badge>Blog</Badge>
          <div className="flex gap-2 flex-col">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl tracking-tight text-center text-gray-900 leading-[1.08]">
              Insights &amp; <em>updates</em>
            </h1>
            <p className="text-lg leading-relaxed tracking-tight text-gray-400 max-w-xl text-center mx-auto">
              Practical guides, industry insights, and product updates
              for sustainable brands running influencer campaigns.
            </p>
          </div>
        </div>
      </section>

      {/* Posts */}
      <main className="px-5 sm:px-8 pb-20">
        <div className="max-w-4xl mx-auto space-y-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block border border-gray-200 rounded-2xl p-6 sm:p-8 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${CATEGORY_COLORS[post.category]}`}
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
              <h2 className="font-serif text-xl sm:text-2xl text-gray-900 mb-2 group-hover:text-[#2F4538] transition-colors">
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

      <Footer />
    </div>
  );
}
