import React from "react";
import { LayoutDashboard, FolderKanban, Milestone, BarChart3, Database } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "sessions", label: "Sessions", icon: FolderKanban },
    { id: "timeline", label: "Timeline", icon: Milestone },
    { id: "metrics", label: "Metrics", icon: BarChart3 },
  ];

  return (
    <aside className="glass-panel hidden h-[calc(100vh-4rem)] w-64 flex-col justify-between p-4 md:flex">
      <div className="space-y-6">
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Navigation</p>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-primary/20 to-secondary/10 text-white border-l-4 border-primary"
                      : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="rounded-lg bg-slate-800/30 p-3 border border-slate-700/30 flex items-center space-x-2">
        <Database className="h-5 w-5 text-primary" />
        <div>
          <h4 className="text-xs font-bold text-white">Valkey Storage</h4>
          <p className="text-[10px] text-slate-400">Strictly Valkey-Only Backend</p>
        </div>
      </div>
    </aside>
  );
};
