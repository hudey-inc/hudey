"""Health endpoint and app startup tests."""


def test_health_returns_ok(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_unknown_route_returns_404(client):
    res = client.get("/api/does-not-exist")
    assert res.status_code in (404, 405)
