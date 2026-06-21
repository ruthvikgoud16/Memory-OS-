import React, { useState, useEffect } from "react";
import type { Session } from "../types";
import { api } from "../services/api";
import { SessionCard } from "../components/SessionCard";
import {
  Plus,
  Play,
  Trash2,
  BrainCircuit,
  Settings,
  UserCheck,
  AlertCircle,
  FileCode
} from "lucide-react";

interface SessionsPageProps {
  sessions: Session[];
  selectedSessionId: string | null;
  onSelectSession: (id: string | null) => void;
  refreshSessions: () => void;
}

export const SessionsPage: React.FC<SessionsPageProps> = ({
  sessions,
  selectedSessionId,
  onSelectSession,
  refreshSessions
}) => {
  const [newSessionName, setNewSessionName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isRunningDemo, setIsRunningDemo] = useState(false);
  const [memories, setMemories] = useState<Record<string, any>>({});
  const [activeMemoryKey, setActiveMemoryKey] = useState<string | null>(null);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || null;

  // Fetch memories when selected session changes
  useEffect(() => {
    if (selectedSessionId) {
      api.getMemory("session", selectedSessionId)
        .then((res) => {
          setMemories(res.memories);
          const keys = Object.keys(res.memories);
          if (keys.length > 0) {
            setActiveMemoryKey(keys[0]);
          } else {
            setActiveMemoryKey(null);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch memories:", err);
          setMemories({});
          setActiveMemoryKey(null);
        });
    } else {
      setMemories({});
      setActiveMemoryKey(null);
    }
  }, [selectedSessionId]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;

    try {
      setIsCreating(true);
      const res = await api.createSession(newSessionName, {
        goal: "Generate technical documentation",
        orchestrator: "MemoryOS Client",
        agents: ["ResearchAgent", "WriterAgent", "ReviewerAgent"]
      });
      
      // Save created session ID to localStorage index
      const storedIdsStr = localStorage.getItem("memoryos_sessions") || "[]";
      const storedIds = JSON.parse(storedIdsStr);
      if (!storedIds.includes(res.id)) {
        storedIds.push(res.id);
        localStorage.setItem("memoryos_sessions", JSON.stringify(storedIds));
      }

      refreshSessions();
      onSelectSession(res.id);
      setNewSessionName("");
    } catch (err) {
      alert("Failed to create session");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRunDemo = async () => {
    if (!selectedSessionId) return;
    try {
      setIsRunningDemo(true);
      await api.runDemoFlow(selectedSessionId);
      refreshSessions();
      // Refetch memories
      const memRes = await api.getMemory("session", selectedSessionId);
      setMemories(memRes.memories);
    } catch (err) {
      alert("Demo execution encountered an error");
    } finally {
      setIsRunningDemo(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!selectedSessionId) return;
    if (!confirm("Are you sure you want to complete this session?")) return;

    try {
      await api.deleteSession(selectedSessionId);
      refreshSessions();
    } catch (err) {
      alert("Failed to complete session");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Agent Sessions</h2>
          <p className="text-sm text-slate-400">Spawn and monitor memory states inside isolated Agent sessions.</p>
        </div>

        <form onSubmit={handleCreateSession} className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Session Name..."
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            className="rounded-lg bg-slate-800 border border-slate-700/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary w-48 sm:w-64"
          />
          <button
            type="submit"
            disabled={isCreating}
            className="flex items-center space-x-1.5 rounded-lg bg-primary hover:bg-teal-600 disabled:bg-slate-700 px-4 py-2 text-sm font-bold text-slate-900 border-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create</span>
          </button>
        </form>
      </div>

      {/* Main Grid split: List of sessions and detail pane */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Session Cards list */}
        <div className="lg:col-span-5 space-y-3 h-[500px] overflow-y-auto pr-1">
          {sessions.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-slate-500 text-sm py-10 glass-panel rounded-xl border border-slate-700/40">
              <BrainCircuit className="h-12 w-12 text-slate-600 mb-2" />
              <span>No sessions available</span>
              <p className="text-xs text-slate-600 mt-1">Create one above to begin.</p>
            </div>
          ) : (
            sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                isSelected={session.id === selectedSessionId}
                onSelect={() => onSelectSession(session.id)}
              />
            ))
          )}
        </div>

        {/* Selected Session Details */}
        <div className="lg:col-span-7 glass-panel rounded-xl p-5 border border-slate-700/40 flex flex-col h-[500px]">
          {selectedSession ? (
            <div className="flex flex-col h-full">
              {/* Top controls & details */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedSession.name}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-1">{selectedSession.id}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  {selectedSession.status === "active" && (
                    <button
                      onClick={handleRunDemo}
                      disabled={isRunningDemo}
                      className="flex items-center space-x-1.5 rounded bg-primary hover:bg-teal-600 disabled:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-900 border-0 cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>{isRunningDemo ? "Running..." : "Run Demo Flow"}</span>
                    </button>
                  )}
                  <button
                    onClick={handleDeleteSession}
                    className="flex items-center space-x-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-3 py-1.5 text-xs font-bold cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Complete</span>
                  </button>
                </div>
              </div>

              {/* Grid detail metrics: goals & active agents */}
              <div className="grid grid-cols-2 gap-4 mt-4 bg-slate-800/10 rounded-lg p-3 border border-slate-800">
                <div className="flex items-start space-x-2">
                  <Settings className="h-4.5 w-4.5 text-primary mt-0.5" />
                  <div>
                    <h5 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Goal</h5>
                    <p className="text-xs text-slate-300 font-medium">{selectedSession.metadata.goal || "None"}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <UserCheck className="h-4.5 w-4.5 text-secondary mt-0.5" />
                  <div>
                    <h5 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Agents Assigned</h5>
                    <p className="text-xs text-slate-300 font-medium">
                      {selectedSession.metadata.agents?.join(", ") || "None"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Memories Segment */}
              <div className="mt-4 flex-1 flex flex-col min-h-0">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Stored Session Memories</h4>
                
                {Object.keys(memories).length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs py-10 bg-slate-800/20 rounded-lg border border-dashed border-slate-700/40">
                    <AlertCircle className="h-8 w-8 text-slate-600 mb-1" />
                    <span>No memories stored for this session</span>
                    <p className="text-[10px] text-slate-600">Run the Demo Flow to record agent memories.</p>
                  </div>
                ) : (
                  <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">
                    {/* Left: Memory keys */}
                    <div className="col-span-4 border-r border-slate-800 overflow-y-auto pr-2 space-y-1.5">
                      {Object.keys(memories).map((key) => (
                        <button
                          key={key}
                          onClick={() => setActiveMemoryKey(key)}
                          className={`w-full text-left rounded p-2 text-xs font-bold truncate border transition-all ${
                            activeMemoryKey === key
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-slate-800/30 text-slate-400 border-slate-700/20 hover:text-white"
                          }`}
                        >
                          {key}
                        </button>
                      ))}
                    </div>

                    {/* Right: Memory value viewer */}
                    <div className="col-span-8 bg-slate-900/60 rounded-lg border border-slate-800 p-3 overflow-auto flex flex-col min-h-0">
                      {activeMemoryKey && memories[activeMemoryKey] ? (
                        <div className="text-xs flex flex-col h-full">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                            <span className="font-bold text-white flex items-center space-x-1.5">
                              <FileCode className="h-3.5 w-3.5 text-secondary" />
                              <span>{activeMemoryKey}</span>
                            </span>
                            <span className="text-[10px] text-slate-500">
                              by {memories[activeMemoryKey].author}
                            </span>
                          </div>
                          
                          <pre className="flex-1 overflow-auto bg-black/30 p-2.5 rounded font-mono text-[10px] text-teal-400 leading-normal">
                            {JSON.stringify(memories[activeMemoryKey].value, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-600 text-xs">
                          Select a memory key to inspect contents
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-slate-500 text-sm">
              <BrainCircuit className="h-12 w-12 text-slate-700 mb-2" />
              <span>No Session Selected</span>
              <p className="text-xs text-slate-600 mt-1">Select a session from the list to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
