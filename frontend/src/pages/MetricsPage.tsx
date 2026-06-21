import React from "react";
import type { MetricsData } from "../types";
import { LatencyChart, CachePerformanceChart, TokenSavingsChart } from "../components/Charts";
import { Clock, Target, PiggyBank } from "lucide-react";

interface MetricsPageProps {
  metrics: MetricsData | null;
  history: any[];
}

export const MetricsPage: React.FC<MetricsPageProps> = ({ history }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">System Performance Metrics</h2>
        <p className="text-sm text-slate-400">Time-series tracking of Valkey operations, latency, and cache hit metrics.</p>
      </div>

      {/* Grid of charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Latency Area Chart */}
        <div className="glass-panel rounded-xl p-5 border border-slate-700/40">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-white">Rolling Average Latency</h3>
          </div>
          {history.length > 0 ? (
            <LatencyChart data={history} />
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
              Waiting for telemetry data...
            </div>
          )}
        </div>

        {/* Cache Performance Bar Chart */}
        <div className="glass-panel rounded-xl p-5 border border-slate-700/40">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-white">Cache Performance (Hits vs Misses)</h3>
          </div>
          {history.length > 0 ? (
            <CachePerformanceChart data={history} />
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
              Waiting for telemetry data...
            </div>
          )}
        </div>

        {/* Token Savings Area Chart */}
        <div className="glass-panel rounded-xl p-5 border border-slate-700/40 md:col-span-2">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4">
            <PiggyBank className="h-5 w-5 text-secondary" />
            <h3 className="font-bold text-white">Cumulative Context Token Savings</h3>
          </div>
          {history.length > 0 ? (
            <TokenSavingsChart data={history} />
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
              Waiting for telemetry data...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
