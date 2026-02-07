"""Supabase client - graceful degradation when credentials missing."""

import os
_SUPABASE_CLIENT = None


def get_supabase():
    """Return Supabase client or None if credentials unset."""
    global _SUPABASE_CLIENT
    if _SUPABASE_CLIENT is not None:
        return _SUPABASE_CLIENT
    url = (os.getenv("SUPABASE_URL") or "").strip()
    key = (os.getenv("SUPABASE_SERVICE_KEY") or "").strip()
    if not url or not key:
        return None
    try:
        from supabase import create_client
        _SUPABASE_CLIENT = create_client(url, key)
        return _SUPABASE_CLIENT
    except Exception:
        return None


def reset_supabase():
    """Force re-creation of the Supabase client (e.g. after a connection error)."""
    global _SUPABASE_CLIENT
    _SUPABASE_CLIENT = None
