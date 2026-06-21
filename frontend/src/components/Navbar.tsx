import React from "react";
import { Cpu, Activity } from "lucide-react";

interface NavbarProps {
  isOnline: boolean;
  activeSessions: number;
}

export const Navbar: React.FC<NavbarProps> = ({ isOnline, activeSessions }) => {
  return (
    <header className="glass-panel sticky top-0 z-40 flex h-16 w-full items-center justify-between px-6">
      <div className="flex items-center space-x-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-white shadow-md shadow-primary/20">
          <Cpu className="h-6 w-6 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-white">MemoryOS</h1>
            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">v1.0.0</span>
          </div>
          <p className="text-xs text-slate-400">Distributed Agent Memory Infrastructure powered by Valkey</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Active sessions quick badge */}
        <div className="flex items-center space-x-2 rounded-lg bg-slate-800/40 px-3 py-1.5 border border-slate-700/50">
          <Activity className="h-4 w-4 text-secondary" />
          <span className="text-xs text-slate-300">
            Active Sessions: <span className="font-bold text-white">{activeSessions}</span>
          </span>
        </div>

        {/* Server status badge */}
        <div className="flex items-center space-x-2 rounded-lg bg-slate-800/40 px-3 py-1.5 border border-slate-700/50">
          <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? "bg-primary animate-ping" : "bg-red-500 animate-pulse"}`} />
          <span className="text-xs font-medium text-slate-300">
            Backend: <span className={isOnline ? "text-primary font-bold" : "text-red-500 font-bold"}>{isOnline ? "ONLINE" : "OFFLINE"}</span>
          </span>
        </div>
      </div>
    </header>
  );
};
