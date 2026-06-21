from valkey_client.client import valkey
from typing import Dict, List

class AgentService:
    RUNNING_KEY = "memoryos:agents:running"
    IDLE_KEY = "memoryos:agents:idle"
    COMPLETED_KEY = "memoryos:agents:completed"

    @classmethod
    def track_agent_start(cls, agent_name: str):
        valkey.srem(cls.IDLE_KEY, agent_name)
        valkey.srem(cls.COMPLETED_KEY, agent_name)
        valkey.sadd(cls.RUNNING_KEY, agent_name)

    @classmethod
    def track_agent_complete(cls, agent_name: str):
        valkey.srem(cls.RUNNING_KEY, agent_name)
        valkey.srem(cls.IDLE_KEY, agent_name)
        valkey.sadd(cls.COMPLETED_KEY, agent_name)

    @classmethod
    def track_agent_idle(cls, agent_name: str):
        valkey.srem(cls.RUNNING_KEY, agent_name)
        valkey.srem(cls.COMPLETED_KEY, agent_name)
        valkey.sadd(cls.IDLE_KEY, agent_name)

    @classmethod
    def get_agent_states(cls) -> Dict[str, List[str]]:
        core_agents = ["ResearchAgent", "WriterAgent", "ReviewerAgent"]
        
        running = valkey.smembers(cls.RUNNING_KEY)
        idle = valkey.smembers(cls.IDLE_KEY)
        completed = valkey.smembers(cls.COMPLETED_KEY)
        
        # Default initialization for consistency
        if not running and not idle and not completed:
            for agent in core_agents:
                valkey.sadd(cls.IDLE_KEY, agent)
            idle = core_agents

        return {
            "running": list(running),
            "idle": list(idle),
            "completed": list(completed)
        }
