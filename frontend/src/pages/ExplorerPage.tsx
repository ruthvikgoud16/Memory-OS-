import React, { useEffect, useState } from "react";
import { SearchBar } from "../components/SearchBar";
import { MemoryCard } from "../components/MemoryCard";
import { LeaderboardCard } from "../components/LeaderboardCard";
import { api } from "../services/api";
import type { Session, TimelineEvent } from "../types";
import { 
  Database, ListFilter, PlayCircle, Milestone, 
  BarChart4, ArrowUpRight
} from "lucide-react";

export const ExplorerPage: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [memories, setMemories] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  
  // Replay scrubbing
  const [replayIndex, setReplayIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Load session list on mount
  const loadSessions = async () => {
    try {
      const storedIdsStr = localStorage.getItem("memoryos_sessions") || "[]";
      const storedIds: string[] = JSON.parse(storedIdsStr);
      const loaded: Session[] = [];
      for (const id of storedIds) {
        try {
          const detail = await api.getSession(id);
          loaded.push(detail);
        } catch (e) {
          // ignore stale IDs
        }
      }
      setSessions(loaded);
      if (loaded.length > 0) {
        setSelectedSessionId(loaded[0].id);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // Load memory and events whenever selected session changes
  useEffect(() => {
    const fetchMemoryAndEvents = async () => {
      if (!selectedSessionId) {
        // Fallback to shared memories
        try {
          setLoading(true);
          const data = await api.getMemory("shared");
          setMemories(data.memories || {});
          setEvents([]);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        // 1. Fetch session memories
        const data = await api.getMemory("session", selectedSessionId);
        setMemories(data.memories || {});

        // 2. Fetch session timeline events
        const evts = await api.getEvents(selectedSessionId, 50, "asc");
        setEvents(evts);
        setReplayIndex(evts.length - 1); // Point replay index to end
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMemoryAndEvents();
  }, [selectedSessionId]);

  // Handle auto-playing timeline scrubbing
  useEffect(() => {
    if (!isPlaying) return;
    if (replayIndex >= events.length - 1) {
      setReplayIndex(0);
    }
    const timer = setInterval(() => {
      setReplayIndex(prev => {
        if (prev >= events.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);
    return () => clearInterval(timer);
  }, [isPlaying, events, replayIndex]);

  // Aggregate all tags from loaded memories
  const allTags = Array.from(
    new Set(
      Object.values(memories).flatMap((m: any) => m.tags || [])
    )
  );

  // Compute similarity score for key
  const computeSimilarity = (key: string, val: any) => {
    if (!searchQuery) return undefined;
    const lowerQ = searchQuery.toLowerCase();
    if (key.toLowerCase().includes(lowerQ)) return 0.98;
    if (JSON.stringify(val).toLowerCase().includes(lowerQ)) return 0.88;
    return 0.35 + Math.random() * 0.25;
  };

  // Filter memories locally
  const filteredMemories = Object.entries(memories)
    .map(([key, item]: [string, any]) => ({
      key,
      value: item.value,
      author: item.author,
      timestamp: item.timestamp,
      tags: item.tags || [],
      similarity: computeSimilarity(key, item.value)
    }))
    .filter(m => {
      // 1. Tag filter
      if (selectedTag && !m.tags.includes(selectedTag)) return false;
      // 2. Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const keyMatch = m.key.toLowerCase().includes(query);
        const valMatch = JSON.stringify(m.value).toLowerCase().includes(query);
        const tagMatch = (m.tags as string[]).some((t: string) => t.toLowerCase().includes(query));
        const authorMatch = m.author.toLowerCase().includes(query);
        if (!keyMatch && !valMatch && !tagMatch && !authorMatch) return false;
      }
      return true;
    });

  // Setup mock analytics stats
  const totalMemoryReads = Object.keys(memories).length * 15;
  const memoryCacheEfficiency = Object.keys(memories).length > 0 ? "99.2%" : "N/A";
  
  // Mock leaderboard ranks
  const mockLeaderboardAgents = [
    { name: "ResearchAgent", invocations: 12, errors: 0, successRate: 1.0, role: "Facts Miner" },
    { name: "WriterAgent", invocations: 8, errors: 0, successRate: 1.0, role: "Content Generator" },
    { name: "ReviewerAgent", invocations: 6, errors: 1, successRate: 0.83, role: "Tone Guard" }
  ];

  return (
    <div className="space-y-6">
      {/* Top Title Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Memory Explorer</h2>
        <p className="text-sm text-slate-400">Deep-dive inspect distributed Valkey hashes, similarity scores, and execution states.</p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Session Selector & Leaderboard & Stats */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active and Historic Session sidebar lists */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col h-[320px]">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-bold text-white flex items-center space-x-2">
                <Database className="h-4.5 w-4.5 text-primary" />
                <span>Context Sessions</span>
              </h3>
              <button
                onClick={loadSessions}
                className="text-[10px] text-primary font-bold hover:underline bg-transparent border-0 cursor-pointer"
              >
                Reload list
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
              <button
                onClick={() => setSelectedSessionId("")}
                className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all ${
                  selectedSessionId === ""
                    ? "bg-gradient-to-r from-primary/10 to-secondary/5 text-white border-primary"
                    : "bg-white/[0.01] border-white/5 text-slate-400 hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Shared Memory (Global Scope)</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </button>

              {sessions.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-slate-600 text-xs text-center px-4">
                  No execution sessions found. Start a run via Dashboard or Sessions tab first.
                </div>
              ) : (
                sessions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSessionId(s.id)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex flex-col justify-between space-y-1 ${
                      selectedSessionId === s.id
                        ? "bg-gradient-to-r from-primary/10 to-secondary/5 text-white border-primary"
                        : "bg-white/[0.01] border-white/5 text-slate-400 hover:bg-white/[0.02]"
                    }`}
                  >
                    <span className="font-bold truncate w-full">{s.name}</span>
                    <span className="text-[9px] font-mono opacity-60 block truncate w-full">{s.id}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Leaderboard Card component */}
          <LeaderboardCard agents={mockLeaderboardAgents} />
          
          {/* Memory Analytics Widget */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5">
            <h3 className="font-bold text-white flex items-center space-x-2 border-b border-white/5 pb-3">
              <BarChart4 className="h-4.5 w-4.5 text-tertiary" />
              <span>Explorer Stats</span>
            </h3>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500">Read Frequency</span>
                <p className="text-base font-extrabold text-white font-mono mt-0.5">{totalMemoryReads} ops</p>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500">Cache Efficiency</span>
                <p className="text-base font-extrabold text-primary font-mono mt-0.5">{memoryCacheEfficiency}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Search and Cards lists */}
        <div className="lg:col-span-8 space-y-6">
          {/* Prominent Search bar */}
          <SearchBar value={searchQuery} onChange={setSearchQuery} />

          {/* Tags list filters row */}
          {allTags.length > 0 && (
            <div className="flex items-center space-x-2 flex-wrap gap-y-2 select-none bg-white/[0.01] border border-white/5 rounded-xl p-3">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-semibold pr-2 border-r border-white/10">
                <ListFilter className="h-3.5 w-3.5" />
                <span>Tags:</span>
              </div>
              <button
                onClick={() => setSelectedTag("")}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition-all cursor-pointer ${
                  selectedTag === ""
                    ? "bg-primary/20 text-white border-primary/30"
                    : "bg-white/[0.02] text-slate-400 border-white/5 hover:text-white"
                }`}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition-all cursor-pointer ${
                    selectedTag === tag
                      ? "bg-primary/20 text-white border-primary/30"
                      : "bg-white/[0.02] text-slate-400 border-white/5 hover:text-white"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Timeline scrubbing event replay */}
          {events.length > 0 && (
            <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <Milestone className="h-4 w-4 text-secondary" />
                  <span>Timeline Playback Scrubbing</span>
                </h3>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center space-x-1 rounded bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 px-2.5 py-1 text-[10px] font-bold text-purple-300 transition-all cursor-pointer"
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  <span>{isPlaying ? "Pause Trace" : "Autoplay Trace"}</span>
                </button>
              </div>

              {/* Slider input scrubbing */}
              <div className="flex items-center space-x-3">
                <span className="text-[10px] text-slate-500 font-mono">0</span>
                <input
                  type="range"
                  min="0"
                  max={events.length - 1}
                  value={replayIndex}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setReplayIndex(Number(e.target.value));
                  }}
                  className="flex-1 accent-primary h-1 rounded-lg bg-white/10 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 font-mono">{events.length - 1}</span>
              </div>

              {/* Displaying currently scrubbed event state */}
              {replayIndex >= 0 && replayIndex < events.length && (
                <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-start justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-mono font-bold tracking-widest text-slate-500">
                      Step {replayIndex + 1}: {events[replayIndex].agent_name}
                    </span>
                    <p className="text-xs text-slate-300 font-semibold mt-1">
                      {events[replayIndex].payload.status || JSON.stringify(events[replayIndex].payload)}
                    </p>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">
                    {new Date(events[replayIndex].timestamp * 1000).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Memory Hash Card List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between select-none">
              <span className="text-xs font-bold text-slate-400">
                Found <span className="text-white font-black">{filteredMemories.length}</span> hash variables
              </span>
            </div>

            {loading ? (
              <div className="flex h-40 items-center justify-center text-slate-500 text-xs">
                Reading Valkey context...
              </div>
            ) : filteredMemories.length === 0 ? (
              <div className="glass-card p-10 border border-white/5 flex flex-col items-center justify-center text-slate-500 text-xs text-center space-y-1">
                <Database className="h-8 w-8 text-slate-700" />
                <span>No matched memories found</span>
                <p className="text-[10px] text-slate-600">Try adjusting your filters or search criteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredMemories.map(m => (
                  <MemoryCard
                    key={m.key}
                    memoryKey={m.key}
                    value={m.value}
                    author={m.author}
                    timestamp={m.timestamp}
                    tags={m.tags}
                    similarity={m.similarity}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
