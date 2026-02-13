"""Shared pytest fixtures — mock Supabase and auth for all backend tests."""

import os
import pytest
from unittest.mock import MagicMock, patch


# ── Ensure env vars don't hit real services ──────────────────

@pytest.fixture(autouse=True)
def _isolate_env(monkeypatch):
    """Prevent tests from connecting to real Supabase / APIs."""
    monkeypatch.setenv("SUPABASE_URL", "https://test.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_KEY", "test-service-key")
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "test-jwt-secret")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "")
    monkeypatch.setenv("RESEND_API_KEY", "")
    monkeypatch.setenv("INSIGHTIQ_CLIENT_ID", "")
    monkeypatch.setenv("INSIGHTIQ_CLIENT_SECRET", "")


# ── Mock Supabase client ─────────────────────────────────────

class MockSupabaseResponse:
    """Mimics supabase-py response object."""

    def __init__(self, data=None):
        self.data = data or []


class MockSupabaseQuery:
    """Chainable mock for sb.table(...).select(...).eq(...).execute()."""

    def __init__(self, data=None):
        self._data = data or []

    def select(self, *a, **kw):
        return self

    def insert(self, row, **kw):
        # Auto-assign an id if missing
        if isinstance(row, dict) and "id" not in row:
            row["id"] = "mock-uuid-1234"
        self._data = [row]
        return self

    def update(self, updates, **kw):
        if self._data:
            self._data[0].update(updates)
        return self

    def upsert(self, row, **kw):
        if isinstance(row, dict) and "id" not in row:
            row["id"] = "mock-uuid-1234"
        self._data = [row]
        return self

    def delete(self):
        self._data = []
        return self

    def eq(self, *a, **kw):
        return self

    def neq(self, *a, **kw):
        return self

    def order(self, *a, **kw):
        return self

    def limit(self, *a, **kw):
        return self

    def execute(self):
        return MockSupabaseResponse(self._data)


class MockSupabaseClient:
    """Lightweight mock of the supabase-py Client."""

    def __init__(self):
        self._tables = {}
        self._rpc_results = {}

    def table(self, name):
        if name not in self._tables:
            self._tables[name] = MockSupabaseQuery()
        return self._tables[name]

    def seed_table(self, name, rows):
        """Pre-load data for a table."""
        self._tables[name] = MockSupabaseQuery(list(rows))

    def rpc(self, fn_name, params=None):
        return MockSupabaseQuery(self._rpc_results.get(fn_name, []))


@pytest.fixture()
def mock_sb():
    """Provide a mock Supabase client and patch get_supabase()."""
    client = MockSupabaseClient()
    with patch("backend.db.client.get_supabase", return_value=client):
        # Also reset the module-level cache
        import backend.db.client as db_mod
        db_mod._SUPABASE_CLIENT = client
        yield client
        db_mod._SUPABASE_CLIENT = None


# ── Mock auth ────────────────────────────────────────────────

MOCK_BRAND = {
    "id": "brand-uuid-1234",
    "user_id": "user-uuid-5678",
    "name": "Test Brand",
    "industry": "Technology",
    "brand_voice": None,
    "contact_email": "test@example.com",
    "created_at": "2025-01-01T00:00:00Z",
}


@pytest.fixture()
def auth_brand():
    """Return the mock brand dict used by get_current_brand override."""
    return dict(MOCK_BRAND)


# ── FastAPI TestClient ───────────────────────────────────────

@pytest.fixture()
def client(mock_sb, auth_brand):
    """FastAPI TestClient with auth bypassed and Supabase mocked."""
    from fastapi.testclient import TestClient

    # Must import app AFTER mocking
    from backend.main import app
    from backend.auth.current_brand import get_current_brand

    app.dependency_overrides[get_current_brand] = lambda: auth_brand
    tc = TestClient(app)
    yield tc
    app.dependency_overrides.clear()
