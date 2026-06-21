from fastapi import APIRouter
from schemas.agent import AgentStateUpdate
from services.agent import AgentService

router = APIRouter(prefix="/agents", tags=["Agent Tracking"])

@router.get("/status")
def get_agents_status():
    return AgentService.get_agent_states()

@router.post("/state")
def update_agent_state(payload: AgentStateUpdate):
    if payload.state == "running":
        AgentService.track_agent_start(payload.agent_name)
    elif payload.state == "completed":
        AgentService.track_agent_complete(payload.agent_name)
    else:
        AgentService.track_agent_idle(payload.agent_name)
    return {"status": "success", "agent": payload.agent_name, "state": payload.state}
