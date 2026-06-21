# Component Map
**Project**: MemoryOS Startup Upgrade Phase 1.0

This document outlines the reusable UI component architecture required to construct the upgraded pages.

## Layout Components
- **Navbar**: Top-level navigation. Transparent background, backdrop blur, sticky positioning. Contains global search and status indicator.
- **Sidebar**: Left-side vertical navigation menu. Collapsible, with animated icon hover states. Highlights active route with a glowing Emerald border.

## Dashboard Components
- **MetricCard**: A KPI display widget. 
  - *Props*: title, value, trend percentage, icon, trend direction (up/down).
  - *Styling*: Glassmorphic background, glowing border on hover.
- **AnalyticsChart**: Reusable wrapper for Recharts.
  - *Features*: Custom styled tooltips, responsive container, hidden grid lines, thick neon stroke weights.
- **TimelineCard**: Single event entry within the timeline.
  - *Props*: timestamp, agent_name, event_type, message.
  - *Styling*: Left border colored according to the agent (e.g., Purple for Research, Emerald for Reviewer).

## Explorer Components
- **AgentCard**: Displays active agent profile and state.
  - *Props*: agent_name, status (idle, running, completed), task_count.
  - *Styling*: Pulse animation on the status indicator.
- **MemoryCard**: Inspectable data container for Valkey Hashes.
  - *Props*: key, value (JSON or string), author, tags.
  - *Features*: Expandable JSON tree view, copy-to-clipboard functionality.
- **SearchBar**: A prominent, animated input field for semantic search.
  - *Styling*: Deep black background with a subtle glowing aura when focused.

## Specialized Components
- **LeaderboardCard**: Displays top performing agents based on invocation counts.
- **GraphVisualization**: A canvas or SVG-based node graph to map agent communication and memory relations.
  - *Nodes*: Agents or Memory Keys.
  - *Edges*: Data flow or Pub/Sub messages.
