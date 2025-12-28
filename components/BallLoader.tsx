
import React from 'react';

const BallLoader: React.FC<{ size?: 'sm' | 'md' | 'lg', label?: string }> = ({ size = 'md', label }) => {
  const containerSize = size === 'sm' ? 'w-40 h-40' : size === 'lg' ? 'w-80 h-80' : 'w-64 h-64';
  
  return (
    <div className="flex flex-col items-center justify-center gap-6 animate-in fade-in duration-500">
      <div className={`relative ${containerSize} overflow-hidden bg-[#0a0515]/80 rounded-[3rem] border-2 border-fuchsia-500/20 shadow-2xl`}>
        {/* Goal Post & Net */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-4/5 h-1/2 border-t-4 border-x-4 border-white/80 rounded-t-2xl z-0">
           <div className="w-full h-full opacity-20 bg-[radial-gradient(circle_at_center,_#fff_1px,_transparent_1px)] bg-[length:14px:14px] animate-net-vibration"></div>
           <div className="absolute inset-0 bg-emerald-500/0 animate-goal-flash"></div>
        </div>

        {/* The Falling Ball */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-14 z-10 animate-drop-score">
           <div className="w-full h-full bg-white rounded-full border-4 border-black shadow-[0_0_30px_white] relative">
              <div className="grid grid-cols-2 grid-rows-2 w-full h-full opacity-30">
                <div className="bg-black border border-white/10"></div>
                <div className="border border-white/10"></div>
                <div className="border border-white/10"></div>
                <div className="bg-black border border-white/10"></div>
              </div>
           </div>
        </div>
      </div>

      {label && (
        <p className="text-[11px] font-black text-fuchsia-500 uppercase tracking-[0.6em] animate-pulse italic text-center max-w-[300px]">
          {label}
        </p>
      )}

      <style>{`
        @keyframes drop-score {
          0% { transform: translate(-50%, -120px) rotate(0deg); opacity: 0; }
          15% { opacity: 1; }
          45% { transform: translate(-50%, 40px) rotate(360deg); }
          50% { transform: translate(-50%, 30px) rotate(390deg); }
          55% { transform: translate(-50%, 50px) rotate(420deg); }
          85% { transform: translate(-50%, 50px) rotate(420deg); opacity: 1; }
          100% { transform: translate(-50%, 50px) rotate(420deg); opacity: 0; }
        }
        @keyframes net-vibration {
          0%, 42%, 100% { transform: scale(1); opacity: 0.2; }
          48% { transform: scale(1.1) translateY(8px); opacity: 0.6; }
        }
        @keyframes goal-flash {
          0%, 45%, 100% { background: rgba(16, 185, 129, 0); }
          48% { background: rgba(16, 185, 129, 0.4); }
        }
        .animate-drop-score { animation: drop-score 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        .animate-net-vibration { animation: net-vibration 2.8s infinite; }
        .animate-goal-flash { animation: goal-flash 2.8s infinite; }
      `}</style>
    </div>
  );
};

export default BallLoader;
