"""Basic tests for the Physics AI Tutor API.

These tests do NOT hit the real Gemini API.  They verify:
  - Health-check endpoint works.
  - File upload validation (MIME type, file size).
  - Happy-path evaluation with a mocked Gemini service.
"""

from __future__ import annotations

import io
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient
from PIL import Image

# The settings object is created at import-time, so we must ensure the
# GEMINI_API_KEY env var exists before importing the app.
import os

os.environ.setdefault("GEMINI_API_KEY", "test-key-for-ci")

from app.main import app  # noqa: E402
from app.schemas.evaluation import RubricBreakdown, SolutionFeedback  # noqa: E402

client = TestClient(app)


# ── Helpers ────────────────────────────────────────────────────────────


def _make_test_image(fmt: str = "JPEG", size: tuple[int, int] = (200, 200)) -> bytes:
    """Create a minimal in-memory image and return its bytes."""
    img = Image.new("RGB", size, color="white")
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    buf.seek(0)
    return buf.read()


def _mock_feedback() -> SolutionFeedback:
    """Return a valid ``SolutionFeedback`` instance for mocking."""
    return SolutionFeedback(
        total_score=72,
        rubric=RubricBreakdown(
            si_units_and_given=12,
            physics_laws_setup=25,
            math_derivations=20,
            calculation_units=15,
        ),
        strong_points=[
            "Берілгені дұрыс жазылған",
            "ХБЖ жүйесіне аудару дұрыс орындалған",
        ],
        socratic_hints=[
            "Тік ось бойындағы барлық күштер ескерілді ме?",
            "Өлшем бірліктер ХБЖ жүйесімен сәйкес келе ме?",
        ],
        error_area="Күштердің проекцияларын жазу кезеңі",
    )


# ── Tests ──────────────────────────────────────────────────────────────


class TestHealthCheck:
    """GET /api/v1/health"""

    def test_health_returns_ok(self) -> None:
        resp = client.get("/api/v1/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}


class TestEvaluateValidation:
    """POST /api/v1/evaluate — input validation (no Gemini call)."""

    def test_reject_unsupported_mime_type(self) -> None:
        resp = client.post(
            "/api/v1/evaluate",
            files={"file": ("doc.pdf", b"%PDF-fake-content", "application/pdf")},
        )
        assert resp.status_code == 400
        assert "Формат файла" in resp.json()["detail"]

    def test_reject_oversized_file(self) -> None:
        # Create content slightly over 8 MB
        big_content = b"\x00" * (8 * 1024 * 1024 + 1)
        resp = client.post(
            "/api/v1/evaluate",
            files={"file": ("big.jpg", big_content, "image/jpeg")},
        )
        assert resp.status_code == 413
        assert "Размер файла" in resp.json()["detail"]

    def test_reject_corrupt_image(self) -> None:
        resp = client.post(
            "/api/v1/evaluate",
            files={"file": ("bad.png", b"not-an-image", "image/png")},
        )
        assert resp.status_code == 400
        assert "Не удалось открыть" in resp.json()["detail"]


class TestEvaluateHappyPath:
    """POST /api/v1/evaluate — successful evaluation with mocked Gemini."""

    @patch("app.services.gemini_service.evaluate_solution", new_callable=AsyncMock)
    def test_returns_valid_feedback(self, mock_eval: AsyncMock) -> None:
        mock_eval.return_value = _mock_feedback()

        image_bytes = _make_test_image()
        resp = client.post(
            "/api/v1/evaluate",
            files={"file": ("solution.jpg", image_bytes, "image/jpeg")},
            data={"problem_statement": "Массасы 5 кг дене 10 м биіктіктен құлады."},
        )

        assert resp.status_code == 200
        body = resp.json()
        assert body["total_score"] == 72
        assert len(body["socratic_hints"]) == 2
        assert "rubric" in body
        mock_eval.assert_awaited_once()

    @patch("app.services.gemini_service.evaluate_solution", new_callable=AsyncMock)
    def test_works_without_problem_statement(self, mock_eval: AsyncMock) -> None:
        mock_eval.return_value = _mock_feedback()

        image_bytes = _make_test_image()
        resp = client.post(
            "/api/v1/evaluate",
            files={"file": ("solution.jpg", image_bytes, "image/jpeg")},
        )

        assert resp.status_code == 200
        mock_eval.assert_awaited_once()
