import React from "react";
import { LayoutDashboard, FolderKanban, Milestone, BarChart3, Settings, Database, Cpu } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "explorer", label: "Memory Explorer", icon: Database },
    { id: "sessions", label: "Sessions", icon: FolderKanban },
    { id: "timeline", label: "Timeline", icon: Milestone },
    { id: "agents", label: "Agents", icon: Cpu },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="glass-panel hidden h-[calc(100vh-4rem)] w-64 flex-col justify-between p-4 md:flex bg-[#050505]/60 border-r border-white/5">
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Workspace</p>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-primary/15 to-secondary/5 text-white border-l-2 border-primary shadow-[0_0_15px_rgba(16,185,129,0.08)]"
                      : "text-slate-400 hover:bg-white/[0.02] hover:text-white hover:translate-x-1"
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 transition-colors ${isActive ? "text-primary" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="rounded-xl bg-white/[0.01] p-3 border border-white/5 flex items-center space-x-3 shadow-inner">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
          <Database className="h-4.5 w-4.5 text-primary" />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-white truncate">Valkey Cluster</h4>
          <p className="text-[10px] text-slate-500 font-mono">Sub-ms cache layer</p>
        </div>
      </div>
    </aside>
  );
};
