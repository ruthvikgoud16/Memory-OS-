from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional

class EventAdd(BaseModel):
    session_id: str = Field(..., description="The unique session ID")
    agent_name: str = Field(..., description="The agent recording the event")
    event_type: str = Field(..., description="Options: 'execution_start', 'tool_call', 'state_update', 'error', 'completion'")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Custom event details dictionary")

class EventAddResponse(BaseModel):
    status: str
    event_id: str
    session_id: str
    timestamp: float

class EventResponseItem(BaseModel):
    event_id: str
    timestamp: float
    agent_name: str
    event_type: str
    payload: Dict[str, Any]

class EventListResponse(BaseModel):
    session_id: Optional[str] = None
    events: List[EventResponseItem]
