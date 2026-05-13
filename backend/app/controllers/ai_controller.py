from __future__ import annotations

import asyncio
import io
import os
import time
from uuid import uuid4

import base64
import cv2
import colorsys
import httpx
import numpy as np
from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter
import tempfile
from gradio_client import Client, handle_file

from app.config.settings import settings
from app.providers.supabase_provider import supabase_admin

router = APIRouter(tags=["AI Preview"])

# ─────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────
HF_TOKEN = settings.HF_TOKEN
HF_SPACE_ID = settings.HF_SPACE_ID

BUCKET = "order-references"
COMPANY_ID = 1
POLL_INTERVAL = 2.0
MAX_TOTAL_SECONDS = 15.0
MAX_POLLS = max(1, int(MAX_TOTAL_SECONDS // POLL_INTERVAL))

STYLE_CONFIG: dict[str, dict] = {
    "bordado": {
        "prompt": (
            "Use the input logo as the exact embroidery template. "
            "Keep the original logo shape, text, proportions and colors. "
            "Create realistic embroidered thread texture only on the logo itself, "
            "with visible stitch direction, thread relief, and detailed thread fibers. "
            "The embroidery must follow the exact contour of each letter and shape. "
            "No separate patch, no added border around the logo, no extra frame, "
            "no white fill, no background replacement, no stylized redesign. "
            "The logo should appear normal size or slightly larger. "
            "Background must be a subtle neutral dark fabric texture, not saturated."
        ),
        "negative_prompt": (
            "full image effect, border around the whole image, patch, badge, sticker, "
            "white plate, circular patch, extra frame, extra border, glowing background, "
            "blurry, distorted letters, missing shapes, extra shapes, changed colors, "
            "oversaturated background, flat 2D, illustration, cartoon, unreadable text"
        ),
        "bg_color": (28, 32, 36),
        "strength": 0.34,
        "guidance_scale": 9.5,
        "steps": 32,
    },

    "neon_flex": {
        "prompt": (
            "Use the input logo as the exact neon flex template. "
            "Preserve the original logo shape, text, layout and colors exactly. "
            "Create a neon flex tube effect only along the outer contour and inner contour "
            "of each letter and shape, like a glowing tube tracing the edges. "
            "Do not illuminate the full interior of the design. "
            "The neon glow must stay confined to the logo contour, with a thin luminous border "
            "and a subtle halo around the edges only. "
            "Place the sign on a dark neutral wall with realistic signage lighting. "
            "No redesign, no background effect over the whole image, no full-body glow."
        ),
        "negative_prompt": (
            "full image glow, washed out logo, glowing fill, bright entire design, "
            "border around the whole image, extra frame, light leak over background, "
            "blurred letters, distorted shapes, changed colors, extra shapes, "
            "flat illustration, cartoon, 2D, watermark, broken tubes, melted sign"
        ),
        "bg_color": (20, 20, 24),
        "strength": 0.38,
        "guidance_scale": 9.0,
        "steps": 34,
    },

    "acrilico": {
        "prompt": (
            "Use the input logo as the exact acrylic sign template. "
            "Preserve the original logo shape, text, proportions and colors exactly. "
            "Create a translucent acrylic contour effect only around the logo letters and shapes, "
            "with subtle bevels, glossy edges, internal refraction, and soft reflections. "
            "The acrylic effect must follow the exact contour of each letter and shape. "
            "Do not create a solid circle, disk, plate, or full background panel. "
            "Do not change the whole image. "
            "The sign must sit on a neutral wall background, with only the logo having the acrylic contour."
        ),
        "negative_prompt": (
            "solid circle, filled disk, large panel, full image effect, border around whole image, "
            "extra frame, patch, badge, sticker, opaque background, dark background, "
            "changed colors, distorted logo, missing shapes, extra shapes, "
            "flat 2D, illustration, cartoon, watermark, cheap plastic, toy look"
        ),
        "bg_color": (214, 210, 204),
        "strength": 0.36,
        "guidance_scale": 8.8,
        "steps": 32,
    },
}

# ═════════════════════════════════════════════════════════
# Supabase helpers
# ═════════════════════════════════════════════════════════

def upload_image_bytes(image_bytes: bytes, path: str, content_type: str = "image/png") -> str:
    """Upload bytes to Supabase and return a signed URL."""
    supabase_admin.storage.from_(BUCKET).upload(
        path=path,
        file=image_bytes,
        file_options={"content-type": content_type},
    )
    signed = supabase_admin.storage.from_(BUCKET).create_signed_url(path, 3600)
    url = signed.get("signedURL") or signed.get("signed_url") or ""
    if not url:
        raise RuntimeError(f"Supabase did not return a signed URL for {path}")
    return url


def pil_to_png_bytes(img: Image.Image) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def prepare_source_image(
    image: Image.Image,
    size: int = 512,
    style: str | None = None,
    bg_color: tuple | None = None,   # ← nuevo parámetro
) -> Image.Image:
    rgba = image.convert("RGBA")

    ratio = min(size / rgba.width, size / rgba.height)
    ratio *= 0.90
    if style == "bordado":
        ratio *= 0.98 / 0.90  # ajuste bordado

    nw = max(1, int(rgba.width * ratio))
    nh = max(1, int(rgba.height * ratio))
    resized = rgba.resize((nw, nh), Image.Resampling.LANCZOS)

    # Usar el color de fondo del estilo en lugar de detectar automáticamente
    if bg_color:
        bg = (*bg_color, 255)
    else:
        arr = np.array(rgba, dtype=np.uint8)
        rgb, alpha = arr[:, :, :3], arr[:, :, 3]
        if (alpha < 250).mean() > 0.02:
            bg = (255, 255, 255, 255) if rgb.mean() < 140 else (18, 18, 18, 255)
        else:
            h, w = rgb.shape[:2]
            s = max(4, int(min(h, w) * 0.08))
            corners = np.vstack([
                rgb[:s, :s].reshape(-1, 3), rgb[:s, -s:].reshape(-1, 3),
                rgb[-s:, :s].reshape(-1, 3), rgb[-s:, -s:].reshape(-1, 3),
            ])
            bg_rgb = tuple(int(x) for x in np.clip(np.median(corners, axis=0), 0, 255))
            bg = (*bg_rgb, 255)

    canvas = Image.new("RGBA", (size, size), bg)
    x, y = (size - nw) // 2, (size - nh) // 2
    canvas.paste(resized, (x, y), resized)

    rgb_canvas = canvas.convert("RGB")
    rgb_canvas = ImageEnhance.Sharpness(rgb_canvas).enhance(1.12)
    rgb_canvas = ImageEnhance.Contrast(rgb_canvas).enhance(1.04)

    arr_final = np.clip(np.array(rgb_canvas, dtype=np.uint8), 0, 255).astype(np.uint8)
    result = Image.fromarray(arr_final, mode="RGB")
    print(f"[IA LOG]: Imagen preparada - Modo: {result.mode}, Tamaño: {result.size}, BG: {bg[:3]}")
    return result

# ═════════════════════════════════════════════════════════
# Stable Diffusion img2img
# ═════════════════════════════════════════════════════════

async def call_sd_img2img(pil_img: Image.Image, style: str) -> Image.Image:
    cfg = STYLE_CONFIG[style]
    tmp_path = None

    try:
        # 1. Guardar imagen temporal
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            if pil_img.mode != "RGB":
                pil_img = pil_img.convert("RGB")
            arr = np.clip(np.array(pil_img, dtype=np.uint8), 0, 255).astype(np.uint8)
            Image.fromarray(arr, mode="RGB").save(tmp, format="PNG", compress_level=6)
            tmp_path = tmp.name

        print(f"[IA LOG]: PNG guardado — {tmp_path}")
        print(f"[IA LOG]: Conectando a Space '{HF_SPACE_ID}' para estilo '{style}'...")

        # 2. Inferencia en thread separado (no bloquea FastAPI)
        def run_prediction():
            # Sin token: el Space es público
            # Sin kwargs extra: compatibilidad con versiones antiguas de gradio_client
            client = Client(HF_SPACE_ID)

            print(f"[IA LOG]: Enviando — strength={cfg['strength']}, guidance={cfg['guidance_scale']}, steps={cfg['steps']}")
            return client.predict(
                image=handle_file(tmp_path),
                prompt=cfg["prompt"],
                negative_prompt=cfg["negative_prompt"],
                strength=float(cfg["strength"]),
                guidance_scale=float(cfg["guidance_scale"]),
                steps=int(cfg["steps"]), 
                api_name="/predict",
            )

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, run_prediction)

        print(f"[IA LOG]: Space respondió → {result}")

        if not result or not os.path.exists(result):
            raise RuntimeError("El Space no devolvió una ruta de imagen válida")

        # 3. Leer resultado en memoria ANTES de limpiar temporales
        generated = Image.open(result).convert("RGB")
        generated.load()  # Forzar carga completa en memoria
        print(f"[IA LOG]: Imagen generada exitosamente — Tamaño: {generated.size}")
        return generated

    finally:
        # Limpieza del temporal (Windows necesita que nadie más lo use)
        if tmp_path and os.path.exists(tmp_path):
            try:
                await asyncio.sleep(1.0)  # Dar tiempo a Gradio a soltar el archivo
                os.remove(tmp_path)
                print(f"[IA LOG]: Temporal eliminado")
            except Exception as e:
                print(f"[IA LOG WARNING]: No se pudo eliminar temporal: {e}")

async def _download_image(url: str) -> Image.Image:
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(url)
        r.raise_for_status()
    return Image.open(io.BytesIO(r.content)).convert("RGB")


# ═════════════════════════════════════════════════════════
# Fallback: local compositing (PIL + OpenCV)
# ═════════════════════════════════════════════════════════
# Si ya tienes tu bloque fallback anterior, puedes dejarlo igual debajo de aquí.
# Si prefieres, reemplaza esa parte por tu implementación actual.

def logo_mask(logo: Image.Image) -> np.ndarray:
    rgba = np.array(logo.convert("RGBA"))
    alpha = rgba[:, :, 3]
    rgb = rgba[:, :, :3].astype(np.float32)
    h, w = rgba.shape[:2]

    if alpha.min() < 200 and (alpha < 200).mean() > 0.03:
        mask = np.where(alpha > 30, np.uint8(255), np.uint8(0))
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        return cv2.morphologyEx(mask, cv2.MORPH_CLOSE, k, iterations=2)

    s = max(4, int(min(h, w) * 0.08))
    corners = np.vstack([
        rgb[:s, :s].reshape(-1, 3),
        rgb[:s, -s:].reshape(-1, 3),
        rgb[-s:, :s].reshape(-1, 3),
        rgb[-s:, -s:].reshape(-1, 3),
    ])
    bg = np.median(corners, axis=0)
    dist = np.linalg.norm(rgb - bg, axis=2)
    thr = max(10.0, dist.max() * 0.05)
    mask = np.where(dist > thr, np.uint8(255), np.uint8(0))

    k3 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    k5 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, k5, iterations=2)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, k3, iterations=1)

    n, labels, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
    if n > 2:
        clean = np.zeros_like(mask)
        for lbl in range(1, n):
            if stats[lbl, cv2.CC_STAT_AREA] >= h * w * 0.005:
                clean[labels == lbl] = 255
        mask = clean

    return cv2.morphologyEx(mask, cv2.MORPH_CLOSE, k5, iterations=3)


def fit_logo(image: Image.Image, max_w: int, max_h: int) -> Image.Image:
    image = image.convert("RGBA")
    ratio = min(max_w / image.width, max_h / image.height)
    nw, nh = max(1, int(image.width * ratio)), max(1, int(image.height * ratio))
    return image.resize((nw, nh), Image.Resampling.LANCZOS)


def dominant_color(logo: Image.Image, mask: np.ndarray) -> tuple:
    arr = np.array(logo.convert("RGB"))
    px = arr[mask > 60].astype(np.float32)
    if len(px) == 0:
        return (220, 60, 60)
    lum = 0.299 * px[:, 0] + 0.587 * px[:, 1] + 0.114 * px[:, 2]
    col = px[(lum > 35) & (lum < 220)]
    col = col if len(col) >= 10 else px
    k = min(3, len(col))
    try:
        _, _, centers = cv2.kmeans(
            col, k, None,
            (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0),
            5, cv2.KMEANS_PP_CENTERS,
        )
        best, bsat = centers[0], 0.0
        for c in centers:
            _, s, _ = colorsys.rgb_to_hsv(*[x / 255 for x in c])
            if s > bsat:
                bsat, best = s, c
        return tuple(int(x) for x in best)
    except Exception:
        return tuple(col.mean(axis=0).astype(int))


def _denim(size: int) -> np.ndarray:
    rng = np.random.default_rng(42)
    base = np.array([38, 44, 54])
    arr = np.tile(base, (size, size, 1)).astype(np.int16)
    warp = rng.integers(-18, 18, (size,))
    for c in range(3):
        arr[:, :, c] = np.clip(arr[:, :, c] + warp, 0, 255)
    for y in range(0, size, 2):
        arr[y] = np.clip(arr[y] + (14 if (y // 2) % 2 == 0 else -14), 0, 255)
    noise = rng.integers(-7, 7, (size, size, 3), dtype=np.int16)
    arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
    return cv2.GaussianBlur(arr, (3, 3), 0.6)


def _canvas(h: int, w: int) -> np.ndarray:
    rng = np.random.default_rng(7)
    arr = np.full((h, w, 3), (210, 205, 195), dtype=np.int16)
    arr = np.clip(arr + rng.integers(-14, 14, (w,), dtype=np.int16), 0, 255)
    arr = np.clip(arr + rng.integers(-9, 9, (h, 1, 3), dtype=np.int16), 0, 255)
    arr = np.clip(arr + rng.integers(-6, 6, (h, w, 3), dtype=np.int16), 0, 255).astype(np.uint8)
    return cv2.GaussianBlur(arr, (3, 3), 0.4)


def _wall(size: int, base=(108, 103, 98)) -> np.ndarray:
    rng = np.random.default_rng(13)
    arr = np.full((size, size, 3), base, dtype=np.uint8)
    for _ in range(35):
        cx, cy = int(rng.integers(0, size)), int(rng.integers(0, size))
        rx, ry = int(rng.integers(30, 110)), int(rng.integers(20, 80))
        db = int(rng.integers(-22, 22))
        cv2.ellipse(
            arr,
            (cx, cy),
            (rx, ry),
            int(rng.integers(0, 180)),
            0, 360,
            tuple(int(np.clip(c + db, 0, 255)) for c in base),
            -1,
        )
    noise = rng.integers(-13, 13, (size, size, 3), dtype=np.int16)
    arr = np.clip(arr.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    return cv2.GaussianBlur(arr, (9, 9), 2.5)


def _fallback_bordado(image: Image.Image) -> Image.Image:
    S = 720

    # Logo un poco más grande, sin parche alrededor
    logo = fit_logo(image, 540, 540)
    lw, lh = logo.size

    logo_rgba = np.array(logo.convert("RGBA"), dtype=np.uint8)
    logo_arr = logo_rgba[:, :, :3].astype(np.float32)
    msk = logo_mask(logo)

    # Fondo textil más neutro y menos saturado
    bg = np.full((S, S, 3), (24, 25, 27), dtype=np.float32)

    rng = np.random.default_rng(42)
    yy, xx = np.indices((S, S))

    weave = (
        0.7 * np.sin(xx / 4.0) +
        0.5 * np.sin(yy / 4.8) +
        0.35 * np.sin((xx + yy) / 13.0)
    ).astype(np.float32)

    bg += weave[..., None] * np.array([1.2, 1.0, 0.9], dtype=np.float32)

    noise = rng.normal(0, 1.1, (S, S, 3)).astype(np.float32)
    bg += noise

    # Viñeta suave y más natural
    cy, cx = S / 2, S / 2
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / (S * 0.72)
    vignette = np.clip(1.0 - dist * 0.18, 0.82, 1.0).astype(np.float32)
    bg *= vignette[..., None]
    bg = cv2.GaussianBlur(bg, (0, 0), 0.8)

    # Posición del diseño
    lx, ly = (S - lw) // 2, (S - lh) // 2

    # Mantener colores originales y dar solo micro textura de hilo
    yy2, xx2 = np.indices((lh, lw))
    stitch_pattern = (
        0.985
        + 0.010 * np.sin(xx2 / 2.5)
        + 0.008 * np.sin((xx2 + yy2) / 5.3)
        + 0.006 * np.sin((xx2 - yy2) / 7.4)
    ).astype(np.float32)

    stitch_pattern *= (msk.astype(np.float32) / 255.0)
    detail = np.clip(logo_arr * stitch_pattern[..., None], 0, 255)

    # Relieve muy sutil en los bordes del propio diseño
    edge_band = cv2.subtract(
        msk,
        cv2.erode(msk, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    )
    edge_band = cv2.GaussianBlur(edge_band, (0, 0), 1.0)
    edge_alpha = (edge_band.astype(np.float32) / 255.0)[..., None]

    # Oscurecer apenas el contorno para simular hilo, sin meter colores nuevos
    darker = np.clip(detail * 0.94, 0, 255)
    detail = detail * (1.0 - edge_alpha * 0.18) + darker * (edge_alpha * 0.18)

    # Sombra de hilo suave
    shadow_mask_small = cv2.GaussianBlur(msk.astype(np.float32) / 255.0, (0, 0), 1.8)
    shadow_mask = np.zeros((S, S), dtype=np.float32)
    shadow_mask[ly:ly + lh, lx:lx + lw] = shadow_mask_small
    bg -= shadow_mask[..., None] * np.array([2.0, 2.0, 2.2], dtype=np.float32)

    # Composición final
    alpha = (cv2.GaussianBlur(msk, (3, 3), 0).astype(np.float32) / 255.0)[..., None]
    roi = bg[ly:ly + lh, lx:lx + lw]
    roi = roi * (1.0 - alpha) + detail * alpha
    bg[ly:ly + lh, lx:lx + lw] = roi

    # Un poco más de relieve fino, sin parche
    micro = cv2.GaussianBlur(msk.astype(np.float32) / 255.0, (0, 0), 0.9)
    bg[ly:ly + lh, lx:lx + lw] += micro[..., None] * np.array([2.0, 1.5, 1.2], dtype=np.float32)

    return Image.fromarray(np.clip(bg, 0, 255).astype(np.uint8), mode="RGB")


def _fallback_neon(image: Image.Image) -> Image.Image:
    S, LMAX = 720, 460

    logo = fit_logo(image, LMAX, LMAX)
    lw, lh = logo.size
    logo_rgba = np.array(logo.convert("RGBA"), dtype=np.uint8)
    logo_arr = logo_rgba[:, :, :3].astype(np.float32)
    msk = logo_mask(logo)

    ox, oy = (S - lw) // 2, (S - lh) // 2

    fl = np.zeros((S, S, 3), dtype=np.float32)
    fl[oy:oy + lh, ox:ox + lw] = logo_arr

    fm = np.zeros((S, S), dtype=np.uint8)
    fm[oy:oy + lh, ox:ox + lw] = msk

    res = _wall(S, base=(28, 26, 32)).astype(np.float32)

    # Mantener el color original dentro del diseño
    full_mask = (fm.astype(np.float32) / 255.0)[..., None]
    res = res * (1.0 - full_mask) + fl * full_mask

    # Borde luminoso del mismo color de cada parte del diseño
    outer_ring = cv2.subtract(
        cv2.dilate(fm, np.ones((5, 5), np.uint8), iterations=1),
        fm
    )
    outer_ring = cv2.GaussianBlur(outer_ring, (0, 0), 3.4)

    inner_ring = cv2.subtract(
        fm,
        cv2.erode(fm, np.ones((3, 3), np.uint8), iterations=1)
    )
    inner_ring = cv2.GaussianBlur(inner_ring, (0, 0), 1.2)

    # Glow coloreado por borde, no por relleno
    blurred_color = np.stack(
        [cv2.GaussianBlur(fl[:, :, c], (0, 0), 4.5) for c in range(3)],
        axis=2
    )

    outer_a = (outer_ring.astype(np.float32) / 255.0)[..., None]
    inner_a = (inner_ring.astype(np.float32) / 255.0)[..., None]

    res = np.clip(
        res + blurred_color * outer_a * 0.95,
        0,
        255,
    )

    res = np.clip(
        res + blurred_color * inner_a * 0.28,
        0,
        255,
    )

    # Refuerzo suave de la línea sin iluminar todo el centro
    core = cv2.erode(fm, np.ones((2, 2), np.uint8), iterations=1)
    core_a = (core.astype(np.float32) / 255.0)[..., None]
    res = np.clip(res * (1.0 - core_a * 0.03) + fl * core_a * 0.03, 0, 255)

    grain = np.random.randint(0, 4, res.shape, dtype=np.uint8)
    return Image.fromarray(np.clip(res + grain, 0, 255).astype(np.uint8))


def _fallback_acrilico(image: Image.Image) -> Image.Image:
    S = 720

    logo = fit_logo(image, 360, 360)
    lw, lh = logo.size
    logo_rgba = np.array(logo.convert("RGBA"), dtype=np.uint8)
    logo_arr = logo_rgba[:, :, :3].astype(np.float32)
    msk = logo_mask(logo)

    bg = _wall(S, base=(200, 196, 192)).astype(np.float32)

    lx, ly = (S - lw) // 2, (S - lh) // 2

    full_mask = np.zeros((S, S), dtype=np.uint8)
    full_mask[ly:ly + lh, lx:lx + lw] = msk

    full_logo = np.zeros((S, S, 3), dtype=np.float32)
    full_logo[ly:ly + lh, lx:lx + lw] = logo_arr

    # Contorno translúcido alrededor del diseño, sin círculo sólido
    outer = cv2.dilate(full_mask, np.ones((13, 13), np.uint8), iterations=1)
    ring = cv2.subtract(outer, full_mask)
    ring = cv2.GaussianBlur(ring.astype(np.float32), (0, 0), 5.5)
    ring_a = (ring / max(ring.max(), 1e-6))[..., None]

    # Contorno con sensación de acrílico translúcido
    ring_color = cv2.GaussianBlur(full_logo, (0, 0), 4.0)
    ring_color = np.clip(ring_color * 0.65 + 255 * 0.18, 0, 255)

    # Sombras muy suaves sobre la pared
    shadow = cv2.GaussianBlur(np.roll(full_mask, 10, axis=0).astype(np.float32) / 255.0, (0, 0), 18)
    bg -= shadow[..., None] * np.array([10, 9, 8], np.float32)

    # Línea acrílica translúcida
    bg = np.clip(bg + ring_color * ring_a * 0.42, 0, 255)

    # Logo principal con borde limpio y sutil
    logo_a = (full_mask.astype(np.float32) / 255.0)[..., None]
    face = np.clip(full_logo * 1.05, 0, 255)
    bg = bg * (1.0 - logo_a) + face * logo_a

    # Reflejos finos en el borde
    sheen = cv2.GaussianBlur(full_mask.astype(np.float32) / 255.0, (0, 0), 8)
    sheen = sheen[..., None]
    bg = np.clip(bg + sheen * np.array([18, 16, 14], np.float32), 0, 255)

    # Pequeño brillo especular en el contorno
    edge = cv2.subtract(outer, full_mask)
    edge = cv2.GaussianBlur(edge.astype(np.float32), (0, 0), 2.2)
    edge_a = (edge / max(edge.max(), 1e-6))[..., None]
    bg = np.clip(bg + edge_a * np.array([22, 20, 18], np.float32), 0, 255)

    return Image.fromarray(bg.astype(np.uint8), mode="RGB")


def generate_fallback(image: Image.Image, style: str) -> Image.Image:
    if style == "bordado":
        return _fallback_bordado(image)
    if style == "neon_flex":
        return _fallback_neon(image)
    if style == "acrilico":
        return _fallback_acrilico(image)
    raise ValueError(style)


# ═════════════════════════════════════════════════════════
# Main endpoint
# ═════════════════════════════════════════════════════════

@router.post("/generate-preview")
async def generate_product_preview(
    file: UploadFile = File(...),
    style: str = Query(..., description="bordado | neon_flex | acrilico"),
):
    if style not in STYLE_CONFIG:
        raise HTTPException(400, f"Estilo no válido. Opciones: {list(STYLE_CONFIG)}")

    if not HF_TOKEN:
        raise HTTPException(500, "Error: HF_TOKEN no configurado.")
    
    if not HF_SPACE_ID:
        raise HTTPException(500, "Error: HF_SPACE_ID no configurado.")

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGBA")

        # 1. Preparar imagen base
        prepared = prepare_source_image(image, size=512, style=style, bg_color=STYLE_CONFIG[style].get("bg_color"),)

        # 2. Llamada a HF Space (con fallback automático)
        print(f"[IA LOG]: Iniciando generación para estilo '{style}'...")
        preview = await call_sd_img2img(prepared, style)

        # 3. Guardar resultado final en Supabase
        out_path = f"{COMPANY_ID}/previews/{uuid4()}.png"
        final_url = upload_image_bytes(pil_to_png_bytes(preview), out_path)
        
        return {
            "status": "AI_SUCCESS",
            "preview_url": final_url,
            "style_applied": style,
            "space_id": HF_SPACE_ID,
            "message": "Imagen generada exitosamente"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[AI CRITICAL ERROR]: {str(e)}")
        raise HTTPException(500, f"Error al generar la vista previa: {str(e)}")