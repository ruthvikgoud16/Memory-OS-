import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";

interface ChartProps {
  data: any[];
}

export const LatencyChart: React.FC<ChartProps> = ({ data }) => {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
          <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
          <YAxis stroke="#64748b" fontSize={11} unit="ms" />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f8fafc" }}
            labelStyle={{ fontWeight: "bold" }}
          />
          <Area type="monotone" dataKey="latency" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#colorLatency)" name="Avg Latency" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CachePerformanceChart: React.FC<ChartProps> = ({ data }) => {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
          <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
          <YAxis stroke="#64748b" fontSize={11} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f8fafc" }}
            labelStyle={{ fontWeight: "bold" }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="hits" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Cache Hits" />
          <Bar dataKey="misses" fill="#ef4848" radius={[4, 4, 0, 0]} name="Cache Misses" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const TokenSavingsChart: React.FC<ChartProps> = ({ data }) => {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
          <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
          <YAxis stroke="#64748b" fontSize={11} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f8fafc" }}
            labelStyle={{ fontWeight: "bold" }}
          />
          <Area type="monotone" dataKey="tokens" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorTokens)" name="Tokens Saved" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
