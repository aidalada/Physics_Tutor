"""Unit tests for the resilient retry and fallback mechanisms in gemini_service."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException
from google.genai.errors import APIError
from PIL import Image

from app.schemas.evaluation import RubricBreakdown, SolutionFeedback
from app.services import gemini_service


@pytest.fixture
def dummy_image() -> Image.Image:
    return Image.new("RGB", (100, 100), color="white")


@pytest.fixture
def valid_feedback() -> SolutionFeedback:
    return SolutionFeedback(
        total_score=85,
        rubric=RubricBreakdown(
            si_units_and_given=15,
            physics_laws_setup=30,
            math_derivations=25,
            calculation_units=15,
        ),
        strong_points=["Формулалар дұрыс таңдалған"],
        socratic_hints=["Векторлар бағытын тексердіңіз бе?"],
        error_area="Есептеу бөлімі",
    )


def _mock_gemini_response(payload: dict) -> MagicMock:
    mock_resp = MagicMock()
    mock_resp.text = json.dumps(payload)
    return mock_resp


def _make_api_error(code: int, status: str, message: str) -> APIError:
    return APIError(
        code=code,
        response_json={
            "error": {
                "code": code,
                "status": status,
                "message": message,
            }
        },
    )


class TestGeminiResilience:
    @pytest.mark.anyio
    async def test_retry_on_503_and_succeed(
        self, dummy_image: Image.Image, valid_feedback: SolutionFeedback
    ) -> None:
        """Should retry upon 503 error and succeed on second attempt."""
        err_503 = _make_api_error(503, "UNAVAILABLE", "High demand")
        success_resp = _mock_gemini_response(valid_feedback.model_dump())

        mock_generate = AsyncMock(side_effect=[err_503, success_resp])

        with patch.object(
            gemini_service._client.aio.models, "generate_content", mock_generate
        ), patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
            result = await gemini_service.evaluate_solution(dummy_image)

            assert result.total_score == 85
            assert mock_generate.call_count == 2
            mock_sleep.assert_awaited_once()

    @pytest.mark.anyio
    async def test_fallback_to_second_model_after_exhausting_retries(
        self, dummy_image: Image.Image, valid_feedback: SolutionFeedback
    ) -> None:
        """Should switch to fallback model when primary model fails all retries with 503."""
        err_503 = _make_api_error(503, "UNAVAILABLE", "High demand")
        success_resp = _mock_gemini_response(valid_feedback.model_dump())

        # Primary model (gemini-3.8-flash) fails 3 times, fallback (gemini-3.6-flash) succeeds
        mock_generate = AsyncMock(
            side_effect=[err_503, err_503, err_503, success_resp]
        )

        with patch.object(
            gemini_service._client.aio.models, "generate_content", mock_generate
        ), patch("asyncio.sleep", new_callable=AsyncMock):
            result = await gemini_service.evaluate_solution(dummy_image)

            assert result.total_score == 85
            assert mock_generate.call_count == 4
            # Check model name used in 4th call was the fallback
            call_kwargs = mock_generate.call_args_list[3].kwargs
            assert call_kwargs["model"] == "gemini-3.6-flash"

    @pytest.mark.anyio
    async def test_immediate_fallback_on_404(
        self, dummy_image: Image.Image, valid_feedback: SolutionFeedback
    ) -> None:
        """404 NOT_FOUND should immediately trigger fallback without wasting retries."""
        err_404 = _make_api_error(404, "NOT_FOUND", "Model not found")
        success_resp = _mock_gemini_response(valid_feedback.model_dump())

        mock_generate = AsyncMock(side_effect=[err_404, success_resp])

        with patch.object(
            gemini_service._client.aio.models, "generate_content", mock_generate
        ), patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
            result = await gemini_service.evaluate_solution(dummy_image)

            assert result.total_score == 85
            # 1st call for 3.8-flash (failed 404), 2nd call directly to 3.6-flash
            assert mock_generate.call_count == 2
            assert mock_generate.call_args_list[0].kwargs["model"] == "gemini-3.8-flash"
            assert mock_generate.call_args_list[1].kwargs["model"] == "gemini-3.6-flash"
            # No sleep delay wasted on 404
            mock_sleep.assert_not_called()

    @pytest.mark.anyio
    async def test_all_models_fail_raises_503(self, dummy_image: Image.Image) -> None:
        """When all candidate models fail all retries, return 503 HTTPException."""
        err_503 = _make_api_error(503, "UNAVAILABLE", "High demand")

        # 3 attempts for primary + 3 attempts for fallback = 6 failures
        mock_generate = AsyncMock(side_effect=[err_503] * 6)

        with patch.object(
            gemini_service._client.aio.models, "generate_content", mock_generate
        ), patch("asyncio.sleep", new_callable=AsyncMock):
            with pytest.raises(HTTPException) as exc_info:
                await gemini_service.evaluate_solution(dummy_image)

            assert exc_info.value.status_code == 503
            assert "Сервис уақытша қолжетімсіз" in exc_info.value.detail

    @pytest.mark.anyio
    async def test_handles_validation_error_with_logging(
        self, dummy_image: Image.Image, valid_feedback: SolutionFeedback
    ) -> None:
        """Should catch ValidationError on malformed JSON, retry and succeed."""
        bad_resp = _mock_gemini_response({"invalid": "schema"})
        good_resp = _mock_gemini_response(valid_feedback.model_dump())

        mock_generate = AsyncMock(side_effect=[bad_resp, good_resp])

        with patch.object(
            gemini_service._client.aio.models, "generate_content", mock_generate
        ), patch("asyncio.sleep", new_callable=AsyncMock):
            result = await gemini_service.evaluate_solution(dummy_image)
            assert result.total_score == 85
            assert mock_generate.call_count == 2
