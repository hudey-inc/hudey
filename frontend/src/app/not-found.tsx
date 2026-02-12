"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center py-16 sm:py-24">
      <div className="text-center max-w-md px-4">
        {/* 404 display */}
        <div className="text-[120px] sm:text-[160px] font-bold leading-none text-[#2F4538]/10 select-none">
          404
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 -mt-4 mb-3">
          Page not found
        </h1>
        <p className="text-gray-500 text-sm sm:text-base mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto bg-[#2F4538] hover:bg-[#243a2d] text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
          <button
            onClick={() => router.back()}
            className="w-full sm:w-auto border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
