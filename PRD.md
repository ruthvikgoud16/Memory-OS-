# Product Requirements Document (PRD) - MemoryOS

## 1. Document Control & Overview

| Project | MemoryOS |
| :--- | :--- |
| **Subtitle** | Distributed Memory Infrastructure for AI Agents powered by Valkey |
| **Author** | Principal Architect |
| **Status** | Approved (Phase 1) |
| **Target Hackathon** | Valkey Build Beyond Limits 2.0 |
| **Architectural Style** | Modular Monolith |
| **Tech Stack** | React + Tailwind + Recharts (Frontend), FastAPI (Backend), Valkey (Storage) |

---

## 2. Executive Summary & Vision

AI agent orchestration systems (like CrewAI, LangChain, and Agno) often run into severe challenges when scaling from isolated single-agent scripts to multi-agent production systems:
1. **Context Fragmentation**: Agents lose track of conversation state, shared knowledge, or past executions when sessions reset or distribute across multiple nodes.
2. **Slow Coordination**: Relational databases add unnecessary query latency, and full-blown message brokers like Kafka introduce heavy operations overhead.
3. **Black-box Operations**: Developers lack a unified visual timeline to debug agent-to-agent interactions, message exchanges, and latency.

**MemoryOS** solves this by providing a lightweight, low-latency, modular distributed memory infrastructure powered exclusively by **Valkey**. It acts as the agent's short-term session context, long-term shared memory, real-time message bus (via Pub/Sub), and event telemetry stream, all unified in a single, high-performance storage engine.

---

## 3. User Personas & Target Audience

### AI Developers & Agent Builders
- **Goal**: Quickly deploy collaborative multi-agent teams without managing complex message brokers or database clusters.
- **Pain Point**: Debugging race conditions, coordinate-blocking issues, and state management in multi-agent runs is difficult and slow.

### Framework Integrators (CrewAI, LangChain, Agno)
- **Goal**: Plug in a fast, distributed memory provider that allows agent states to persist and sync across different processes or pods.
- **Pain Point**: Standard file-based or in-memory systems don't scale across distributed instances, and relational backends are too slow for fast-paced agent loops.

---

## 4. Product Scope

### In-Scope (Phase 2 Implementation Target)
- **Modular Monolith Architecture**: A single, clean backend codebase using FastAPI and a single-page app frontend using React.
- **Valkey-Only Backend Storage**: Absolutely no database dependencies other than Valkey.
- **Session Memory**: Fast creation, tracking, and deletion of agent sessions.
- **Shared Agent Memory**: Cross-agent global memory accessible by tags or keys.
- **Event Timeline Service**: Ordered, chronological execution logs (e.g., tool calls, agent thoughts, state transitions) using Valkey Streams.
- **Inter-Agent Pub/Sub**: Native pub/sub message routing for real-time task distribution.
- **Metrics Service**: Aggregating API latency, event throughput, memory footprint, and active sessions.
- **Live Dashboard**: Interactive interface visualizing the active sessions, event timelines, metrics graphs, and real-time message stream.

### Out-of-Scope (Strict Exclusions)
- **No Vector Databases or Embeddings**: Context matching is structure-based, tag-based, or key-based. No neural search.
- **No LangChain/CrewAI/Agno direct SDK bindings**: The system exposes clean HTTP REST endpoints that can be wrapped by any SDK.
- **No Authentication / Authorization**: All endpoints are public and accessible to simplify deployment for agent orchestration networks in secure virtual private clouds (VPCs).
- **No Multi-tenancy or RBAC**: Scoping is done via session and agent namespaces.
- **No Billing, Metering, or User Management**: Zero SaaS elements.
- **No External Message Queues (Kafka/RabbitMQ)**: Pub/Sub and stream buffer queues are fully handled by Valkey.
- **No Relational/NoSQL DBs (Postgres/MongoDB)**: State persistence relies entirely on Valkey.

---

## 5. Feature Requirements

### 5.1 Session Service (Core State)
- **FR-SES-1**: Create a new session with custom metadata (e.g., agent names, goals, configurations). Returns a unique session ID.
- **FR-SES-2**: Retrieve active or historic session details and metadata.
- **FR-SES-3**: Delete a session (teardown), which purges session-scoped storage or marks it closed.

### 5.2 Memory Service (Structured State)
- **FR-MEM-1**: Store **Session Memory** (short-term) linked directly to a session ID.
- **FR-MEM-2**: Retrieve session-specific memory (key-value or sequential chat context).
- **FR-MEM-3**: Store **Shared Agent Memory** (long-term/global) that is shared across all sessions, using key-value tagging for organization.
- **FR-MEM-4**: Retrieve shared agent memories by tag or prefix.

### 5.3 Event Timeline Service (Telemetry)
- **FR-EVT-1**: Record an execution event (e.g., "Research Agent started web search", "Writer Agent drafted section"). Every event must include a timestamp, session ID, agent name, event type, and payload data.
- **FR-EVT-2**: Fetch ordered timeline events for a given session ID (ascending/descending chronological order).
- **FR-EVT-3**: Real-time event streaming support to feed the UI dashboard timeline.

### 5.4 Pub/Sub Service (Communication Bus)
- **FR-PUB-1**: Route messages between agents over dynamic Valkey pub/sub channels.
- **FR-PUB-2**: Provide clean REST API wrappers to publish messages to a channel.
- **FR-PUB-3**: Log all message transmission metadata to the metrics engine.

### 5.5 Metrics Service (Monitoring)
- **FR-MET-1**: Collect and expose system execution statistics (e.g., total active sessions, event throughput per minute, memory usage).
- **FR-MET-2**: Track per-agent performance metrics (number of tasks handled, tool invocation count, execution latency).

### 5.6 Dashboard (Visibility)
- **FR-DSH-1**: Render active sessions list.
- **FR-DSH-2**: Draw a real-time, scrolling event timeline for selected sessions.
- **FR-DSH-3**: Display system metrics using charts (e.g., Recharts) for event counts and memory utilization.
- **FR-DSH-4**: Visual representation of the agent demo flow (Research -> Writer -> Reviewer).

---

## 6. End-to-End Demo Flow Specification

To validate MemoryOS, the backend must support a mock/interactive agent workflow demonstration. This workflow simulates an automated content creation loop:

```
[Research Agent] (Collects facts, updates memory, logs progress)
      │
      ▼
[Writer Agent] (Reads facts, drafts article, logs draft, requests review)
      │
      ▼
[Reviewer Agent] (Reviews draft, approves/rejects, logs final approval)
```

1. **Start Session**: A user clicks "Run Demo Flow" on the dashboard. This hits `POST /session/create` mapping the orchestration task.
2. **Research Stage**:
   - The *Research Agent* publishes an event indicating it has started scanning sources.
   - It writes facts to `POST /memory/add` under the session context.
   - It triggers a notification event via Pub/Sub indicating that the research is complete.
3. **Writing Stage**:
   - The *Writer Agent* receives the pub/sub notification, fetches the facts using `GET /memory/get`, and writes a draft payload.
   - It publishes an event indicating the draft is complete and saves the draft state in Memory.
4. **Reviewing Stage**:
   - The *Reviewer Agent* is alerted, retrieves the draft from Memory, simulates an evaluation, and writes the final approval report.
   - It submits a completion event and closes the session.
5. **Dashboard Visibility**: The dashboard must render this entire progression in real-time, charting step times and event counts.

---

## 7. Non-Functional Requirements (NFRs)

### Performance & Latency
- All backend-to-Valkey queries (metadata retrievals, event insertions, metric increments) must complete in **< 2ms** under typical load.
- The UI must update within **200ms** of a new Valkey stream event.

### Tech Stack & Deployment Constraints
- **Framework**: FastAPI (Python 3.10+) for lightweight asynchronous API handlers.
- **Storage**: Valkey 7.x/8.x ONLY. Absolutely no third-party database engines.
- **Frontend**: React (Vite-based) styling with Tailwind CSS, data graphing with Recharts.
- **Packaging**: Monorepo/modular monolithic structure, packaged with a simple Docker Compose file running a Valkey node and the unified Python/React server components.
