from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db, User, UserCounters, PromptLibraryEntry, PromptVersion, ActivityLog
from app.dependencies import get_current_user

router = APIRouter(tags=["Analytics"])


@router.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Returns the current user's usage stats and their 10 most recent activity entries."""
    counters = db.query(UserCounters).filter(UserCounters.user_id == user.id).first()

    avg_score = 0.0
    evaluate_calls = counters.evaluate_calls if counters else 0
    optimize_calls = counters.optimize_calls if counters else 0
    if counters and counters.scores_recorded > 0:
        avg_score = round(counters.total_score_sum / counters.scores_recorded, 1)

    prompts_in_library = db.query(PromptLibraryEntry).count()
    versions_saved = db.query(PromptVersion).filter(PromptVersion.user_id == user.id).count()

    recent = (
        db.query(ActivityLog)
        .filter(ActivityLog.user_id == user.id)
        .order_by(ActivityLog.id.desc())
        .limit(10)
        .all()
    )
    recent_activity = [
        {"label": a.label, "action": a.action, "created_at": a.created_at.isoformat()}
        for a in recent
    ]

    return {
        "evaluate_calls": evaluate_calls,
        "optimize_calls": optimize_calls,
        "average_score": avg_score,
        "prompts_in_library": prompts_in_library,
        "versions_saved": versions_saved,
        "recent_activity": recent_activity,
    }
