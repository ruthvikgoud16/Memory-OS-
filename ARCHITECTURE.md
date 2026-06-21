# Architecture Document - MemoryOS

This document defines the high-level architecture, module boundaries, database paradigm, and data flows for **MemoryOS**.

---

## 1. System Context & Topology

MemoryOS is structured as a **Modular Monolith**. This architecture choice ensures high cohesion, rapid development, and simple deployments, while strictly isolating responsibilities into clean logical submodules.

```mermaid
graph TD
    User([AI Developer / Agent Builder]) -->|HTTP REST| Frontend[React Single Page Application]
    Frontend -->|HTTP / Server-Sent Events| Backend[FastAPI Modular Monolith]
    
    subgraph Backend [FastAPI Backend Server]
        API[API Router Layer]
        
        subgraph Modules [Logical Monolith Modules]
            SessionSvc[Session Service]
            MemorySvc[Memory Service]
            TimelineSvc[Event Timeline Service]
            PubSubSvc[Pub/Sub Service]
            MetricsSvc[Metrics Service]
        end
        
        API --> SessionSvc
        API --> MemorySvc
        API --> TimelineSvc
        API --> PubSubSvc
        API --> MetricsSvc
    end
    
    subgraph Storage [Valkey Dedicated Datastore]
        Valkey[(Valkey Instance)]
    end
    
    SessionSvc -->|Hashes / Sets| Valkey
    MemorySvc -->|Hashes / Sets| Valkey
    TimelineSvc -->|Streams| Valkey
    PubSubSvc -->|Pub/Sub Channels / Streams| Valkey
    MetricsSvc -->|Hashes / Sorted Sets| Valkey
```

- **Frontend (React + Tailwind + Recharts)**: Displays session states, active agent lists, live timelines, and metrics charts. It reads from REST endpoints and uses Server-Sent Events (SSE) for live streaming updates.
- **Backend (FastAPI)**: Serves the REST API. Contains a centralized connection pool to Valkey and delegates tasks to specific services.
- **Storage (Valkey ONLY)**: The single source of truth for the application. No relational databases, document databases, or third-party message brokers are permitted.

---

## 2. Monolithic Module Boundaries

The backend code is divided into logical modules. Each module encapsulates its data access logic and limits inter-module calls to clear service-level APIs.

```
memoryos/
├── backend/
│   ├── app/
│   │   ├── main.py                # App entrypoint & middleware
│   │   ├── config.py              # Application settings (Valkey connection config)
│   │   ├── session/               # Session Service (Lifecycle management)
│   │   │   ├── router.py
│   │   │   └── service.py
│   │   ├── memory/                # Memory Service (Session context & shared agent memory)
│   │   │   ├── router.py
│   │   │   └── service.py
│   │   ├── timeline/              # Event Timeline Service (Chronological streams)
│   │   │   ├── router.py
│   │   │   └── service.py
│   │   ├── pubsub/                # Pub/Sub Service (Inter-agent communication)
│   │   │   └── service.py
│   │   └── metrics/               # Metrics Service (Telemetry & statistics)
│   │       ├── router.py
│   │       └── service.py
```

### 2.1 Session Service
- **Responsibility**: Tracks execution sessions.
- **Valkey Structures**: Hashes for metadata storage; Sets for tracking active/historic session lists.
- **Internal APIs**: Exposes methods to create, fetch, and expire sessions.

### 2.2 Memory Service
- **Responsibility**: Manages short-term (session-locked) context and long-term (global shared) state.
- **Valkey Structures**: Hashes for context storage; Sets for indexing memories by tags.
- **Internal APIs**: Exposes interfaces for saving and fetching key-value data scoped globally or by session.

### 2.3 Event Timeline Service
- **Responsibility**: Appends ordered state logs representing agent steps, tool executions, and system milestones.
- **Valkey Structures**: Streams for high-speed chronological appends and real-time consumption.
- **Internal APIs**: Exposes event-appending endpoints and streaming search routines.

### 2.4 Pub/Sub Service
- **Responsibility**: Distributes messages between collaborative agents in real-time.
- **Valkey Structures**: Valkey native Pub/Sub channels for fast, fire-and-forget message distribution.
- **Internal APIs**: Allows backend endpoints or active client streams to publish messages to agent channels.

### 2.5 Metrics Service
- **Responsibility**: Monitors system load, operational count, and telemetry.
- **Valkey Structures**: Hashes for counter tracking; Sorted Sets for time-series aggregation.
- **Internal APIs**: Integrates as FastAPI middleware to log API requests and latency metrics, incrementing counters in Valkey.

---

## 3. End-to-End Demo Sequence (Research -> Writer -> Reviewer)

The following sequence diagram outlines the interactive workflow demo showing how the different services interact during a typical multi-agent orchestration session:

```mermaid
sequenceDiagram
    autonumber
    actor Dashboard as UI Dashboard
    participant Backend as FastAPI Backend
    participant Valkey as Valkey Storage
    participant RA as Research Agent (Mock/Process)
    participant WA as Writer Agent (Mock/Process)
    participant RevA as Reviewer Agent (Mock/Process)

    Dashboard->>Backend: POST /session/create (Initiate Content Generation Session)
    Backend->>Valkey: HSET memoryos:session:{id} (Save session meta)
    Backend->>Valkey: SADD memoryos:session:active (Add to active set)
    Backend-->>Dashboard: Return Session ID

    Note over Dashboard, RevA: Agents activate and subscribe to Valkey Pub/Sub channel "memoryos:comm:session:{id}"

    %% Research Agent Phase
    Backend->>Valkey: PUBLISH (channel, "research_start")
    Valkey-->>RA: Receive "research_start" message
    RA->>Backend: POST /events/add ("Research agent searching sources...")
    Backend->>Valkey: XADD memoryos:timeline:stream (Log timeline event)
    RA->>Backend: POST /memory/add (Save key: "research_facts", val: "Valkey is fast...")
    Backend->>Valkey: HSET memoryos:memory:session:{id} (Store session memory)
    RA->>Backend: POST /events/add ("Research complete")
    Backend->>Valkey: XADD memoryos:timeline:stream (Log event)
    RA->>Valkey: PUBLISH (channel, "research_done")

    %% Writer Agent Phase
    Valkey-->>WA: Receive "research_done" message
    WA->>Backend: POST /events/add ("Writer agent retrieving facts...")
    Backend->>Valkey: XADD memoryos:timeline:stream (Log event)
    WA->>Backend: GET /memory/get?key=research_facts (Retrieve facts)
    Backend->>Valkey: HGET memoryos:memory:session:{id}
    Valkey-->>Backend: Return facts data
    Backend-->>WA: Return facts data
    WA->>Backend: POST /memory/add (Save key: "article_draft", val: "Valkey is a high-speed data store...")
    Backend->>Valkey: HSET memoryos:memory:session:{id} (Store draft)
    WA->>Backend: POST /events/add ("Drafting complete")
    Backend->>Valkey: XADD memoryos:timeline:stream (Log event)
    WA->>Valkey: PUBLISH (channel, "draft_done")

    %% Reviewer Agent Phase
    Valkey-->>RevA: Receive "draft_done" message
    RevA->>Backend: POST /events/add ("Reviewer evaluating draft...")
    Backend->>Valkey: XADD memoryos:timeline:stream (Log event)
    RevA->>Backend: GET /memory/get?key=article_draft
    Backend->>Valkey: HGET memoryos:memory:session:{id}
    Valkey-->>Backend: Return draft
    Backend-->>RevA: Return draft
    RevA->>Backend: POST /memory/add (Save key: "final_review", val: "Approved!")
    Backend->>Valkey: HSET memoryos:memory:session:{id}
    RevA->>Backend: POST /events/add ("Review complete - Session closing")
    Backend->>Valkey: XADD memoryos:timeline:stream (Log event)
    RevA->>Backend: DELETE /session/delete/{id} (Close Session)
    Backend->>Valkey: SREM memoryos:session:active (Remove from active set)
    Backend-->>RevA: Session Closed

    %% Dashboard updates
    Note over Dashboard: Dashboard polls GET /metrics and displays real-time execution statistics
```

---

## 4. Frontend Component Interface

The frontend is built as a single-page dashboard designed to show live telemetry.

```
memoryos/frontend/src/
├── components/
│   ├── SessionManager.jsx      # Controls creation/teardown & session listings
│   ├── EventTimeline.jsx       # Renders streaming chronologic timeline
│   ├── MessageStream.jsx       # Displays real-time agent pub/sub interactions
│   └── MetricsDashboard.jsx    # Displays Recharts visual statistics
```

- **Metrics Charts**: Recharts line-charts trace "Event Frequency over Time" and bar-charts trace "Valkey Memory Footprint".
- **Visual Flow Map**: A graphical pipeline highlighting which node (Research, Writer, Reviewer) is active, updated in real time via event triggers.
