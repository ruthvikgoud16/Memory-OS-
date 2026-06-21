export interface Session {
  id: string;
  name: string;
  status: string;
  created_at: number;
  updated_at: number;
  metadata: Record<string, any>;
}

export interface MemoryItem {
  value: any;
  author: string;
  timestamp: number;
}

export interface MemoryResponse {
  scope: string;
  session_id?: string;
  memories: Record<string, MemoryItem>;
}

export interface TimelineEvent {
  event_id: string;
  timestamp: number;
  agent_name: string;
  event_type: string;
  payload: Record<string, any>;
}

export interface AgentMetrics {
  invocations: number;
  errors: number;
}

export interface GlobalMetrics {
  total_sessions_created: number;
  total_events_logged: number;
  total_messages_routed: number;
  total_memory_writes: number;
  request_count: number;
  cache_hits: number;
  cache_misses: number;
  tokens_saved: number;
  latency: number;
}

export interface MetricsData {
  global: GlobalMetrics;
  agents: Record<string, AgentMetrics>;
  active_sessions_count: number;
}
