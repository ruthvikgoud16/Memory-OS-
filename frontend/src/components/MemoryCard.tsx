import React, { useState } from "react";
import { Database, Copy, Check, ChevronDown, ChevronRight, Tag } from "lucide-react";

interface MemoryCardProps {
  memoryKey: string;
  value: any;
  author: string;
  timestamp: number;
  tags?: string[];
  similarity?: number;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({
  memoryKey,
  value,
  author,
  timestamp,
  tags = [],
  similarity
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(false);

  const handleCopy = async () => {
    try {
      const text = typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const getAgentColor = (name: string) => {
    const lName = name.toLowerCase();
    if (lName.includes("research")) return "text-secondary border-secondary/20 bg-secondary/5";
    if (lName.includes("writer")) return "text-tertiary border-tertiary/20 bg-tertiary/5";
    if (lName.includes("reviewer")) return "text-primary border-primary/20 bg-primary/5";
    return "text-slate-400 border-white/10 bg-white/5";
  };

  const timeStr = new Date(timestamp * 1000).toLocaleString();

  return (
    <div className="glass-card p-5 border border-white/5 flex flex-col justify-between hover:border-white/10 hover:bg-white/[0.03] transition-all duration-300">
      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.02] border border-white/5 text-slate-400 group-hover:text-white">
              <Database className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Valkey Hash Key</span>
              <h4 className="text-sm font-bold text-white truncate max-w-[240px] sm:max-w-md font-mono" title={memoryKey}>{memoryKey}</h4>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {similarity !== undefined && (
              <div className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                Match: {Math.floor(similarity * 100)}%
              </div>
            )}
            <button
              onClick={handleCopy}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Details and author info */}
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 border uppercase ${getAgentColor(author)}`}>
            {author}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">{timeStr}</span>
        </div>

        {/* Content body */}
        <div className="mt-4 border border-white/5 rounded-xl overflow-hidden bg-black/40">
          <div 
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between px-4 py-2.5 text-xs text-slate-400 hover:text-white hover:bg-white/[0.01] cursor-pointer select-none border-b border-white/5"
          >
            <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-500">Stored Context Value</span>
            <div className="flex items-center space-x-1">
              <span className="text-[10px] font-mono">{expanded ? "Collapse" : "Expand JSON"}</span>
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </div>
          </div>

          <div className={`p-4 transition-all overflow-x-auto ${expanded ? "max-h-[300px]" : "max-h-24 overflow-hidden relative"}`}>
            <pre className="text-xs font-mono-code text-slate-300 leading-relaxed whitespace-pre-wrap select-all">
              {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
            </pre>
            
            {!expanded && (
              <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
            )}
          </div>
        </div>
      </div>

      {/* Tags section */}
      {tags.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-1.5">
          {tags.map((tag, idx) => (
            <span 
              key={idx}
              className="inline-flex items-center space-x-1 rounded-full bg-white/[0.02] border border-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-slate-400"
            >
              <Tag className="h-3 w-3 text-slate-500" />
              <span>{tag}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
