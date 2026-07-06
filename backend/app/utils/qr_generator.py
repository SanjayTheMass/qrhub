"""Generate QR code PNG images with custom colors and optional logo."""
from __future__ import annotations

import io

import httpx
import qrcode
from PIL import Image
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.colormasks import SolidFillColorMask


def _hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    hex_color = hex_color.lstrip("#")
    r, g, b = int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16)
    return r, g, b


def generate_qr_png(
    data: str,
    foreground_color: str = "#000000",
    background_color: str = "#FFFFFF",
    logo_url: str | None = None,
    box_size: int = 10,
    border: int = 4,
) -> bytes:
    """Return PNG bytes for a QR code encoding *data*.

    Uses ERROR_CORRECT_H (30 % recovery) so a logo can cover the centre
    without making the QR unreadable.
    """
    fg = _hex_to_rgb(foreground_color)
    bg = _hex_to_rgb(background_color)

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=box_size,
        border=border,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img: Image.Image = qr.make_image(
        image_factory=StyledPilImage,
        color_mask=SolidFillColorMask(front_color=fg, back_color=bg),
    )

    if logo_url:
        try:
            img = _embed_logo(img, logo_url)
        except Exception:
            pass  # silently skip logo on failure

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _embed_logo(qr_img: Image.Image, logo_url: str) -> Image.Image:
    """Download *logo_url* and paste it centred on *qr_img*."""
    resp = httpx.get(logo_url, timeout=5, follow_redirects=True)
    resp.raise_for_status()

    logo = Image.open(io.BytesIO(resp.content)).convert("RGBA")
    qr_w, qr_h = qr_img.size

    # Logo occupies ≤ 22 % of the QR code side
    max_side = int(min(qr_w, qr_h) * 0.22)
    logo.thumbnail((max_side, max_side), Image.LANCZOS)

    # White square background with 6px padding
    pad = 6
    bg = Image.new("RGBA", (logo.width + pad * 2, logo.height + pad * 2), (255, 255, 255, 255))
    bg.paste(logo, (pad, pad), logo)

    qr_rgba = qr_img.convert("RGBA")
    pos = ((qr_w - bg.width) // 2, (qr_h - bg.height) // 2)
    qr_rgba.paste(bg, pos, bg)

    return qr_rgba.convert("RGB")

