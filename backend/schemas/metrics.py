from pydantic import BaseModel, Field
from typing import Dict, Any

class AgentMetrics(BaseModel):
    invocations: int = 0
    errors: int = 0

class MetricsResponse(BaseModel):
    global_metrics: Dict[str, Any] = Field(..., alias="global")
    agents: Dict[str, AgentMetrics]
    active_sessions_count: int

    class Config:
        populate_by_name = True
