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
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        router.replace("/login");
      } else {
        setUser(data.user);
      }
      setChecking(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { user, checking };
}
