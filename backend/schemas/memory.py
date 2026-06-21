from pydantic import BaseModel, Field, model_validator
from typing import Dict, List, Any, Optional

class MemoryAdd(BaseModel):
    scope: str = Field(..., description="Options: 'session', 'shared'")
    session_id: Optional[str] = Field(None, description="UUID of session, required if scope is 'session'")
    key: str = Field(..., description="Memory identifier key")
    value: Any = Field(..., description="Memory content value (dict, list, string, etc.)")
    author: str = Field(..., description="Author agent identifier")
    tags: Optional[List[str]] = Field(default_factory=list, description="Optional tags for shared memory")

    @model_validator(mode='after')
    def validate_session_id(self) -> 'MemoryAdd':
        if self.scope == "session" and not self.session_id:
            raise ValueError("session_id is required when scope is 'session'")
        return self

class MemoryAddResponse(BaseModel):
    status: str
    scope: str
    key: str
    written_at: float

class MemoryItem(BaseModel):
    value: Any
    author: str
    timestamp: float

class MemoryGetResponse(BaseModel):
    scope: str
    session_id: Optional[str] = None
    memories: Dict[str, MemoryItem]
