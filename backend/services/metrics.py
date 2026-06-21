from valkey_client.client import valkey
from schemas.metrics import MetricsResponse, AgentMetrics
from typing import Dict, Any

class MetricsService:
    @staticmethod
    def get_metrics() -> MetricsResponse:
        # Fetch global metrics
        global_raw = valkey.hgetall("memoryos:metrics:global")
        
        # Helper to convert to int/float with default 0
        def get_int(d: Dict[str, str], k: str) -> int:
            try:
                return int(d.get(k, "0"))
            except ValueError:
                return 0

        def get_float(d: Dict[str, str], k: str) -> float:
            try:
                return float(d.get(k, "0.0"))
            except ValueError:
                return 0.0

        # Extract values
        total_sessions = get_int(global_raw, "total_sessions_created")
        total_events = get_int(global_raw, "total_events_logged")
        total_messages = get_int(global_raw, "total_messages_routed")
        total_writes = get_int(global_raw, "total_memory_writes")
        
        request_count = get_int(global_raw, "request_count")
        cache_hits = get_int(global_raw, "cache_hits")
        cache_misses = get_int(global_raw, "cache_misses")
        tokens_saved = get_int(global_raw, "tokens_saved")
        
        total_latency_ms = get_float(global_raw, "total_latency_ms")
        latency_request_count = get_int(global_raw, "latency_request_count")
        
        # Calculate latency rolling average
        latency = 0.0
        if latency_request_count > 0:
            latency = total_latency_ms / latency_request_count

        global_metrics = {
            "total_sessions_created": total_sessions,
            "total_events_logged": total_events,
            "total_messages_routed": total_messages,
            "total_memory_writes": total_writes,
            "request_count": request_count,
            "cache_hits": cache_hits,
            "cache_misses": cache_misses,
            "tokens_saved": tokens_saved,
            "latency": round(latency, 4)
        }

        # Fetch active sessions count
        active_count = valkey.get_client().scard("memoryos:session:active")

        # Fetch agent metrics
        agent_raw = valkey.hgetall("memoryos:metrics:agents")
        agents_data: Dict[str, AgentMetrics] = {}
        
        # Always initialize core agents in response for API contract consistency
        for agent in ["ResearchAgent", "WriterAgent", "ReviewerAgent"]:
            agents_data[agent] = AgentMetrics(invocations=0, errors=0)

        for k, v in agent_raw.items():
            if ":" in k:
                agent_name, metric_type = k.split(":", 1)
                if agent_name not in agents_data:
                    agents_data[agent_name] = AgentMetrics(invocations=0, errors=0)
                
                try:
                    val = int(v)
                except ValueError:
                    val = 0
                    
                if metric_type == "invocations":
                    agents_data[agent_name].invocations = val
                elif metric_type == "errors":
                    agents_data[agent_name].errors = val

        return MetricsResponse(
            global_metrics=global_metrics,
            agents=agents_data,
            active_sessions_count=active_count
        )
