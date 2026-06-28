from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db, User
from app.dependencies import get_current_user
from app.schemas import PlaygroundRequest
from app.services.groq_service import groq_chat, run_prompt
from app.services.json_parser import parse_json_reply
from app.services.activity import log_activity

router = APIRouter(tags=["Playground"])


@router.post("/playground/compare")
def playground_compare(
    request: PlaygroundRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Runs prompt_a and prompt_b through the AI and returns both outputs,
    plus a brief AI-generated comparison summary and a winner verdict.
    """
    output_a = run_prompt(request.prompt_a)
    output_b = run_prompt(request.prompt_b)

    # Ask the AI to compare the two outputs
    compare_sys = (
        "You are a prompt quality judge. Compare two AI responses to different prompt versions. "
        "Respond ONLY with valid JSON (no markdown):\n"
        '{"winner":"A or B or Tie","summary":"one sentence why","score_a":0,"score_b":0}'
    )
    compare_user = (
        f"PROMPT A: {request.prompt_a}\nRESPONSE A: {output_a}\n\n"
        f"PROMPT B: {request.prompt_b}\nRESPONSE B: {output_b}"
    )
    try:
        raw = groq_chat(
            [{"role": "system", "content": compare_sys}, {"role": "user", "content": compare_user}],
            temperature=0,
            max_tokens=120,
        )
        comparison = parse_json_reply(raw)
    except Exception:
        comparison = {"winner": "—", "summary": "Could not generate comparison.", "score_a": 0, "score_b": 0}

    log_activity(db, user.id, "playground", f"Playground run — winner: {comparison.get('winner', '—')}")

    return {
        "prompt_a": request.prompt_a,
        "output_a": output_a,
        "prompt_b": request.prompt_b,
        "output_b": output_b,
        "winner": comparison.get("winner", "—"),
        "comparison_summary": comparison.get("summary", ""),
        "score_a": comparison.get("score_a", 0),
        "score_b": comparison.get("score_b", 0),
    }
