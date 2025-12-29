
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

const PlaneIcon: React.FC = () => (
  <div className="relative animate-float-gentle inline-block align-middle mr-2">
    <svg 
      width="18" height="18" viewBox="0 0 24 24" fill="none" 
      className="stroke-rose-400 drop-shadow-[0_0_8px_#fb7185]"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.2c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z" />
    </svg>
  </div>
);

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
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Sync Global Sports Data - Reduced frequency to avoid 429 errors
  useEffect(() => {
    const fetchSports = async () => {
      try {
        const data = await refreshGlobalSportsMarkets();
        setGlobalSports(data);
      } catch (err) {
        console.error("Failed to sync global sports", err);
      }
    };
    fetchSports();
    const interval = setInterval(fetchSports, 600000); // Sync every 10 minutes
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginInput.user && loginInput.pass) {
      setIsLoggedIn(true);
    }
  };

  const handlePredictMarket = async () => {
    setLoadingPrediction(true);
    try {
      const prediction = await getMarketPrediction(marketData, selectedMarketNode);
      setActiveSignals(prev => [prediction, ...prev].slice(0, 5));
      setSelectedSignalId(prediction.id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPrediction(false);
    }
  };

  const handlePredictSports = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sportsInput) return;
    setLoadingSports(true);
    try {
      const prediction = await getSportsPrediction(sportsInput);
      setSportsPrediction(prediction);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSports(false);
    }
  };

  const handleManualSync = () => {
    if (!manualInput) return;
    const val = parseFloat(manualInput);
    if (isNaN(val)) return;

    const manualSig: PredictionResult = {
      id: 'manual-' + Math.random().toString(36).substring(2, 9),
      direction: val >= 2.0 ? 'UP' : 'DOWN',
      confidence: 99,
      reasoning: "Manual Node Sync verified for Botswana Cluster.",
      timestamp: new Date().toLocaleTimeString('en-GB', { timeZone: 'Africa/Gaborone' }),
      multiplier: val,
      timeRemaining: 30,
      isManual: true,
      marketNode: selectedMarketNode
    };

    setActiveSignals(prev => [manualSig, ...prev].slice(0, 5));
    setSelectedSignalId(manualSig.id);
    setIsManualSyncOpen(false);
    setManualInput('');
  };

  const handleSignalUpdate = (updated: PredictionResult) => {
    setActiveSignals(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const currentSignal = activeSignals.find(s => s.id === selectedSignalId) || activeSignals[0] || null;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#05020a] flex items-center justify-center p-4 font-black">
        <div className="w-full max-w-md bg-[#120a25] border-4 border-purple-600/30 rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-500">
           <div className="flex flex-col items-center mb-10">
              <div className="w-20 h-20 bg-purple-600 rounded-2xl flex items-center justify-center text-4xl mb-4 shadow-[0_0_40px_#9333ea]">⚡</div>
              <h1 className="text-4xl text-white italic tracking-tighter uppercase">BetWireless <span className="text-purple-500">Ultra</span></h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] mt-2 font-bold">Gaborone Node v3.1</p>
           </div>
           
           <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] text-purple-400 uppercase tracking-widest ml-4">Authorized User</label>
                 <input 
                   type="text" 
                   required
                   value={loginInput.user}
                   onChange={(e) => setLoginInput(prev => ({...prev, user: e.target.value}))}
                   className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-4 text-white placeholder-slate-600 outline-none focus:border-purple-600 transition-all"
                   placeholder="VIP_ID_0000"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] text-purple-400 uppercase tracking-widest ml-4">Node Pass-Code</label>
                 <input 
                   type="password" 
                   required
                   value={loginInput.pass}
                   onChange={(e) => setLoginInput(prev => ({...prev, pass: e.target.value}))}
                   className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-4 text-white placeholder-slate-600 outline-none focus:border-purple-600 transition-all"
                   placeholder="••••••••"
                 />
              </div>
              <button 
                type="submit"
                className="w-full bg-purple-600 hover:bg-white hover:text-purple-600 text-white py-5 rounded-2xl transition-all shadow-xl active:scale-95 text-lg uppercase tracking-[0.2em] italic"
              >
                Establish Link
              </button>
           </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05020a] text-slate-200 font-bold overflow-x-hidden selection:bg-purple-600 selection:text-white">
      {/* Navigation Rail */}
      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-black/80 backdrop-blur-2xl px-8 py-4 rounded-[2.5rem] border-2 border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex items-center gap-10">
         {(['AVIATOR', 'SPORTS', 'CAMERA', 'DEV_HUB'] as AppTab[]).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:scale-110 active:scale-90 ${activeTab === tab ? 'text-purple-500 scale-110' : 'text-slate-500'}`}
            >
              {tab === 'AVIATOR' && <PlaneIcon />}
              <span>{tab}</span>
            </button>
         ))}
      </nav>

      <main className="max-w-[1400px] mx-auto p-6 pt-12 pb-40">
        <header className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-3xl shadow-2xl rotate-12 transition-transform hover:rotate-0">⚡</div>
              <div>
                 <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">BetWireless <span className="text-purple-600">Ultra</span></h1>
                 <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-slate-500 uppercase tracking-[0.4em]">Regional Uplink:</span>
                    <span className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em] animate-pulse">● Gaborone_Live</span>
                 </div>
              </div>
           </div>
           
           <div className="flex gap-4">
              <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 flex flex-col items-end">
                 <span className="text-[8px] text-slate-500 uppercase font-black">Cluster Load</span>
                 <span className="text-sm font-black text-white italic">NODE_7_ALPHA</span>
              </div>
              <button 
                onClick={() => setIsLoggedIn(false)}
                className="w-12 h-12 bg-rose-950/20 text-rose-500 border border-rose-500/30 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
              >
                🔒
              </button>
           </div>
        </header>

        {activeTab === 'AVIATOR' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-700">
             <div className="lg:col-span-4 space-y-10">
                <SignalCard 
                  prediction={currentSignal} 
                  loading={loadingPrediction} 
                />
                
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-8">
                   <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Telemetry Controls</h3>
                   <div className="space-y-6">
                      <div className="space-y-3">
                         <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>Trail Persistence</span>
                            <span>{trailPersistence / 1000}s</span>
                         </div>
                         <input 
                           type="range" min="1000" max="10000" step="1000"
                           value={trailPersistence}
                           onChange={(e) => setTrailPersistence(parseInt(e.target.value))}
                           className="w-full accent-purple-600 bg-slate-900 h-1.5 rounded-full appearance-none cursor-pointer"
                         />
                      </div>
                      <div className="space-y-3">
                         <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>Signal Intensity</span>
                            <span>{trailIntensity}%</span>
                         </div>
                         <input 
                           type="range" min="10" max="100" step="5"
                           value={trailIntensity}
                           onChange={(e) => setTrailIntensity(parseInt(e.target.value))}
                           className="w-full accent-purple-600 bg-slate-900 h-1.5 rounded-full appearance-none cursor-pointer"
                         />
                      </div>
                   </div>
                </div>
             </div>

             <div className="lg:col-span-8 space-y-10">
                <div className="bg-[#120a25]/80 border-4 border-purple-900/40 rounded-[4rem] p-10 shadow-2xl relative overflow-hidden">
                   <RadarView 
                     activeSignals={activeSignals}
                     selectedSignalId={selectedSignalId}
                     onSelectSignal={setSelectedSignalId}
                     onPredict={handlePredictMarket}
                     loadingPrediction={loadingPrediction}
                     onManualEntryOpen={() => setIsManualSyncOpen(true)}
                     trailDuration={trailPersistence}
                     trailIntensity={trailIntensity}
                     onSignalUpdate={handleSignalUpdate}
                   />
                </div>
                
                <div className="rounded-[4rem] overflow-hidden border-4 border-white/5 shadow-2xl">
                   <ChartSection data={marketData} globalSports={globalSports} />
                </div>
             </div>
          </div>
        )}

        {activeTab === 'SPORTS' && (
          <div className="space-y-12 animate-in slide-in-from-bottom-12 duration-700">
             {!sportsPrediction ? (
                <div className="max-w-4xl mx-auto space-y-12">
                   <div className="bg-emerald-950/20 border-4 border-emerald-500/20 rounded-[4rem] p-12 text-center shadow-2xl">
                      <h2 className="text-5xl font-black italic text-white uppercase mb-4">Tactical Sports Pulse</h2>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-sm max-w-lg mx-auto leading-relaxed">Deep AI analysis of African and Global football markets with real-time BW node synchronization.</p>
                   </div>
                   
                   <form onSubmit={handlePredictSports} className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-[3rem] blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                      <div className="relative flex items-center bg-[#120a25] rounded-[3rem] p-3 border-2 border-white/10">
                        <input 
                          type="text"
                          value={sportsInput}
                          onChange={(e) => setSportsInput(e.target.value)}
                          placeholder="ENTER FIXTURE OR LEAGUE (E.G. CHIEFS VS PIRATES)"
                          className="flex-1 bg-transparent px-10 py-6 text-white text-xl font-black italic uppercase placeholder-slate-600 outline-none"
                        />
                        <button 
                          type="submit"
                          disabled={loadingSports}
                          className="bg-emerald-600 hover:bg-white hover:text-emerald-600 text-white px-12 py-6 rounded-[2.5rem] font-black uppercase italic tracking-widest transition-all shadow-xl disabled:opacity-50"
                        >
                          {loadingSports ? 'ANALYZING...' : 'INITIATE RADAR'}
                        </button>
                      </div>
                   </form>

                   {loadingSports && (
                      <div className="flex flex-col items-center gap-10 py-20">
                         <BallLoader size="lg" label="Establishing Gaborone Stadium Uplink..." />
                      </div>
                   )}
                </div>
             ) : (
                <SportsTerminal 
                  data={sportsPrediction} 
                  globalSports={globalSports}
                  onBack={() => setSportsPrediction(null)} 
                />
             )}
          </div>
        )}

        {activeTab === 'CAMERA' && (
           <div className="animate-in zoom-in duration-700">
              <CameraView />
           </div>
        )}

        {activeTab === 'DEV_HUB' && <DevHub />}
      </main>

      {/* Manual Sync Modal */}
      {isManualSyncOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-3xl bg-black/80">
           <div className="w-full max-w-lg bg-slate-900 border-4 border-fuchsia-600/50 rounded-[3rem] p-12 shadow-[0_0_100px_rgba(168,85,247,0.3)] animate-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-3xl font-black italic text-white uppercase">Manual Node Sync</h2>
                 <button onClick={() => setIsManualSyncOpen(false)} className="text-slate-500 hover:text-white transition-colors text-4xl">×</button>
              </div>
              
              <div className="space-y-8">
                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-fuchsia-400 uppercase tracking-widest ml-4">Target Multiplier</label>
                    <input 
                      type="number" step="0.01"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="E.G. 2.15"
                      className="w-full bg-black/60 border-2 border-white/5 rounded-2xl px-8 py-6 text-2xl text-white font-black italic outline-none focus:border-fuchsia-600 transition-all"
                    />
                 </div>
                 
                 <div className="bg-fuchsia-600/10 border border-fuchsia-600/30 p-6 rounded-2xl flex items-start gap-4">
                    <span className="text-2xl">⚠️</span>
                    <p className="text-[10px] text-fuchsia-200/70 font-bold uppercase leading-relaxed tracking-wider">Warning: Manual overrides bypass automated telemetry. Certified VIP clearance required for cluster injection.</p>
                 </div>

                 <button 
                   onClick={handleManualSync}
                   className="w-full bg-fuchsia-600 hover:bg-white hover:text-fuchsia-600 text-white py-6 rounded-2xl font-black uppercase italic text-xl tracking-widest transition-all shadow-2xl active:scale-95"
                 >
                   Inject Pulse
                 </button>
              </div>
           </div>
        </div>
      )}
      
      <style>{`
        @keyframes float-gentle {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        .animate-float-gentle { animation: float-gentle 4s ease-in-out infinite; }
        
        @keyframes soccer-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-soccer-spin { animation: soccer-spin 5s linear infinite; }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
      `}</style>
    </div>
  );
};

export default App;
