import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { SessionsPage } from "./pages/SessionsPage";
import { ExplorerPage } from "./pages/ExplorerPage";
import { DemoPage } from "./pages/DemoPage";
import { TimelineCard } from "./components/TimelineCard";
import { LeaderboardCard } from "./components/LeaderboardCard";
import { GraphVisualization } from "./components/GraphVisualization";
import { TokenSavingsChart, LatencyChart } from "./components/Charts";
import { api } from "./services/api";
import type { Session, TimelineEvent, MetricsData } from "./types";
import { 
  Cpu, Database, Sliders, 
  RotateCcw, SlidersHorizontal, CheckCircle2 
} from "lucide-react";

export const App: React.FC = () => {
  // Set default tab to demo (Page 1 pitch page)
  const [activeTab, setActiveTab] = useState<string>("demo");
  const [isOnline, setIsOnline] = useState<boolean>(false);
  
  // Data States
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [recentEvents, setRecentEvents] = useState<TimelineEvent[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  // Phase 2.0 Live States
  const [agentStatus, setAgentStatus] = useState<{ running: string[]; idle: string[]; completed: string[] }>({ running: [], idle: [], completed: [] });
  const [leaderboards, setLeaderboards] = useState<any>(null);

  // Chart History State
  const [history, setHistory] = useState<any[]>([]);

  // Settings mock inputs
  const [valkeyUrl, setValkeyUrl] = useState("localhost:6379");
  const [simDelay, setSimDelay] = useState(1500);

  // Load and refresh sessions from localStorage index
  const refreshSessionsList = async () => {
    try {
      const storedIdsStr = localStorage.getItem("memoryos_sessions") || "[]";
      let storedIds: string[] = JSON.parse(storedIdsStr);

      const loadedSessions: Session[] = [];
      const validIds: string[] = [];

      for (const id of storedIds) {
        try {
          const detail = await api.getSession(id);
          loadedSessions.push(detail);
          validIds.push(id);
        } catch (e) {
          // Discard stale
        }
      }

      localStorage.setItem("memoryos_sessions", JSON.stringify(validIds));
      
      loadedSessions.sort((a, b) => {
        if (a.status === "active" && b.status !== "active") return -1;
        if (a.status !== "active" && b.status === "active") return 1;
        return b.created_at - a.created_at;
      });

      setSessions(loadedSessions);
    } catch (err) {
      console.error("Error refreshing sessions list:", err);
    }
  };

  useEffect(() => {
    if (isOnline) {
      refreshSessionsList();
    }
  }, [isOnline]);

  // Polling loop
  useEffect(() => {
    const poll = async () => {
      try {
        const metricsData = await api.getMetrics();
        setMetrics(metricsData);
        setIsOnline(true);

        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setHistory((prev) => {
          const newPoint = {
            time: nowStr,
            latency: metricsData.global.latency,
            hits: metricsData.global.cache_hits,
            misses: metricsData.global.cache_misses,
            tokens: metricsData.global.tokens_saved,
          };
          return [...prev, newPoint].slice(-15);
        });

        const globalEvents = await api.getEvents(undefined, 20, "desc");
        setRecentEvents(globalEvents);

        // Fetch agent sets status
        const statusData = await api.getAgentsStatus();
        setAgentStatus(statusData);

        // Fetch analytics leaderboards
        const leaderData = await api.getAnalyticsLeaderboards();
        setLeaderboards(leaderData);
      } catch (err) {
        console.error("Polling error:", err);
        setIsOnline(false);
      }
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, []);

  const getAgentState = (name: string): "idle" | "running" | "completed" => {
    if (agentStatus.running.includes(name)) return "running";
    if (agentStatus.completed.includes(name)) return "completed";
    return "idle";
  };

  const getAgentLeaderboardData = () => {
    const core_agents = [
      { name: "ResearchAgent", role: "Facts Miner" },
      { name: "WriterAgent", role: "Content Generator" },
      { name: "ReviewerAgent", role: "Tone Guard" }
    ];

    if (!leaderboards) {
      return core_agents.map(a => ({
        name: a.name,
        invocations: 0,
        errors: 0,
        successRate: 1.0,
        role: a.role
      }));
    }

    return core_agents.map(a => {
      const invScore = leaderboards.top_agents?.find((x: any) => x.name === a.name)?.score ?? 0;
      const errorScore = a.name === "ReviewerAgent" && invScore > 5 ? 1 : 0;
      return {
        name: a.name,
        invocations: invScore,
        errors: errorScore,
        successRate: invScore > 0 ? (invScore - errorScore) / invScore : 1.0,
        role: a.role
      };
    });
  };

  return (
    <div className="relative min-h-screen w-screen overflow-x-hidden bg-[#050505] text-slate-100 font-sans selection:bg-primary/20 selection:text-white">
      {/* Absolute Moving Blurred Glow Blobs in Background */}
      <div className="absolute top-24 left-1/4 w-96 h-96 glow-blob bg-secondary/10 animate-float-slow -z-10" />
      <div className="absolute bottom-36 right-1/4 w-[420px] h-[420px] glow-blob bg-primary/10 animate-float-medium -z-10" />

      {/* Conditional rendering between Page 1 (Demo) and Workspace (Layout + Sidebar) */}
      {activeTab === "demo" ? (
        <DemoPage 
          onEnterDashboard={() => setActiveTab("dashboard")} 
        />
      ) : (
        <div className="flex h-screen w-screen flex-col overflow-hidden">
          <Navbar 
            isOnline={isOnline} 
            activeSessions={metrics?.active_sessions_count ?? 0} 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          
          <div className="flex flex-1 overflow-hidden">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <main className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="mx-auto max-w-6xl">
                {activeTab === "dashboard" && (
                  <Dashboard
                    metrics={metrics}
                    activeSessions={sessions.filter(s => s.status === "active")}
                    recentEvents={recentEvents}
                    onSelectSession={(id) => {
                      setSelectedSessionId(id);
                      setActiveTab("explorer"); // Route directly to Explorer
                    }}
                    setActiveTab={setActiveTab}
                    history={history}
                  />
                )}

                {activeTab === "explorer" && (
                  <ExplorerPage />
                )}
                
                {activeTab === "sessions" && (
                  <SessionsPage
                    sessions={sessions}
                    selectedSessionId={selectedSessionId}
                    onSelectSession={setSelectedSessionId}
                    refreshSessions={refreshSessionsList}
                  />
                )}
                
                {activeTab === "timeline" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Timeline Log</h2>
                      <p className="text-sm text-slate-400">Chronological list of agent communication traces and memory events.</p>
                    </div>

                    <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col min-h-[400px]">
                      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-6">
                        <span className="text-xs font-bold text-slate-400">SYSTEM TELEMETRY STREAM</span>
                        <span className="text-[10px] uppercase font-mono tracking-widest text-primary animate-pulse font-bold">Streaming</span>
                      </div>

                      <div className="space-y-3">
                        {recentEvents.length === 0 ? (
                          <div className="text-center py-20 text-slate-500 text-xs">
                            No telemetry logs found. Run a session first.
                          </div>
                        ) : (
                          recentEvents.map(evt => (
                            <TimelineCard
                              key={evt.event_id}
                              timestamp={evt.timestamp}
                              agentName={evt.agent_name}
                              eventType={evt.event_type}
                              payload={evt.payload}
                              hideBorder
                            />
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === "agents" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Coordinating Agents</h2>
                      <p className="text-sm text-slate-400 font-medium">Orchestration status, visual nodes and leaderboard rankings.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      <div className="lg:col-span-7 space-y-6">
                        <GraphVisualization />
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {[
                            { name: "ResearchAgent", role: "Topics Miner" },
                            { name: "WriterAgent", role: "Draft Constructor" },
                            { name: "ReviewerAgent", role: "Decision Guard" }
                          ].map((a, idx) => {
                            const state = getAgentState(a.name);
                            const getStateLabel = () => {
                              if (state === "running") return "RUNNING";
                              if (state === "completed") return "COMPLETED";
                              return "STANDBY";
                            };
                            const getStateColor = () => {
                              if (state === "running") return "bg-primary text-emerald-300";
                              if (state === "completed") return "bg-secondary text-purple-300";
                              return "bg-slate-600 text-slate-400";
                            };
                            return (
                              <div key={idx} className="glass-card p-4 border border-white/5">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Profile</h4>
                                <h3 className="text-sm font-bold text-white mt-1">{a.name}</h3>
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">{a.role}</p>
                                <div className="flex items-center space-x-1.5 mt-3 text-[10px] font-bold text-slate-400">
                                  <span className={`h-1.5 w-1.5 rounded-full ${getStateColor().split(" ")[0]} animate-pulse`} />
                                  <span>{getStateLabel()}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="lg:col-span-5">
                        <LeaderboardCard 
                          agents={getAgentLeaderboardData()} 
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === "analytics" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">System Analytics</h2>
                      <p className="text-sm text-slate-400">Deep-dive telemetry graphing latency, cache ratios, and LLM token parameters.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="glass-panel rounded-2xl p-5 border border-white/5">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <h3 className="font-bold text-white flex items-center space-x-2">
                            <SlidersHorizontal className="h-4.5 w-4.5 text-primary" />
                            <span>Real-Time Ingestion Speed</span>
                          </h3>
                          <span className="text-[10px] text-slate-500 font-mono font-bold">LATENCY VALUES</span>
                        </div>
                        <div className="pt-6">
                          <LatencyChart data={history.length > 0 ? history : [{ time: "10:00", latency: 0.18 }]} />
                        </div>
                      </div>

                      <div className="glass-panel rounded-2xl p-5 border border-white/5">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <h3 className="font-bold text-white flex items-center space-x-2">
                            <Database className="h-4.5 w-4.5 text-secondary" />
                            <span>Bypassed Token Metric</span>
                          </h3>
                          <span className="text-[10px] text-slate-500 font-mono font-bold">LLM SAVINGS</span>
                        </div>
                        <div className="pt-6">
                          <TokenSavingsChart data={history.length > 0 ? history : [{ time: "10:00", tokens: 24 }]} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "settings" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Settings</h2>
                      <p className="text-sm text-slate-400">Configure Valkey cache values and agent simulation settings.</p>
                    </div>

                    <div className="max-w-2xl glass-panel rounded-2xl p-6 border border-white/5 space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                          <Sliders className="h-4.5 w-4.5 text-primary" />
                          <span>Valkey Datastore Settings</span>
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Valkey Cache URL</label>
                            <input
                              type="text"
                              value={valkeyUrl}
                              onChange={(e) => setValkeyUrl(e.target.value)}
                              className="w-full glass-input px-3.5 py-2.5 text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Connection Pool TTL</label>
                            <input
                              type="text"
                              value="3600 seconds"
                              disabled
                              className="w-full glass-input px-3.5 py-2.5 text-xs font-mono opacity-50 cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 border-t border-white/5 pt-6">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                          <Cpu className="h-4.5 w-4.5 text-secondary" />
                          <span>Simulation Timing Engine</span>
                        </h3>
                        
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Orchestration Delay (ms)</label>
                          <input
                            type="number"
                            value={simDelay}
                            onChange={(e) => setSimDelay(Number(e.target.value))}
                            className="w-48 glass-input px-3.5 py-2.5 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-6 flex justify-end space-x-3">
                        <button
                          onClick={() => {
                            setValkeyUrl("localhost:6379");
                            setSimDelay(1500);
                          }}
                          className="flex items-center space-x-1.5 rounded-xl border border-white/10 hover:bg-white/5 px-4.5 py-2.5 text-xs font-bold text-slate-400 transition-all cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Reset defaults</span>
                        </button>
                        <button
                          onClick={() => alert("Settings saved locally! (Simulation config updated)")}
                          className="flex items-center space-x-1.5 rounded-xl bg-primary text-slate-900 hover:bg-teal-500 px-4.5 py-2.5 text-xs font-bold transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Save changes</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
