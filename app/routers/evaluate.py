import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db, User
from app.dependencies import get_current_user
from app.schemas import PromptRequest

from app.services.groq_service import groq_chat
from app.services.json_parser import parse_json_reply
from app.services.activity import log_activity
from app.services.counters import bump_counters

router = APIRouter(tags=["Prompt Evaluator"])


@router.post("/evaluate/ai")
def evaluate_prompt_ai(
    request: PromptRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    AI-powered prompt evaluation across five dimensions.
    """

    system_instruction = (
        "You are a world-class prompt engineering expert. Evaluate the given prompt "
        "on EXACTLY these 5 dimensions, scoring each from 0–20:\n"
        "  - clarity: how unambiguous and specific the instruction is\n"
        "  - context: how well it establishes background, audience, and use case\n"
        "  - constraints: whether it specifies limits, tone, length, or things to avoid\n"
        "  - structure: logical flow and formatting of the prompt itself\n"
        "  - output_format: whether it specifies the desired output shape\n\n"

        "Also provide:\n"
        "  - total_score: sum of the 5 scores (0–100)\n"
        "  - verdict: one sentence rating\n"
        "  - strengths: array of short strings\n"
        "  - weaknesses: array of short strings\n"
        "  - suggestions: array of actionable tips\n"
        "  - better_example: rewritten prompt scoring above 90\n\n"

        "Respond ONLY with valid JSON matching:\n"

        '{"clarity":0,"context":0,"constraints":0,"structure":0,"output_format":0,'
        '"total_score":0,"verdict":"","strengths":[],"weaknesses":[],'
        '"suggestions":[],"better_example":""}'
    )

    try:

        raw = groq_chat(
            [
                {
                    "role": "system",
                    "content": system_instruction,
                },
                {
                    "role": "user",
                    "content": request.prompt,
                },
            ],
            temperature=0.15,
            max_tokens=700,
        )

        scores = parse_json_reply(raw)

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502,
            detail="AI returned an unexpected format. Please try again.",
        )

    except Exception:
        raise

    total = scores.get("total_score", 0)

    bump_counters(
        db,
        user.id,
        evaluate=True,
        score=total,
    )

    snippet = request.prompt[:50]

    if len(request.prompt) > 50:
        snippet += "..."

    log_activity(
        db,
        user.id,
        "evaluate",
        f'Evaluated prompt — score {total}/100 · "{snippet}"',
    )

    return {
        "prompt": request.prompt,
        "scores": scores,
    }