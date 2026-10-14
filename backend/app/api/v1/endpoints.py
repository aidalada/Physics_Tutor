"""API v1 endpoints for the Physics AI Tutor service."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, File, Form, UploadFile

from app.schemas.evaluation import SolutionFeedback
from app.services import gemini_service, image_service

router = APIRouter()


@router.get("/health", summary="Health-check", tags=["System"])
async def health_check() -> dict[str, str]:
    """Return service liveness status."""
    return {"status": "ok"}


@router.post(
    "/evaluate",
    response_model=SolutionFeedback,
    summary="Evaluate a handwritten physics solution",
    tags=["Evaluation"],
)
async def evaluate(
    file: UploadFile = File(..., description="Фото рукописного решения (JPEG/PNG/WebP)"),
    problem_statement: Optional[str] = Form(
        None, description="Текст условия задачи (необязательно)"
    ),
) -> SolutionFeedback:
    """Accept an image of a handwritten physics solution, process it, send to
    Gemini for Socratic evaluation, and return structured feedback.
    """
    image = await image_service.process_and_validate_image(file)
    feedback = await gemini_service.evaluate_solution(image, problem_statement)
    return feedback
