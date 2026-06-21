import React, { useState, useEffect } from "react";
import type { Session, TimelineEvent } from "../types";
import { api } from "../services/api";
import {
  Milestone,
  ArrowRight,
  User,
  Clock,
  Terminal,
  Activity,
  CheckCircle2,
  Hourglass
} from "lucide-react";

interface TimelinePageProps {
  sessions: Session[];
  selectedSessionId: string | null;
  onSelectSession: (id: string | null) => void;
}

export const TimelinePage: React.FC<TimelinePageProps> = ({
  sessions,
  selectedSessionId,
  onSelectSession
}) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  // Fetch events for selected session (or global if null)
  useEffect(() => {
    const fetchEvents = () => {
      api.getEvents(selectedSessionId || undefined, 100, order)
        .then(setEvents)
        .catch(console.error);
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [selectedSessionId, order]);

  // Determine active agent in the pipeline based on event status
  const getPipelineStatus = () => {
    if (!selectedSessionId || events.length === 0) {
      return { active: "ResearchAgent", research: "idle", writer: "idle", reviewer: "idle" };
    }

    let research = "idle";
    let writer = "idle";
    let reviewer = "idle";
    let active = "ResearchAgent";

    const hasResearchStart = events.some(e => e.agent_name === "ResearchAgent" && e.event_type === "execution_start");
    const hasResearchComplete = events.some(e => e.agent_name === "ResearchAgent" && e.event_type === "completion");
    const hasWriterStart = events.some(e => e.agent_name === "WriterAgent" && e.event_type === "execution_start");
    const hasWriterComplete = events.some(e => e.agent_name === "WriterAgent" && e.event_type === "completion");
    const hasReviewerStart = events.some(e => e.agent_name === "ReviewerAgent" && e.event_type === "execution_start");
    const hasReviewerComplete = events.some(e => e.agent_name === "ReviewerAgent" && e.event_type === "completion");

    if (hasResearchStart) {
      research = "running";
      active = "ResearchAgent";
    }
    if (hasResearchComplete) {
      research = "completed";
      active = "WriterAgent";
    }
    if (hasWriterStart) {
      writer = "running";
      active = "WriterAgent";
    }
    if (hasWriterComplete) {
      writer = "completed";
      active = "ReviewerAgent";
    }
    if (hasReviewerStart) {
      reviewer = "running";
      active = "ReviewerAgent";
    }
    if (hasReviewerComplete) {
      reviewer = "completed";
      active = "none";
    }

    return { active, research, writer, reviewer };
  };

  const status = getPipelineStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Event Timeline</h2>
          <p className="text-sm text-slate-400">Trace transactional state records and multi-agent workflow streams.</p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Session dropdown filter */}
          <select
            value={selectedSessionId || ""}
            onChange={(e) => onSelectSession(e.target.value || null)}
            className="rounded-lg bg-slate-800 border border-slate-700/50 px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
          >
            <option value="">Global Stream (All Sessions)</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.status})
              </option>
            ))}
          </select>

          {/* Sort order toggle */}
          <button
            onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/50 px-3 py-2 text-sm text-white cursor-pointer"
          >
            {order === "asc" ? "Oldest First" : "Newest First"}
          </button>
        </div>
      </div>

      {/* Visual Pipeline map */}
      {selectedSessionId && (
        <div className="glass-panel rounded-xl p-5 border border-slate-700/40">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4">Orchestration pipeline progress</h3>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-2">
            {/* Research agent node */}
            <PipelineNode
              name="Research Agent"
              role="Context Scrubber"
              state={status.research}
              isActive={status.active === "ResearchAgent"}
            />

            <ArrowRight className="hidden sm:block h-6 w-6 text-slate-600" />

            {/* Writer agent node */}
            <PipelineNode
              name="Writer Agent"
              role="Content Producer"
              state={status.writer}
              isActive={status.active === "WriterAgent"}
            />

            <ArrowRight className="hidden sm:block h-6 w-6 text-slate-600" />

            {/* Reviewer agent node */}
            <PipelineNode
              name="Reviewer Agent"
              role="Integrity Auditor"
              state={status.reviewer}
              isActive={status.active === "ReviewerAgent"}
            />
          </div>
        </div>
      )}

      {/* Timeline streaming log list */}
      <div className="glass-panel rounded-xl p-5 border border-slate-700/40 flex flex-col h-[500px]">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4">
          <Terminal className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-white">Stream Logs</h3>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {events.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-slate-500 text-sm">
              <Milestone className="h-12 w-12 text-slate-700 mb-2" />
              <span>No timeline logs found</span>
              <p className="text-xs text-slate-600">Select another session or run the demo.</p>
            </div>
          ) : (
            events.map((evt) => (
              <div key={evt.event_id} className="relative pl-8 border-l border-slate-800 pb-3 last:pb-0">
                {/* Visual bullet representing log state */}
                <span className={`absolute -left-2 top-1 h-4.5 w-4.5 rounded-full bg-[#0B0E14] border-2 flex items-center justify-center ${
                  evt.event_type === "completion"
                    ? "border-primary"
                    : evt.event_type === "execution_start"
                    ? "border-secondary animate-pulse"
                    : "border-blue-500"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    evt.event_type === "completion"
                      ? "bg-primary"
                      : evt.event_type === "execution_start"
                      ? "bg-secondary"
                      : "bg-blue-500"
                  }`} />
                </span>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                        <User className="h-3.5 w-3.5 text-primary" />
                        <span>{evt.agent_name}</span>
                      </span>
                      <span className="text-[10px] rounded bg-slate-800 border border-slate-700/30 px-2 py-0.5 text-slate-300 font-mono">
                        {evt.event_type.toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-300">
                      {evt.payload.status || JSON.stringify(evt.payload)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-mono">
                    <Clock className="h-3.5 w-3.5 text-slate-600" />
                    <span>{new Date(evt.timestamp * 1000).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

interface PipelineNodeProps {
  name: string;
  role: string;
  state: string; // "idle", "running", "completed"
  isActive: boolean;
}

const PipelineNode: React.FC<PipelineNodeProps> = ({ name, role, state, isActive }) => {
  return (
    <div className={`w-48 rounded-xl p-4 border transition-all text-center flex flex-col items-center ${
      state === "completed"
        ? "border-primary bg-primary/5 text-primary"
        : state === "running"
        ? "border-secondary bg-secondary/5 text-secondary animate-pulse"
        : "border-slate-800 bg-slate-900/30 text-slate-500"
    }`}>
      {state === "completed" ? (
        <CheckCircle2 className="h-6 w-6 text-primary mb-2" />
      ) : state === "running" ? (
        <Activity className="h-6 w-6 text-secondary mb-2" />
      ) : (
        <Hourglass className="h-6 w-6 text-slate-600 mb-2" />
      )}
      
      <h4 className="font-bold text-xs text-white leading-normal">{name}</h4>
      <p className="text-[10px] text-slate-400 mt-0.5">{role}</p>

      {isActive && (
        <span className="mt-2.5 rounded bg-secondary/20 border border-secondary/30 px-2 py-0.5 text-[8px] font-bold text-secondary tracking-widest animate-pulse">
          ACTIVE
        </span>
      )}
    </div>
  );
};
