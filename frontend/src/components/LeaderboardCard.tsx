import React from "react";
import { Award, Zap, ShieldAlert, ShieldCheck } from "lucide-react";

interface LeaderboardAgent {
  name: string;
  invocations: number;
  errors: number;
  successRate: number;
  role: string;
}

interface LeaderboardCardProps {
  agents: LeaderboardAgent[];
}

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ agents }) => {
  // Sort agents by invocations
  const sorted = [...agents].sort((a, b) => b.invocations - a.invocations);

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return "bg-amber-500/10 border-amber-500/30 text-amber-400";
      case 1:
        return "bg-slate-300/10 border-slate-300/30 text-slate-300";
      case 2:
        return "bg-amber-700/10 border-amber-700/30 text-amber-600";
      default:
        return "bg-white/5 border-white/10 text-slate-400";
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col h-[400px]">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <h3 className="font-bold text-white flex items-center space-x-2">
          <Award className="h-4.5 w-4.5 text-secondary" />
          <span>Agent Leaderboard</span>
        </h3>
        <span className="text-[10px] text-slate-500 font-mono">Sorted by Invocations</span>
      </div>

      <div className="mt-4 flex-1 overflow-y-auto space-y-3.5 pr-1">
        {sorted.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-500 text-xs">
            No agent data available
          </div>
        ) : (
          sorted.map((agent, idx) => (
            <div 
              key={agent.name}
              className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] hover:border-white/10 transition-all duration-200"
            >
              <div className="flex items-center space-x-3 min-w-0">
                {/* Rank indicator badge */}
                <div className={`flex h-6 w-6 items-center justify-center rounded-lg border text-xs font-black font-mono ${getRankBadge(idx)}`}>
                  {idx + 1}
                </div>
                
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{agent.name}</h4>
                  <span className="text-[10px] text-slate-400 font-medium font-mono">{agent.role}</span>
                </div>
              </div>

              {/* Performance indicators */}
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Runs</span>
                  <span className="text-xs font-black text-white font-mono flex items-center space-x-0.5 justify-end">
                    <Zap className="h-3.5 w-3.5 text-primary" />
                    <span>{agent.invocations}</span>
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Efficiency</span>
                  <span className={`text-xs font-black font-mono flex items-center space-x-0.5 justify-end ${agent.successRate >= 0.95 ? "text-primary" : "text-red-400"}`}>
                    {agent.successRate >= 0.95 ? (
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
                    )}
                    <span>{Math.floor(agent.successRate * 100)}%</span>
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
