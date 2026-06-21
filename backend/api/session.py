from fastapi import APIRouter, status
from schemas.session import SessionCreate, SessionResponse, SessionDeleteResponse
from services.session import SessionService

router = APIRouter(prefix="/session", tags=["Session"])

@router.post("/create", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(session_in: SessionCreate):
    return SessionService.create_session(session_in)

@router.get("/{id}", response_model=SessionResponse)
def get_session(id: str):
    return SessionService.get_session(id)

@router.delete("/delete/{id}", response_model=SessionDeleteResponse)
def delete_session(id: str):
    return SessionService.delete_session(id)
