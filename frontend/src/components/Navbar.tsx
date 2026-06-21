import React from "react";
import { Cpu, Activity, PlayCircle } from "lucide-react";

interface NavbarProps {
  isOnline: boolean;
  activeSessions: number;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ isOnline, activeSessions, activeTab, setActiveTab }) => {
  return (
    <header className="glass-panel sticky top-0 z-40 flex h-16 w-full items-center justify-between px-6 bg-[#050505]/40 backdrop-blur-md border-b border-white/5">
      <div 
        className="flex items-center space-x-3 cursor-pointer select-none group"
        onClick={() => setActiveTab && setActiveTab("demo")}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-transform duration-300 group-hover:scale-105">
          <Cpu className="h-5.5 w-5.5 animate-pulse-slow" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold tracking-tight text-white transition-colors duration-200 group-hover:text-primary">
              Memory<span className="text-secondary font-extrabold">OS</span>
            </h1>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
              v1.1.0
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono tracking-tight">Distributed AI Memory powered by Valkey</p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Pitch Page quick navigate */}
        {activeTab && activeTab !== "demo" && setActiveTab && (
          <button
            onClick={() => setActiveTab("demo")}
            className="flex items-center space-x-1.5 rounded-lg bg-secondary/10 px-3 py-1.5 border border-secondary/20 hover:bg-secondary/20 transition-all text-xs font-semibold text-purple-300 cursor-pointer"
          >
            <PlayCircle className="h-4 w-4" />
            <span>Interactive Pitch</span>
          </button>
        )}

        {/* Active sessions quick badge */}
        <div className="flex items-center space-x-2 rounded-lg bg-white/[0.02] px-3 py-1.5 border border-white/5 shadow-inner">
          <Activity className="h-4 w-4 text-secondary animate-pulse" />
          <span className="text-xs text-slate-400">
            Sessions: <span className="font-bold text-white">{activeSessions}</span>
          </span>
        </div>

        {/* Server status badge */}
        <div className="flex items-center space-x-2 rounded-lg bg-white/[0.02] px-3 py-1.5 border border-white/5">
          <span className="relative flex h-2 w-2">
            {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? "bg-primary" : "bg-red-500"}`}></span>
          </span>
          <span className="text-xs font-medium text-slate-400">
            System: <span className={isOnline ? "text-primary font-bold" : "text-red-500 font-bold"}>{isOnline ? "ONLINE" : "OFFLINE"}</span>
          </span>
        </div>
      </div>
    </header>
  );
};
