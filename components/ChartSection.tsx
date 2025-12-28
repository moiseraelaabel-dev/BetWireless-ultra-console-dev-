
import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { DataPoint, CategorizedSportsPredictions } from '../types';

interface ChartSectionProps {
  data: DataPoint[];
  globalSports?: CategorizedSportsPredictions | null;
}

const ChartSection: React.FC<ChartSectionProps> = ({ data, globalSports }) => {
  const [activeSubTab, setActiveSubTab] = useState<'PURPLE' | 'SPORTS'>('PURPLE');

  // Use world sports if available, otherwise fallback to empty array
  const incomingMatches = globalSports?.upcoming || globalSports?.live || [];

  return (
    <div className="bg-slate-950/40 p-8 h-full backdrop-blur-2xl relative group">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 relative z-10 gap-4">
        <div className="flex items-center gap-4">
           {/* Navigation Back Button for Chart */}
           <button 
             onClick={() => setActiveSubTab('PURPLE')} 
             className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-sm border border-white/10 transition-all active:scale-90"
             title="Reset View"
           >
             🔙
           </button>
           <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tighter italic">WORLD <span className="text-purple-500">FLOW</span></h3>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">WORLD SPORTS CLUSTER SYNC</p>
           </div>
        </div>
        
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
          <button onClick={() => setActiveSubTab('PURPLE')} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'PURPLE' ? 'bg-purple-600 text-white' : 'text-slate-500'}`}>AVIATOR</button>
          <button onClick={() => setActiveSubTab('SPORTS')} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'SPORTS' ? 'bg-purple-600 text-white' : 'text-slate-500'}`}>SPORTS</button>
        </div>
      </div>
      
      <div className="w-full h-[240px] relative z-10 overflow-y-auto no-scrollbar">
        {activeSubTab === 'PURPLE' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="coolWarm" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.8}/>
                </linearGradient>
                <linearGradient id="fillGloom" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3}/>
                  <stop offset="100%" stopColor="#0a0515" stopOpacity={0.01}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.1} />
              <XAxis dataKey="time" hide />
              <YAxis 
                stroke="#475569" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false} 
                domain={['auto', 'auto']}
                tickFormatter={(val) => val.toFixed(1) + 'x'}
                tick={{ fontWeight: '900', fill: '#64748b' }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid #334155', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                itemStyle={{ color: '#fff', fontWeight: '900', fontSize: '12px' }}
                labelStyle={{ display: 'none' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="url(#coolWarm)" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#fillGloom)" 
                animationDuration={1500}
                filter="drop-shadow(0 0 8px rgba(168, 85, 247, 0.3))"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full space-y-3 animate-in fade-in duration-500">
            {incomingMatches.length > 0 ? (
              incomingMatches.map((item: any, idx: number) => (
                <div key={idx} className="bg-black/60 border border-purple-900/30 p-4 rounded-2xl flex items-center justify-between group/item hover:border-purple-500/50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black bg-emerald-500/20 text-emerald-400`}>
                      ⚽
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-white uppercase tracking-tighter italic">{item.match || 'Incoming Match'}</h4>
                      <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">{item.league || 'Global Pro League'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-amber-400 mono">{item.odds || '1.00'}x</div>
                    <div className="text-[6px] font-black text-purple-500 uppercase">World Pulse</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest animate-pulse">Scanning World Nodes...</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="absolute bottom-6 right-8 flex items-center gap-4 z-10">
        <div className="flex items-center gap-1.5">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-[8px] font-black text-emerald-500/80 uppercase tracking-widest">WORLD SYNC: OK</span>
        </div>
      </div>
    </div>
  );
};

export default ChartSection;
