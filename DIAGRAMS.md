# MemoryOS — Architecture Diagrams

This document contains all Mermaid architecture diagrams for MemoryOS.

---

## 1. System Context Diagram

High-level view of how MemoryOS fits into the AI agent ecosystem.

```mermaid
graph TB
    subgraph Agents ["AI Agent Frameworks"]
        CA[CrewAI]
        LC[LangChain]
        AG[Agno]
    end

    subgraph MemoryOS ["MemoryOS Platform"]
        UI["🖥️ React Dashboard\n(Tailwind + Recharts)"]
        API["⚡ FastAPI Backend\n(Modular Monolith)"]
        VK[("🗄️ Valkey\n(Single Datastore)")]
    end

    Dev["👩‍💻 AI Developer"] --> UI
    Dev --> API
    CA -->|HTTP REST| API
    LC -->|HTTP REST| API
    AG -->|HTTP REST| API
    UI -->|HTTP REST| API
    API -->|Hashes, Streams\nPub/Sub, Sets| VK

    style MemoryOS fill:#1e293b,stroke:#7c3aed,color:#f8fafc
    style Agents fill:#0f172a,stroke:#3b82f6,color:#f8fafc
    style VK fill:#7c3aed,color:#ffffff
```

---

## 2. Modular Monolith Component Diagram

Internal structure of the FastAPI backend — showing module boundaries and Valkey interactions.

```mermaid
graph TD
    Client["🌐 HTTP Client\n(Dashboard / Agent)"]

    subgraph Backend ["FastAPI Backend — Modular Monolith"]
        Router["API Router Layer\n(route dispatch)"]

        subgraph Services ["Service Modules"]
            SS["📋 Session Service\nCreate · Get · Delete"]
            MS["🧠 Memory Service\nSession · Shared"]
            TS["📜 Timeline Service\nAppend · List"]
            PS["📡 Pub/Sub Service\nPublish · Route"]
            MX["📊 Metrics Service\nCount · Track"]
        end

        MW["Middleware\n(request timer, metrics hook)"]

        Router --> SS
        Router --> MS
        Router --> TS
        Router --> PS
        Router --> MX
        MW --> MX
    end

    subgraph Valkey ["Valkey — Single Storage Engine"]
        VH["Hashes\nmemoryos:session:{id}\nmemoryos:memory:session:{id}\nmemoryos:metrics:global"]
        VS["Sets\nmemoryos:session:active\nmemoryos:session:all"]
        VST["Streams\nmemoryos:timeline:stream:{id}\nmemoryos:timeline:global"]
        VP["Pub/Sub\nmemoryos:comm:session:{id}"]
    end

    Client --> Router
    Client --> MW
    SS -->|HSET, SADD, HGETALL| VH
    SS -->|SADD, SMEMBERS| VS
    MS -->|HSET, HGET, HGETALL| VH
    TS -->|XADD, XREAD| VST
    PS -->|PUBLISH, SUBSCRIBE| VP
    MX -->|HINCRBY, HGETALL| VH

    style Backend fill:#1e293b,stroke:#06b6d4,color:#f8fafc
    style Valkey fill:#0f172a,stroke:#7c3aed,color:#f8fafc
    style VH fill:#7c3aed,color:#ffffff
    style VS fill:#7c3aed,color:#ffffff
    style VST fill:#7c3aed,color:#ffffff
    style VP fill:#7c3aed,color:#ffffff
```

---

## 3. End-to-End Agent Flow: Research → Writer → Reviewer

Sequence diagram showing the complete multi-agent pipeline.

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer / Dashboard
    participant API as FastAPI Backend
    participant VK as Valkey
    participant RA as Research Agent
    participant WA as Writer Agent
    participant RevA as Reviewer Agent

    Dev->>API: POST /session/create
    API->>VK: HSET memoryos:session:{id}
    API->>VK: SADD memoryos:session:active
    API-->>Dev: { session_id }

    Note over RA,RevA: All agents subscribe to session Pub/Sub channel

    rect rgb(30, 58, 138)
        Note over RA: Research Phase
        RA->>API: POST /events/add (task_start)
        API->>VK: XADD memoryos:timeline:stream:{id}
        RA->>API: POST /memory/add (key=research_facts)
        API->>VK: HSET memoryos:memory:session:{id}
        RA->>API: POST /events/add (task_complete)
        API->>VK: XADD memoryos:timeline:stream:{id}
        RA->>VK: PUBLISH channel "research_done"
    end

    rect rgb(6, 78, 59)
        Note over WA: Writing Phase
        VK-->>WA: Receive "research_done"
        WA->>API: GET /memory/get?scope=session&session_id={id}
        API->>VK: HGET memoryos:memory:session:{id}
        VK-->>API: { research_facts }
        API-->>WA: { research_facts }
        WA->>API: POST /memory/add (key=article_draft)
        API->>VK: HSET memoryos:memory:session:{id}
        WA->>API: POST /events/add (task_start)
        API->>VK: XADD memoryos:timeline:stream:{id}
        WA->>API: POST /events/add (task_complete)
        API->>VK: XADD memoryos:timeline:stream:{id}
        WA->>VK: PUBLISH channel "draft_done"
    end

    rect rgb(88, 28, 135)
        Note over RevA: Review Phase
        VK-->>RevA: Receive "draft_done"
        RevA->>API: GET /memory/get?scope=session&session_id={id}
        API->>VK: HGET memoryos:memory:session:{id}
        VK-->>API: { article_draft }
        API-->>RevA: { article_draft }
        RevA->>API: POST /memory/add (key=final_review)
        API->>VK: HSET memoryos:memory:session:{id}
        RevA->>API: POST /events/add (task_start)
        API->>VK: XADD memoryos:timeline:stream:{id}
        RevA->>API: POST /events/add (task_complete)
        API->>VK: XADD memoryos:timeline:stream:{id}
    end

    Dev->>API: GET /metrics
    API->>VK: HGETALL memoryos:metrics:global
    VK-->>API: { request_count, events, cache_hits, ... }
    API-->>Dev: Live metrics dashboard update
```

---

## 4. Valkey Data Model Diagram

How each MemoryOS service maps to Valkey data structures.

```mermaid
erDiagram
    SESSION_HASH {
        string id PK
        string name
        string status
        float created_at
        float updated_at
        string metadata_json
    }

    SESSION_ACTIVE_SET {
        string session_id FK
    }

    SESSION_ALL_SET {
        string session_id FK
    }

    MEMORY_HASH {
        string key PK
        string value_json
        string author
        float timestamp
    }

    TIMELINE_STREAM {
        string stream_id PK
        string session_id FK
        string agent_name
        string event_type
        float timestamp
        string data_json
    }

    METRICS_HASH {
        string total_sessions_created
        string total_events_logged
        string total_messages_routed
        string total_memory_writes
        string request_count
        string cache_hits
        string cache_misses
        string tokens_saved
        string latency
    }

    AGENT_METRICS_HASH {
        string agent_name PK
        string invocations
        string errors
    }

    SESSION_HASH ||--o{ SESSION_ACTIVE_SET : "SADD when active"
    SESSION_HASH ||--o{ SESSION_ALL_SET : "SADD always"
    SESSION_HASH ||--o{ MEMORY_HASH : "session-scoped memory"
    SESSION_HASH ||--o{ TIMELINE_STREAM : "events logged per session"
    TIMELINE_STREAM ||--o{ METRICS_HASH : "increments request_count"
```

---

## 5. Frontend Component Architecture

```mermaid
graph TD
    subgraph App ["React App — Vite + TypeScript"]
        Main["main.tsx\n(React root mount)"]
        AppRoot["App.tsx\n(Tab router + polling loop)"]
        API["services/api.ts\n(REST client + demo flow simulator)"]
        Types["types/index.ts\n(TypeScript interfaces)"]
    end

    subgraph Pages ["Pages"]
        DB["Dashboard.tsx\n7 KPI cards + live global timeline"]
        SP["SessionsPage.tsx\nSession manager + Run Demo + memory inspect"]
        TP["TimelinePage.tsx\nAgent pipeline nodes + event stream"]
        MP["MetricsPage.tsx\nRecharts: latency · cache · tokens"]
    end

    subgraph Components ["Shared Components"]
        NB["Navbar.tsx\nProject title + server status badge"]
        SB["Sidebar.tsx\nTab navigation + active session count"]
        MC["MetricCard.tsx\nKPI card with trend arrow"]
        CH["Charts.tsx\nRecharts wrappers"]
    end

    Main --> AppRoot
    AppRoot --> NB
    AppRoot --> SB
    AppRoot --> DB
    AppRoot --> SP
    AppRoot --> TP
    AppRoot --> MP
    DB --> MC
    MP --> CH
    AppRoot --> API
    API -->|"GET /metrics\nGET /session/{id}\nGET /events/list"| BackendAPI["FastAPI Backend\n:8000"]

    style App fill:#1e293b,stroke:#06b6d4,color:#f8fafc
    style Pages fill:#0f172a,stroke:#10b981,color:#f8fafc
    style Components fill:#0f172a,stroke:#f59e0b,color:#f8fafc
```

---

## 6. Docker Compose Deployment Diagram

```mermaid
graph LR
    subgraph Host ["Host Machine"]
        DevServer["Node Dev Server\n:3000\nnpm run dev"]
        
        subgraph DockerCompose ["Docker Compose Network"]
            BackendC["memoryos_backend\nFastAPI + Uvicorn\n:8000"]
            ValkeyC["memoryos_valkey\nValkey Server\n:6379"]
        end
    end

    Browser["🌐 Browser"] -->|"http://localhost:3000"| DevServer
    Browser -->|"http://localhost:8000/docs"| BackendC
    DevServer -->|"API calls :8000"| BackendC
    BackendC -->|"RESP3 protocol\n:6379"| ValkeyC

    style DockerCompose fill:#1e293b,stroke:#2496ed,color:#f8fafc
    style BackendC fill:#009688,color:#ffffff
    style ValkeyC fill:#7c3aed,color:#ffffff
```
