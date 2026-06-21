# Page Map
**Project**: MemoryOS Startup Upgrade Phase 1.0

This document outlines the structural hierarchy of the three primary pages required for the premium upgrade.

## 1. Submission Demo Page (`/demo`)
**Purpose**: The "Wow" page. Designed to pitch MemoryOS to judges and stakeholders immediately upon load.

**Sections**:
- **Hero**: High-impact headline, animated background, and primary "Launch Demo" call-to-action (CTA).
- **Architecture Visualization**: An animated, high-level map of how MemoryOS interfaces with Valkey and AI Agents.
- **Valkey Capabilities**: 3-column grid highlighting Hashes, Streams, and Pub/Sub advantages.
- **Metrics**: Live ticker showing sub-millisecond latencies and active cache performance.
- **Agent Flow**: Visual diagram showing Research → Writer → Reviewer.
- **Tech Stack**: Grid of logos (FastAPI, React, Valkey, Docker).
- **Final CTA**: "Enter Dashboard" button.

## 2. Main Dashboard (`/dashboard`)
**Purpose**: The operational heart of the application. Inspired by top-tier startup analytics platforms (e.g., TalentLens).

**Sections**:
- **Sidebar**: Primary navigation (Dashboard, Explorer, Settings).
- **Top Metrics Cards**: Glassmorphic cards tracking Active Agents, Cache Hits, and Request Count.
- **Charts**: 
  - Main area chart tracking latency over time.
  - Secondary bar chart for Token Savings.
- **Timeline**: A vertically scrolling, real-time feed of system and agent events.
- **Active Agents**: A lateral list of agents currently executing tasks.
- **Analytics**: A summary block of total system health.
- **Recent Sessions**: A table or grid of the latest orchestration sessions.

## 3. Memory Explorer (`/explorer`)
**Purpose**: A deep-dive investigative tool for developers to inspect the distributed memory layer.

**Sections**:
- **Semantic Search**: A prominent, glowing search bar to filter memories.
- **Session List**: Filterable sidebar showing active and historic sessions.
- **Timeline Replay**: A visual scrubbing tool to replay agent state changes.
- **Memory Cards**: Rich JSON-view cards displaying exact values stored in Valkey Hashes.
- **Tags**: Badges for categorizing shared memory concepts.
- **Similarity Scores**: Mock visual indicators of memory relevance (even if driven by keyword tags).
- **Analytics**: Memory specific stats (e.g., memory read frequency).
