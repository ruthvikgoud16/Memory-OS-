from fastapi import APIRouter, Query, status
from typing import Optional
from schemas.event import EventAdd, EventAddResponse, EventListResponse
from services.event import EventService

router = APIRouter(prefix="/events", tags=["Event Timeline"])

@router.post("/add", response_model=EventAddResponse, status_code=status.HTTP_201_CREATED)
def add_event(event_in: EventAdd):
    return EventService.add_event(event_in)

@router.get("/list", response_model=EventListResponse)
def list_events(
    session_id: Optional[str] = Query(None, description="UUID of session, if omitted lists global stream"),
    limit: int = Query(50, description="Max entries to return"),
    order: str = Query("asc", description="Sort timeline order: 'asc' or 'desc'")
):
    return EventService.list_events(session_id=session_id, limit=limit, order=order)
