
import React from 'react';
import { PredictionResult } from '../types';

interface SignalCardProps {
  prediction: PredictionResult | null;
  loading: boolean;
  isCollision?: boolean;
  isCritical?: boolean;
}

const SignalCard: React.FC<SignalCardProps> = ({ prediction, loading, isCollision, isCritical }) => {
  if (loading) {
    return (
      <div className="bg-[#120a25]/60 border border-purple-900/30 rounded-[2.5rem] p-8 flex flex-col items-center justify-center min-h-[300px] animate-pulse">
        <div className="w-20 h-20 bg-purple-900/20 rounded-full mb-6"></div>
        <div className="h-6 w-48 bg-purple-900/20 rounded-full mb-4"></div>
        <div className="h-4 w-64 bg-purple-900/20 rounded-full"></div>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="bg-[#120a25]/60 border border-purple-900/30 rounded-[2.5rem] p-8 text-center min-h-[300px] flex flex-col justify-center border-dashed">
        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] italic">Awaiting Gaborone Node Telemetry Pulse...</p>
      </div>
    );
  }

  const isUp = prediction.direction === 'UP';
  const isManual = prediction.isManual;

  return (
    <div className={`
      relative overflow-hidden transition-all duration-700 rounded-[2.5rem] p-8 shadow-2xl
      ${isCritical ? 'bg-rose-950/20 border-2 border-rose-500/50' : 
        isCollision ? 'bg-fuchsia-950/20 border-2 border-fuchsia-500/50' : 
        isManual ? 'bg-amber-950/40 border-4 border-amber-500 shadow-[0_0_80px_rgba(245,158,11,0.3)] animate-manual-glow' : 
        'bg-[#120a25]/80 border border-purple-900/30'}
    `}>
      {/* Background kinetic effect for manual override */}
      {isManual && (
        <div className="absolute inset-0 pointer-events-none opacity-25 overflow-hidden">
           <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_15px,rgba(245,158,11,0.05)_15px,rgba(245,158,11,0.05)_30px)] animate-manual-scan"></div>
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-amber-500/10 to-transparent"></div>
        </div>
      )}

      {/* Manual Override Indicator Badge */}
      {isManual && (
        <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-black px-12 py-4 uppercase tracking-[0.2em] rounded-bl-[2.5rem] shadow-[0_15px_40px_rgba(245,158,11,0.5)] z-20 flex items-center gap-3 italic border-l-2 border-b-2 border-amber-300/30">
          <span className="text-sm animate-pulse">🛠️</span> 
          <span>CERTIFIED MANUAL SYNC</span>
        </div>
      )}

      {/* Primary Status Header */}
      <div className="flex justify-between items-center mb-8 relative z-10">
        <div className="flex items-center gap-3">
           <div className={`w-3.5 h-3.5 rounded-full ${isManual ? 'bg-amber-400 animate-ping shadow-[0_0_10px_#f59e0b]' : isCritical ? 'bg-rose-500 animate-pulse' : isCollision ? 'bg-fuchsia-500' : 'bg-purple-500'}`}></div>
           <span className={`text-[11px] font-black uppercase tracking-[0.4em] ${isManual ? 'text-amber-400 drop-shadow-sm' : isCritical ? 'text-rose-400' : 'text-fuchsia-400'}`}>
             {isManual ? 'NODE_OVERRIDE_ENABLED' : 'AUTO_ANALYTICS_PULSE'}
           </span>
        </div>
        <span className="mono text-[10px] font-black text-slate-400 bg-black/70 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md">
          {prediction.timestamp}
        </span>
      </div>
      
      <div className="flex flex-col items-center mb-10 relative z-10">
        <div className={`text-8xl mb-6 drop-shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-transform duration-700 hover:scale-110 active:scale-95 cursor-help`}>
          {isManual ? '🛰️' : isCritical ? '☢️' : isCollision ? '⚡' : isUp ? '🚀' : '💥'}
        </div>
        
        <div className="relative">
          <h2 className={`text-7xl font-black tracking-tighter uppercase italic leading-none drop-shadow-2xl
            ${isManual ? 'text-amber-400' : isCritical ? 'text-rose-500' : isCollision ? 'text-fuchsia-400' : isUp ? 'text-emerald-400' : 'text-rose-400'}`}
          >
            {prediction.multiplier ? `${prediction.multiplier.toFixed(2)}x` : prediction.direction}
          </h2>
          {isManual && <div className="absolute -bottom-2 left-0 w-full h-1.5 bg-amber-500/30 blur-sm animate-pulse"></div>}
        </div>
        
        <div className="mt-10 flex flex-col items-center gap-4 w-full px-6">
          <div className="flex justify-between w-full">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Probability Weight</span>
            <span className={`text-[10px] font-black uppercase ${isManual ? 'text-amber-500' : 'text-slate-400'}`}>
              {isManual ? 'HIGH_CONFIDENCE_MANUAL' : 'BW_ALGO_RESULT'}
            </span>
          </div>
          <div className="flex items-center gap-5 w-full">
             <div className="flex-1 h-3.5 bg-black/90 rounded-full overflow-hidden border-2 border-white/5 shadow-inner p-[2px]">
                <div 
                  className={`h-full rounded-full transition-all duration-[2000ms] cubic-bezier(0.34, 1.56, 0.64, 1) 
                    ${isManual ? 'bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.6)]' : 
                      isCritical ? 'bg-rose-600' : isUp ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-rose-500'}`}
                  style={{ width: `${prediction.confidence}%` }}
                ></div>
             </div>
             <span className={`text-2xl font-black mono italic ${isManual ? 'text-amber-400' : 'text-slate-100'}`}>
               {prediction.confidence}%
             </span>
          </div>
        </div>
      </div>

      <div className="relative z-10">
         <div className={`p-8 rounded-[3rem] backdrop-blur-4xl border-2 transition-colors duration-500
           ${isManual ? 'bg-amber-500/10 border-amber-500/40 shadow-inner' : 'bg-black/60 border-white/5'}`}>
            <h4 className={`text-[11px] font-black uppercase tracking-[0.5em] mb-4 flex items-center gap-3
              ${isManual ? 'text-amber-400' : 'text-purple-400'}`}
            >
               <span className="text-3xl">{isManual ? '🛡️' : '🧠'}</span> System Logistics
            </h4>
            <p className={`text-[14px] leading-relaxed font-bold italic tracking-wide drop-shadow-md
              ${isManual ? 'text-amber-100/90' : 'text-slate-200/90'}`}
            >
              "{prediction.reasoning}"
            </p>
         </div>
      </div>
      
      <div className="mt-10 flex justify-between items-center opacity-50 relative z-10 border-t border-white/10 pt-8">
         <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] italic">Gaborone Cluster Sync</span>
            <span className="text-[8px] text-slate-500 font-mono mt-1">UPLINK_SECURE_PROTOCOL_7</span>
         </div>
         <div className="text-right">
            <span className="text-[10px] font-black mono uppercase tracking-widest text-fuchsia-400 bg-fuchsia-400/10 px-4 py-1.5 rounded-lg border border-fuchsia-400/20">
              PULSE-{prediction.id.substring(0, 6).toUpperCase()}
            </span>
         </div>
      </div>

      <style>{`
        @keyframes manual-glow {
          0%, 100% { box-shadow: 0 0 40px rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.5); }
          50% { box-shadow: 0 0 80px rgba(245,158,11,0.3); border-color: rgba(245,158,11,0.8); }
        }
        @keyframes manual-scan {
          from { background-position: 0 0; }
          to { background-position: 60px 60px; }
        }
        .animate-manual-glow { animation: manual-glow 3s infinite; }
        .animate-manual-scan { animation: manual-scan 2s linear infinite; }
      `}</style>
    </div>
  );
};

export default SignalCard;
