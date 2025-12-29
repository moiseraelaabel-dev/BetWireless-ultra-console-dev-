
import React, { useState, useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  ResponsiveContainer,
  YAxis,
  XAxis,
  Tooltip
} from 'recharts';
import { SportsPrediction, CategorizedSportsPredictions } from '../types';

interface SportsTerminalProps {
  data: SportsPrediction;
  globalSports?: CategorizedSportsPredictions | null;
  onBack?: () => void;
}

const SportsTerminal: React.FC<SportsTerminalProps> = ({ data, globalSports, onBack }) => {
  const [activeTab, setActiveTab] = useState<'MOMENTUM' | 'GOALS' | 'HISTORY' | 'NODES' | 'FORM' | 'ODDS'>('MOMENTUM');

  const wins = data.form?.filter(f => f === 'W').length || 0;
  const losses = data.form?.filter(f => f === 'L').length || 0;
  const draws = data.form?.filter(f => f === 'D').length || 0;

  const liveMatches = useMemo(() => globalSports?.live || [], [globalSports]);

  // Map performance index to recharts format
  const chartData = useMemo(() => {
    return (data.performanceIndex || []).map((val, i) => ({
      index: i,
      value: val
    }));
  }, [data.performanceIndex]);

  const momentumInsights = useMemo(() => {
    if (!data.performanceIndex || data.performanceIndex.length < 2) return null;
    
    const index = data.performanceIndex;
    const lastVal = index[index.length - 1];
    const prevVal = index[index.length - 2];
    const trend = lastVal - prevVal;
    
    const mean = index.reduce((a, b) => a + b, 0) / index.length;
    const variance = index.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / index.length;
    const volatility = Math.sqrt(variance);

    let strategy = "";
    let riskLevel = "LOW";
    let icon = "🎯";

    if (trend > 15 && lastVal > 70) {
      strategy = "MOMENTUM SURGE DETECTED. High probability of immediate scoring.";
      riskLevel = "MODERATE";
      icon = "🔥";
    } else if (volatility > 20) {
      strategy = "EXCEPTIONAL VOLATILITY. Match state unstable. Scalping 'Over/Under' goals recommended.";
      riskLevel = "HIGH";
      icon = "⚡";
    } else if (lastVal < 30 && trend < 0) {
      strategy = "MOMENTUM COLLAPSE. Defensive lockdown sync active.";
      riskLevel = "LOW";
      icon = "🛡️";
    } else if (lastVal > 50 && trend >= 0) {
      strategy = "STEADY BUILD-UP. Pressure sustained. Monitor for late-surge multiplier.";
      riskLevel = "LOW";
      icon = "📈";
    } else {
      strategy = "NEUTRAL STALEMATE. Telemetry suggests a low-event period.";
      riskLevel = "MINIMAL";
      icon = "⚖️";
    }

    return { strategy, riskLevel, volatility: volatility.toFixed(1), trend: trend > 0 ? 'BULLISH' : 'BEARISH', icon };
  }, [data.performanceIndex]);

  const playerFormInsights = useMemo(() => {
    if (!data.squadNodes) return [];
    const historyWeight = data.history?.reduce((acc, h) => acc + (h.result === 'W' ? 10 : h.result === 'D' ? 5 : 0), 0) || 0;
    const avgPerformance = data.performanceIndex?.reduce((a, b) => a + b, 0) / (data.performanceIndex?.length || 1);
    
    return data.squadNodes.map((node, i) => {
      const formScore = Math.min(100, (node.impact * 0.5) + (avgPerformance * 0.3) + (historyWeight * 0.5) + (Math.random() * 8 - 4));
      const trend = formScore > 82 ? 'PEAK' : formScore > 65 ? 'STABLE' : 'RECOVERING';
      const tacticalSnippets = [
        `CRITICAL IMPACT: Node ${node.name} showing ${Math.round(formScore)}% efficiency.`,
        `STRATEGIC ASSET: High recovery rate detected in mid-block.`,
        `OFFENSIVE SURGE: Goal involvement projected within first 20 minutes.`,
        `STABILIZER NODE: Performance volatility is low (${(Math.random()*10).toFixed(1)}%).`,
        `ADAPTIVE PLAY: Node exhibits strong counter-press synergy.`
      ];
      return {
        ...node,
        formScore: Math.round(formScore),
        trend,
        analysis: tacticalSnippets[i % tacticalSnippets.length],
        isProjectedScorer: formScore > 85 && node.impact > 75
      };
    });
  }, [data.squadNodes, data.performanceIndex, data.history]);

  return (
    <div className="w-full bg-[#05030a] border-2 border-emerald-500/30 rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,1)] flex flex-col font-mono text-[11px] animate-in slide-in-from-bottom-8 duration-700">
      {/* Terminal Header */}
      <div className="bg-[#0a1a15] px-8 py-6 flex items-center justify-between border-b border-emerald-500/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-emerald-500/5 animate-pulse opacity-20 pointer-events-none"></div>
        
        <div className="flex items-center gap-6 relative z-10">
          {onBack && (
            <button 
              onClick={onBack}
              className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-black rounded-xl border border-emerald-500/20 text-[10px] tracking-widest transition-all mr-2"
            >
              🔙 BACK
            </button>
          )}
          <div className="flex gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e]"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b]"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
          </div>
          <span className="text-emerald-400 font-black tracking-[0.2em] uppercase italic text-sm">BW_SPORT_TERMINAL_RADAR: {data.match.split(' ')[0]}_ULTRA</span>
        </div>
        
        <div className="flex items-center gap-6 relative z-10">
           <div className="relative w-12 h-12 flex items-center justify-center group">
              <svg width="32" height="32" viewBox="0 0 100 100" className="text-emerald-500 drop-shadow-[0_0_15px_#10b981]">
                <path d="M10 85 V20 H90 V85" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                <path d="M10 20 Q50 0 90 20" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="5,5" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center animate-soccer-spin">
                 <span className="text-sm translate-y-1">⚽</span>
              </div>
           </div>
           <div className="text-right">
             <span className="text-emerald-500 animate-pulse text-[11px] font-black uppercase tracking-[0.4em] italic">● RADAR_SYNC</span>
             <p className="text-[8px] text-emerald-900 font-black uppercase tracking-widest mt-1">BW_GABORONE_UPLINK</p>
           </div>
        </div>
      </div>

      <div className="flex h-[620px] flex-row">
        {/* Sidebar Navigation */}
        <div className="w-28 border-r border-emerald-500/15 flex flex-col bg-black/80">
          {[
            { id: 'MOMENTUM', icon: '⚽', label: 'Radar' },
            { id: 'ODDS', icon: '📈', label: 'Odds' },
            { id: 'GOALS', icon: '🥅', label: 'Goals' },
            { id: 'HISTORY', icon: '🕰️', label: 'History' },
            { id: 'FORM', icon: '📊', label: 'Form' },
            { id: 'NODES', icon: '🧬', label: 'Nodes' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex flex-col items-center justify-center transition-all border-b border-emerald-500/10 relative group ${activeTab === tab.id ? 'bg-emerald-600/30 text-emerald-400 border-r-4 border-r-emerald-500' : 'text-slate-600 hover:bg-emerald-500/5 hover:text-emerald-300'}`}
            >
              <span className={`text-3xl mb-1.5 transition-all duration-500 ${activeTab === tab.id ? 'scale-125 rotate-[360deg] drop-shadow-[0_0_100px_currentColor]' : 'group-hover:scale-110'}`}>
                 {tab.icon}
              </span>
              <span className="text-[8px] font-black uppercase tracking-widest italic">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Main Content Dashboard */}
        <div className="flex-1 p-8 relative overflow-hidden flex flex-col bg-gradient-to-br from-[#06040d] via-transparent to-emerald-950/25">
           <div className="mb-6 flex justify-between items-start">
              <div className="space-y-2">
                 <h4 className="text-white font-black uppercase tracking-[0.1em] text-3xl italic leading-none group cursor-default">
                    {data.match} <span className="inline-block animate-soccer-spin ml-2 text-xl">⚽</span>
                 </h4>
                 <div className="flex gap-2">
                    {data.form?.map((r, i) => (
                       <span key={i} className={`w-7 h-7 flex items-center justify-center rounded-lg font-black text-[10px] shadow-lg transition-all hover:scale-110 ${r === 'W' ? 'bg-emerald-500 text-black shadow-emerald-500/30' : r === 'L' ? 'bg-rose-500 text-white shadow-rose-500/30' : 'bg-slate-700 text-white'}`}>
                          {r}
                       </span>
                    ))}
                 </div>
              </div>
              <div className="text-right flex flex-col items-end">
                 <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase italic tracking-widest">Regional Odds</span>
                    <span className="text-emerald-400 font-black text-3xl mono italic drop-shadow-[0_0_100px_#10b981]">{data.odds}x</span>
                 </div>
              </div>
           </div>

           <div className="flex-1 min-h-0 bg-black/60 rounded-[2.5rem] p-0 border-2 border-white/5 shadow-2xl relative group/terminal overflow-hidden flex flex-col">
              <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(45deg,#fff_25%,transparent_25%,transparent_50%,#fff_50%,#fff_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-net-flow pointer-events-none"></div>

              {activeTab === 'MOMENTUM' && (
                <div className="h-full flex flex-col animate-in zoom-in-95 duration-700">
                  {/* LIVE GLOBAL FEED TICKER */}
                  {liveMatches.length > 0 && (
                    <div className="bg-black/80 h-8 border-b border-emerald-500/20 flex items-center overflow-hidden z-20">
                       <div className="flex whitespace-nowrap animate-marquee-fast">
                          {liveMatches.map((m, i) => (
                            <div key={i} className="flex items-center gap-2 px-6 border-r border-emerald-500/10">
                               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                               <span className="text-[9px] font-black text-white uppercase italic tracking-wider">{m.match}</span>
                               <span className="text-[9px] font-black text-emerald-400 mono">LIVE</span>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}

                  {/* FULL HORIZONTAL TACTICAL RADAR PITCH */}
                  <div className="h-[360px] w-full relative overflow-hidden bg-gradient-to-b from-emerald-950 via-emerald-900 to-black p-2 shadow-inner">
                    {/* Radial Sweep Overlay */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] pointer-events-none z-10">
                        <div className="absolute top-1/2 left-1/2 w-1/2 h-1 bg-gradient-to-r from-emerald-400/60 to-transparent origin-left animate-radar-sweep-line"></div>
                        <div className="absolute top-1/2 left-1/2 w-1/2 h-[150px] bg-gradient-to-t from-emerald-400/5 to-transparent origin-bottom animate-radar-sweep-fan" style={{ transform: 'translateX(-50%)' }}></div>
                    </div>

                    {/* Horizontal Scanning Light */}
                    <div className="absolute inset-0 z-10 pointer-events-none">
                        <div className="absolute top-0 bottom-0 w-80 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent animate-horizontal-scan"></div>
                    </div>

                    {/* Tactical Grid Matrix Overlay */}
                    <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#10b981_1px,transparent_1px),linear-gradient(to_bottom,#10b981_1px,transparent_1px)] bg-[length:40px_40px]"></div>
                    
                    {/* Full Horizontal Soccer Pitch Markings */}
                    <div className="absolute inset-4 border-2 border-white/20 rounded-lg bg-emerald-900/10 backdrop-blur-sm">
                      {/* Center Markings */}
                      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-white/20"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-white/20"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/40 rounded-full"></div>
                      
                      {/* Goal Areas */}
                      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-24 h-48 border-2 border-white/20"></div>
                      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-24 h-48 border-2 border-white/20"></div>
                    </div>

                    {/* Prediction Crosshair (Pulse near the side of the prediction) */}
                    <div className="absolute z-20 top-[40%] right-[15%] pointer-events-none animate-prediction-pulse">
                        <div className="w-20 h-20 border-2 border-dashed border-emerald-400/60 rounded-full animate-spin-slow"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                           <div className="w-1 h-12 bg-emerald-400/40"></div>
                           <div className="absolute w-12 h-1 bg-emerald-400/40"></div>
                        </div>
                    </div>

                    {/* Squad Node Pins on Pitch */}
                    {data.squadNodes?.map((node, i) => {
                       const posX = 15 + ((i * 18) % 70);
                       const posY = 20 + ((node.impact * 23) % 60);
                       return (
                          <div 
                            key={i} 
                            className="absolute -translate-x-1/2 -translate-y-1/2 group/node cursor-pointer transition-transform hover:scale-125 z-20"
                            style={{ left: `${posX}%`, top: `${posY}%` }}
                          >
                             <div className="relative">
                                <div className="w-4 h-4 bg-emerald-500 rounded-full border border-white shadow-[0_0_15px_#10b981] animate-pulse"></div>
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/95 px-2 py-1 rounded-md text-[9px] font-black text-white whitespace-nowrap border border-emerald-500/20 opacity-0 group-hover/node:opacity-100 transition-all">
                                   NODE_{node.name.toUpperCase()}
                                </div>
                             </div>
                          </div>
                       );
                    })}

                    {/* CENTRAL BOUNCING BALL ANIMATION */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 animate-ball-physics-bounce">
                       <div className="relative w-16 h-16 flex items-center justify-center animate-soccer-spin">
                          <span className="text-6xl drop-shadow-[0_0_30px_white]">⚽</span>
                          <div className="absolute inset-0 border-4 border-emerald-400/50 rounded-full animate-ping opacity-20"></div>
                       </div>
                    </div>
                    
                    {/* HUD - Labeled as SCORE WIRED */}
                    <div className="absolute top-8 left-10 z-40 bg-black/80 backdrop-blur-xl px-6 py-2.5 rounded-2xl border border-white/15 flex items-center gap-5 shadow-2xl group cursor-help">
                        <div className="relative flex items-center justify-center">
                           <span className="absolute w-4 h-4 rounded-full bg-emerald-500 animate-ping opacity-60"></span>
                           <span className="w-3 h-3 rounded-full bg-emerald-400 relative"></span>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[14px] font-black text-emerald-400 uppercase tracking-[0.5em] italic drop-shadow-sm leading-none mb-1">SCORE WIRED</span>
                           <span className="text-[7px] text-slate-500 font-black uppercase tracking-widest">TACTICAL_RADAR_UPLINK</span>
                        </div>
                    </div>

                    {/* Radar Range Rings */}
                    <div className="absolute inset-0 pointer-events-none border border-emerald-500/5 rounded-full scale-[1.5] opacity-50"></div>
                  </div>

                  {/* MOMENTUM DATA GRAPH */}
                  <div className="flex-1 bg-black/95 border-t border-emerald-500/20 p-4 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-2 px-2">
                       <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-emerald-500/80 uppercase italic tracking-[0.4em]">LIVE_FIELD_MOMENTUM</span>
                       </div>
                       <div className="flex gap-2 items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">T-7_SYNC</span>
                       </div>
                    </div>
                    
                    <div className="h-[70px] w-full mt-1">
                       <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={chartData}>
                           <defs>
                             <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="0%" stopColor="#10b981" stopOpacity={0.5}/>
                               <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                             </linearGradient>
                           </defs>
                           <Tooltip 
                             contentStyle={{ backgroundColor: 'rgba(0,0,0,0.95)', border: '1px solid #10b981', borderRadius: '14px', fontSize: '11px' }}
                             itemStyle={{ color: '#10b981', fontWeight: '900' }}
                             labelStyle={{ display: 'none' }}
                           />
                           <Area 
                             type="monotone" 
                             dataKey="value" 
                             stroke="#10b981" 
                             strokeWidth={4} 
                             fill="url(#flowGrad)"
                             animationDuration={2000}
                           />
                         </AreaChart>
                       </ResponsiveContainer>
                    </div>

                    {/* Insights Footer */}
                    {momentumInsights && (
                      <div className="mt-4 p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-[2rem] flex items-center gap-5 transition-all hover:bg-emerald-500/10">
                         <div className="text-3xl filter drop-shadow-[0_0_15px_currentColor]">{momentumInsights.icon}</div>
                         <div className="flex-1">
                            <p className="text-[11px] text-white font-bold italic leading-tight tracking-wide">
                               "{momentumInsights.strategy}"
                            </p>
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'ODDS' && (
                <div className="h-full flex flex-col p-6 overflow-hidden animate-in slide-in-from-right-12 duration-700">
                   <div className="flex items-center justify-between mb-6">
                      <h4 className="text-emerald-400 font-black uppercase italic tracking-widest text-[11px]">LIVE_BETTING_MATRIX</h4>
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                         <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">REAL-TIME DATASTREAM</span>
                      </div>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-2">
                      {liveMatches.length > 0 ? (
                        liveMatches.map((match: any, idx: number) => (
                          <div key={idx} className="bg-black/80 border border-emerald-500/20 rounded-2xl p-5 hover:border-emerald-500/50 transition-all group/odd">
                             <div className="flex justify-between items-start mb-4">
                                <div className="flex flex-col gap-1">
                                   <div className="flex items-center gap-2">
                                      <span className="text-[8px] font-black text-slate-500 uppercase">{match.league || 'WORLD LEAGUE'}</span>
                                      <span className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded italic">{match.minute || '45'}'</span>
                                   </div>
                                   <h5 className="text-[12px] font-black text-white uppercase italic">{match.match}</h5>
                                </div>
                                <div className="bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30">
                                   <span className="text-lg font-black text-white mono italic tracking-tighter">{match.score || '0-0'}</span>
                                </div>
                             </div>
                             
                             <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col items-center bg-white/5 p-2 rounded-xl border border-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all cursor-pointer">
                                   <span className="text-[7px] font-black text-slate-500 uppercase mb-1">HOME (1)</span>
                                   <span className="text-sm font-black text-emerald-400 mono italic">{match.odds?.home || '1.85'}</span>
                                </div>
                                <div className="flex flex-col items-center bg-white/5 p-2 rounded-xl border border-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all cursor-pointer">
                                   <span className="text-[7px] font-black text-slate-500 uppercase mb-1">DRAW (X)</span>
                                   <span className="text-sm font-black text-emerald-400 mono italic">{match.odds?.draw || '3.40'}</span>
                                </div>
                                <div className="flex flex-col items-center bg-white/5 p-2 rounded-xl border border-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all cursor-pointer">
                                   <span className="text-[7px] font-black text-slate-500 uppercase mb-1">AWAY (2)</span>
                                   <span className="text-sm font-black text-emerald-400 mono italic">{match.odds?.away || '4.20'}</span>
                                </div>
                             </div>
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
                           <div className="w-12 h-12 border-2 border-slate-700 border-t-emerald-500 rounded-full animate-spin"></div>
                           <p className="text-[10px] font-black uppercase tracking-widest italic">SYNCING WITH WORLD NODES...</p>
                        </div>
                      )}
                   </div>
                </div>
              )}

              {activeTab === 'GOALS' && (
                <div className="h-full flex flex-col items-center justify-center px-12 animate-in slide-in-from-right-12 duration-700 gap-10">
                   <div className="w-full space-y-4">
                      <div className="flex items-center justify-between">
                         <span className="text-slate-400 font-black uppercase tracking-widest text-[11px]">Attack Density</span>
                         <span className="text-4xl text-white font-black mono italic">{data.goalsPerGame} G/M</span>
                      </div>
                      <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden border border-white/10 shadow-inner">
                         <div className="h-full bg-emerald-500 animate-loading-bar" style={{ width: `${(data.goalsPerGame / 4) * 100}%` }}></div>
                      </div>
                   </div>
                   <div className="w-full space-y-4">
                      <div className="flex items-center justify-between">
                         <span className="text-slate-400 font-black uppercase tracking-widest text-[11px]">Defense Load</span>
                         <span className="text-4xl text-emerald-400 font-black mono italic">{data.cleanSheetChance}%</span>
                      </div>
                      <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden border border-white/10 shadow-inner">
                         <div className="h-full bg-emerald-500 animate-loading-bar" style={{ width: `${data.cleanSheetChance}%` }}></div>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'FORM' && (
                <div className="h-full flex flex-col gap-4 overflow-hidden animate-in slide-in-from-left-12 duration-700 p-6">
                   <div className="flex items-center gap-6">
                      <div className="flex flex-row gap-2">
                        <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                           <div className="text-xl font-black text-emerald-400 mono">{wins}</div>
                           <div className="text-[7px] font-black text-slate-500 uppercase mt-1 italic">Wins</div>
                        </div>
                        <div className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-center">
                           <div className="text-xl font-black text-rose-400 mono">{losses}</div>
                           <div className="text-[7px] font-black text-slate-500 uppercase mt-1 italic">Losses</div>
                        </div>
                      </div>
                   </div>

                   <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                      {playerFormInsights.map((player, idx) => (
                        <div key={idx} className="bg-emerald-500/5 border border-emerald-500/15 p-4 rounded-2xl">
                           <div className="flex justify-between items-center mb-2">
                              <span className="text-white font-black uppercase text-[10px] italic">{player.name}</span>
                              <span className="text-emerald-400 font-black mono text-sm">{player.formScore}%</span>
                           </div>
                           <p className="text-[9px] text-slate-400 italic">"{player.analysis}"</p>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {activeTab === 'HISTORY' && (
                <div className="h-full grid grid-cols-1 gap-4 overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-12 duration-700 p-6 pr-2">
                   {data.history?.map((item, idx) => (
                      <div key={idx} className="bg-white/5 p-5 rounded-2xl flex items-center justify-between border border-white/10 border-l-4 border-l-emerald-500">
                         <div className="flex flex-col">
                            <span className="text-[9px] text-slate-500 uppercase font-black mb-1">{item.date}</span>
                            <span className="text-white font-black uppercase tracking-widest text-xs italic">vs {item.opponent}</span>
                         </div>
                         <div className="flex items-center gap-6">
                            <span className="text-xl font-black mono text-white">{item.score}</span>
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-black ${item.result === 'W' ? 'bg-emerald-500 text-black' : item.result === 'L' ? 'bg-rose-500 text-white' : 'bg-slate-700 text-white'}`}>
                               {item.result}
                            </span>
                         </div>
                      </div>
                   ))}
                </div>
              )}

              {activeTab === 'NODES' && (
                <div className="h-full flex flex-col gap-6 py-6 animate-in zoom-in-95 duration-700 p-8">
                   {data.squadNodes?.map((node, i) => (
                      <div key={i} className="flex flex-col gap-3 group/node">
                         <div className="flex justify-between items-end px-2">
                            <span className="text-white font-black uppercase tracking-[0.2em] text-[12px] italic leading-none">{node.name}</span>
                            <span className="text-emerald-400 font-black mono text-sm">{node.impact}% IMPACT</span>
                         </div>
                         <div className="h-2 w-full bg-slate-900 rounded-full border border-white/10 overflow-hidden relative">
                            <div className="h-full bg-emerald-500 transition-transform origin-left duration-1000" style={{ width: `${node.impact}%` }}></div>
                         </div>
                      </div>
                   ))}
                </div>
              )}
           </div>

           <div className="mt-6 p-6 bg-emerald-600/10 rounded-3xl border-2 border-emerald-500/20 flex items-center justify-between shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-emerald-500/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1.5s]"></div>
              <div className="flex items-center gap-4 relative z-10">
                 <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                 <span className="text-sm font-black text-emerald-400 uppercase tracking-widest italic drop-shadow-lg animate-pulse">BW_BANKER: {data.prediction}</span>
              </div>
              <div className="relative z-10">
                 <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">CONF: {data.confidence}%</span>
              </div>
           </div>
        </div>
      </div>

      <style>{`
        @keyframes net-flow { 0% { background-position: 0 0; } 100% { background-position: 40px 40px; } }
        .animate-net-flow { animation: net-flow 3s linear infinite; }
        
        @keyframes horizontal-scan {
          0% { transform: translateX(-100%); opacity: 0; }
          40% { opacity: 1; }
          60% { opacity: 1; }
          100% { transform: translateX(1200%); opacity: 0; }
        }
        .animate-horizontal-scan {
          animation: horizontal-scan 6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes radar-sweep-line {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes radar-sweep-fan {
          from { transform: translateX(-50%) rotate(0deg); }
          to { transform: translateX(-50%) rotate(360deg); }
        }
        .animate-radar-sweep-line { animation: radar-sweep-line 4s linear infinite; }
        .animate-radar-sweep-fan { animation: radar-sweep-fan 4s linear infinite; filter: blur(12px); }

        @keyframes ball-physics-bounce {
          0%, 100% { transform: translate(-50%, -50%) scale(1) translateY(0); }
          25% { transform: translate(-50%, -50%) scale(1.15) translateY(-35px) rotate(20deg) translateX(10px); }
          50% { transform: translate(-50%, -50%) scale(0.85) translateY(0) rotate(0deg); }
          75% { transform: translate(-50%, -50%) scale(1.1) translateY(-15px) rotate(-20deg) translateX(-10px); }
        }
        .animate-ball-physics-bounce { animation: ball-physics-bounce 2.2s ease-in-out infinite; }

        @keyframes prediction-pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        .animate-prediction-pulse { animation: prediction-pulse 2s ease-in-out infinite; }

        @keyframes marquee-fast {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-fast {
          animation: marquee-fast 12s linear infinite;
        }

        .animate-spin-slow {
           animation: spin 8s linear infinite;
        }
        @keyframes spin {
           from { transform: rotate(0deg); }
           to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SportsTerminal;
