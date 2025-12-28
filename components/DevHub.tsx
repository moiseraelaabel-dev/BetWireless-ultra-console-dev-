
import React, { useState, useEffect, useRef } from 'react';

const DevHub: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const developerName = "PurpleDev Alpha";
  const commitHistory = [
    { id: '7f3a2c', msg: 'Initial Node-7 Gaborone Sync', date: '2 mins ago' },
    { id: 'b2e1d0', msg: 'Optimized Python-Node Algorithm v4.1', date: '1 hour ago' },
    { id: 'x9v8c7', msg: 'Integrated Multi-Market Node Connectivity', date: '3 hours ago' },
    { id: 'p0q1r2', msg: 'Android PWA Android_SDK_v33 Handshake', date: 'Yesterday' }
  ];

  useEffect(() => {
    const bootSequence = [
      "> initializing dev_hub...",
      "> connecting to github.com/BetWireless-Ultra/Gaborone-Node...",
      "> fetching latest commits from [PurpleDev Alpha]...",
      "> node connection: ESTABLISHED",
      "> ready for android build wrap."
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < bootSequence.length) {
        setLogs(prev => [...prev, bootSequence[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  const startAndroidBuild = () => {
    setIsBuilding(true);
    setProgress(0);
    setLogs(prev => [...prev, "> starting android install wrap...", "> targeting: [THIS PHONE]"]);
    
    const buildInterval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(buildInterval);
          setIsBuilding(false);
          setLogs(prev => [...prev, "> build complete. APK Node Ready for Installation."]);
          return 100;
        }
        return p + 2;
      });
    }, 100);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12 animate-in slide-in-from-bottom-12 duration-1000">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Terminal Side */}
        <div className="lg:col-span-8 flex flex-col gap-8">
           <div className="bg-[#05020a] border-4 border-fuchsia-600/30 rounded-[3rem] p-10 font-mono text-fuchsia-400 overflow-hidden shadow-2xl relative">
              <div className="flex justify-between items-center mb-6 border-b border-fuchsia-600/20 pb-4">
                 <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-600">BetWireless_Dev_Console_v2.5</span>
              </div>
              <div ref={scrollRef} className="h-[400px] overflow-y-auto no-scrollbar space-y-2 text-[12px] leading-relaxed">
                 {logs.map((log, i) => (
                   <p key={i} className="animate-in fade-in slide-in-from-left-2">{log}</p>
                 ))}
                 {isBuilding && (
                   <div className="mt-4 space-y-2">
                      <p className="animate-pulse">Building Android APK Wrapper... {progress}%</p>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-fuchsia-500/20">
                         <div className="h-full bg-fuchsia-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                      </div>
                   </div>
                 )}
              </div>
              <div className="absolute bottom-4 right-10 text-[8px] opacity-30 animate-pulse">AUTHOR: {developerName.toUpperCase()}</div>
           </div>

           <div className="bg-fuchsia-600/10 border-4 border-fuchsia-600/20 rounded-[4rem] p-12 flex items-center justify-between shadow-xl">
              <div className="flex flex-col gap-2">
                 <h3 className="text-2xl font-black italic text-white uppercase">Install on This Phone 📱</h3>
                 <p className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">Progressive Web App / Android APK Handshake</p>
              </div>
              <button 
                onClick={startAndroidBuild}
                disabled={isBuilding}
                className="px-12 py-6 bg-fuchsia-600 text-white font-black rounded-[2.5rem] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-3xl disabled:opacity-50"
              >
                {isBuilding ? 'Wrapping...' : 'Download to Device'}
              </button>
           </div>
        </div>

        {/* GitHub Stats Side */}
        <div className="lg:col-span-4 space-y-10">
           <div className="glass-card p-10 rounded-[4rem] border-2 border-white/10 shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-3xl">🐙</div>
                 <div>
                    <h4 className="font-black text-white italic uppercase leading-none">GitHub Repository</h4>
                    <p className="text-[9px] text-fuchsia-500 font-bold uppercase tracking-widest mt-1">BetWireless-Ultra/Gaborone-Node</p>
                 </div>
              </div>
              <div className="space-y-6">
                 {commitHistory.map(commit => (
                   <div key={commit.id} className="flex flex-col gap-1 border-b border-white/5 pb-4 group cursor-default">
                      <div className="flex justify-between items-center">
                         <span className="text-fuchsia-400 font-mono text-[10px] font-black uppercase">commit: {commit.id}</span>
                         <span className="text-slate-500 text-[9px] font-bold">{commit.date}</span>
                      </div>
                      <p className="text-[12px] text-white font-bold italic group-hover:text-fuchsia-300 transition-colors">"{commit.msg}"</p>
                   </div>
                 ))}
              </div>
              <div className="mt-10 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                 <span className="text-[9px] font-black text-emerald-400 uppercase">Status</span>
                 <span className="text-[10px] font-black text-emerald-500 mono">PUSHED_AND_SYNCED</span>
              </div>
           </div>

           <div className="bg-[#120a25] border-2 border-white/5 rounded-[4rem] p-10 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-fuchsia-500/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[2s]"></div>
              <div className="flex items-center gap-6 relative z-10">
                 <div className="text-4xl">👤</div>
                 <div>
                    <p className="text-[8px] font-black text-fuchsia-500 uppercase tracking-widest">Main Developer</p>
                    <h5 className="text-xl font-black text-white italic uppercase tracking-tighter">{developerName}</h5>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DevHub;
