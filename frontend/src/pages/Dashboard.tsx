import React from "react";
import type { Session, TimelineEvent, MetricsData } from "../types";
import { MetricCard } from "../components/MetricCard";
import { AgentCard } from "../components/AgentCard";
import { TimelineCard } from "../components/TimelineCard";
import { LatencyChart, CachePerformanceChart } from "../components/Charts";
import {
  FolderOpen, Activity, Send, Target,
  PiggyBank, Clock, Terminal,
  Cpu, Play, ChevronRight
} from "lucide-react";

interface DashboardProps {
  metrics: MetricsData | null;
  activeSessions: Session[];
  recentEvents: TimelineEvent[];
  onSelectSession: (id: string) => void;
  setActiveTab: (tab: string) => void;
  history?: any[];
}

export const Dashboard: React.FC<DashboardProps> = ({
  metrics,
  activeSessions,
  recentEvents,
  onSelectSession,
  setActiveTab,
  history = []
}) => {
  const global = metrics?.global;

  const topMetricCards = [
    {
      title: "Active Sessions",
      value: metrics?.active_sessions_count ?? 0,
      icon: Activity,
      subtext: "Orchestration runs active",
      color: "primary" as const,
    },
    {
      title: "Valkey Writes",
      value: global?.total_memory_writes ?? 0,
      icon: Send,
      subtext: "Context commits saved",
      color: "accent" as const,
    },
    {
      title: "Cache Efficiency",
      value: global ? `${Math.round((global.cache_hits / Math.max(1, global.cache_hits + global.cache_misses)) * 100)}%` : "0%",
      icon: Target,
      subtext: "Success rate of queries",
      color: "primary" as const,
    },
    {
      title: "LLM Tokens Bypassed",
      value: global?.tokens_saved ?? 0,
      icon: PiggyBank,
      subtext: "Context window saved",
      color: "secondary" as const,
    },
  ];

  // Map active agent execution status
  const agents: {
    name: string;
    status: "idle" | "running" | "completed";
    invocations: number;
    errors: number;
    role: string;
  }[] = [
    {
      name: "ResearchAgent",
      status: metrics?.agents?.["ResearchAgent"]?.invocations ? "completed" as const : "idle" as const,
      invocations: metrics?.agents?.["ResearchAgent"]?.invocations ?? 0,
      errors: metrics?.agents?.["ResearchAgent"]?.errors ?? 0,
      role: "Knowledge Miner"
    },
    {
      name: "WriterAgent",
      status: metrics?.agents?.["WriterAgent"]?.invocations ? "completed" as const : "idle" as const,
      invocations: metrics?.agents?.["WriterAgent"]?.invocations ?? 0,
      errors: metrics?.agents?.["WriterAgent"]?.errors ?? 0,
      role: "Draft Constructor"
    },
    {
      name: "ReviewerAgent",
      status: metrics?.agents?.["ReviewerAgent"]?.invocations ? "completed" as const : "idle" as const,
      invocations: metrics?.agents?.["ReviewerAgent"]?.invocations ?? 0,
      errors: metrics?.agents?.["ReviewerAgent"]?.errors ?? 0,
      role: "Decision Evaluator"
    }
  ];

  // If there's an active session, mark running status dynamically for demonstration
  if (activeSessions.length > 0) {
    const latestEvent = recentEvents[0];
    if (latestEvent) {
      const activeName = latestEvent.agent_name;
      const isComplete = latestEvent.event_type === "completion";
      agents.forEach(a => {
        if (a.name === activeName) {
          a.status = isComplete ? "completed" : "running";
        }
      });
    }
  }

  // Generate fallback visual history if empty
  const chartData = history.length > 0 ? history : [
    { time: "10:00", latency: 0.15, hits: 10, misses: 0, tokens: 20 },
    { time: "10:05", latency: 0.22, hits: 15, misses: 1, tokens: 40 },
    { time: "10:10", latency: 0.18, hits: 24, misses: 0, tokens: 80 }
  ];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Valkey Orchestration Console</h2>
          <p className="text-sm text-slate-400 font-medium">Real-time cache utilization, latencies, and agent communication trace routing.</p>
        </div>
        <button
          onClick={() => setActiveTab("sessions")}
          className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
        >
          <Play className="h-3.5 w-3.5 fill-white" />
          <span>Trigger New Session</span>
        </button>
      </div>

      {/* Stats Cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {topMetricCards.map((card, idx) => (
          <MetricCard
            key={idx}
            title={card.title}
            value={card.value}
            icon={card.icon}
            subtext={card.subtext}
            color={card.color}
          />
        ))}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 glass-panel rounded-2xl p-5 border border-white/5">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="font-bold text-white flex items-center space-x-2">
              <Clock className="h-4.5 w-4.5 text-primary" />
              <span>Orchestration Latency Stream</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono font-bold">AVG WRITE SPEED</span>
          </div>
          <div className="pt-4">
            <LatencyChart data={chartData} />
          </div>
        </div>

        <div className="lg:col-span-4 glass-panel rounded-2xl p-5 border border-white/5">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="font-bold text-white flex items-center space-x-2">
              <Target className="h-4.5 w-4.5 text-secondary" />
              <span>Cache Ratio Efficiency</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono font-bold">HITS VS MISSES</span>
          </div>
          <div className="pt-4">
            <CachePerformanceChart data={chartData} />
          </div>
        </div>
      </div>

      {/* Active Agents Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h3 className="font-bold text-white flex items-center space-x-2">
            <Cpu className="h-4.5 w-4.5 text-tertiary" />
            <span>Active Coordinating Agents</span>
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">STATUS TELEMETRY</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {agents.map((agent, idx) => (
            <AgentCard
              key={idx}
              agentName={agent.name}
              status={agent.status}
              invocations={agent.invocations}
              errors={agent.errors}
              description={agent.role}
            />
          ))}
        </div>
      </div>

      {/* Double Column: Recent Sessions Table and Timeline Activity Feed */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Recent Sessions list */}
        <div className="lg:col-span-4 glass-panel rounded-2xl p-5 border border-white/5 flex flex-col h-[380px]">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="font-bold text-white flex items-center space-x-2">
              <FolderOpen className="h-4.5 w-4.5 text-primary animate-pulse" />
              <span>Orchestrated Runs</span>
            </h3>
            <button
              onClick={() => setActiveTab("sessions")}
              className="text-xs text-primary hover:underline font-semibold bg-transparent border-0 cursor-pointer"
            >
              Configure
            </button>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
            {activeSessions.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-slate-500 text-xs py-10 space-y-2">
                <FolderOpen className="h-8 w-8 text-slate-700" />
                <span>No active orchestration logs</span>
                <p className="text-[10px] text-slate-600 text-center">Start a demo or new run session</p>
              </div>
            ) : (
              activeSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className="p-3.5 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-white/10 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-200 truncate group-hover:text-white">{session.name}</h4>
                    <span className="text-[9px] text-slate-500 font-mono block truncate mt-0.5">{session.id}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-all transform group-hover:translate-x-0.5 ml-2 flex-shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Global Timeline Feed */}
        <div className="lg:col-span-8 glass-panel rounded-2xl p-5 border border-white/5 flex flex-col h-[380px]">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="font-bold text-white flex items-center space-x-2">
              <Terminal className="h-4.5 w-4.5 text-secondary" />
              <span>Real-Time Stream Feed</span>
            </h3>
            <span className="text-[9px] uppercase font-mono tracking-widest text-primary animate-pulse font-bold">Valkey Stream</span>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
            {recentEvents.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-slate-500 text-xs py-10 space-y-1">
                <Terminal className="h-8 w-8 text-slate-700" />
                <span>Waiting for telemetry events...</span>
              </div>
            ) : (
              recentEvents.map((evt) => (
                <TimelineCard
                  key={evt.event_id}
                  timestamp={evt.timestamp}
                  agentName={evt.agent_name}
                  eventType={evt.event_type}
                  payload={evt.payload}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
