from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

class SessionCreate(BaseModel):
    name: str = Field(..., description="The name of the session")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Metadata dictionary for the session")

class SessionResponse(BaseModel):
    id: str
    name: str
    status: str
    created_at: float
    updated_at: float
    metadata: Dict[str, Any]

class SessionDeleteResponse(BaseModel):
    status: str
    message: str
    session_id: str
    completed_at: float
