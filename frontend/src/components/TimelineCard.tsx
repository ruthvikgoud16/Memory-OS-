import React from "react";
import { User, Clock } from "lucide-react";

interface TimelineCardProps {
  timestamp: number;
  agentName: string;
  eventType: string;
  payload: Record<string, any>;
  hideBorder?: boolean;
}

export const TimelineCard: React.FC<TimelineCardProps> = ({
  timestamp,
  agentName,
  eventType,
  payload,
  hideBorder = false
}) => {
  // Determine color matching for borders and text based on agent
  const getAgentTheme = () => {
    const name = agentName.toLowerCase();
    if (name.includes("research")) {
      return {
        border: "border-l-secondary",
        text: "text-secondary",
        glow: "shadow-[0_0_15px_rgba(139,92,246,0.1)]",
        badge: "bg-secondary/10 border-secondary/20 text-purple-300",
        bullet: "bg-secondary"
      };
    } else if (name.includes("writer")) {
      return {
        border: "border-l-tertiary",
        text: "text-tertiary",
        glow: "shadow-[0_0_15px_rgba(6,182,212,0.1)]",
        badge: "bg-tertiary/10 border-tertiary/20 text-cyan-300",
        bullet: "bg-tertiary"
      };
    } else if (name.includes("reviewer")) {
      return {
        border: "border-l-primary",
        text: "text-primary",
        glow: "shadow-[0_0_15px_rgba(16,185,129,0.1)]",
        badge: "bg-primary/10 border-primary/20 text-emerald-300",
        bullet: "bg-primary"
      };
    } else {
      return {
        border: "border-l-slate-700",
        text: "text-slate-400",
        glow: "shadow-none",
        badge: "bg-white/5 border-white/10 text-slate-300",
        bullet: "bg-slate-700"
      };
    }
  };

  const theme = getAgentTheme();
  const dateStr = new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Format message summary
  const messageSummary = payload.status || payload.message || JSON.stringify(payload);

  return (
    <div className={`relative pl-6 pb-4 last:pb-0 ${hideBorder ? "" : "border-l border-white/5"}`}>
      {/* Dynamic timeline node indicator */}
      <span className={`absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border border-black/50 transition-all duration-300 ${theme.bullet} ${theme.glow}`} />

      <div className={`glass-card p-4 border border-white/5 border-l-4 ${theme.border} hover:bg-white/[0.03] transition-all duration-200`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className={`text-xs font-bold flex items-center space-x-1.5 ${theme.text}`}>
              <User className="h-3.5 w-3.5" />
              <span>{agentName}</span>
            </span>
            <span className={`text-[9px] rounded-full px-2 py-0.5 border font-bold uppercase tracking-wider font-mono ${theme.badge}`}>
              {eventType}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{dateStr}</span>
          </span>
        </div>

        <p className="mt-2 text-xs text-slate-300 font-medium leading-relaxed">
          {messageSummary}
        </p>

        {Object.keys(payload).length > 1 && (
          <div className="mt-2 text-[10px] bg-black/40 border border-white/5 rounded-lg p-2 font-mono-code text-slate-400 overflow-x-auto select-all max-h-24">
            {JSON.stringify(payload, null, 2)}
          </div>
        )}
      </div>
    </div>
  );
};
