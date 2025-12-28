
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { PredictionResult } from '../types';

interface RadarViewProps {
  activeSignals: PredictionResult[];
  selectedSignalId: string | null;
  onSelectSignal: (id: string | null) => void;
  onManualEntryOpen: () => void;
  onPredict: () => void;
  loadingPrediction: boolean;
  trailDuration: number;
  trailIntensity: number;
  onSignalUpdate?: (signal: PredictionResult) => void;
}

interface SignalPosition extends PredictionResult {
  x: number;
  y: number;
  angle: number;
  color: string;
  radius: number;
  tier: number; 
  trailThickness: number;
  trailOpacity: number;
}

interface Point {
  x: number;
  y: number;
  time: number;
}

const RadarView: React.FC<RadarViewProps> = ({ 
  activeSignals, 
  selectedSignalId, 
  onSelectSignal,
  onManualEntryOpen,
  onPredict,
  loadingPrediction,
  trailDuration,
  trailIntensity,
  onSignalUpdate
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<Record<string, Point[]>>({});
  const [botswanaTime, setBotswanaTime] = useState('');

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{multiplier: string, time: string}>({multiplier: '', time: ''});

  // Update Botswana Time (GMT+2)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Africa/Gaborone',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      setBotswanaTime(new Intl.DateTimeFormat('en-GB', options).format(now));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const digitColors = [
    '#f43f5e', '#ec4899', '#d946ef', '#a855f7', 
    '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', 
    '#06b6d4', '#14b8a6', '#10b981', '#22c55e'
  ];

  const getSignalMeta = (val: number) => {
    // Normalize intensity (0-100) to a scale factor (0.2 - 3.0)
    // 50 is the "neutral" point (scale 1.0)
    const intensityScale = trailIntensity / 50; 
    
    // Logarithmic scaling for multiplier influence.
    // We want a steep difference between 1.0x and 10.0x to make high signals pop.
    // 1.05x -> ~0.05
    // 2.0x  -> ~0.7
    // 10.0x -> ~2.3
    // 100x  -> ~4.6
    const multiplierWeight = Math.log(val || 1.05); 
    
    // Thickness Calculation
    // Base thickness starts at 1.0 and grows with multiplier weight
    // High values get a significant boost
    const baseThickness = 1.0 + (multiplierWeight * 0.9);
    const thicknessFactor = baseThickness * intensityScale;

    // Opacity Calculation
    // Base opacity: Low multipliers are fainter, high multipliers are solid
    // 1x -> ~0.2
    // 10x -> ~0.8
    let baseOpacity = 0.2 + (multiplierWeight * 0.25);
    baseOpacity = Math.min(1.0, Math.max(0.15, baseOpacity)); // Clamp opacity
    
    // Allow intensity to overdrive opacity slightly up to cap
    const opacityFactor = Math.min(1.0, baseOpacity * Math.min(1.5, intensityScale));

    if (val >= 100) return { 
      color: '#fbbf24', 
      radius: 10, 
      tier: 2, 
      trailThickness: thicknessFactor * 2.0, // Massive trail for 100x+
      trailOpacity: opacityFactor 
    }; 
    if (val >= 2.10) return { 
      color: '#d946ef', 
      radius: 8, 
      tier: 1, 
      trailThickness: thicknessFactor * 1.3, // Boost for purple > 2.0x
      trailOpacity: opacityFactor 
    };  
    return { 
      color: '#a855f7', 
      radius: 6, 
      tier: 0, 
      trailThickness: thicknessFactor * 0.7, // Thinner for sub-2x
      trailOpacity: opacityFactor * 0.9 
    };               
  };

  const { positionedSignals, currentPrimary, nextPurple } = useMemo(() => {
    const sorted = [...activeSignals].sort((a, b) => (a.timeRemaining || 0) - (b.timeRemaining || 0));
    const primary = sorted[0] || null;
    const purple = sorted.find(s => (s.multiplier || 0) >= 2.10) || null;

    const positioned: SignalPosition[] = sorted.map(sig => {
      const meta = getSignalMeta(sig.multiplier || 0);
      
      // If editing this signal, use the static edit time to prevent it from moving while typing
      let timeRef = sig.timeRemaining || 0;
      if (sig.id === editingId && editValues.time) {
          const parsedTime = parseFloat(editValues.time);
          if (!isNaN(parsedTime)) {
             timeRef = parsedTime;
          }
      }

      const angle = (timeRef % 60) * 6; 
      const radiusPos = 38; 

      const x = 50 + radiusPos * Math.cos(((angle - 90) * Math.PI) / 180);
      const y = 50 + radiusPos * Math.sin(((angle - 90) * Math.PI) / 180);

      return { ...sig, ...meta, x, y, angle };
    });

    return { positionedSignals: positioned, currentPrimary: primary, nextPurple: purple };
  }, [activeSignals, editingId, editValues.time, trailIntensity]);

  useEffect(() => {
    const nextHistory = { ...historyRef.current };
    const currentIds = new Set(positionedSignals.map(s => s.id));
    const now = Date.now();

    positionedSignals.forEach(sig => {
      const pts = nextHistory[sig.id] || [];
      const last = pts[0];
      
      // Only add point if moved significantly
      if (!last || Math.abs(last.x - sig.x) > 0.01 || Math.abs(last.y - sig.y) > 0.01) {
        nextHistory[sig.id] = [{ x: sig.x, y: sig.y, time: now }, ...pts];
      }
      
      // Filter points by duration (persist for trailDuration ms)
      nextHistory[sig.id] = nextHistory[sig.id].filter(p => now - p.time < trailDuration);
    });

    Object.keys(nextHistory).forEach(id => {
      if (!currentIds.has(id)) delete nextHistory[id];
    });

    historyRef.current = nextHistory;
  });

  const handleEditClick = (e: React.MouseEvent, sig: PredictionResult) => {
    e.stopPropagation();
    setEditingId(sig.id);
    setEditValues({
      multiplier: sig.multiplier?.toString() || '0',
      time: sig.timeRemaining?.toFixed(1) || '0'
    });
  };

  const handleSave = (e: React.MouseEvent, originalSig: PredictionResult) => {
    e.stopPropagation();
    if (onSignalUpdate) {
      onSignalUpdate({
        ...originalSig,
        multiplier: parseFloat(editValues.multiplier),
        timeRemaining: parseFloat(editValues.time)
      });
    }
    setEditingId(null);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const pilotRotation = currentPrimary ? ((currentPrimary.timeRemaining || 0) % 60) * 6 : 0;
  const purpleRotation = nextPurple ? ((nextPurple.timeRemaining || 0) % 60) * 6 : 0;
  const isHighValueCrash = currentPrimary && (currentPrimary.multiplier || 0) >= 2.10;

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6 relative z-50">
        {selectedSignalId ? (
          <button 
            onClick={() => onSelectSignal(null)}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 font-black rounded-xl text-[10px] uppercase tracking-widest border border-white/10 flex items-center gap-2"
          >
            🔙 BACK
          </button>
        ) : <div />}
        
        <div className="flex gap-2">
          <button 
            onClick={onPredict}
            disabled={loadingPrediction}
            className="px-4 py-2 bg-emerald-600 hover:bg-white hover:text-emerald-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-xl transition-all border border-white/20 active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            <span>⚡</span> {loadingPrediction ? 'SCANNING' : 'SCAN'}
          </button>

          <button 
            onClick={onManualEntryOpen}
            className="px-4 py-2 bg-fuchsia-600 hover:bg-white hover:text-fuchsia-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-xl transition-all border border-white/20 active:scale-95 flex items-center gap-2"
          >
            <span>🛰️</span> SYNC
          </button>
        </div>
      </div>

      <div 
        className={`relative aspect-square w-full max-w-[450px] rounded-full border-[8px] transition-all duration-300 bg-[#05020a] overflow-visible 
          ${isHighValueCrash ? 'animate-critical-red border-rose-500 shadow-[0_0_80px_rgba(244,63,94,0.4)]' : 
            currentPrimary ? 'border-fuchsia-600/50 shadow-[0_0_50px_rgba(168,85,247,0.2)]' : 'border-slate-900/50 shadow-none'}
        `}
      >
        {/* Digital Clock Numbers */}
        <div className="absolute inset-0 p-8">
           <div className="absolute inset-0 rounded-full border border-white/5"></div>
           {[...Array(12)].map((_, i) => {
             const hour = i + 1;
             const angle = hour * 30;
             const rad = ((angle - 90) * Math.PI) / 180;
             const x = 50 + 44 * Math.cos(rad);
             const y = 50 + 44 * Math.sin(rad);
             
             return (
               <div 
                 key={i} 
                 className="absolute flex flex-col items-center transition-all duration-500"
                 style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
               >
                 <span 
                   className="font-black text-sm logo-font drop-shadow-lg"
                   style={{ 
                     color: digitColors[i],
                     filter: `drop-shadow(0 0 5px ${digitColors[i]}66)`
                   }}
                 >
                   {hour}
                 </span>
               </div>
             );
           })}
        </div>

        {/* ORBITING SIGNAL DETAILS AROUND CENTER HUB */}
        <div className="absolute inset-0 pointer-events-none">
           {positionedSignals.map(sig => {
               const detailRadius = 24; 
               const rad = ((sig.angle - 90) * Math.PI) / 180;
               const x = 50 + detailRadius * Math.cos(rad);
               const y = 50 + detailRadius * Math.sin(rad);
               const isHigh = (sig.multiplier || 0) >= 2.10;
               const isEditing = editingId === sig.id;

               return (
                   <div 
                     key={`meta-${sig.id}`}
                     className="absolute flex flex-col items-center justify-center transition-all duration-300 z-40"
                     style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                   >
                       {isEditing ? (
                         <div className="bg-black/95 border border-white/20 p-3 rounded-xl flex flex-col gap-2 pointer-events-auto shadow-2xl min-w-[130px] animate-in zoom-in duration-200">
                            <div className="flex items-center gap-2">
                               <span className="text-[8px] font-black text-slate-400 w-8">MULT</span>
                               <input 
                                 type="number" 
                                 value={editValues.multiplier}
                                 onChange={(e) => setEditValues(prev => ({...prev, multiplier: e.target.value}))}
                                 className="flex-1 bg-slate-800 text-white text-[10px] font-mono px-1 py-0.5 rounded outline-none focus:ring-1 focus:ring-fuchsia-500"
                               />
                            </div>
                            <div className="flex items-center gap-2">
                               <span className="text-[8px] font-black text-slate-400 w-8">TIME</span>
                               <input 
                                 type="number" 
                                 value={editValues.time}
                                 onChange={(e) => setEditValues(prev => ({...prev, time: e.target.value}))}
                                 className="flex-1 bg-slate-800 text-white text-[10px] font-mono px-1 py-0.5 rounded outline-none focus:ring-1 focus:ring-fuchsia-500"
                               />
                            </div>
                            <div className="flex gap-2 mt-1">
                               <button 
                                 onClick={(e) => handleSave(e, sig)}
                                 className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black py-1 rounded"
                               >
                                 SAVE
                               </button>
                               <button 
                                 onClick={handleCancel}
                                 className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-black py-1 rounded"
                               >
                                 CANCEL
                               </button>
                            </div>
                         </div>
                       ) : (
                         <div className={`pointer-events-auto flex flex-col gap-1 backdrop-blur-md border px-2 py-1.5 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.8)] animate-in zoom-in duration-300 group cursor-pointer min-w-[50px] items-center ${isHigh ? 'bg-rose-950/90 border-rose-500/60' : 'bg-fuchsia-950/90 border-fuchsia-500/60'}`}>
                             <div className="flex items-center gap-2 border-b border-white/10 pb-1">
                               <span className={`text-[10px] font-black mono leading-none ${isHigh ? 'text-rose-400' : 'text-fuchsia-400'}`}>{sig.multiplier?.toFixed(2)}x</span>
                               {/* Edit Button */}
                               <button 
                                 onClick={(e) => handleEditClick(e, sig)}
                                 className="w-3 h-3 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-[6px] transition-colors opacity-0 group-hover:opacity-100"
                               >
                                 ✏️
                               </button>
                             </div>
                             
                             {/* Countdown Timer */}
                             <div className="flex items-center gap-1.5">
                                <span className={`text-[8px] font-mono font-bold leading-none ${isHigh ? 'text-white' : 'text-slate-300'}`}>
                                   {(sig.timeRemaining || 0).toFixed(1)}s
                                </span>
                                <div className={`w-1 h-1 rounded-full animate-pulse ${isHigh ? 'bg-rose-500' : 'bg-fuchsia-500'}`}></div>
                             </div>
                         </div>
                       )}
                   </div>
               )
           })}
        </div>

        {/* Central Telemetry Hub - Background & Progress Ring */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full bg-black/98 backdrop-blur-3xl border-2 flex flex-col items-center justify-center z-40 shadow-2xl transition-colors duration-300 overflow-hidden
          ${isHighValueCrash ? 'border-rose-500 shadow-rose-500/30' : 'border-fuchsia-500/30 shadow-fuchsia-500/30'}
        `}>
           <div className={`absolute inset-0 rounded-full animate-pulse opacity-20 ${isHighValueCrash ? 'bg-rose-500' : 'bg-fuchsia-500'}`}></div>
           
           {/* Visual Countdown Progress Ring */}
           {currentPrimary && (
             <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-1">
               <circle 
                 cx="50%" cy="50%" r="80" 
                 fill="none" 
                 stroke="currentColor" 
                 strokeWidth="2" 
                 className={`${isHighValueCrash ? 'text-rose-500/10' : 'text-fuchsia-500/10'}`} 
               />
               <circle 
                 cx="50%" cy="50%" r="80" 
                 fill="none" 
                 stroke="currentColor" 
                 strokeWidth="4" 
                 strokeDasharray="502" 
                 strokeDashoffset={502 - (502 * Math.min(60, currentPrimary.timeRemaining || 0) / 60)}
                 strokeLinecap="round"
                 className={`transition-all duration-100 ${isHighValueCrash ? 'text-rose-500 drop-shadow-[0_0_8px_#f43f5e]' : 'text-fuchsia-500 drop-shadow-[0_0_8px_#a855f7]'}`} 
               />
             </svg>
           )}

           {/* Integrated Countdown Display */}
           <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-4">
               {currentPrimary ? (
                <>
                    <span className={`text-[9px] font-black uppercase tracking-[0.3em] mb-1 text-center ${isHighValueCrash ? 'text-rose-400' : 'text-fuchsia-500'} animate-in slide-in-from-bottom-2 fade-in`}>
                       IMPACT IN
                    </span>
                    <span className={`text-5xl font-black italic mono leading-none tracking-tighter drop-shadow-[0_0_20px_rgba(0,0,0,1)] ${isHighValueCrash ? 'text-rose-100' : 'text-white'} animate-in zoom-in duration-300`}>
                        {(currentPrimary.timeRemaining || 0).toFixed(1)}
                        <span className="text-xl ml-1 opacity-70">s</span>
                    </span>
                    
                    {/* Integrated Target Badge */}
                    <div className={`mt-2 px-3 py-1 rounded-full border shadow-lg backdrop-blur-xl whitespace-nowrap animate-bounce-slow ${isHighValueCrash ? 'bg-rose-600/90 border-rose-400 text-white' : 'bg-fuchsia-600/90 border-fuchsia-400 text-white'}`}>
                        <span className="font-black text-[9px] mono tracking-widest">
                            TARGET: {currentPrimary.multiplier?.toFixed(2)}x
                        </span>
                    </div>
                </>
               ) : (
                 <div className="text-slate-600 text-[8px] font-black uppercase tracking-[0.4em] animate-pulse flex flex-col items-center gap-4">
                   <div className="w-10 h-10 border-2 border-slate-800 border-t-fuchsia-500 rounded-full animate-spin"></div>
                   SCANNING...
                 </div>
               )}
           </div>
        </div>

        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible" viewBox="0 0 100 100">
          <defs>
            <filter id="cometGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Pilot Hand + Plane */}
          <g transform={`rotate(${pilotRotation - 90} 50 50)`} className="transition-transform duration-500">
            <line x1="50" y1="50" x2="88" y2="50" stroke={isHighValueCrash ? "#f43f5e" : "#d946ef"} strokeWidth="0.6" strokeDasharray="1 2" className="opacity-60" />
            <text x="88" y="50" fontSize="6" textAnchor="middle" alignmentBaseline="middle" transform="rotate(90 88 50)" className="animate-bounce">✈️</text>
            <circle cx="88" cy="50" r="1.2" fill={isHighValueCrash ? "#f43f5e" : "#d946ef"} filter="url(#cometGlow)" className="animate-ping" />
          </g>

          {/* Prediction Hand (Targeting Purple >2.10x) */}
          {nextPurple && (
            <g transform={`rotate(${purpleRotation - 90} 50 50)`} className="transition-transform duration-1000">
               <line x1="50" y1="50" x2="75" y2="50" stroke="#10b981" strokeWidth="1" className="opacity-40" />
               <text x="75" y="50" fontSize="5" textAnchor="middle" alignmentBaseline="middle" transform="rotate(90 75 50)">☝️</text>
               <circle cx="75" cy="50" r="0.8" fill="#10b981" className="animate-pulse" />
            </g>
          )}

          {/* Comet Trails */}
          {positionedSignals.map(sig => {
            const history = historyRef.current[sig.id] || [];
            if (history.length < 2) return null;
            return (
              <g key={`trail-${sig.id}`} filter="url(#cometGlow)">
                {history.slice(0, -1).map((point, idx) => {
                  const nextPoint = history[idx + 1];
                  
                  // Calculate time-based opacity
                  const age = Date.now() - point.time;
                  const progress = Math.min(1, age / trailDuration);
                  const opacity = Math.max(0, sig.trailOpacity * (1 - progress));
                  
                  // If points are too old, they are filtered out by useEffect, but we handle visual fade here
                  const strokeWidth = (sig.radius / 10) * sig.trailThickness * (1 - progress * 0.8);
                  
                  return (
                    <line
                      key={idx}
                      x1={point.x} y1={point.y} x2={nextPoint.x} y2={nextPoint.y}
                      stroke={sig.color} strokeWidth={strokeWidth} strokeOpacity={opacity} strokeLinecap="round"
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Node Icons */}
        {positionedSignals.map(sig => {
          const isSelected = sig.id === selectedSignalId;
          const sigIsHighValue = (sig.multiplier || 0) >= 2.10;
          return (
            <div 
              key={sig.id} 
              className={`absolute z-30 transition-all duration-300 cursor-pointer ${isSelected ? 'scale-125' : 'scale-100'}`}
              style={{ left: `${sig.x}%`, top: `${sig.y}%`, transform: 'translate(-50%, -50%)' }}
              onClick={() => onSelectSignal(sig.id)}
            >
              <div 
                className={`relative rounded-full border border-white/20 transition-all ${isSelected ? 'ring-2 ring-white shadow-[0_0_15px_white]' : 'shadow-lg'} ${sigIsHighValue ? 'animate-pulse' : ''}`}
                style={{ 
                  width: `${sig.radius * 2}px`, 
                  height: `${sig.radius * 2}px`, 
                  backgroundColor: sig.color,
                  boxShadow: sig.tier > 0 ? `0 0 15px ${sig.color}` : 'none'
                }}
              >
              </div>
            </div>
          );
        })}
      </div>

      {/* Botswana GMT+2 Digital Clock View */}
      <div className="mt-2 px-6 py-2 bg-black/40 rounded-xl border border-white/5 backdrop-blur-sm flex flex-col items-center shadow-lg transition-all hover:bg-black/60">
         <span className="text-[7px] font-black text-emerald-500/70 uppercase tracking-[0.2em]">GMT+2 UPLINK</span>
         <span className="text-lg font-black text-white mono italic tracking-widest drop-shadow-[0_0_5px_white]">
            {botswanaTime || 'SYNCING...'}
         </span>
      </div>
      
      <style>{`
        @keyframes critical-red {
          0%, 100% { border-color: rgba(244, 63, 94, 0.5); background-color: rgba(5, 2, 10, 1); }
          50% { border-color: rgba(244, 63, 94, 1); background-color: rgba(244, 63, 94, 0.05); }
        }
        .animate-critical-red {
          animation: critical-red 0.5s ease-in-out infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default RadarView;
