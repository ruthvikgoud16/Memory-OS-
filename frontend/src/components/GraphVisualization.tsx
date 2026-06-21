import React from "react";
import { Cpu, Database, Network } from "lucide-react";

interface GraphVisualizationProps {
  activeStep?: "idle" | "research" | "writer" | "reviewer";
}

export const GraphVisualization: React.FC<GraphVisualizationProps> = ({ activeStep = "idle" }) => {
  const getHighlightNode = (nodeId: string) => {
    if (activeStep === "research" && nodeId === "research") return "scale-110 filter drop-shadow-[0_0_15px_rgba(139,92,246,0.8)]";
    if (activeStep === "writer" && nodeId === "writer") return "scale-110 filter drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]";
    if (activeStep === "reviewer" && nodeId === "reviewer") return "scale-110 filter drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]";
    if (nodeId === "valkey" && activeStep !== "idle") return "filter drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]";
    return "opacity-70";
  };

  const getPathStyle = (pathId: string) => {
    if (activeStep === "research" && pathId === "research-to-valkey") {
      return "stroke-[#8B5CF6] stroke-[3px] stroke-dasharray-[6,4] animate-[dash_1s_linear_infinite]";
    }
    if (activeStep === "writer" && (pathId === "valkey-to-writer" || pathId === "writer-to-valkey")) {
      return "stroke-[#06B6D4] stroke-[3px] stroke-dasharray-[6,4] animate-[dash_1s_linear_infinite]";
    }
    if (activeStep === "reviewer" && (pathId === "valkey-to-reviewer" || pathId === "reviewer-to-valkey")) {
      return "stroke-[#10B981] stroke-[3px] stroke-dasharray-[6,4] animate-[dash_1s_linear_infinite]";
    }
    return "stroke-white/10 stroke-[1.5px]";
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-white/5 relative overflow-hidden flex flex-col items-center justify-between h-[360px] w-full">
      {/* Title */}
      <div className="flex items-center justify-between w-full border-b border-white/5 pb-3">
        <h3 className="font-bold text-white flex items-center space-x-2">
          <Network className="h-4.5 w-4.5 text-primary" />
          <span>Orchestration Topology</span>
        </h3>
        <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-500 font-mono">
          <span className="relative flex h-2 w-2">
            {activeStep !== "idle" && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${activeStep !== "idle" ? "bg-primary" : "bg-slate-700"}`}></span>
          </span>
          <span>{activeStep === "idle" ? "STATIC MAP" : `${activeStep.toUpperCase()} STEP ACTIVE`}</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative flex-1 w-full flex items-center justify-center min-h-[220px]">
        {/* Style block for animated dash array keyframes */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes dash {
            to {
              stroke-dashoffset: -20;
            }
          }
        `}} />

        <svg viewBox="0 0 500 240" className="w-full max-w-[480px] h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Connector Paths */}
          
          {/* Research to Valkey */}
          <path 
            d="M 125,70 Q 200,60 230,105" 
            fill="none" 
            className={getPathStyle("research-to-valkey")}
          />
          {/* Valkey to Writer */}
          <path 
            d="M 230,135 Q 180,160 125,170" 
            fill="none" 
            className={getPathStyle("valkey-to-writer")}
          />
          {/* Writer to Valkey */}
          <path 
            d="M 125,170 Q 210,180 230,135" 
            fill="none" 
            className={getPathStyle("writer-to-valkey")}
          />
          {/* Valkey to Reviewer */}
          <path 
            d="M 270,120 Q 320,100 375,120" 
            fill="none" 
            className={getPathStyle("valkey-to-reviewer")}
          />
          {/* Reviewer to Valkey */}
          <path 
            d="M 375,120 Q 330,140 270,120" 
            fill="none" 
            className={getPathStyle("reviewer-to-valkey")}
          />

          {/* Valkey Central Node (Hub) */}
          <g className={`transition-all duration-300 ${getHighlightNode("valkey")}`}>
            <circle cx="250" cy="120" r="28" fill="#111111" stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="250" cy="120" r="24" fill="url(#valkey-glow)" opacity="0.15" />
            <foreignObject x="238" y="108" width="24" height="24">
              <Database className="h-6 w-6 text-white" />
            </foreignObject>
            <text x="250" y="165" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold" fontFamily="Inter, sans-serif">
              Valkey DB
            </text>
          </g>

          {/* Research Agent Node (Left Top) */}
          <g className={`transition-all duration-300 ${getHighlightNode("research")}`}>
            <rect x="20" y="30" width="100" height="40" rx="8" fill="#111" stroke="#8B5CF6" strokeWidth="1.5" />
            <foreignObject x="28" y="40" width="20" height="20">
              <Cpu className="h-5 w-5 text-secondary animate-pulse-slow" />
            </foreignObject>
            <text x="56" y="54" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="Inter, sans-serif">
              ResearchAgent
            </text>
            <text x="56" y="64" fill="#8B5CF6" fontSize="7" fontWeight="bold" fontFamily="Inter, sans-serif">
              WRITES HASH
            </text>
          </g>

          {/* Writer Agent Node (Left Bottom) */}
          <g className={`transition-all duration-300 ${getHighlightNode("writer")}`}>
            <rect x="20" y="150" width="100" height="40" rx="8" fill="#111" stroke="#06B6D4" strokeWidth="1.5" />
            <foreignObject x="28" y="160" width="20" height="20">
              <Cpu className="h-5 w-5 text-tertiary" />
            </foreignObject>
            <text x="56" y="174" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="Inter, sans-serif">
              WriterAgent
            </text>
            <text x="56" y="184" fill="#06B6D4" fontSize="7" fontWeight="bold" fontFamily="Inter, sans-serif">
              READS & WRITES
            </text>
          </g>

          {/* Reviewer Agent Node (Right Center) */}
          <g className={`transition-all duration-300 ${getHighlightNode("reviewer")}`}>
            <rect x="380" y="100" width="100" height="40" rx="8" fill="#111" stroke="#10B981" strokeWidth="1.5" />
            <foreignObject x="388" y="110" width="20" height="20">
              <Cpu className="h-5 w-5 text-primary" />
            </foreignObject>
            <text x="416" y="124" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="Inter, sans-serif">
              ReviewerAgent
            </text>
            <text x="416" y="134" fill="#10B981" fontSize="7" fontWeight="bold" fontFamily="Inter, sans-serif">
              EVALUATES & WRITES
            </text>
          </g>

          {/* Definition for glows */}
          <defs>
            <radialGradient id="valkey-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Description caption */}
      <p className="text-[10px] text-slate-500 font-medium text-center">
        {activeStep === "idle" && "Execute simulation to watch real-time data flows between agent processes."}
        {activeStep === "research" && "ResearchAgent writes compiled search topics to Valkey context."}
        {activeStep === "writer" && "WriterAgent queries topics from Valkey and drafts the text content."}
        {activeStep === "reviewer" && "ReviewerAgent reads final draft from Valkey, grading the final result."}
      </p>
    </div>
  );
};
