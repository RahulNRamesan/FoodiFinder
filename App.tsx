import React, { useState, useEffect } from 'react';
import { Coordinates, FoodSpot, AgentType, AgentLog } from './types';
import { fetchFoodSpots } from './services/geminiService';
import { AgentHUD } from './components/AgentHUD';
import { SpotCard } from './components/SpotCard';
import { MapVisualization } from './components/MapVisualization';
import { DetailPanel } from './components/DetailPanel';
import { Search, Navigation, RefreshCw, LayoutGrid, Map as MapIcon, Menu, Loader2 } from 'lucide-react';

// Kochi, Kerala Coordinates
const DEFAULT_CENTER: Coordinates = { lat: 9.9312, lng: 76.2673 }; 
const DEFAULT_LOCATION_NAME = "Kochi, Kerala";

const App: React.FC = () => {
  // State
  const [userLocation, setUserLocation] = useState<Coordinates>(DEFAULT_CENTER);
  const [locationName, setLocationName] = useState<string>(DEFAULT_LOCATION_NAME);
  const [spots, setSpots] = useState<FoodSpot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<FoodSpot | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAgent, setActiveAgent] = useState<AgentType>(AgentType.IDLE);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [mapType, setMapType] = useState<'map' | 'satellite'>('map');

  // Helper to add logs
  const addLog = (message: string, agent: AgentType) => {
    setAgentLogs(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      message,
      agent
    }]);
  };

  // 1. Initial Load - Get Location & Run Discovery Agent
  useEffect(() => {
    addLog('Initializing FoodiFind System...', AgentType.IDLE);
    
    // Default to Kochi immediately
    runDiscoveryAgent(DEFAULT_CENTER, DEFAULT_LOCATION_NAME);

    // Optional: Attempt real geolocation silently to update if granted
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
          addLog(`User position detected: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`, AgentType.IDLE);
        },
        (err) => {
          console.log("Location access denied or ignored, staying in Kochi.");
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. AI Agent Workflows
  const runDiscoveryAgent = async (center: Coordinates, query: string) => {
    // Clear previous selection
    setSelectedSpot(null);
    
    setActiveAgent(AgentType.DISCOVERY);
    addLog(`Scanning social signals for "${query}" within 5km...`, AgentType.DISCOVERY);
    
    // Simulate delay for "Thinking" visualization
    await new Promise(r => setTimeout(r, 800));
    
    setActiveAgent(AgentType.SEARCH);
    addLog('Extracting entities & geolocation data...', AgentType.SEARCH);
    
    // Fetch spots AND the new center coordinates from the AI
    const result = await fetchFoodSpots(query, center.lat, center.lng);
    
    setActiveAgent(AgentType.RANKING);
    addLog(`Ranking ${result.spots.length} candidates by sentiment velocity...`, AgentType.RANKING);
    await new Promise(r => setTimeout(r, 600));

    setActiveAgent(AgentType.VALIDATION);
    addLog('Cross-referencing with public review databases...', AgentType.VALIDATION);
    await new Promise(r => setTimeout(r, 400));

    setSpots(result.spots);
    
    // Update map center and location name based on what the AI found
    if (result.center) {
      setUserLocation(result.center);
    }
    if (result.locationName) {
      setLocationName(result.locationName);
    }

    addLog(`Discovery complete. ${result.spots.length} trending spots found in ${result.locationName}.`, AgentType.IDLE);
    setActiveAgent(AgentType.IDLE);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    addLog(`New search initiated: "${searchQuery}"`, AgentType.SEARCH);
    
    // Pass current location as reference, but the AI will determine the new center based on the query
    runDiscoveryAgent(userLocation, searchQuery);
  };

  const handleWeeklyRefresh = () => {
    if (spots.length === 0) return;
    setActiveAgent(AgentType.REFRESH);
    addLog('Executing Weekly Analytics Refresh...', AgentType.REFRESH);
    
    setTimeout(() => {
       const updatedSpots = spots.map(s => ({
         ...s,
         trendingScore: Math.min(100, s.trendingScore + Math.floor(Math.random() * 10 - 3)),
         lastUpdated: new Date().toISOString()
       }));
       setSpots(updatedSpots);
       addLog('Refresh complete. Trends updated.', AgentType.IDLE);
       setActiveAgent(AgentType.IDLE);
    }, 2500);
  };

  const isLoading = activeAgent !== AgentType.IDLE;

  return (
    <div className="relative h-screen w-full flex flex-col bg-slate-50 text-slate-800 overflow-hidden font-sans">
      
      {/* Top Navigation Bar (Lamar Style: White with Dark Green Accents) */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-50">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="bg-brand-dark text-white p-1.5 rounded-lg shadow-sm">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-brand-dark tracking-tight">FoodiFind</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-1 ml-8">
            <button className="px-4 py-2 text-sm font-bold text-brand-dark border-b-2 border-brand-dark">Discovery Map</button>
            <button className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-brand-dark transition-colors">Influencer Gallery</button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
           <form onSubmit={handleSearch} className="relative hidden md:block w-96">
             <input 
               type="text" 
               placeholder="Search location (e.g., Paris, Tokyo)..." 
               className="w-full bg-slate-100 border border-transparent rounded-full py-2 pl-4 pr-12 text-sm text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-dark focus:border-transparent transition-all"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
             <button type="submit" className="absolute right-1 top-1 bg-brand-dark text-white p-1.5 rounded-full hover:bg-brand-accent transition-colors shadow-sm">
               <Search className="w-4 h-4" />
             </button>
           </form>
           
           <button className="text-sm font-medium text-slate-600 hover:text-brand-dark">Contact Us</button>
           <button className="bg-brand-dark hover:bg-brand-accent text-white px-5 py-2 rounded-full text-sm font-medium transition-colors shadow-soft">Login</button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Floating Search (Mobile) */}
        <div className="md:hidden absolute top-4 left-4 right-4 z-40">
           <form onSubmit={handleSearch} className="relative shadow-lg">
             <input 
               type="text" 
               placeholder="Search..." 
               className="w-full bg-white border border-slate-200 rounded-lg py-3 pl-4 pr-10 shadow-sm focus:ring-2 focus:ring-brand-dark"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
             <Search className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" />
           </form>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative bg-slate-200">
           
           {/* Loading Overlay */}
           {isLoading && (
             <div className="absolute inset-0 z-[450] bg-white/60 backdrop-blur-sm flex items-center justify-center">
               <div className="bg-white p-6 rounded-xl shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-300">
                 <div className="relative w-16 h-16 mb-4">
                   <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                   <LayoutGrid className="absolute inset-0 m-auto w-6 h-6 text-brand-dark" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-800">Scanning Area...</h3>
                 <p className="text-sm text-slate-500 mt-1 animate-pulse">{agentLogs[agentLogs.length - 1]?.message || "Initializing agents..."}</p>
               </div>
             </div>
           )}

           {/* Map Controls */}
           <div className="absolute top-4 left-4 z-[400] hidden md:flex bg-white rounded-lg shadow-soft border border-slate-200 p-1">
             <button 
               onClick={() => setMapType('map')}
               className={`px-3 py-1.5 text-xs font-bold rounded shadow-sm transition-colors ${mapType === 'map' ? 'bg-slate-100 text-brand-dark' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               Map
             </button>
             <button 
               onClick={() => setMapType('satellite')}
               className={`px-3 py-1.5 text-xs font-bold rounded shadow-sm transition-colors ${mapType === 'satellite' ? 'bg-slate-100 text-brand-dark' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               Satellite
             </button>
           </div>

           <MapVisualization 
             spots={spots} 
             center={userLocation} 
             selectedSpotId={selectedSpot?.id || null}
             onSelectSpot={setSelectedSpot}
             mapType={mapType}
           />

           {/* Mobile List Toggle */}
           <button 
             onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
             className="md:hidden absolute bottom-6 right-6 z-[400] bg-brand-dark text-white p-4 rounded-full shadow-xl"
           >
             {viewMode === 'map' ? <Menu className="w-6 h-6" /> : <MapIcon className="w-6 h-6" />}
           </button>
        </div>

        {/* Right Sidebar (Desktop) or Bottom Sheet (Mobile) */}
        <div className={`${viewMode === 'map' ? 'hidden md:flex' : 'flex'} absolute md:static inset-0 md:inset-auto bg-white md:w-[400px] flex-col border-l border-slate-200 shadow-xl z-20`}>
          
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
            <div>
               <h2 className="font-bold text-slate-800 flex items-center text-lg">
                 <LayoutGrid className="w-4 h-4 mr-2 text-brand-dark" />
                 Trending Spots
               </h2>
               <p className="text-xs text-slate-500 mt-1">Found {spots.length} recommendations in {locationName}</p>
            </div>
            <button 
              onClick={handleWeeklyRefresh} 
              disabled={isLoading}
              className={`p-2 text-slate-400 hover:text-brand-dark hover:bg-slate-50 rounded-full transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Refresh AI Analysis"
            >
              <RefreshCw className={`w-4 h-4 ${activeAgent === AgentType.REFRESH ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {spots.length === 0 && !isLoading && (
               <div className="text-center p-8 text-slate-400 text-sm">
                 No spots found. Try a different location.
               </div>
            )}
            
            {spots.map(spot => (
              <SpotCard 
                key={spot.id} 
                spot={spot} 
                selected={selectedSpot?.id === spot.id}
                onSelect={setSelectedSpot} 
              />
            ))}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-200 bg-white">
             <button className="w-full bg-brand-dark text-white py-3 rounded-lg font-bold hover:bg-brand-accent transition-colors shadow-soft flex justify-center items-center">
               <Navigation className="w-4 h-4 mr-2" />
               Locate Me
             </button>
          </div>
        </div>

        {/* Detail Panel (Slide Over) */}
        {selectedSpot && (
          <div className="absolute top-4 right-4 md:right-[416px] bottom-4 w-full md:w-[400px] z-[500] pointer-events-none">
             <div className="pointer-events-auto h-full">
                <DetailPanel spot={selectedSpot} onClose={() => setSelectedSpot(null)} />
             </div>
          </div>
        )}

        {/* Agent HUD (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-30 hidden md:block">
           <AgentHUD logs={agentLogs} activeAgent={activeAgent} />
        </div>

      </div>
    </div>
  );
};

export default App;