import pytest
import time
import json
import unittest.mock
from fastapi.testclient import TestClient
from valkey_client.client import valkey
from services.semantic_cache import SemanticCacheService
from services.memory import MemoryService
from services.timeline import TimelineService
from services.pubsub import PubSubService
from services.agent import AgentService
from services.analytics import AnalyticsService
from sdk.client import MemoryOSClient

def test_semantic_cache():
    prompt = "How does Valkey replication work?"
    response = "Valkey replication is asynchronous by default..."
    
    # Store in cache
    prompt_hash = SemanticCacheService.store(prompt, response, tokens_saved=42, latency=1.2)
    assert prompt_hash is not None
    
    # Search cache (hit)
    hit = SemanticCacheService.search("How does Valkey replication work?", threshold=0.8)
    assert hit is not None
    assert hit["response"] == response
    assert hit["similarity_score"] > 0.8
    
    # Search cache (miss)
    miss = SemanticCacheService.search("weather in Paris", threshold=0.85)
    assert miss is None
    
    # Stats
    assert SemanticCacheService.hit_rate() > 0.0
    assert SemanticCacheService.token_savings() >= 42

def test_vector_search():
    # Store shared memory items
    MemoryService.add_memory(
        MemoryAddSchema(
            scope="shared",
            key="valkey_replication_doc",
            value="Replication is set up using replicaof command.",
            author="ResearchAgent",
            tags=["valkey", "repl"]
        )
    )
    MemoryService.add_memory(
        MemoryAddSchema(
            scope="shared",
            key="fastapi_cors_doc",
            value="CORSMiddleware allows cross-origin requests.",
            author="WriterAgent",
            tags=["fastapi", "cors"]
        )
    )
    
    # Run vector search - query with high semantic overlap and lower threshold
    matches = MemoryService.vector_search("Replication is set up using replicaof command.", threshold=0.4)
    assert len(matches) > 0
    assert matches[0]["key"] == "valkey_replication_doc"
    assert "valkey" in matches[0]["tags"]
    assert matches[0]["source_session"] == "shared"

def test_timeline_replay():
    # Create a session
    sess_id = "test-session-uuid"
    valkey.hset(f"memoryos:session:{sess_id}", {
        "id": sess_id,
        "name": "Test Timeline Session",
        "status": "active",
        "created_at": str(time.time()),
        "updated_at": str(time.time()),
        "metadata": "{}"
    })
    valkey.sadd("memoryos:session:all", sess_id)
    
    # Add timeline events using stream
    valkey.xadd(f"memoryos:timeline:stream:{sess_id}", {
        "event_id": "e1",
        "timestamp": str(time.time()),
        "agent_name": "ResearchAgent",
        "event_type": "execution_start",
        "payload": json.dumps({"status": "running"})
    })
    valkey.xadd(f"memoryos:timeline:stream:{sess_id}", {
        "event_id": "e2",
        "timestamp": str(time.time() + 0.1),
        "agent_name": "ResearchAgent",
        "event_type": "completion",
        "payload": json.dumps({"status": "done"})
    })
    
    # Store a memory linked to ResearchAgent in this session
    MemoryService.add_memory(
        MemoryAddSchema(
            scope="session",
            session_id=sess_id,
            key="test_fact",
            value="Some session fact text",
            author="ResearchAgent"
        )
    )
    
    # Replay
    replay = TimelineService.replay(sess_id)
    assert len(replay) > 0
    research_step = next(s for s in replay if s["agent_name"] == "ResearchAgent")
    assert research_step["status"] == "completed"
    assert "test_fact" in research_step["memories"]

def test_pubsub():
    received_msgs = []
    def callback(data):
        received_msgs.append(data)
        
    PubSubService.subscribe("research.complete", callback)
    # Sleep to allow the subscriber background thread to establish socket connection
    time.sleep(0.3)
    
    # Publish message
    payload = {"status": "success", "agent": "ResearchAgent"}
    PubSubService.publish("research.complete", payload)
    
    # Allow some time for background thread to receive and route message
    time.sleep(0.3)
    
    assert len(received_msgs) > 0
    assert received_msgs[0]["agent"] == "ResearchAgent"
    
    # Cleanup thread
    PubSubService.unsubscribe_all()

def test_analytics_leaderboards():
    # Increment writes
    AnalyticsService.track_session_write("session-1")
    AnalyticsService.track_session_write("session-1")
    AnalyticsService.track_session_write("session-2")
    
    AnalyticsService.track_agent_invocation("ResearchAgent")
    AnalyticsService.track_agent_invocation("WriterAgent")
    AnalyticsService.track_agent_invocation("ResearchAgent")
    
    AnalyticsService.track_agent_tokens("WriterAgent", 150)
    AnalyticsService.track_agent_tokens("ResearchAgent", 50)
    
    leaderboards = AnalyticsService.get_leaderboards()
    
    assert len(leaderboards["top_sessions"]) > 0
    assert leaderboards["top_sessions"][0]["name"] == "session-1"
    
    assert len(leaderboards["top_agents"]) > 0
    assert leaderboards["top_agents"][0]["name"] == "ResearchAgent"
    
    assert len(leaderboards["token_savings_leaderboard"]) > 0
    assert leaderboards["token_savings_leaderboard"][0]["name"] == "WriterAgent"

def test_sdk_client(client: TestClient):
    sdk_client = MemoryOSClient()
    
    # Mock httpx requests to point to FastAPI TestClient
    def mock_post(url, *args, **kwargs):
        path = url.replace("http://localhost:8000", "")
        json_data = kwargs.get("json")
        res = client.post(path, json=json_data)
        mock_res = unittest.mock.Mock()
        mock_res.json.return_value = res.json()
        mock_res.raise_for_status = lambda: None if res.status_code == 200 else res.raise_for_status()
        return mock_res

    def mock_get(url, *args, **kwargs):
        path = url.replace("http://localhost:8000", "")
        params = kwargs.get("params")
        res = client.get(path, params=params)
        mock_res = unittest.mock.Mock()
        mock_res.json.return_value = res.json()
        mock_res.raise_for_status = lambda: None if res.status_code == 200 else res.raise_for_status()
        return mock_res

    with unittest.mock.patch("httpx.post", side_effect=mock_post), \
         unittest.mock.patch("httpx.get", side_effect=mock_get):
         
         # SDK Store & Search cache
         store_res = sdk_client.cache.semantic("test prompt", "cached reply", tokens_saved=20, latency=0.5)
         assert store_res["status"] == "success"
         
         # Search using identical prompt to guarantee cache hit
         search_res = sdk_client.cache.semantic("test prompt", threshold=0.8)
         assert search_res["hit"] is True
         assert search_res["data"]["response"] == "cached reply"
         
         # SDK metrics
         metrics_res = sdk_client.metrics.get()
         assert "global" in metrics_res
         assert "active_sessions_count" in metrics_res

# Helper class for schemas inside test file without extra imports
class MemoryAddSchema:
    def __init__(self, scope, key, value, author, session_id=None, tags=[]):
        self.scope = scope
        self.key = key
        self.value = value
        self.author = author
        self.session_id = session_id
        self.tags = tags
