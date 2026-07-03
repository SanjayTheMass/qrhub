"""Basic smoke tests — run with: pytest tests/"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock


@pytest.fixture
def client():
    # Patch Supabase + settings before importing app
    with (
        patch("app.db.supabase.create_client", return_value=MagicMock()),
        patch("app.core.razorpay_client.razorpay.Client", return_value=MagicMock()),
    ):
        from app.main import app
        return TestClient(app)


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_redirect_unknown_code(client):
    with patch("app.db.queries.get_url_by_short_code", return_value=None):
        resp = client.get("/unknownXYZ", allow_redirects=False)
        assert resp.status_code == 404


def test_redirect_active_url(client):
    mock_url = {
        "id": "uuid-1",
        "original_url": "https://example.com",
        "expires_at": None,
        "is_active": True,
    }
    with (
        patch("app.db.queries.get_url_by_short_code", return_value=mock_url),
        patch("app.db.queries.create_click_event"),
        patch("app.db.queries.increment_url_clicks"),
    ):
        resp = client.get("/abc12345", allow_redirects=False)
        assert resp.status_code in (301, 307)

