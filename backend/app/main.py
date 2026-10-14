"""FastAPI application entry-point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints import router as v1_router
from app.config import settings

app = FastAPI(
    title="Physics AI Tutor API",
    version="1.0.0",
    description=(
        "MVP backend that accepts a photo of a handwritten physics solution, "
        "evaluates it via Gemini using the Socratic method, and returns "
        "structured feedback in Kazakh."
    ),
)

# ── CORS ────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ─────────────────────────────────────────────────────────────
app.include_router(v1_router, prefix="/api/v1")
