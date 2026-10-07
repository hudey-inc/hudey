"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

/**
 * Client-side auth guard. Redirects to /login if not authenticated.
 * Returns the user once confirmed, or null while checking.
 */
export function useRequireAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const checked = useRef(false);

  useEffect(() => {
    // Only check once
    if (checked.current) return;
    checked.current = true;

    const supabase = createClient();
    let settled = false;

    // A hung or rejected auth call previously left `checking` true forever,
    // stranding the user on the loading spinner. Treat >10s of silence (or
    // a network failure) as unauthenticated and let /login sort it out.
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      setChecking(false);
      router.replace("/login");
    }, 10_000);

    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (settled) return;
        settled = true;
        if (error || !data.user) {
          router.replace("/login");
        } else {
          setUser(data.user);
        }
      })
      .catch(() => {
        if (settled) return;
        settled = true;
        router.replace("/login");
      })
      .finally(() => {
        clearTimeout(timeout);
        setChecking(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { user, checking };
}
