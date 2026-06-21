from pydantic import BaseModel
from typing import Literal

class AgentStateUpdate(BaseModel):
    agent_name: str
    state: Literal["idle", "running", "completed"]
