"""Image validation, EXIF correction, and compression service."""

from __future__ import annotations

import io

from fastapi import HTTPException, UploadFile
from PIL import Image, ImageOps

from app.config import settings

ALLOWED_MIME_TYPES: set[str] = {"image/jpeg", "image/png", "image/webp"}


async def process_and_validate_image(file: UploadFile) -> Image.Image:
    """Validate, orient, convert, and resize an uploaded image.

    Returns a ready-to-send ``PIL.Image.Image`` in RGB mode with its longest
    side capped at ``settings.MAX_IMAGE_DIMENSION`` pixels.

    Raises ``HTTPException`` on validation failures.
    """

    # 1. MIME-type check ─────────────────────────────────────────────────
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Формат файла не поддерживается. Допустимы: JPEG, PNG, WebP.",
        )

    # 2. Read raw bytes & size check ────────────────────────────────────
    contents = await file.read()
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Размер файла превышает {settings.MAX_FILE_SIZE_MB} МБ.",
        )

    # 3. Open with Pillow ───────────────────────────────────────────────
    try:
        img = Image.open(io.BytesIO(contents))
        img.load()  # force decode to catch corrupt files early
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail="Не удалось открыть изображение. Файл повреждён или некорректен.",
        ) from exc

    # 4. EXIF orientation fix (phone photos) ────────────────────────────
    img = ImageOps.exif_transpose(img)

    # 5. Convert to RGB (from RGBA / P / LA / etc.) ─────────────────────
    if img.mode != "RGB":
        img = img.convert("RGB")

    # 6. Proportional downscale if needed ───────────────────────────────
    max_dim = settings.MAX_IMAGE_DIMENSION
    if max(img.size) > max_dim:
        img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

    return img
