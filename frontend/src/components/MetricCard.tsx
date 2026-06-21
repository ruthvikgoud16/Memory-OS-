import React from "react";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtext?: string;
  color?: "primary" | "secondary" | "accent" | "red";
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  subtext,
  color = "primary"
}) => {
  const colorMap = {
    primary: "border-primary/20 text-primary bg-primary/5",
    secondary: "border-secondary/20 text-secondary bg-secondary/5",
    accent: "border-blue-500/20 text-blue-500 bg-blue-500/5",
    red: "border-red-500/20 text-red-500 bg-red-500/5"
  };

  const glowMap = {
    primary: "group-hover:border-primary/50 group-hover:shadow-[0_0_20px_rgba(20,184,166,0.15)]",
    secondary: "group-hover:border-secondary/50 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]",
    accent: "group-hover:border-blue-500/50 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]",
    red: "group-hover:border-red-500/50 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]"
  };

  return (
    <div className={`group glass-card p-4 rounded-xl border border-slate-700/50 flex flex-col justify-between ${glowMap[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-400">{title}</span>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-2xl font-bold tracking-tight text-white">{value}</h3>
        {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
      </div>
    </div>
  );
};
