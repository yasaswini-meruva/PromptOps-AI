from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db, User, PromptVersion
from app.dependencies import get_current_user
from app.schemas import SaveVersionRequest
from app.services.activity import log_activity

router = APIRouter(tags=["Version History"])


@router.post("/versions/save")
def save_version(
    request: SaveVersionRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Saves a new version of a prompt for the current user."""
    version = PromptVersion(user_id=user.id, name=request.name, prompt=request.prompt, score=request.score)
    db.add(version)
    db.commit()
    db.refresh(version)
    log_activity(db, user.id, "save_version", f"Saved version · \"{request.name}\"")
    return {
        "message": "Version saved",
        "version": {
            "id": version.id,
            "name": version.name,
            "prompt": version.prompt,
            "score": version.score,
            "created_at": version.created_at.isoformat() if version.created_at else None,
        },
    }


@router.get("/versions")
def list_versions(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Lists all of the current user's saved versions, newest first. Optional ?search= filter."""
    query = db.query(PromptVersion).filter(PromptVersion.user_id == user.id)
    if search:
        query = query.filter(PromptVersion.name.ilike(f"%{search}%"))
    versions = query.order_by(PromptVersion.id.desc()).all()
    return {
        "count": len(versions),
        "versions": [
            {
                "id": v.id,
                "name": v.name,
                "prompt": v.prompt,
                "score": v.score,
                "created_at": v.created_at.isoformat() if v.created_at else None,
            }
            for v in versions
        ],
    }


@router.get("/versions/{version_id}")
def get_version(
    version_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Retrieves a specific version by ID."""
    v = db.query(PromptVersion).filter(
        PromptVersion.id == version_id, PromptVersion.user_id == user.id
    ).first()
    if not v:
        raise HTTPException(status_code=404, detail=f"No version found with id {version_id}.")
    return {
        "version": {
            "id": v.id,
            "name": v.name,
            "prompt": v.prompt,
            "score": v.score,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
    }


@router.delete("/versions/{version_id}")
def delete_version(
    version_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Deletes a version by ID."""
    v = db.query(PromptVersion).filter(
        PromptVersion.id == version_id, PromptVersion.user_id == user.id
    ).first()
    if not v:
        raise HTTPException(status_code=404, detail=f"No version found with id {version_id}.")
    db.delete(v)
    db.commit()
    return {"message": f"Version #{version_id} deleted."}
