from fastapi import APIRouter, Query
from typing import Optional
from schemas.memory import MemoryAdd, MemoryAddResponse, MemoryGetResponse
from services.memory import MemoryService

router = APIRouter(prefix="/memory", tags=["Memory"])

@router.post("/add", response_model=MemoryAddResponse)
def add_memory(memory_in: MemoryAdd):
    return MemoryService.add_memory(memory_in)

@router.get("/get", response_model=MemoryGetResponse)
def get_memory(
    scope: str = Query(..., description="Options: 'session', 'shared'"),
    session_id: Optional[str] = Query(None, description="UUID of session, required if scope is 'session'"),
    key: Optional[str] = Query(None, description="Memory key filter"),
    tag: Optional[str] = Query(None, description="Tag filter (shared memory only)")
):
    return MemoryService.get_memory(scope=scope, session_id=session_id, key=key, tag=tag)
