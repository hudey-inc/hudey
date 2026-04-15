import Link from "next/link";

export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f3f1ea] px-6">
      <div className="max-w-md w-full text-center">
        <p className="text-sm font-medium text-[#D16B42] tracking-wide uppercase mb-4">
          404
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl tracking-tight leading-[1.08] text-[#2F4538] mb-5">
          This page <em>doesn&apos;t exist</em>
        </h1>
        <p className="text-gray-600 mb-8">
          The link may be broken or the page may have moved. Try one of these
          instead.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-[#2F4538] text-white font-medium text-sm px-6 py-3 hover:bg-[#253629] transition-colors"
          >
            Go home
          </Link>
          <Link
            href="/help"
            className="inline-flex items-center justify-center rounded-xl border border-[#2F4538]/20 text-[#2F4538] font-medium text-sm px-6 py-3 hover:bg-[#2F4538]/[0.04] transition-colors"
          >
            Visit Help Centre
          </Link>
        </div>
      </div>
    </main>
  );
}
