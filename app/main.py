"""
PromptOps AI — Backend
-----------------------
FastAPI server powering the PromptOps AI workspace.
All AI calls use Groq (LLaMA 3.3 70B).
"""

from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import (
    get_db, init_db, SessionLocal,
    PromptLibraryEntry,
)
from app.routers.auth import router as auth_router
from app.routers.library import router as library_router
from app.routers.versions import router as versions_router
from app.routers.analytics import router as analytics_router
from app.routers.playground import router as playground_router
from app.routers.abtest import router as abtest_router
from app.routers.evaluate import router as evaluate_router
from app.routers.optimize import router as optimize_router

load_dotenv()

app = FastAPI(
    title="PromptOps AI",
    description="Backend API for the PromptOps AI platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(auth_router)
app.include_router(evaluate_router)
app.include_router(optimize_router)
app.include_router(library_router)
app.include_router(versions_router)
app.include_router(analytics_router)
app.include_router(playground_router)
app.include_router(abtest_router)


# ─────────────────────────────────────────────
# STARTUP
# ─────────────────────────────────────────────

@app.on_event("startup")
def on_startup():
    init_db()

    if SessionLocal is None:
        return

    db = SessionLocal()
    try:
        _seed_library(db)
    finally:
        db.close()


def _seed_library(db: Session):
    """
    Insert any seed prompts that don't already exist in the database.
    Uses title as the unique key — safe to call on every startup.
    Existing rows are never modified or deleted.
    """
    seeds = [
        {
            "category": "Resume",
            "title": "Resume Summary Generator",
            "prompt": (
                "Write a 3-sentence professional summary for a [role] with [X years] of experience in [domain]. "
                "Highlight [2-3 key skills]. Tone: confident, results-oriented. "
                "Output format: plain paragraph, no bullet points, under 60 words."
            ),
        },
        {
            "category": "UI Design",
            "title": "Dark SaaS Landing Page",
            "prompt": (
                "Design a dark, glassmorphic SaaS landing page for [product] targeting [audience]. "
                "Include: (1) hero with value proposition + CTA, (2) 3-feature bento grid, (3) social proof section. "
                "Stack: React + Tailwind + Framer Motion. Output: full component code with comments."
            ),
        },
        {
            "category": "AI Agents",
            "title": "RAG Support Agent System Prompt",
            "prompt": (
                "You are a support agent for [product]. "
                "Rules: (1) Answer only using the provided context documents. "
                "(2) Always cite the source doc by name. "
                "(3) If the answer isn't in the documents, say exactly: 'I don't have that information.' "
                "(4) Reply in under 120 words. (5) Never guess or hallucinate."
            ),
        },
        {
            "category": "Content Writing",
            "title": "Engaging Blog Introduction",
            "prompt": (
                "Write a 100-word blog introduction about [topic] for [audience]. "
                "Tone: conversational and direct — no fluff, no clichés like 'In today's world'. "
                "Hook the reader in the first sentence. End with a question that makes them want to keep reading."
            ),
        },
        {
            "category": "Full Stack Apps",
            "title": "REST API Endpoint Generator",
            "prompt": (
                "Build a [language/framework] REST API endpoint for [resource]. "
                "Requirements: proper HTTP methods (GET/POST/PUT/DELETE), input validation, "
                "error responses with status codes, and inline docstrings. "
                "Output: production-ready code with a usage example."
            ),
        },
        {
            "category": "AI Agents",
            "title": "Chain-of-Thought Reasoning Prompt",
            "prompt": (
                "Solve [problem] step by step. "
                "Format: (1) Restate the problem in your own words. "
                "(2) List assumptions. (3) Show each reasoning step clearly numbered. "
                "(4) State your final answer on a new line starting with 'Answer:'. "
                "If you're unsure at any step, say so."
            ),
        },
        {
            "category": "Marketing",
            "title": "Product Launch Email",
            "prompt": (
                "Write a launch email for [product] going to [audience] on [date]. "
                "Structure: subject line (under 50 chars), preview text (under 90 chars), "
                "3-paragraph body (hook → value → CTA), and a P.S. Tone: [brand voice]. "
                "Output format: plain text with labels for each section."
            ),
        },
    ]

    # Fetch all titles already in the DB in a single query
    existing_titles = {
        row.title for row in db.query(PromptLibraryEntry.title).all()
    }

    new_entries = [
        PromptLibraryEntry(**seed)
        for seed in seeds
        if seed["title"] not in existing_titles
    ]

    if new_entries:
        db.add_all(new_entries)
        db.commit()


# ─────────────────────────────────────────────
# HEALTH
# ─────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"message": "PromptOps AI backend is running.", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
    }