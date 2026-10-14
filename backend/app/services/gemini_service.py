"""Gemini multimodal integration service with resilient retry and fallback mechanisms.

Features:
  - Default model with automatic fallback list (e.g. gemini-3.8-flash -> gemini-3.6-flash).
  - Retry logic for transient errors (503 UNAVAILABLE, 429 RESOURCE_EXHAUSTED).
  - Immediate fallback on 404 NOT_FOUND without wasting retries.
  - Safe response validation with raw payload logging upon ValidationError.
"""

from __future__ import annotations

import asyncio
import io
import logging
from typing import Optional

from fastapi import HTTPException
from google import genai
from google.genai import types
from google.genai.errors import APIError
from PIL import Image
from pydantic import ValidationError

from app.config import settings
from app.schemas.evaluation import SolutionFeedback

logger = logging.getLogger(__name__)

# ── System instruction (Socratic tutor, Kazakh language) ───────────────
SYSTEM_INSTRUCTION = """\
Сен — физика пәнінің тәжірибелі әдіскері және оқытушысысың. Сенің басты оқыту әдісің — Сократ диалогы (Socratic tutoring).
Сенің міндетің — оқушының фотосуреттегі қолмен жазылған физика есебінің шығарылу жолын талдау және бағалау.

НЕГІЗГІ ЕРЕЖЕЛЕР:
1. Барлық мәтіндік кері байланыс (ұсыныстар, сұрақтар, мақтаулар) ТЕК ҚАЗАҚ ТІЛІНДЕ, сауатты әрі академиялық стильде жазылуы тиіс.
2. 100 балдық жүйе бойынша бағала:
   - si_units_and_given (0-15): Берілгені мен ХБЖ
   - physics_laws_setup (0-35): Физикалық заңдар, сызба, векторлар мен проекциялар
   - math_derivations (0-30): Алгебралық өрнектеулер
   - calculation_units (0-20): Сандық есептеу мен өлшем бірлік
3. ҚАТАҢ ТЫЙЫМ САЛЫНАДЫ:
   - Дайын дұрыс жауапты немесе формулаларды айтуға («мұнда A орнына B болуы керек» деп айтпа).
   - Есептің соңғы сандық нәтижесін беруге.
   - «Сен тіректің реакция күшін ұмытып кеттің» деп нақты қатені тікелей атауға.
4. СОКРАТТЫҚ ЖЕТЕКТЕУ СҰРАҚТАРЫ (socratic_hints):
   - Қатенің қай кезеңде екенін меңзе (сызба, осьтерге проекция, бөлшек түрлендіруі).
   - Оқушыны ойландыратын жетекші сұрақ қой (мысалы: «Тік ось бойындағы барлық күштер ескерілді ме?», «Өлшем бірліктер ХБЖ жүйесімен сәйкес келе ме?»).
5. Жауапты тек берілген JSON сұлбасына сәйкес қайтар.
"""

# ── Gemini client (initialised once at module level) ───────────────────
_client = genai.Client(api_key=settings.GEMINI_API_KEY)


def _is_transient_error(api_err: APIError) -> bool:
    """Check if an APIError is transient (503, 429, 500, 502, 504)."""
    transient_codes = {429, 500, 502, 503, 504}
    transient_statuses = {
        "UNAVAILABLE",
        "RESOURCE_EXHAUSTED",
        "INTERNAL",
        "DEADLINE_EXCEEDED",
    }
    return (api_err.code in transient_codes) or (api_err.status in transient_statuses)


def _is_not_found_error(api_err: APIError) -> bool:
    """Check if model is missing or deprecated (404 NOT_FOUND)."""
    return (api_err.code == 404) or (api_err.status == "NOT_FOUND")


def _is_auth_error(api_err: APIError) -> bool:
    """Check if API key or authorization is invalid (401, 403)."""
    auth_codes = {401, 403}
    auth_statuses = {"UNAUTHENTICATED", "PERMISSION_DENIED"}
    return (api_err.code in auth_codes) or (api_err.status in auth_statuses)


async def evaluate_solution(
    image: Image.Image,
    problem_statement: Optional[str] = None,
) -> SolutionFeedback:
    """Send the processed image to Gemini and return validated feedback.

    Iterates through configured candidate models (primary + fallbacks)
    with automatic retries for transient failures (e.g. 503, 429).
    """

    # ── Prepare multimodal contents ────────────────────────────────────
    buf = io.BytesIO()
    image.save(buf, format="JPEG", quality=85)
    image_bytes = buf.getvalue()

    image_part = types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")

    user_text = "Осы фотосуреттегі оқушының қолжазба шешімін талда және бағала."
    if problem_statement:
        user_text += f"\n\nЕсеп шарты: {problem_statement}"

    text_part = types.Part.from_text(text=user_text)
    contents = [image_part, text_part]

    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_INSTRUCTION,
        response_mime_type="application/json",
        response_schema=SolutionFeedback,
        temperature=0.2,
    )

    models_to_try = settings.candidate_models
    max_retries = max(1, settings.GEMINI_MAX_RETRIES)
    base_delay = max(0.5, settings.GEMINI_RETRY_DELAY)

    last_failure_reason: Optional[str] = None

    # ── Iterate through candidate models (primary -> fallbacks) ────────
    for model_idx, model_name in enumerate(models_to_try, start=1):
        logger.info(
            "Attempting evaluation with model [%d/%d]: '%s'",
            model_idx,
            len(models_to_try),
            model_name,
        )

        for attempt in range(1, max_retries + 1):
            try:
                # Call Gemini async API
                response = await _client.aio.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=config,
                )

                raw_text = response.text
                if not raw_text:
                    logger.warning(
                        "Model '%s' returned an empty response on attempt %d/%d.",
                        model_name,
                        attempt,
                        max_retries,
                    )
                    last_failure_reason = f"Модель '{model_name}' бос жауап қайтарды."
                    if attempt < max_retries:
                        await asyncio.sleep(base_delay)
                        continue
                    break

                # Validate structured response against Pydantic schema
                try:
                    feedback = SolutionFeedback.model_validate_json(raw_text)
                    logger.info(
                        "Successfully evaluated solution using model '%s' (score=%d)",
                        model_name,
                        feedback.total_score,
                    )
                    return feedback
                except ValidationError as val_err:
                    logger.error(
                        "Schema validation failed for model '%s'. Raw response: %r. Error: %s",
                        model_name,
                        raw_text,
                        val_err,
                    )
                    last_failure_reason = "Жауап схемасына сәйкес келмеді."
                    # If model returns malformed JSON, retry if attempts remain
                    if attempt < max_retries:
                        await asyncio.sleep(base_delay)
                        continue
                    break

            except APIError as api_err:
                last_failure_reason = (
                    f"Google API Error {api_err.code} ({api_err.status}): {api_err.message}"
                )

                # 1. Non-existent or deprecated model (404): switch to next fallback immediately
                if _is_not_found_error(api_err):
                    logger.warning(
                        "Model '%s' not found or deprecated (code=%s, status=%s). "
                        "Switching to fallback model immediately.",
                        model_name,
                        api_err.code,
                        api_err.status,
                    )
                    break

                # 2. Fatal auth errors (401, 403): do not retry or switch, invalid key
                if _is_auth_error(api_err):
                    logger.critical(
                        "Fatal authentication error from Gemini API: %s (%s)",
                        api_err.code,
                        api_err.message,
                    )
                    raise HTTPException(
                        status_code=500,
                        detail=(
                            "Gemini API авторизация қатесі (API кілті жарамсыз немесе шектеулі). "
                            "Пожалуйста, проверьте GEMINI_API_KEY."
                        ),
                    ) from api_err

                # 3. Transient errors (503 UNAVAILABLE, 429 RESOURCE_EXHAUSTED, 5xx)
                if _is_transient_error(api_err):
                    delay = base_delay * (1.5 ** (attempt - 1))
                    logger.warning(
                        "Transient error from model '%s' (attempt %d/%d, code=%s, status=%s): %s. "
                        "Retrying in %.1fs...",
                        model_name,
                        attempt,
                        max_retries,
                        api_err.code,
                        api_err.status,
                        api_err.message,
                        delay,
                    )
                    if attempt < max_retries:
                        await asyncio.sleep(delay)
                        continue
                    logger.error(
                        "Model '%s' exhausted all %d retry attempts for transient error.",
                        model_name,
                        max_retries,
                    )
                    break

                # 4. Other unexpected APIError
                logger.error(
                    "Non-transient APIError with model '%s' on attempt %d: %s",
                    model_name,
                    attempt,
                    api_err,
                )
                if attempt < max_retries:
                    await asyncio.sleep(base_delay)
                    continue
                break

            except Exception as exc:
                last_failure_reason = str(exc)
                logger.exception(
                    "Unexpected exception during Gemini call with model '%s' on attempt %d/%d: %s",
                    model_name,
                    attempt,
                    max_retries,
                    exc,
                )
                if attempt < max_retries:
                    await asyncio.sleep(base_delay)
                    continue
                break

    # ── All models and retries exhausted ────────────────────────────────
    logger.critical(
        "All candidate Gemini models failed. Models tried: %s. Last error: %s",
        models_to_try,
        last_failure_reason,
    )
    raise HTTPException(
        status_code=503,
        detail=(
            "Сервис уақытша қолжетімсіз. Gemini моделіне жоғары сұраныс түсуде немесе байланыс қатесі орын алды. "
            "Өтініш, біраздан соң қайталап көріңіз. "
            "(Сервис временно недоступен из-за высокой нагрузки на Gemini API. Пожалуйста, повторите попытку позже.)"
        ),
    )
