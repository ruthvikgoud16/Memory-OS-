# API Contract Specification - MemoryOS

This document serves as the official API Contract between the backend service (FastAPI) and consumers (Frontend dashboard and AI agents). 

All endpoints accept and return `application/json` payloads.

---

## 1. Session APIs

### 1.1 Create Session
- **Endpoint**: `POST /session/create`
- **Description**: Initializes a new tracking session for an agent workflow run.
- **Request Headers**: `Content-Type: application/json`
- **Request Body (Pydantic Model)**:
  ```json
  {
    "name": "E2E Content Creation Demo",
    "metadata": {
      "goal": "Generate a technical blog post detailing Valkey Streams.",
      "orchestrator": "CrewAI",
      "agents": ["ResearchAgent", "WriterAgent", "ReviewerAgent"]
    }
  }
  ```
- **Responses**:
  - **201 Created**: Session initialized in Valkey.
    ```json
    {
      "id": "7ac15df2-4217-48f8-b3d9-48243dbf12fa",
      "name": "E2E Content Creation Demo",
      "status": "active",
      "created_at": 1782064614.0,
      "updated_at": 1782064614.0,
      "metadata": {
        "goal": "Generate a technical blog post detailing Valkey Streams.",
        "orchestrator": "CrewAI",
        "agents": ["ResearchAgent", "WriterAgent", "ReviewerAgent"]
      }
    }
    ```
  - **400 Bad Request**: Invalid metadata format or missing session name.

---

### 1.2 Get Session Details
- **Endpoint**: `GET /session/{id}`
- **Description**: Retrieves current status and configuration for a specified session.
- **Path Parameters**:
  - `id` (string, UUID format): The unique identifier of the session.
- **Responses**:
  - **200 OK**:
    ```json
    {
      "id": "7ac15df2-4217-48f8-b3d9-48243dbf12fa",
      "name": "E2E Content Creation Demo",
      "status": "active",
      "created_at": 1782064614.0,
      "updated_at": 1782064820.0,
      "metadata": {
        "goal": "Generate a technical blog post detailing Valkey Streams.",
        "orchestrator": "CrewAI",
        "agents": ["ResearchAgent", "WriterAgent", "ReviewerAgent"]
      }
    }
    ```
  - **404 Not Found**: Session ID does not exist in Valkey.

---

### 1.3 Teardown Session
- **Endpoint**: `DELETE /session/delete/{id}`
- **Description**: Marks the session status as `completed` and removes the session from the active list. It does not purge archival event timeline records unless explicitly configured to clean up.
- **Path Parameters**:
  - `id` (string, UUID format): The unique identifier of the session.
- **Responses**:
  - **200 OK**:
    ```json
    {
      "status": "success",
      "message": "Session 7ac15df2-4217-48f8-b3d9-48243dbf12fa has been completed.",
      "session_id": "7ac15df2-4217-48f8-b3d9-48243dbf12fa",
      "completed_at": 1782064900.0
    }
    ```
  - **404 Not Found**: Session ID does not exist in Valkey.

---

## 2. Memory APIs

### 2.1 Add Memory
- **Endpoint**: `POST /memory/add`
- **Description**: Stores context into memory. Supports session-locked short-term memory, and cross-session global long-term memory.
- **Request Body**:
  ```json
  {
    "scope": "session", // Options: "session", "shared"
    "session_id": "7ac15df2-4217-48f8-b3d9-48243dbf12fa", // Nullable if scope is "shared"
    "key": "research_facts",
    "value": {
      "facts": [
        "Valkey is sponsored by the Linux Foundation.",
        "It supports existing Redis commands."
      ]
    },
    "author": "ResearchAgent",
    "tags": ["raw_facts", "valkey_info"] // Optional tags for indexing (shared memory only)
  }
  ```
- **Responses**:
  - **200 OK**:
    ```json
    {
      "status": "success",
      "scope": "session",
      "key": "research_facts",
      "written_at": 1782064635.0
    }
    ```
  - **400 Bad Request**: Missing `session_id` for session-scoped memory, or invalid keys.
  - **404 Not Found**: Scoped session ID does not exist.

---

### 2.2 Get Memory
- **Endpoint**: `GET /memory/get`
- **Description**: Retrieves memory by scope, session context, key, or tag index.
- **Query Parameters**:
  - `scope` (string, required): Options: `"session"`, `"shared"`.
  - `session_id` (string, optional): Required if `scope` is `"session"`.
  - `key` (string, optional): Retrieve only this specific key's memory. If omitted, returns all memory elements under the selected scope.
  - `tag` (string, optional): Filter shared memory items index by tag (applicable only for `"shared"` scope).
- **Responses**:
  - **200 OK**:
    ```json
    {
      "scope": "session",
      "session_id": "7ac15df2-4217-48f8-b3d9-48243dbf12fa",
      "memories": {
        "research_facts": {
          "value": {
            "facts": [
              "Valkey is sponsored by the Linux Foundation.",
              "It supports existing Redis commands."
            ]
          },
          "author": "ResearchAgent",
          "timestamp": 1782064635.0
        }
      }
    }
    ```
  - **400 Bad Request**: Invalid combination of parameters.
  - **404 Not Found**: Memory key or session context not found.

---

## 3. Event APIs

### 3.1 Record Event
- **Endpoint**: `POST /events/add`
- **Description**: Appends a chronological execution event to the session stream and the global logging stream.
- **Request Body**:
  ```json
  {
    "session_id": "7ac15df2-4217-48f8-b3d9-48243dbf12fa",
    "agent_name": "WriterAgent",
    "event_type": "tool_call", // Options: "execution_start", "tool_call", "state_update", "error", "completion"
    "payload": {
      "tool": "drafting_editor",
      "action": "generating_sections",
      "sections_count": 3
    }
  }
  ```
- **Responses**:
  - **201 Created**: Event appended to Valkey Stream.
    ```json
    {
      "status": "success",
      "event_id": "1782064710000-0", // Valkey auto-assigned stream ID
      "session_id": "7ac15df2-4217-48f8-b3d9-48243dbf12fa",
      "timestamp": 1782064710.0
    }
    ```
  - **404 Not Found**: Session ID does not exist in active or historic tracking sets.

---

### 3.2 List Events
- **Endpoint**: `GET /events/list`
- **Description**: Fetches historical and real-time timeline events. Supports query filtering.
- **Query Parameters**:
  - `session_id` (string, optional): Retrieve only events for this session ID. If omitted, returns global aggregated events.
  - `limit` (integer, optional): Maximum events to return (default: `50`).
  - `order` (string, optional): Sort sorting by timeline: `"asc"` (oldest first) or `"desc"` (newest first). Defaults to `"asc"`.
- **Responses**:
  - **200 OK**:
    ```json
    {
      "session_id": "7ac15df2-4217-48f8-b3d9-48243dbf12fa",
      "events": [
        {
          "event_id": "1782064710000-0",
          "timestamp": 1782064710.0,
          "agent_name": "WriterAgent",
          "event_type": "tool_call",
          "payload": {
            "tool": "drafting_editor",
            "action": "generating_sections",
            "sections_count": 3
          }
        }
      ]
    }
    ```

---

## 4. Metrics APIs

### 4.1 System Metrics
- **Endpoint**: `GET /metrics`
- **Description**: Exposes accumulated performance, traffic, active usage telemetry, and agent error rates.
- **Responses**:
  - **200 OK**:
    ```json
    {
      "global": {
        "total_sessions_created": 412,
        "total_events_logged": 3204,
        "total_messages_routed": 1290,
        "total_memory_writes": 944
      },
      "agents": {
        "ResearchAgent": {
          "invocations": 150,
          "errors": 2
        },
        "WriterAgent": {
          "invocations": 142,
          "errors": 0
        },
        "ReviewerAgent": {
          "invocations": 120,
          "errors": 1
        }
      },
      "active_sessions_count": 5
    }
    ```
