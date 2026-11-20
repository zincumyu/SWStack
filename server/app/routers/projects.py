"""Project board flag.

The projects domain is not part of the minimum loop, but the frontend asks for
this flag on boot. Reporting the board as closed keeps every project entry point
hidden instead of showing broken links.
"""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["projects"])


@router.get("/projects/board")
def board() -> dict:
    return {"enabled": False}
