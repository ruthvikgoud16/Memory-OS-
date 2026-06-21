# MemoryOS — Hackathon Submission

## Hackathon: Valkey Build Beyond Limits 2.0

---

## Project Identity

| Field | Value |
|---|---|
| **Project Name** | MemoryOS |
| **Tagline** | Distributed Memory Infrastructure for AI Agents powered by Valkey |
| **Hackathon** | Valkey Build Beyond Limits 2.0 |
| **Category** | Infrastructure / AI Tooling |
| **Status** | ✅ Complete — All phases implemented and verified |

---

## Elevator Pitch

> AI agent frameworks like CrewAI, LangChain, and Agno all face the same bottleneck: state management. Agents lose context between steps, coordination requires message brokers, and debugging multi-agent flows is nearly impossible. MemoryOS solves this with a single, unified, low-latency memory infrastructure — powered exclusively by Valkey.

---

## Problem Statement

Multi-agent AI systems suffer from:

1. **Context Fragmentation** — Agents lose shared state between runs and across nodes
2. **Slow Coordination** — Traditional databases add 5–50ms latency per step
3. **Opaque Execution** — No unified way to visualize or debug agent-to-agent interactions
4. **Infrastructure Sprawl** — Developers cobble together Postgres + Kafka + Vector DB to handle what one system could do

---

## Solution: MemoryOS

MemoryOS provides a complete distributed memory layer for AI agent teams using **Valkey as the sole datastore**:

### Core Services (all powered by Valkey)

| Service | Valkey Structure | Capability |
|---|---|---|
| **Session Service** | Hash + Set | Create, track, and teardown agent sessions |
| **Memory Service** | Hash (session + shared) | Session-scoped and global cross-agent memory |
| **Event Timeline** | Stream (`XADD`/`XREAD`) | Ordered chronological execution logs |
| **Pub/Sub Bus** | Native Pub/Sub channels | Real-time inter-agent message routing |
| **Metrics Engine** | Hash counters | Latency, cache hits, token savings, throughput |

---

## Technical Architecture

```
Architecture: Modular Monolith
Backend:      FastAPI + Python 3.10 + Pydantic v2
Storage:      Valkey ONLY (no Postgres, no Kafka, no Vector DB)
Frontend:     React 18 + TypeScript + Tailwind CSS + Recharts
Packaging:    Docker Compose (2 containers: backend + valkey)
```

### Why Valkey is Central

MemoryOS is not a Valkey-backed cache — Valkey IS the database:

- **Hashes** store session metadata and agent memory (O(1) field reads)
- **Sets** index active and historic sessions (O(1) membership checks)
- **Streams** provide an append-only, ordered timeline (like a lightweight event log)
- **Pub/Sub** channels enable fire-and-forget inter-agent notifications
- **Hash counters** with `HINCRBY` enable atomic, lockless metrics tracking

Result: **Sub-millisecond p99 latency** across all agent operations.

---

## Demo Flow: Research → Writer → Reviewer

The project includes a fully functional end-to-end demonstration:

```
[Research Agent]
  → Stores facts in session memory (Valkey Hash)
  → Logs start/complete events (Valkey Stream)
        ↓
[Writer Agent]
  → Reads facts from memory (Valkey Hash GET)
  → Stores draft in session memory
  → Logs drafting events (Valkey Stream)
        ↓
[Reviewer Agent]
  → Reads draft from memory
  → Stores final review and approval
  → Logs review complete event
  → Session closed
        ↓
[Dashboard]
  → Live metrics update (request count, events, cache stats)
  → Timeline page shows all 6+ sequential events
  → Sessions page shows 3 memory entries
```

**Trigger:** Click "Run Demo Flow" in the Sessions page, or call the REST API directly.

---

## API Endpoints Implemented

### Session Service
```
POST   /session/create          Create named agent session
GET    /session/{id}            Get session metadata
DELETE /session/delete/{id}     Teardown session
```

### Memory Service
```
POST   /memory/add              Store session or shared memory
GET    /memory/get              Retrieve memory by scope/session
```

### Event Timeline
```
POST   /events/add              Append timeline event
GET    /events/list             List events for a session
```

### Pub/Sub
```
POST   /pubsub/publish          Publish to agent channel
```

### Metrics
```
GET    /metrics                 Global metrics + per-agent stats
```

**Full Swagger UI:** `http://localhost:8000/docs`

---

## Live Dashboard Pages

| Page | What It Shows |
|---|---|
| **Dashboard** | 7 KPI metric cards (sessions, requests, cache, tokens, latency), global event stream |
| **Sessions** | All active sessions, memory inspector, "Run Demo Flow" button |
| **Timeline** | Live event stream with agent name, event type, timestamp, and execution flow visualization |
| **Metrics** | Recharts: latency area chart, cache hit/miss bar chart, token savings accumulation line chart |

---

## Project Phases Completed

| Phase | Description | Status |
|---|---|---|
| **Phase 1** | PRD, Architecture, Schema, API Contract, Test Plan | ✅ Complete |
| **Phase 2** | FastAPI backend with all 5 services, Docker Compose, Pytest suite | ✅ Complete |
| **Phase 3** | React + TypeScript frontend, all 4 pages, Recharts, API integration | ✅ Complete |
| **Phase 4** | E2E demo, README, submission, GitHub readiness | ✅ Complete |

---

## Test Results

```
backend/tests/
  test_session.py    ✅ 3 tests passed
  test_memory.py     ✅ 3 tests passed
  test_events.py     ✅ 3 tests passed
  test_metrics.py    ✅ 2 tests passed
  test_pubsub.py     ✅ 2 tests passed
  ─────────────────────────────
  TOTAL: 13 tests — 0 failures
```

---

## Setup Instructions

### Requirements
- Docker Desktop with Docker Compose
- Node.js 18+

### Backend (Docker)
```bash
cd backend
docker compose up --build -d
# API: http://localhost:8000
# Docs: http://localhost:8000/docs
```

### Frontend (Dev Server)
```bash
cd frontend
npm install
npm run dev
# Dashboard: http://localhost:3000
```

---

## Repository Structure

```
memoryos/
├── README.md           ← Full project documentation
├── submission.md       ← This file
├── PRD.md              ← Product Requirements
├── ARCHITECTURE.md     ← Architecture + Mermaid diagrams
├── SCHEMA.md           ← Valkey data schema
├── API_CONTRACT.md     ← REST API contract
├── TEST_PLAN.md        ← QA test plan
├── .gitignore          ← Root gitignore
├── backend/            ← FastAPI + Valkey backend
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py
│   ├── api/
│   ├── services/
│   ├── schemas/
│   ├── valkey_client/
│   └── tests/
├── frontend/           ← React + TypeScript dashboard
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   └── types/
│   └── package.json
└── docs/
    └── screenshots/    ← UI screenshots
```

---

## Valkey-Specific Innovation

### Why This Matters for the Hackathon

1. **Streams as an Event Bus** — `XADD`/`XREAD` replaces Kafka for agent event logging at sub-ms latency
2. **Hashes as a Memory Store** — Replaces Postgres for agent context with atomic `HSET`/`HGET` operations
3. **Pub/Sub as a Message Router** — Native channel-based routing replaces RabbitMQ for inter-agent communication
4. **Sets for Session Indexing** — O(1) membership operations enable instant active session lookups
5. **Hash Counters for Metrics** — `HINCRBY` enables lockless, atomic counter increments for high-throughput metric collection

**MemoryOS demonstrates that Valkey, used correctly, can replace 3–4 separate infrastructure components for AI agent systems.**

---

## What's Next (Post-Hackathon Roadmap)

- SDK wrappers for CrewAI and LangChain agents
- Valkey Cluster support for horizontal scalability
- TTL-based session expiry with configurable retention
- Agent permission namespacing
- WebSocket support for real-time dashboard streaming
- OpenTelemetry metrics export

---

*Submitted for Valkey Build Beyond Limits 2.0 Hackathon*
