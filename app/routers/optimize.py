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

router = APIRouter(tags=["Prompt Optimizer"])


@router.post("/optimize/ai")
def optimize_prompt_ai(
    request: PromptRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Optimizes a prompt using Groq AI.
    """

    system_instruction = (
        "You are a prompt engineering expert. Given a rough or weak prompt, rewrite it "
        "to be significantly clearer, more specific, and better structured.\n\n"

        "Respond with ONLY valid JSON in exactly this format:\n"

        '{"optimized_prompt":"","what_changed":[""],'
        '"why_better":"","expected_improvement":""}'
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
            temperature=0.4,
            max_tokens=600,
        )

        result = parse_json_reply(raw)

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502,
            detail="AI returned an unexpected format. Please try again.",
        )

    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"AI call failed: {str(e)}",
        )

    bump_counters(
        db,
        user.id,
        optimize=True,
    )

    snippet = request.prompt[:50]

    if len(request.prompt) > 50:
        snippet += "..."

    log_activity(
        db,
        user.id,
        "optimize",
        f'Optimized prompt · "{snippet}"',
    )

    return {
        "original_prompt": request.prompt,
        "optimized_prompt": result.get("optimized_prompt", ""),
        "what_changed": result.get("what_changed", []),
        "why_better": result.get("why_better", ""),
        "expected_improvement": result.get(
            "expected_improvement",
            "",
        ),
    }