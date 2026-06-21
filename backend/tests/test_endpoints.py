from fastapi.testclient import TestClient

def test_session_lifecycle(client: TestClient):
    # 1. Create Session
    create_res = client.post("/session/create", json={
        "name": "Test Session Run",
        "metadata": {"task": "Verify session management", "orchestrator": "pytest"}
    })
    assert create_res.status_code == 201
    session_data = create_res.json()
    assert "id" in session_data
    assert session_data["status"] == "active"
    assert session_data["name"] == "Test Session Run"
    assert session_data["metadata"]["orchestrator"] == "pytest"
    
    session_id = session_data["id"]

    # 2. Retrieve Session Details
    get_res = client.get(f"/session/{session_id}")
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert get_data["id"] == session_id
    assert get_data["status"] == "active"
    
    # Retrieve Invalid Session (404)
    get_invalid = client.get("/session/invalid-uuid-string")
    assert get_invalid.status_code == 404

    # 3. Teardown Session
    delete_res = client.delete(f"/session/delete/{session_id}")
    assert delete_res.status_code == 200
    delete_data = delete_res.json()
    assert delete_data["status"] == "success"
    assert delete_data["session_id"] == session_id

    # 4. Verify Session is now Completed
    get_completed = client.get(f"/session/{session_id}")
    assert get_completed.status_code == 200
    assert get_completed.json()["status"] == "completed"


def test_memory_service(client: TestClient):
    # Initialize session for memory scoping
    session_res = client.post("/session/create", json={
        "name": "Memory Test Session"
    })
    session_id = session_res.json()["id"]

    # 1. Add Session-Scoped Memory
    add_session_mem = client.post("/memory/add", json={
        "scope": "session",
        "session_id": session_id,
        "key": "agent_insight",
        "value": {"summary": "Valkey is extremely fast", "latency_ms": 1.2},
        "author": "ResearchAgent"
    })
    assert add_session_mem.status_code == 200
    assert add_session_mem.json()["status"] == "success"

    # 2. Retrieve Session-Scoped Memory
    get_session_mem = client.get(
        f"/memory/get?scope=session&session_id={session_id}&key=agent_insight"
    )
    assert get_session_mem.status_code == 200
    mem_res = get_session_mem.json()
    assert mem_res["scope"] == "session"
    assert mem_res["session_id"] == session_id
    assert "agent_insight" in mem_res["memories"]
    assert mem_res["memories"]["agent_insight"]["value"]["summary"] == "Valkey is extremely fast"
    assert mem_res["memories"]["agent_insight"]["author"] == "ResearchAgent"

    # 3. Add Shared Global Memory with Tags
    add_shared_mem = client.post("/memory/add", json={
        "scope": "shared",
        "key": "global_rules",
        "value": "Always validate draft structural integrity.",
        "author": "ReviewerAgent",
        "tags": ["rules", "editorial"]
    })
    assert add_shared_mem.status_code == 200

    # 4. Retrieve Shared Global Memory by Key
    get_shared_key = client.get("/memory/get?scope=shared&key=global_rules")
    assert get_shared_key.status_code == 200
    shared_res = get_shared_key.json()
    assert shared_res["scope"] == "shared"
    assert shared_res["memories"]["global_rules"]["value"] == "Always validate draft structural integrity."

    # 5. Retrieve Shared Global Memory by Tag
    get_shared_tag = client.get("/memory/get?scope=shared&tag=rules")
    assert get_shared_tag.status_code == 200
    tag_res = get_shared_tag.json()
    assert "global_rules" in tag_res["memories"]


def test_event_timeline(client: TestClient):
    session_res = client.post("/session/create", json={"name": "Event Test Session"})
    session_id = session_res.json()["id"]

    # 1. Add Events
    ev1 = client.post("/events/add", json={
        "session_id": session_id,
        "agent_name": "WriterAgent",
        "event_type": "tool_call",
        "payload": {"tool": "editor", "chars_written": 1200}
    })
    assert ev1.status_code == 201
    
    ev2 = client.post("/events/add", json={
        "session_id": session_id,
        "agent_name": "ReviewerAgent",
        "event_type": "completion",
        "payload": {"status": "approved"}
    })
    assert ev2.status_code == 201

    # 2. List Session Events
    list_res = client.get(f"/events/list?session_id={session_id}&order=asc")
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert len(list_data["events"]) == 2
    assert list_data["events"][0]["agent_name"] == "WriterAgent"
    assert list_data["events"][0]["event_type"] == "tool_call"
    assert list_data["events"][1]["agent_name"] == "ReviewerAgent"
    assert list_data["events"][1]["payload"]["status"] == "approved"

    # 3. List Global Events
    global_list = client.get("/events/list")
    assert global_list.status_code == 200
    assert len(global_list.json()["events"]) >= 2


def test_metrics_endpoint(client: TestClient):
    # Perform some requests to populate metrics
    client.get("/")
    
    metrics_res = client.get("/metrics")
    assert metrics_res.status_code == 200
    metrics_data = metrics_res.json()
    
    # Assert structural layout complies with API contract
    assert "global" in metrics_data
    assert "agents" in metrics_data
    assert "active_sessions_count" in metrics_data
    
    # Assert Phase 2 telemetry properties exist
    global_metrics = metrics_data["global"]
    assert "request_count" in global_metrics
    assert "cache_hits" in global_metrics
    assert "cache_misses" in global_metrics
    assert "tokens_saved" in global_metrics
    assert "latency" in global_metrics


def test_e2e_agent_collaboration_flow(client: TestClient):
    # Step 1: Create Orchestrator Run Session
    res = client.post("/session/create", json={
        "name": "E2E Creative Content Run",
        "metadata": {"task": "Write about Valkey"}
    })
    assert res.status_code == 201
    session_id = res.json()["id"]

    # Step 2: Research Agent starts work
    # Logging startup event
    res = client.post("/events/add", json={
        "session_id": session_id,
        "agent_name": "ResearchAgent",
        "event_type": "execution_start",
        "payload": {"status": "starting_research"}
    })
    assert res.status_code == 201
    
    # Storing facts collected
    res = client.post("/memory/add", json={
        "scope": "session",
        "session_id": session_id,
        "key": "raw_facts",
        "value": {"v_features": ["low latency", "pubsub streams", "redis compatibility"]},
        "author": "ResearchAgent"
    })
    assert res.status_code == 200

    # Research Agent finishes and notifies
    res = client.post("/events/add", json={
        "session_id": session_id,
        "agent_name": "ResearchAgent",
        "event_type": "completion",
        "payload": {"status": "research_done_facts_saved"}
    })
    assert res.status_code == 201

    # Step 3: Writer Agent consumes facts and drafts article
    # Fetching facts from short-term memory
    res = client.get(f"/memory/get?scope=session&session_id={session_id}&key=raw_facts")
    assert res.status_code == 200
    memory_data = res.json()
    facts = memory_data["memories"]["raw_facts"]["value"]["v_features"]
    assert "low latency" in facts

    # Writing drafting event
    res = client.post("/events/add", json={
        "session_id": session_id,
        "agent_name": "WriterAgent",
        "event_type": "tool_call",
        "payload": {"status": "drafting_article", "based_on_facts_count": len(facts)}
    })
    assert res.status_code == 201

    # Save article draft to memory
    res = client.post("/memory/add", json={
        "scope": "session",
        "session_id": session_id,
        "key": "article_draft",
        "value": {"draft": "Valkey is a low latency store supporting pubsub streams..."},
        "author": "WriterAgent"
    })
    assert res.status_code == 200

    # Step 4: Reviewer Agent retrieves draft, reviews, approves
    # Retrieve draft
    res = client.get(f"/memory/get?scope=session&session_id={session_id}&key=article_draft")
    assert res.status_code == 200
    draft_content = res.json()["memories"]["article_draft"]["value"]["draft"]
    assert "low latency store" in draft_content

    # Logging review execution
    res = client.post("/events/add", json={
        "session_id": session_id,
        "agent_name": "ReviewerAgent",
        "event_type": "state_update",
        "payload": {"status": "checking_quality", "evaluation": "excellent"}
    })
    assert res.status_code == 201

    # Store approval record
    res = client.post("/memory/add", json={
        "scope": "session",
        "session_id": session_id,
        "key": "reviewer_decision",
        "value": {"grade": "A+", "approved": True},
        "author": "ReviewerAgent"
    })
    assert res.status_code == 200

    # Step 5: Teardown Session
    res = client.delete(f"/session/delete/{session_id}")
    assert res.status_code == 200

    # Step 6: Validate Final Telemetry & Timeline Order
    # Query active status (must be gone from active set)
    res = client.get(f"/session/{session_id}")
    assert res.status_code == 200
    assert res.json()["status"] == "completed"

    # Query all timeline events and assert correct execution sequence
    res = client.get(f"/events/list?session_id={session_id}")
    assert res.status_code == 200
    events = res.json()["events"]
    assert len(events) == 4
    assert events[0]["agent_name"] == "ResearchAgent"
    assert events[1]["agent_name"] == "ResearchAgent"
    assert events[2]["agent_name"] == "WriterAgent"
    assert events[3]["agent_name"] == "ReviewerAgent"

    # Query Metrics and check counts
    res = client.get("/metrics")
    assert res.status_code == 200
    metrics = res.json()
    assert metrics["global"]["total_sessions_created"] >= 1  # Isolated test run has 1 session
    assert metrics["agents"]["ResearchAgent"]["invocations"] >= 2
    assert metrics["agents"]["WriterAgent"]["invocations"] >= 1
    assert metrics["agents"]["ReviewerAgent"]["invocations"] >= 1
