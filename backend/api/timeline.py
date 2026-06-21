from fastapi import APIRouter, HTTPException
from services.timeline import TimelineService

router = APIRouter(prefix="/timeline", tags=["Timeline Replay"])

@router.get("/replay/{session_id}")
def replay_timeline(session_id: str):
    return TimelineService.replay(session_id)
