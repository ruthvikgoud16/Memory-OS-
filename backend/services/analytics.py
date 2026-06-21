from valkey_client.client import valkey
from typing import Dict, List, Any

class AnalyticsService:
    @classmethod
    def track_session_write(cls, session_id: str):
        try:
            valkey.get_client().zincrby("memoryos:analytics:sessions:writes", 1.0, session_id)
        except Exception:
            pass

    @classmethod
    def track_agent_invocation(cls, agent_name: str):
        try:
            valkey.get_client().zincrby("memoryos:analytics:agents:invocations", 1.0, agent_name)
        except Exception:
            pass

    @classmethod
    def track_agent_cache_hit(cls, agent_name: str):
        try:
            valkey.get_client().zincrby("memoryos:analytics:agents:cache_hits", 1.0, agent_name)
        except Exception:
            pass

    @classmethod
    def track_agent_tokens(cls, agent_name: str, tokens: int):
        try:
            valkey.get_client().zincrby("memoryos:analytics:agents:tokens", float(tokens), agent_name)
        except Exception:
            pass

    @classmethod
    def get_leaderboards(cls) -> Dict[str, Any]:
        client = valkey.get_client()
        
        def fetch_zset(key: str) -> List[Dict[str, Any]]:
            try:
                raw = client.zrevrange(key, 0, 9, withscores=True)
                return [{"name": item, "score": int(score)} for item, score in raw]
            except Exception:
                return []

        top_sessions = fetch_zset("memoryos:analytics:sessions:writes")
        top_agents = fetch_zset("memoryos:analytics:agents:invocations")
        top_cache_hits = fetch_zset("memoryos:analytics:agents:cache_hits")
        top_tokens = fetch_zset("memoryos:analytics:agents:tokens")
        
        # Core agent defaults for presentation consistency
        core_agents = ["ResearchAgent", "WriterAgent", "ReviewerAgent"]
        
        if not top_agents:
            top_agents = [{"name": name, "score": 0} for name in core_agents]
        if not top_cache_hits:
            top_cache_hits = [{"name": name, "score": 0} for name in core_agents]
        if not top_tokens:
            top_tokens = [{"name": name, "score": 0} for name in core_agents]

        return {
            "top_sessions": top_sessions,
            "top_agents": top_agents,
            "cache_efficiency_leaderboard": top_cache_hits,
            "token_savings_leaderboard": top_tokens
        }
