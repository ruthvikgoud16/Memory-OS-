import React from "react";
import { Search, Sparkles } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search AI memory..."
}) => {
  return (
    <div className="relative group w-full">
      {/* Outer gradient glow line */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-xl blur opacity-25 group-focus-within:opacity-55 transition duration-300 pointer-events-none" />
      
      <div className="relative flex items-center bg-[#050505] rounded-xl border border-white/5 group-focus-within:border-primary/50 overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
        <div className="flex h-12 w-12 items-center justify-center text-slate-500 group-focus-within:text-primary transition-colors">
          <Search className="h-4.5 w-4.5" />
        </div>
        
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 h-12 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none pr-4"
        />

        <div className="flex items-center space-x-1.5 pr-4 text-[10px] font-bold text-slate-500 select-none">
          <Sparkles className="h-3.5 w-3.5 text-secondary animate-pulse" />
          <span className="font-mono">SEMANTIC READY</span>
        </div>
      </div>
    </div>
  );
};
