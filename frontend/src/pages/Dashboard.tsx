import React from "react";
import type { Session, TimelineEvent, MetricsData } from "../types";
import { MetricCard } from "../components/MetricCard";
import {
  FolderOpen,
  Activity,
  Send,
  Target,
  AlertCircle,
  PiggyBank,
  Clock,
  Terminal,
  User,
  ExternalLink
} from "lucide-react";

interface DashboardProps {
  metrics: MetricsData | null;
  activeSessions: Session[];
  recentEvents: TimelineEvent[];
  onSelectSession: (id: string) => void;
  setActiveTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  metrics,
  activeSessions,
  recentEvents,
  onSelectSession,
  setActiveTab
}) => {
  const global = metrics?.global;

  const cards = [
    {
      title: "Total Sessions",
      value: global?.total_sessions_created ?? 0,
      icon: FolderOpen,
      subtext: "Sessions recorded in database",
      color: "accent" as const,
    },
    {
      title: "Active Sessions",
      value: metrics?.active_sessions_count ?? 0,
      icon: Activity,
      subtext: "Agents currently processing tasks",
      color: "primary" as const,
    },
    {
      title: "Total Requests",
      value: global?.request_count ?? 0,
      icon: Send,
      subtext: "API hits to FastAPI backend",
      color: "primary" as const,
    },
    {
      title: "Cache Hits",
      value: global?.cache_hits ?? 0,
      icon: Target,
      subtext: "Agent memory lookups succeeded",
      color: "primary" as const,
    },
    {
      title: "Cache Misses",
      value: global?.cache_misses ?? 0,
      icon: AlertCircle,
      subtext: "Cache misses recorded",
      color: "red" as const,
    },
    {
      title: "Tokens Saved",
      value: global?.tokens_saved ?? 0,
      icon: PiggyBank,
      subtext: "LLM contextual tokens bypassed",
      color: "secondary" as const,
    },
    {
      title: "Average Latency",
      value: `${global?.latency ?? 0} ms`,
      icon: Clock,
      subtext: "Rolling average response speed",
      color: "secondary" as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title section */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">System Dashboard</h2>
        <p className="text-sm text-slate-400">Real-time system telemetry and multi-agent coordination status.</p>
      </div>

      {/* Grid of cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, idx) => (
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

      {/* Grid: Active Sessions and Timeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Active Sessions list */}
        <div className="lg:col-span-4 glass-panel rounded-xl p-5 border border-slate-700/40 flex flex-col h-[400px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white flex items-center space-x-2">
              <Activity className="h-4.5 w-4.5 text-primary animate-pulse" />
              <span>Active Sessions</span>
            </h3>
            <button
              onClick={() => setActiveTab("sessions")}
              className="text-xs text-primary hover:underline font-semibold bg-transparent border-0 cursor-pointer"
            >
              Manage all
            </button>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
            {activeSessions.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-slate-500 text-sm py-10">
                <FolderOpen className="h-10 w-10 text-slate-600 mb-2" />
                <span>No active agent runs</span>
                <p className="text-xs text-slate-600 text-center mt-1">Start a run on the Sessions page</p>
              </div>
            ) : (
              activeSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    setActiveTab("sessions");
                  }}
                  className="p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/30 hover:border-slate-600/50 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-200 truncate">{session.name}</h4>
                    <span className="text-[10px] text-slate-500 font-mono block truncate">{session.id}</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-500 flex-shrink-0 ml-2" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Global Timeline Feed */}
        <div className="lg:col-span-8 glass-panel rounded-xl p-5 border border-slate-700/40 flex flex-col h-[400px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white flex items-center space-x-2">
              <Terminal className="h-4.5 w-4.5 text-secondary" />
              <span>Live Global Timeline</span>
            </h3>
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 animate-pulse">Streaming</span>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
            {recentEvents.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-slate-500 text-sm py-10">
                <MilestonePlaceholder />
              </div>
            ) : (
              recentEvents.map((evt) => (
                <div key={evt.event_id} className="relative pl-6 border-l border-slate-800 pb-2 last:pb-0">
                  {/* Timeline point */}
                  <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-slate-800 border border-secondary" />
                  
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white flex items-center space-x-1">
                          <User className="h-3 w-3 text-secondary" />
                          <span>{evt.agent_name}</span>
                        </span>
                        <span className="text-[10px] rounded bg-slate-800 px-1.5 py-0.5 text-slate-400 font-medium font-mono uppercase">
                          {evt.event_type}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-300">
                        {evt.payload.status || JSON.stringify(evt.payload)}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(evt.timestamp * 1000).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MilestonePlaceholder = () => (
  <div className="flex flex-col items-center justify-center text-slate-500 text-sm">
    <Terminal className="h-10 w-10 text-slate-600 mb-2" />
    <span>No execution logs recorded</span>
    <p className="text-xs text-slate-600 mt-1">Start a session to stream events</p>
  </div>
);
