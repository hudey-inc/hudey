"use client";

import { usePathname } from "next/navigation";

const AUTH_ROUTES = ["/login", "/signup"];

export function MainNav() {
  const pathname = usePathname();

  if (AUTH_ROUTES.includes(pathname)) {
    return null;
  }

  return (
    <nav className="flex gap-4 text-sm text-stone-600">
      <a href="/" className="hover:text-stone-900">
        Campaigns
      </a>
    </nav>
  );
}
