
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DataPoint, PredictionResult, AppTab, SportsPrediction, User, CategorizedSportsPredictions } from './types';
import { getMarketPrediction, getSportsPrediction, refreshGlobalSportsMarkets } from './services/geminiService';
import RadarView from './components/RadarView';
import CameraView from './components/CameraView';
import StatsGrid from './components/StatsGrid';
import ChartSection from './components/ChartSection';
import SignalCard from './components/SignalCard';
import SportsTerminal from './components/SportsTerminal';
import BallLoader from './components/BallLoader';
import DevHub from './components/DevHub';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('AVIATOR'); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginInput, setLoginInput] = useState({ user: '', pass: '' });
  const [isManualSyncOpen, setIsManualSyncOpen] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [trailPersistence, setTrailPersistence] = useState(3000);
  const [trailIntensity, setTrailIntensity] = useState(50);
  
  const [selectedMarketNode, setSelectedMarketNode] = useState("Betway Botswana");
  const [marketData, setMarketData] = useState<DataPoint[]>([]);
  const [activeSignals, setActiveSignals] = useState<PredictionResult[]>([]);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);

  const [sportsInput, setSportsInput] = useState('');
  const [sportsPrediction, setSportsPrediction] = useState<SportsPrediction | null>(null);
  const [loadingSports, setLoadingSports] = useState(false);
  const [globalSports, setGlobalSports] = useState<CategorizedSportsPredictions | null>(null);

  // Market Data Simulation
  useEffect(() => {
    const initial = Array.from({ length: 40 }, (_, i) => ({
      time: new Date(Date.now() - (40 - i) * 10000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: 1 + Math.random() * 5
    }));
    setMarketData(initial);

    const interval = setInterval(() => {
      setMarketData(prev => {
        const last = prev[prev.length - 1];
        const newVal = Math.max(1, last.value + (Math.random() - 0.5));
        return [...prev.slice(1), { 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
          value: newVal 
        }];
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch World Sports Data
  useEffect(() => {
    const fetchGlobalSports = async () => {
      try {
        const data = await refreshGlobalSportsMarkets();
        setGlobalSports(data);
      } catch (e) {
        console.error("Failed to fetch world sports", e);
      }
    };
    fetchGlobalSports();
    // Increased interval to 60s to avoid rate limiting (429 RESOURCE_EXHAUSTED)
    const globalInterval = setInterval(fetchGlobalSports, 60000); 
    return () => clearInterval(globalInterval);
  }, []);

  // Movement Countdown for Radar Signals
  useEffect(() => {
    const countdown = setInterval(() => {
      setActiveSignals(prev => 
        prev
          .map(sig => ({
            ...sig,
            timeRemaining: Math.max(0, (sig.timeRemaining || 0) - 0.1)
          }))
          .filter(sig => (sig.timeRemaining || 0) > 0)
      );
    }, 100);
    return () => clearInterval(countdown);
  }, []);

  const handlePredict = async () => {
    setLoadingPrediction(true);
    try {
      const res = await getMarketPrediction(marketData.slice(-10), selectedMarketNode);
      setActiveSignals(prev => [...prev, { ...res, timeRemaining: res.timeRemaining || 20 }]);
    } catch (e) { console.error(e); }
    finally { setLoadingPrediction(false); }
  };

  const handleManualSyncApply = () => {
    const multipliers = manualInput.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
    if (multipliers.length > 0) {
      const lastVal = multipliers[multipliers.length - 1];
      const manualSignal: PredictionResult = {
        id: 'manual-' + Math.random().toString(36).substring(2, 7),
        direction: lastVal > 2 ? 'UP' : 'DOWN',
        confidence: 98,
        multiplier: lastVal * 1.05,
        timeRemaining: 25,
        timestamp: new Date().toLocaleTimeString('en-GB', { timeZone: 'Africa/Gaborone', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        reasoning: `Manual Node Handshake [${selectedMarketNode}]: Calibrated sequence using external server data. Probability weight maximized for regional node synchronization.`,
        isManual: true,
        marketNode: selectedMarketNode
      };
      setActiveSignals(prev => [...prev, manualSignal]);
    }
    setIsManualSyncOpen(false);
    setManualInput('');
  };
  
  const handleSignalUpdate = (updatedSignal: PredictionResult) => {
    setActiveSignals(prev => prev.map(s => s.id === updatedSignal.id ? updatedSignal : s));
  };

  const handleSports = async () => {
    if (!sportsInput) return;
    setLoadingSports(true);
    try {
      const res = await getSportsPrediction(sportsInput);
      setSportsPrediction(res);
    } catch (e) { console.error(e); }
    finally { setLoadingSports(false); }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#05020a] flex items-center justify-center p-10 font-sans">
        <div className="max-w-md w-full glass-card p-12 rounded-[2rem] border-2 border-fuchsia-500/20 shadow-[0_0_100px_rgba(217,70,239,0.1)]">
           <div className="text-center mb-12">
              <div className="w-32 h-32 bg-white rounded-full mx-auto mb-8 flex items-center justify-center shadow-[0_0_50px_white] animate-soccer-spin-slow overflow-hidden border-4 border-black relative">
                 <span className="text-[10px] font-black text-black transform -rotate-12 italic leading-tight text-center">BET<br/>WIRELESS</span>
                 <div className="absolute inset-0 bg-black/5 grid grid-cols-2 grid-rows-2">
                    <div className="border border-white/20"></div><div className="bg-black/10 border border-white/20"></div>
                    <div className="bg-black/10 border border-white/20"></div><div className="border border-white/20"></div>
                 </div>
              </div>
              <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Node Gateway</h1>
              <p className="text-[10px] text-slate-500 mt-2 tracking-[0.4em] uppercase">Auth-Key Required for Uplink</p>
           </div>
           <div className="space-y-6">
              <input type="text" placeholder="Gaborone_Admin_ID" className="w-full bg-black border-2 border-white/10 rounded-2xl p-5 text-white outline-none focus:border-fuchsia-600 transition-all font-mono" value={loginInput.user} onChange={e => setLoginInput(p => ({...p, user: e.target.value}))} />
              <input type="password" placeholder="••••••••" className="w-full bg-black border-2 border-white/10 rounded-2xl p-5 text-white outline-none focus:border-fuchsia-600 transition-all" value={loginInput.pass} onChange={e => setLoginInput(p => ({...p, pass: e.target.value}))} />
              <button onClick={() => setIsLoggedIn(true)} className="w-full py-5 bg-fuchsia-600 text-white font-black rounded-2xl uppercase tracking-widest hover:bg-white hover:text-fuchsia-600 transition-all shadow-xl">Handshake Node</button>
           </div>
           <p className="text-[9px] text-slate-600 text-center mt-8 italic">Demo Credentials: admin / 1234</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05020a] text-slate-100 font-sans pb-48">
      <header className="h-32 backdrop-blur-3xl border-b-2 border-fuchsia-900/40 flex items-center justify-between px-12 bg-[#0a0515]/95 sticky top-0 z-[60] shadow-2xl">
        <div className="flex items-center gap-8">
           <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute w-16 h-16 bg-white rounded-full border-2 border-black shadow-[0_0_30px_white] z-10 flex items-center justify-center animate-soccer-spin-slow overflow-hidden">
                 <span className="text-[7px] font-black text-black transform -rotate-12 italic leading-none text-center">BET<br/>WIRELESS</span>
              </div>
              <svg className="absolute inset-0 w-full h-full animate-rotate-reverse z-0">
                 <path d="M 50,10 A 40,40 0 1,1 50,90 A 40,40 0 1,1 50,10" fill="none" stroke="url(#trackGrad)" strokeWidth="2" strokeDasharray="5,10" />
                 <defs>
                   <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                     <stop offset="0%" stopColor="#d946ef" />
                     <stop offset="100%" stopColor="#a855f7" />
                   </linearGradient>
                 </defs>
              </svg>
           </div>
           <div>
              <span className="logo-font text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-500">BETWIRELESS ULTRA</span>
              <p className="text-[10px] font-black text-fuchsia-400 tracking-[0.4em] uppercase mt-1">Gaborone Node_7 Cluster | ALPHA-ENGINE</p>
           </div>
        </div>
        <div className="flex items-center gap-8">
           <div className="text-right border-r border-white/10 pr-8">
              <span className="text-[11px] font-black text-emerald-400 tracking-[0.4em] uppercase italic">Uplink Stable</span>
           </div>
           <button onClick={() => setIsLoggedIn(false)} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl hover:bg-rose-600 transition-all group">
             <span>🔒</span>
           </button>
        </div>
      </header>

      <main className="max-w-[1900px] mx-auto px-8 py-12 space-y-16">
        <StatsGrid stats={{ accuracy: '99.1%', dailyProfit: 'P 54,320', winRate: '96.4%', activeUsers: 'ULTRA NODES' }} />

        <div className="flex justify-center">
           <div className="glass-card p-3 rounded-[3rem] flex gap-3 border-2 border-fuchsia-500/20 shadow-2xl">
              {[
                {id: 'AVIATOR', icon: '✈️', label: 'AVIATOR'},
                {id: 'SPORTS', icon: '⚽', label: 'SPORTS'},
                {id: 'CAMERA', icon: '📸', label: 'SCAN'},
                {id: 'DEV_HUB', icon: '💻', label: 'DEV'},
                {id: 'TUTORIAL', icon: '🎓', label: 'ACADEMY'}
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-10 py-5 rounded-[2.5rem] flex items-center gap-3 transition-all font-black uppercase text-[10px] tracking-widest ${activeTab === tab.id ? 'bg-fuchsia-600 text-white shadow-xl scale-105' : 'hover:bg-white/5 text-slate-400'}`}>
                   <span className="text-lg">{tab.icon}</span> {tab.label}
                </button>
              ))}
           </div>
        </div>

        {activeTab === 'AVIATOR' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
             <div className="xl:col-span-5 flex flex-col items-center">
                <RadarView 
                   activeSignals={activeSignals} 
                   selectedSignalId={selectedSignalId}
                   onSelectSignal={setSelectedSignalId}
                   onManualEntryOpen={() => setIsManualSyncOpen(true)}
                   onPredict={handlePredict}
                   loadingPrediction={loadingPrediction}
                   trailDuration={trailPersistence}
                   trailIntensity={trailIntensity}
                   onSignalUpdate={handleSignalUpdate}
                />
             </div>
             <div className="xl:col-span-7 flex flex-col gap-6">
                <SignalCard 
                   prediction={activeSignals.length > 0 ? activeSignals[activeSignals.length - 1] : null} 
                   loading={loadingPrediction} 
                   isCollision={false}
                   isCritical={(activeSignals.length > 0 ? activeSignals[activeSignals.length - 1].multiplier || 0 : 0) > 2.0}
                />
                <div className="flex-1 min-h-[300px]">
                   <ChartSection data={marketData} globalSports={globalSports} />
                </div>
             </div>
          </div>
        )}

        {activeTab === 'SPORTS' && (
           <div className="animate-in slide-in-from-right-10 fade-in duration-500">
              {!sportsPrediction ? (
                 <div className="flex flex-col items-center justify-center min-h-[600px] gap-8">
                    <BallLoader size="lg" label="WAITING FOR KICKOFF..." />
                    <div className="w-full max-w-2xl bg-black/60 border border-white/10 rounded-[3rem] p-4 flex gap-4 shadow-2xl">
                       <input 
                         type="text" 
                         className="flex-1 bg-transparent px-8 py-4 text-white font-mono placeholder:text-slate-600 outline-none uppercase text-sm" 
                         placeholder="Enter Team or Match Context (e.g. Arsenal vs Liverpool)..."
                         value={sportsInput}
                         onChange={e => setSportsInput(e.target.value)}
                         onKeyDown={e => e.key === 'Enter' && handleSports()}
                       />
                       <button 
                         onClick={handleSports}
                         disabled={loadingSports}
                         className="px-10 py-4 bg-emerald-500 hover:bg-white hover:text-emerald-600 text-black font-black rounded-[2.5rem] uppercase tracking-widest transition-all shadow-[0_0_20px_#10b981] disabled:opacity-50"
                       >
                         {loadingSports ? 'ANALYZING...' : 'PREDICT'}
                       </button>
                    </div>
                 </div>
              ) : (
                 <SportsTerminal data={sportsPrediction} globalSports={globalSports} onBack={() => setSportsPrediction(null)} />
              )}
           </div>
        )}

        {activeTab === 'CAMERA' && <CameraView isAnalyzing={false} />}
        {activeTab === 'DEV_HUB' && <DevHub />}
        
        {activeTab === 'TUTORIAL' && (
          <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-4 opacity-50">
             <span className="text-6xl">🎓</span>
             <h3 className="text-2xl font-black text-white uppercase italic">Academy Offline</h3>
             <p className="text-xs uppercase tracking-widest">Training Modules Loading...</p>
          </div>
        )}
      </main>

      {/* Manual Sync Modal */}
      {isManualSyncOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-8">
           <div className="bg-[#120a25] border-2 border-amber-500 rounded-[3rem] p-10 w-full max-w-2xl shadow-[0_0_100px_rgba(245,158,11,0.2)] animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-amber-500 uppercase italic tracking-tighter mb-2">Manual Node Override</h3>
                    <p className="text-xs text-amber-200/60 font-bold uppercase tracking-widest">Inject external server multipliers for calibration</p>
                  </div>
                  <div className="text-4xl">🛰️</div>
              </div>
              
              <div className="space-y-8">
                 <div>
                    <label className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest mb-3 block flex justify-between">
                        <span>Multiplier Sequence (CSV)</span>
                        <span className="opacity-50">e.g. 2.50, 1.10</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="Input data stream..." 
                      className="w-full bg-black/50 border-2 border-amber-500/30 rounded-2xl p-5 text-amber-100 font-mono focus:border-amber-500 outline-none transition-all placeholder:text-amber-900/50 text-sm"
                      value={manualInput}
                      onChange={e => setManualInput(e.target.value)}
                    />
                 </div>

                 {/* Trail Persistence Slider */}
                 <div className="bg-amber-500/5 p-6 rounded-2xl border border-amber-500/10">
                    <div className="flex justify-between items-center mb-4">
                         <div className="flex flex-col">
                            <label className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest">Signal Trail Persistence</label>
                            <span className="text-[8px] text-amber-500/40 uppercase font-bold mt-1">Adjust visual decay rate</span>
                         </div>
                         <span className="text-xl font-black text-amber-400 font-mono italic">{(trailPersistence/1000).toFixed(1)}s</span>
                    </div>
                    <input 
                       type="range" 
                       min="1000" 
                       max="10000" 
                       step="500"
                       value={trailPersistence}
                       onChange={(e) => setTrailPersistence(parseInt(e.target.value))}
                       className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex justify-between mt-2 text-[8px] font-black text-amber-500/30 uppercase">
                        <span>Short (1s)</span>
                        <span>Long (10s)</span>
                    </div>
                 </div>

                 {/* Trail Intensity Slider */}
                 <div className="bg-amber-500/5 p-6 rounded-2xl border border-amber-500/10">
                    <div className="flex justify-between items-center mb-4">
                         <div className="flex flex-col">
                            <label className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest">Trail Intensity & Opacity</label>
                            <span className="text-[8px] text-amber-500/40 uppercase font-bold mt-1">Scale thickness based on multiplier weight</span>
                         </div>
                         <span className="text-xl font-black text-amber-400 font-mono italic">{trailIntensity}%</span>
                    </div>
                    <input 
                       type="range" 
                       min="10" 
                       max="150" 
                       step="10"
                       value={trailIntensity}
                       onChange={(e) => setTrailIntensity(parseInt(e.target.value))}
                       className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex justify-between mt-2 text-[8px] font-black text-amber-500/30 uppercase">
                        <span>Fine Line</span>
                        <span>Heavy Glow</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 mt-4">
                    <button onClick={() => setIsManualSyncOpen(false)} className="py-5 rounded-2xl font-black uppercase text-amber-500 border-2 border-amber-500/30 hover:bg-amber-500/10 transition-all text-xs tracking-widest">Cancel Abort</button>
                    <button onClick={handleManualSyncApply} className="py-5 rounded-2xl font-black uppercase bg-amber-500 text-black hover:bg-amber-400 transition-all shadow-[0_0_30px_rgba(245,158,11,0.4)] text-xs tracking-widest">Inject Data Stream</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
