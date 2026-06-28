from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db, PromptLibraryEntry

router = APIRouter(tags=["Prompt Library"])


@router.get("/library")
def get_library(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Returns prompt templates from the database.
    Optional filters: ?category=Resume  or  ?search=agent
    """
    query = db.query(PromptLibraryEntry)
    if category:
        # Exact case-insensitive match — prevents "AI" accidentally matching
        # unrelated categories that happen to contain those letters as a substring.
        query = query.filter(PromptLibraryEntry.category.ilike(category))
    if search:
        term = f"%{search}%"
        query = query.filter(
            PromptLibraryEntry.title.ilike(term) |
            PromptLibraryEntry.prompt.ilike(term) |
            PromptLibraryEntry.category.ilike(term)
        )
    prompts = query.order_by(PromptLibraryEntry.id).all()
    return {
        "count": len(prompts),
        "prompts": [
            {"id": p.id, "category": p.category, "title": p.title, "prompt": p.prompt}
            for p in prompts
        ],
    }


@router.get("/library/categories")
def get_categories(db: Session = Depends(get_db)):
    """Returns the distinct categories present in the library."""
    rows = db.query(PromptLibraryEntry.category).distinct().all()
    return {"categories": sorted(r[0] for r in rows)}