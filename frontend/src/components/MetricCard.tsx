import React, { useState, useEffect } from "react";
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
  const [animatedValue, setAnimatedValue] = useState<string | number>(typeof value === "number" ? 0 : value);

  useEffect(() => {
    if (typeof value !== "number") {
      setAnimatedValue(value);
      return;
    }

    const end = value;
    if (end === 0) {
      setAnimatedValue(0);
      return;
    }

    const duration = 600; // ms
    const frameRate = 30; // ms per frame
    const totalFrames = duration / frameRate;
    const increment = end / totalFrames;
    let currentFrame = 0;

    const timer = setInterval(() => {
      currentFrame++;
      const nextVal = Math.floor(increment * currentFrame);
      if (currentFrame >= totalFrames || nextVal >= end) {
        setAnimatedValue(end);
        clearInterval(timer);
      } else {
        setAnimatedValue(nextVal);
      }
    }, frameRate);

    return () => clearInterval(timer);
  }, [value]);

  const colorMap = {
    primary: "border-primary/20 text-primary bg-primary/5 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
    secondary: "border-secondary/20 text-secondary bg-secondary/5 shadow-[0_0_10px_rgba(139,92,246,0.1)]",
    accent: "border-tertiary/20 text-tertiary bg-tertiary/5 shadow-[0_0_10px_rgba(6,182,212,0.1)]",
    red: "border-red-500/20 text-red-500 bg-red-500/5 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
  };

  const borderHoverMap = {
    primary: "glass-card hover:border-primary/35",
    secondary: "glass-card glass-card-purple",
    accent: "glass-card glass-card-cyan",
    red: "glass-card hover:border-red-500/35"
  };

  return (
    <div className={`p-5 rounded-2xl flex flex-col justify-between cursor-default group relative overflow-hidden transition-all duration-300 ${borderHoverMap[color]}`}>
      {/* Muted background gradient lines */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent pointer-events-none" />
      
      <div className="flex items-center justify-between z-10">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300 group-hover:scale-110 ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 z-10">
        <h3 className="text-3xl font-extrabold tracking-tight text-white font-sans">
          {typeof animatedValue === "number" ? animatedValue.toLocaleString() : animatedValue}
        </h3>
        {subtext && <p className="mt-1.5 text-xs text-slate-500 font-medium">{subtext}</p>}
      </div>
    </div>
  );
};
