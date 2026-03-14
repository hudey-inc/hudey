import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { getPostBySlug, getAllSlugs, getCategoryLabel } from "@/lib/blog";
import { FloatingHeader } from "@/components/ui/floating-header";
import { Footer } from "@/components/ui/footer";

const APP_URL = "https://app.hudey.co";

const navItems = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
  { label: "Founding Cohort", href: "/#founding-cohort" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
];

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const post = getPostBySlug(params.slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
    },
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  product: "bg-[#2F4538] text-white",
  industry: "bg-[#E8DCC8] text-[#2F4538]",
  guide: "bg-[#D16B42]/10 text-[#D16B42]",
};

export default function BlogPostPage({ params }: Props) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <FloatingHeader navItems={navItems} appUrl={APP_URL} />

      {/* Article */}
      <article className="pt-10 sm:pt-16 pb-20 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${CATEGORY_COLORS[post.category] ?? "bg-gray-100 text-gray-700"}`}
            >
              {getCategoryLabel(post.category)}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              {post.readTime}
            </span>
            <time className="text-xs text-gray-400" dateTime={post.date}>
              {new Date(post.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
          </div>

          {/* Title */}
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-gray-900 leading-tight tracking-tight mb-4">
            {post.title}
          </h1>
          <p className="text-lg text-gray-500 mb-10">{post.description}</p>

          {/* Separator */}
          <div className="h-px bg-gradient-to-r from-[#2F4538]/20 via-[#D16B42]/20 to-transparent mb-10" />

          {/* Content */}
          <div
            className="prose prose-lg prose-gray max-w-none
              prose-headings:font-bold prose-headings:text-gray-900
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-p:leading-relaxed prose-p:text-gray-700
              prose-li:text-gray-700
              prose-strong:text-gray-900
              prose-a:text-[#2F4538] prose-a:underline prose-a:underline-offset-2
            "
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* CTA */}
          <div className="mt-16 rounded-2xl bg-[#2F4538] p-8 sm:p-10 text-center">
            <h3 className="font-serif text-2xl sm:text-3xl text-white mb-3 tracking-tight">
              Stop spending weeks on <em>influencer admin</em>
            </h3>
            <p className="text-sm sm:text-base text-white/60 mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed">
              Hudey finds creators, writes outreach, and negotiates deals.
              You approve everything.
            </p>
            <a
              href="https://app.hudey.co/signup"
              className="inline-flex items-center gap-2 bg-white text-[#2F4538] px-7 py-3.5 rounded-xl font-medium text-sm hover:bg-[#E8DCC8] transition-colors"
            >
              Apply for Early Access
            </a>
          </div>

          {/* Back link */}
          <div className="mt-10">
            <Link
              href="/blog"
              className="text-sm text-gray-500 hover:text-[#2F4538] transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to all posts
            </Link>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}
