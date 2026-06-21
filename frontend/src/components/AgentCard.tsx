import React from "react";
import { Cpu, CheckCircle2, Loader2 } from "lucide-react";

interface AgentCardProps {
  agentName: string;
  status: "idle" | "running" | "completed";
  invocations: number;
  errors: number;
  description?: string;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agentName,
  status,
  invocations,
  errors,
  description
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case "running":
        return {
          color: "text-primary border-primary/20 bg-primary/5",
          dotColor: "bg-primary animate-ping",
          icon: Loader2,
          iconClass: "animate-spin text-primary"
        };
      case "completed":
        return {
          color: "text-secondary border-secondary/20 bg-secondary/5",
          dotColor: "bg-secondary",
          icon: CheckCircle2,
          iconClass: "text-secondary"
        };
      default:
        return {
          color: "text-slate-400 border-white/10 bg-white/[0.01]",
          dotColor: "bg-slate-600",
          icon: Cpu,
          iconClass: "text-slate-500"
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="glass-card p-5 border border-white/5 relative overflow-hidden flex flex-col justify-between h-44 group">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-base font-bold text-white tracking-tight">{agentName}</h4>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{description || "System AI Agent"}</p>
        </div>
        
        {/* Status Badge */}
        <div className={`flex items-center space-x-1.5 rounded-full px-2.5 py-1 border text-[10px] font-bold uppercase tracking-wider ${statusConfig.color}`}>
          <span className="relative flex h-1.5 w-1.5">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${statusConfig.dotColor}`}></span>
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${statusConfig.dotColor.split(" ")[0]}`}></span>
          </span>
          <span>{status}</span>
        </div>
      </div>

      <div className="mt-4 flex-1">
        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Invocations</span>
            <p className="text-lg font-extrabold text-white font-mono mt-0.5">{invocations}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Errors</span>
            <p className={`text-lg font-extrabold font-mono mt-0.5 ${errors > 0 ? "text-red-500" : "text-slate-400"}`}>
              {errors}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
