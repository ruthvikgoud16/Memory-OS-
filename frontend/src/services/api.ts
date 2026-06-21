import type { Session, MemoryResponse, TimelineEvent, MetricsData } from "../types";

const API_BASE = "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Session APIs
  async createSession(name: string, metadata: Record<string, any> = {}): Promise<Session> {
    return request<Session>("/session/create", {
      method: "POST",
      body: JSON.stringify({ name, metadata }),
    });
  },

  async getSession(id: string): Promise<Session> {
    return request<Session>(`/session/${id}`);
  },

  async deleteSession(id: string): Promise<any> {
    return request<any>(`/session/delete/${id}`, {
      method: "DELETE",
    });
  },

  // Memory APIs
  async addMemory(
    scope: "session" | "shared",
    session_id: string | null,
    key: string,
    value: any,
    author: string,
    tags: string[] = []
  ): Promise<any> {
    return request<any>("/memory/add", {
      method: "POST",
      body: JSON.stringify({
        scope,
        session_id,
        key,
        value,
        author,
        tags,
      }),
    });
  },

  async getMemory(
    scope: "session" | "shared",
    session_id?: string,
    key?: string,
    tag?: string
  ): Promise<MemoryResponse> {
    let queryParams = `scope=${scope}`;
    if (session_id) queryParams += `&session_id=${session_id}`;
    if (key) queryParams += `&key=${key}`;
    if (tag) queryParams += `&tag=${tag}`;
    return request<MemoryResponse>(`/memory/get?${queryParams}`);
  },

  // Event APIs
  async addEvent(
    session_id: string,
    agent_name: string,
    event_type: string,
    payload: Record<string, any>
  ): Promise<any> {
    return request<any>("/events/add", {
      method: "POST",
      body: JSON.stringify({
        session_id,
        agent_name,
        event_type,
        payload,
      }),
    });
  },

  async getEvents(session_id?: string, limit: number = 50, order: string = "asc"): Promise<TimelineEvent[]> {
    let query = `limit=${limit}&order=${order}`;
    if (session_id) query += `&session_id=${session_id}`;
    const res = await request<{ events: TimelineEvent[] }>(`/events/list?${query}`);
    return res.events;
  },

  // Metrics API
  async getMetrics(): Promise<MetricsData> {
    return request<MetricsData>("/metrics");
  },

  // Interactive E2E Agent Simulation (Research -> Writer -> Reviewer)
  async runDemoFlow(session_id: string, delayMs: number = 1500): Promise<void> {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // 1. Research Agent begins scans
    await this.addEvent(session_id, "ResearchAgent", "execution_start", {
      status: "scanning_knowledge_base",
      query: "Valkey architecture best practices",
    });
    await sleep(delayMs);

    // Research Agent saves research context to session memory
    await this.addMemory(
      "session",
      session_id,
      "research_facts",
      {
        topics: ["Valkey Streams", "Pub/Sub Messaging", "Sorted Sets", "Hashes"],
        recommendation: "Use streams for event sourcing and hashes for session states.",
      },
      "ResearchAgent"
    );
    
    // Research Agent logs complete
    await this.addEvent(session_id, "ResearchAgent", "completion", {
      status: "research_compiled",
      memory_key: "research_facts",
    });
    await sleep(delayMs);

    // 2. Writer Agent wakes up and retrieves memory
    await this.addEvent(session_id, "WriterAgent", "execution_start", {
      status: "retrieving_raw_facts",
      target_memory: "research_facts",
    });
    await sleep(delayMs);

    // Writer Agent drafts article and saves to session memory
    await this.addMemory(
      "session",
      session_id,
      "article_draft",
      {
        title: "Valkey: Build Beyond Limits",
        introduction: "Valkey is a highly compatible fork of Redis sponsored by the Linux Foundation.",
        sections: [
          { title: "Performance", content: "Sub-millisecond latencies powered by single-threaded memory architectures." },
          { title: "Timeline Stream", content: "Leveraging Valkey Streams for ordering transactional execution telemetry." }
        ]
      },
      "WriterAgent"
    );
    
    // Writer Agent completes
    await this.addEvent(session_id, "WriterAgent", "completion", {
      status: "article_draft_saved",
      memory_key: "article_draft",
    });
    await sleep(delayMs);

    // 3. Reviewer Agent retrieves draft and evaluates
    await this.addEvent(session_id, "ReviewerAgent", "execution_start", {
      status: "analyzing_draft_spelling_and_tone",
      target_memory: "article_draft",
    });
    await sleep(delayMs);

    // Reviewer Agent writes final decision memory
    await this.addMemory(
      "session",
      session_id,
      "reviewer_decision",
      {
        approved: true,
        grade: "A+",
        remarks: "Excellent structural flow. Ready to deploy.",
      },
      "ReviewerAgent"
    );

    // Reviewer Agent logs final complete
    await this.addEvent(session_id, "ReviewerAgent", "completion", {
      status: "approval_completed",
      memory_key: "reviewer_decision",
    });
    await sleep(delayMs);

    // 4. Session teardown
    await this.deleteSession(session_id);
  },

  // Agent Tracking APIs
  async getAgentsStatus(): Promise<{ running: string[]; idle: string[]; completed: string[] }> {
    return request<{ running: string[]; idle: string[]; completed: string[] }>("/agents/status");
  },

  // Analytics APIs
  async getAnalyticsLeaderboards(): Promise<{
    top_sessions: { name: string; score: number }[];
    top_agents: { name: string; score: number }[];
    cache_efficiency_leaderboard: { name: string; score: number }[];
    token_savings_leaderboard: { name: string; score: number }[];
  }> {
    return request<any>("/analytics/leaderboards");
  },
};
