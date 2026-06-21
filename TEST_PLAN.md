# Test Plan - MemoryOS

This document defines the validation strategy, test cases, and assertion procedures to verify the correctness of the **MemoryOS** platform in Phase 2.

---

## 1. Testing Strategy & Infrastructure

### 1.1 Test Environment Requirements
- **Local Valkey Service**: Testing requires a running Valkey instance (v7.2+) accessible locally. During CI/CD runs, this is spun up via a GitHub Action or local Docker Compose service (`valkey/valkey:latest`).
- **Python Test Harness**: Built using `pytest` and `httpx` (async API client).
- **Valkey Client Mocking**: For quick unit checks where a Valkey container isn't running, `fakeredis` can be used to simulate Valkey memory structures.

### 1.2 Test Structure Directory Layout
```
memoryos/tests/
├── conftest.py               # Shared pytest fixtures (app instance, mock Valkey pool)
├── unit/
│   ├── test_session.py       # Unit tests for Session Service
│   ├── test_memory.py        # Unit tests for Memory Service
│   ├── test_timeline.py      # Unit tests for Event Timeline Service
│   └── test_metrics.py       # Unit tests for Metrics Service
└── integration/
    └── test_demo_flow.py     # E2E test simulating the agent workflow (Research -> Writer -> Reviewer)
```

---

## 2. Unit Test Cases

### 2.1 Session Service Verification
- **Test Case 1: Active Session Creation (`POST /session/create`)**
  - **Inputs**: `{ "name": "Test Session", "metadata": { "job": "mock" } }`
  - **Valkey Assertions**:
    - Key `memoryos:session:{session_id}` exists and contains correct values for fields `name`, `status` (must be `"active"`), `created_at`, and `metadata`.
    - Members of `memoryos:session:active` and `memoryos:session:all` sets contain the newly created `{session_id}`.
    - Global metric `total_sessions_created` has incremented.
- **Test Case 2: Retrieve Session (`GET /session/{id}`)**
  - **Inputs**: Existing `session_id`.
  - **API Assertions**: Returns 200 OK status, and JSON payload matches Valkey hash fields.
  - **Edge Case**: Querying an invalid UUID returns `404 Not Found`.
- **Test Case 3: Complete Session Teardown (`DELETE /session/delete/{id}`)**
  - **Inputs**: Existing `session_id`.
  - **Valkey Assertions**:
    - Session status field in hash is updated to `"completed"`.
    - `{session_id}` is removed from `memoryos:session:active` set.
    - `{session_id}` remains in `memoryos:session:all` set for archival reporting.

### 2.2 Memory Service Verification
- **Test Case 4: Add & Get Session-Scoped Memory**
  - **Inputs**: `POST /memory/add` with scope `"session"`, target `session_id`, key `"facts"`, value `"MemoryOS stores state in Valkey"`.
  - **Valkey Assertions**:
    - Value is saved to the hash key `memoryos:memory:session:{session_id}` under field `"facts"`.
  - **API Assertions**:
    - `GET /memory/get?scope=session&session_id={session_id}&key=facts` returns the correct JSON payload, author name, and timestamp.
- **Test Case 5: Add & Get Shared Global Memory**
  - **Inputs**: `POST /memory/add` with scope `"shared"`, key `"agent:schema"`, value `{"agent_types": ["MockAgent"]}`, tags `["infrastructure", "core"]`.
  - **Valkey Assertions**:
    - Value is saved to the shared hash `memoryos:memory:shared` under field `"agent:schema"`.
    - Key `"agent:schema"` is added as a member of `memoryos:memory:shared:tag:infrastructure` and `memoryos:memory:shared:tag:core` sets.
  - **API Assertions**:
    - `GET /memory/get?scope=shared&tag=infrastructure` lists all keys under the tag, including `"agent:schema"`.

### 2.3 Event Timeline Verification
- **Test Case 6: Record Event and Read Stream**
  - **Inputs**: `POST /events/add` with `session_id`, `agent_name` `"ResearchAgent"`, `event_type` `"tool_call"`, and payload `{"query": "Valkey metrics"}`.
  - **Valkey Assertions**:
    - Streams `memoryos:timeline:stream:{session_id}` and `memoryos:timeline:global` receive an entry.
  - **API Assertions**:
    - `GET /events/list?session_id={session_id}` returns a list containing the recorded event with the timestamp, agent name, and type.

### 2.4 Metrics Collection Verification
- **Test Case 7: API Latency & Metrics Incrementation**
  - **Action**: Perform multiple write and read operations.
  - **API Assertions**:
    - `GET /metrics` returns updated counts reflecting the correct amount of global operations and agent invocations.

---

## 3. End-to-End Demo Flow Integration Test

This test verifies the entire multi-agent orchestration pipeline. It acts as the final gatekeeper for production quality.

### Scenario: Creative Writing Agent Group Run
This script is run in `tests/integration/test_demo_flow.py`:

```python
import pytest
import httpx
import time

@pytest.mark.asyncio
async def test_complete_multi_agent_workflow():
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # Step 1: Create Orchestrator Run Session
        res = await client.post("/session/create", json={
            "name": "E2E Creative Content Run",
            "metadata": {"task": "Write about Valkey"}
        })
        assert res.status_code == 201
        session = res.json()
        session_id = session["id"]

        # Step 2: Research Agent starts work
        # Logging startup event
        res = await client.post("/events/add", json={
            "session_id": session_id,
            "agent_name": "ResearchAgent",
            "event_type": "execution_start",
            "payload": {"status": "starting_research"}
        })
        assert res.status_code == 201
        
        # Storing facts collected
        res = await client.post("/memory/add", json={
            "scope": "session",
            "session_id": session_id,
            "key": "raw_facts",
            "value": {"v_features": ["low latency", "pubsub streams", "redis compatibility"]},
            "author": "ResearchAgent"
        })
        assert res.status_code == 200

        # Research Agent finishes and notifies
        res = await client.post("/events/add", json={
            "session_id": session_id,
            "agent_name": "ResearchAgent",
            "event_type": "completion",
            "payload": {"status": "research_done_facts_saved"}
        })
        assert res.status_code == 201

        # Step 3: Writer Agent consumes facts and drafts article
        # Fetching facts from short-term memory
        res = await client.get(f"/memory/get?scope=session&session_id={session_id}&key=raw_facts")
        assert res.status_code == 200
        memory_data = res.json()
        facts = memory_data["memories"]["raw_facts"]["value"]["v_features"]
        assert "low latency" in facts

        # Writing drafting event
        res = await client.post("/events/add", json={
            "session_id": session_id,
            "agent_name": "WriterAgent",
            "event_type": "tool_call",
            "payload": {"status": "drafting_article", "based_on_facts_count": len(facts)}
        })
        assert res.status_code == 201

        # Save article draft to memory
        res = await client.post("/memory/add", json={
            "scope": "session",
            "session_id": session_id,
            "key": "article_draft",
            "value": {"draft": "Valkey is a low latency store supporting pubsub streams..."},
            "author": "WriterAgent"
        })
        assert res.status_code == 200

        # Step 4: Reviewer Agent retrieves draft, reviews, approves
        # Retrieve draft
        res = await client.get(f"/memory/get?scope=session&session_id={session_id}&key=article_draft")
        assert res.status_code == 200
        draft_content = res.json()["memories"]["article_draft"]["value"]["draft"]
        assert "low latency store" in draft_content

        # Logging review execution
        res = await client.post("/events/add", json={
            "session_id": session_id,
            "agent_name": "ReviewerAgent",
            "event_type": "state_update",
            "payload": {"status": "checking_quality", "evaluation": "excellent"}
        })
        assert res.status_code == 201

        # Store approval record
        res = await client.post("/memory/add", json={
            "scope": "session",
            "session_id": session_id,
            "key": "reviewer_decision",
            "value": {"grade": "A+", "approved": True},
            "author": "ReviewerAgent"
        })
        assert res.status_code == 200

        # Step 5: Teardown Session
        res = await client.delete(f"/session/delete/{session_id}")
        assert res.status_code == 200

        # Step 6: Validate Final Telemetry & Timeline Order
        # Query active status (must be gone from active set)
        res = await client.get(f"/session/{session_id}")
        assert res.status_code == 200
        assert res.json()["status"] == "completed"

        # Query all timeline events and assert correct execution sequence
        res = await client.get(f"/events/list?session_id={session_id}")
        assert res.status_code == 200
        events = res.json()["events"]
        assert len(events) == 4
        assert events[0]["agent_name"] == "ResearchAgent"
        assert events[1]["agent_name"] == "ResearchAgent"
        assert events[2]["agent_name"] == "WriterAgent"
        assert events[3]["agent_name"] == "ReviewerAgent"

        # Query Metrics and check counts
        res = await client.get("/metrics")
        assert res.status_code == 200
        metrics = res.json()
        assert metrics["global"]["total_sessions_created"] >= 1
        assert metrics["agents"]["ResearchAgent"]["invocations"] >= 2
        assert metrics["agents"]["WriterAgent"]["invocations"] >= 1
        assert metrics["agents"]["ReviewerAgent"]["invocations"] >= 1
```

---

## 4. How to Execute the Test Suite

Follow these terminal commands in Phase 2 to spin up the local environment and launch validation testing:

```bash
# 1. Start Valkey via Docker in the background
docker run --name valkey-test -p 6379:6379 -d valkey/valkey:latest

# 2. Navigate to backend directory and install dependencies
cd memoryos/backend
pip install -r requirements-dev.txt

# 3. Run all tests with coverage reports
pytest --cov=app tests/ -v
```
