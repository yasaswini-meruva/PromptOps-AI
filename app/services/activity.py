from sqlalchemy.orm import Session
from app.database import ActivityLog


def log_activity(
    db: Session,
    user_id: int,
    action: str,
    label: str,
):
    """
    Saves an activity entry.
    Never interrupts the main request if logging fails.
    """
    try:
        db.add(
            ActivityLog(
                user_id=user_id,
                action=action,
                label=label,
            )
        )
        db.commit()
    except Exception:
        db.rollback()