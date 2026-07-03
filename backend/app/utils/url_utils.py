"""URL validation helpers and short-code generation."""
from __future__ import annotations

import re
from urllib.parse import urlparse

from nanoid import generate

_SLUG_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
_CUSTOM_SLUG_RE = re.compile(r"^[a-zA-Z0-9-]{4,30}$")


def generate_short_code(size: int = 8) -> str:
    """Generate a random URL-safe short code."""
    return generate(_SLUG_ALPHABET, size)


def validate_url(url: str) -> bool:
    """Return True if *url* is a valid http/https URL."""
    try:
        parsed = urlparse(url)
        return parsed.scheme in ("http", "https") and bool(parsed.netloc)
    except Exception:
        return False


def is_valid_custom_slug(slug: str) -> bool:
    """Return True if *slug* matches the allowed pattern for custom slugs."""
    return bool(_CUSTOM_SLUG_RE.match(slug))

