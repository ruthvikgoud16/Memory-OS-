import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { SessionsPage } from "./pages/SessionsPage";
import { TimelinePage } from "./pages/TimelinePage";
import { MetricsPage } from "./pages/MetricsPage";
import { api } from "./services/api";
import type { Session, TimelineEvent, MetricsData } from "./types";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isOnline, setIsOnline] = useState<boolean>(false);
  
  // Data States
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [recentEvents, setRecentEvents] = useState<TimelineEvent[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  // Chart History State
  const [history, setHistory] = useState<any[]>([]);

  // Function to load and refresh sessions from localStorage index
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
          // If 404 or fails, we discard it
          console.warn(`Discovered stale or missing session ID: ${id}`);
        }
      }

      // Keep only valid IDs in localStorage
      localStorage.setItem("memoryos_sessions", JSON.stringify(validIds));
      
      // Sort sessions: active first, then newest created first
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

  // Run on mount to initialize session list
  useEffect(() => {
    if (isOnline) {
      refreshSessionsList();
    }
  }, [isOnline]);

  // Main polling loop (every 2 seconds)
  useEffect(() => {
    const poll = async () => {
      try {
        // 1. Fetch metrics
        const metricsData = await api.getMetrics();
        setMetrics(metricsData);
        setIsOnline(true);

        // Update latency / cache charts history
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setHistory((prev) => {
          const newPoint = {
            time: nowStr,
            latency: metricsData.global.latency,
            hits: metricsData.global.cache_hits,
            misses: metricsData.global.cache_misses,
            tokens: metricsData.global.tokens_saved,
          };
          const next = [...prev, newPoint];
          return next.slice(-15); // limit to last 15 points
        });

        // 2. Fetch global timeline events
        const globalEvents = await api.getEvents(undefined, 20, "desc");
        setRecentEvents(globalEvents);
      } catch (err) {
        console.error("Polling error:", err);
        setIsOnline(false);
      }
    };

    poll(); // Initial run
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-darkBg text-slate-100 font-sans">
      <Navbar isOnline={isOnline} activeSessions={metrics?.active_sessions_count ?? 0} />
      
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
                  setActiveTab("sessions");
                }}
                setActiveTab={setActiveTab}
              />
            )}
            
            {activeTab === "sessions" && (
              <SessionsPage
                sessions={sessions}
                selectedSessionId={selectedSessionId}
                onSelectSession={setSelectedSessionId}
                refreshSessions={() => {
                  refreshSessionsList();
                }}
              />
            )}
            
            {activeTab === "timeline" && (
              <TimelinePage
                sessions={sessions}
                selectedSessionId={selectedSessionId}
                onSelectSession={setSelectedSessionId}
              />
            )}
            
            {activeTab === "metrics" && (
              <MetricsPage
                metrics={metrics}
                history={history}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
