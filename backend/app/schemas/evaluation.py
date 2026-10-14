"""Pydantic v2 schemas for the physics solution evaluation.

These models serve double duty:
  1. FastAPI response schema for the REST endpoint.
  2. `response_schema` for Gemini structured-output generation.
"""

from pydantic import BaseModel, Field


class RubricBreakdown(BaseModel):
    """Per-rubric scores (total max = 100)."""

    si_units_and_given: int = Field(
        ...,
        ge=0,
        le=15,
        description="Берілгені мен ХБЖ бірліктеріне аудару (макс 15 балл)",
    )
    physics_laws_setup: int = Field(
        ...,
        ge=0,
        le=35,
        description="Физикалық заңдарды дұрыс таңдау, сызба мен күш проекциялары (макс 35 балл)",
    )
    math_derivations: int = Field(
        ...,
        ge=0,
        le=30,
        description="Математикалық өрнектеулер мен алгебралық түрлендірулер (макс 30 балл)",
    )
    calculation_units: int = Field(
        ...,
        ge=0,
        le=20,
        description="Сандық есептеу және соңғы өлшем бірлігі (макс 20 балл)",
    )


class SolutionFeedback(BaseModel):
    """Top-level evaluation result returned to the client."""

    total_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="Жалпы балл (0 мен 100 аралығы)",
    )
    rubric: RubricBreakdown
    strong_points: list[str] = Field(
        ...,
        description="Оқушының дұрыс орындаған қадамдары (қазақ тілінде)",
    )
    socratic_hints: list[str] = Field(
        ...,
        description=(
            "Оқушыны қатені өзі табуға бағыттайтын Сократтық сұрақтар "
            "мен тұспалдар (қазақ тілінде)"
        ),
    )
    error_area: str = Field(
        ...,
        description="Қате жіберілген кезеңнің қысқаша анықтамасы (қазақ тілінде)",
    )
