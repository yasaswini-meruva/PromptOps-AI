from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db, User
from app.dependencies import get_current_user
from app.schemas import ABTestRequest
from app.services.groq_service import run_prompt, score_output
from app.services.activity import log_activity

router = APIRouter(tags=["A/B Testing"])


@router.post("/ab-test")
def ab_test(
    request: ABTestRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Runs prompt_a and prompt_b against every test input.
    Each output is scored by an AI judge.
    Returns per-test results, averages, winner, and a recommendation.
    """
    results = []
    total_a, total_b = 0, 0

    for test_input in request.test_inputs:
        full_a = f"{request.prompt_a}\n\nInput: {test_input}"
        full_b = f"{request.prompt_b}\n\nInput: {test_input}"

        output_a = run_prompt(full_a)
        output_b = run_prompt(full_b)

        score_a = score_output(test_input, output_a)
        score_b = score_output(test_input, output_b)

        total_a += score_a
        total_b += score_b

        results.append({
            "test_input": test_input,
            "output_a": output_a,
            "score_a": score_a,
            "output_b": output_b,
            "score_b": score_b,
            "winner": "A" if score_a > score_b else ("B" if score_b > score_a else "Tie"),
        })

    count = max(len(request.test_inputs), 1)
    avg_a = round(total_a / count, 1)
    avg_b = round(total_b / count, 1)

    if avg_a > avg_b:
        winner = "Prompt A"
        recommendation = f"Use Prompt A — it outperformed Prompt B by {round(avg_a - avg_b, 1)} points on average."
    elif avg_b > avg_a:
        winner = "Prompt B"
        recommendation = f"Use Prompt B — it outperformed Prompt A by {round(avg_b - avg_a, 1)} points on average."
    else:
        winner = "Tie"
        recommendation = "Both prompts performed equally. Consider merging their strongest elements."

    log_activity(db, user.id, "ab_test", f"Experiment ran {count} test(s) — {winner} wins")

    return {
        "prompt_a": request.prompt_a,
        "prompt_b": request.prompt_b,
        "results_per_test": results,
        "average_score_a": avg_a,
        "average_score_b": avg_b,
        "winner": winner,
        "recommendation": recommendation,
    }
