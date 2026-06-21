import React from "react";
import type { Session } from "../types";
import { Folder, Clock, Eye } from "lucide-react";

interface SessionCardProps {
  session: Session;
  isSelected: boolean;
  onSelect: () => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, isSelected, onSelect }) => {
  const isCompleted = session.status === "completed";
  const dateStr = new Date(session.created_at * 1000).toLocaleString();

  return (
    <div
      onClick={onSelect}
      className={`glass-card p-4 rounded-xl cursor-pointer border transition-all ${
        isSelected
          ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
          : "border-slate-700/50"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isSelected ? "bg-primary/20 text-primary" : "bg-slate-800 text-slate-400"}`}>
            <Folder className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm line-clamp-1">{session.name}</h4>
            <span className="text-[10px] text-slate-500 font-mono">{session.id}</span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className={`h-2 w-2 rounded-full ${isCompleted ? "bg-slate-500" : "bg-primary animate-pulse"}`} />
          <span className={`text-[10px] font-bold ${isCompleted ? "text-slate-400" : "text-primary"}`}>
            {session.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-1">
          <Clock className="h-3.5 w-3.5 text-slate-500" />
          <span>{dateStr}</span>
        </div>

        <button className="flex items-center space-x-1 text-primary font-semibold hover:underline bg-transparent border-0 p-0 cursor-pointer">
          <Eye className="h-3.5 w-3.5" />
          <span>View</span>
        </button>
      </div>
    </div>
  );
};
