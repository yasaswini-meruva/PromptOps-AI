from typing import Optional

from sqlalchemy.orm import Session

from app.database import UserCounters


def bump_counters(
    db: Session,
    user_id: int,
    *,
    evaluate: bool = False,
    optimize: bool = False,
    score: Optional[float] = None,
):
    """
    Updates a user's analytics counters.
    Creates a record automatically for new users.
    """

    counters = (
        db.query(UserCounters)
        .filter(UserCounters.user_id == user_id)
        .first()
    )

    if counters is None:
        counters = UserCounters(user_id=user_id)
        db.add(counters)
    if evaluate:
        counters.evaluate_calls = (counters.evaluate_calls or 0) + 1

    if optimize:
        counters.optimize_calls = (counters.optimize_calls or 0) + 1

    if score is not None:
        counters.total_score_sum = (counters.total_score_sum or 0) + score
        counters.scores_recorded = (counters.scores_recorded or 0) + 1

    db.commit()