
import React from 'react';
import { MarketStats } from '../types';

interface StatsGridProps {
  stats: MarketStats;
}

const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 transition-transform hover:scale-[1.02]">
        <p className="text-slate-400 text-xs font-semibold mb-1">AI ACCURACY</p>
        <p className="text-2xl font-bold text-emerald-400 tracking-tight">{stats.accuracy}</p>
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 transition-transform hover:scale-[1.02]">
        <p className="text-slate-400 text-xs font-semibold mb-1">WIN RATE</p>
        <p className="text-2xl font-bold text-slate-100 tracking-tight">{stats.winRate}</p>
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 transition-transform hover:scale-[1.02]">
        <p className="text-slate-400 text-xs font-semibold mb-1">VIP PROFIT</p>
        <p className="text-2xl font-bold text-amber-400 tracking-tight">{stats.dailyProfit}</p>
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 transition-transform hover:scale-[1.02]">
        <p className="text-slate-400 text-xs font-semibold mb-1">ACTIVE VIPs</p>
        <p className="text-2xl font-bold text-slate-100 tracking-tight">{stats.activeUsers}</p>
      </div>
    </div>
  );
};

export default StatsGrid;
