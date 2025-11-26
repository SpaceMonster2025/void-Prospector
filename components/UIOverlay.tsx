
import React from 'react';
import { PlayerState, ScannableObject, MINERAL_RARITY_COLOR, GameState } from '../types';
import { SHIP_STATS, TOW_COST, MAX_ASTEROIDS } from '../constants';
import { Database, Zap, Battery, TriangleAlert, Radio, Radar } from 'lucide-react';

interface UIOverlayProps {
  playerState: PlayerState;
  setPlayerState?: React.Dispatch<React.SetStateAction<PlayerState>>;
  setGameState?: (state: GameState) => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ playerState, setPlayerState, setGameState }) => {
  const maxCargo = SHIP_STATS.baseCargo + (playerState.upgrades.cargoCapacityLevel * 2);
  const currentCargo = playerState.scannedItems.length;
  const cargoPercent = (currentCargo / maxCargo) * 100;

  const energyPercent = Math.max(0, (playerState.energy / playerState.maxEnergy) * 100);
  const isDead = playerState.energy <= 0;
  const canAffordRescue = playerState.credits >= TOW_COST;

  const sectorScanPercent = (playerState.sectorProgress / MAX_ASTEROIDS) * 100;

  const handleRescue = () => {
      if (setPlayerState && setGameState && canAffordRescue) {
          setPlayerState(prev => ({
              ...prev,
              credits: prev.credits - TOW_COST,
              energy: prev.maxEnergy,
              // Keep inventory? Risk reward says maybe lose it? 
              // For now, let's keep it but charge the fee. 
              // A tow usually brings you back safely.
          }));
          setGameState(GameState.STATION);
      }
  };

  const handleGameOver = () => {
      if (setGameState) setGameState(GameState.GAME_OVER);
  };

  return (
    <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between font-mono">
      
      {/* Top Center: Sector Progress */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-96 z-10">
         <div className="bg-slate-900/80 border border-teal-800 p-2 px-4 rounded backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-teal-400 mb-1">
                <span className="flex items-center"><Radar className="w-3 h-3 mr-1"/> SECTOR ANALYSIS</span>
                <span className="font-bold">{Math.floor(sectorScanPercent)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.5)] transition-all duration-500"
                  style={{ width: `${sectorScanPercent}%` }}
                ></div>
            </div>
            <div className="text-[10px] text-center text-slate-500 mt-1 uppercase tracking-wider">
               {playerState.sectorProgress} / {MAX_ASTEROIDS} Celestial Bodies Mapped
            </div>
         </div>
      </div>

      {/* Top Left: Status */}
      <div className="flex flex-col space-y-4">
         
         {/* Cargo / Data Buffer */}
         <div className="bg-slate-900/80 border border-teal-500/50 p-4 rounded backdrop-blur-sm w-64">
            <div className="flex items-center justify-between mb-2 text-teal-400">
               <span className="flex items-center font-bold"><Database className="w-4 h-4 mr-2"/> DATA BUFFER</span>
               <span className="text-xs">{currentCargo} / {maxCargo}</span>
            </div>
            {/* Bar */}
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
               <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: `${cargoPercent}%` }}></div>
            </div>
            
            {/* Recent Items */}
            <div className="space-y-1">
               {playerState.scannedItems.slice(-3).reverse().map((item, i) => (
                  <div key={item.id} className="text-xs flex justify-between text-slate-300 animate-in fade-in slide-in-from-left-2 duration-300">
                     <span className="flex items-center">
                        <span className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: MINERAL_RARITY_COLOR[item.type]}}></span>
                        {item.type}
                     </span>
                     <span className="opacity-50">LOGGED</span>
                  </div>
               ))}
               {playerState.scannedItems.length === 0 && <span className="text-xs text-slate-500 italic">Buffer Empty</span>}
            </div>
         </div>

         {/* Energy Gauge */}
         <div className={`bg-slate-900/80 border p-4 rounded backdrop-blur-sm w-64 transition-colors ${isDead ? 'border-red-500 bg-red-950/30' : 'border-yellow-500/50'}`}>
             <div className={`flex items-center justify-between mb-2 ${isDead ? 'text-red-500' : 'text-yellow-400'}`}>
                <span className="flex items-center font-bold"><Battery className="w-4 h-4 mr-2"/> ENERGY CELL</span>
                <span className="text-xs">{Math.floor(playerState.energy)} / {playerState.maxEnergy}</span>
             </div>
             <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${energyPercent < 20 ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`} 
                  style={{ width: `${energyPercent}%` }}
                ></div>
             </div>
             {playerState.energy < 20 && !isDead && (
                 <div className="text-red-500 text-xs mt-2 font-bold animate-pulse">LOW ENERGY - RETURN TO STATION</div>
             )}
         </div>
      </div>

      {/* Top Right: Credits */}
      <div className="absolute top-6 right-6">
         <div className="bg-slate-900/80 border border-orange-500/50 p-2 px-4 rounded backdrop-blur-sm text-right">
             <div className="text-xs text-orange-300">CREDIT BALANCE</div>
             <div className={`text-xl font-bold ${playerState.credits < TOW_COST ? 'text-red-400' : 'text-white'}`}>{playerState.credits.toLocaleString()} CR</div>
         </div>
      </div>

      {/* Center Reticle (Fixed) - Hide if dead */}
      {!isDead && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-50">
            <div className="w-8 h-8 border border-white rounded-full"></div>
            <div className="w-1 h-1 bg-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full"></div>
        </div>
      )}

      {/* Emergency Modal */}
      {isDead && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto bg-slate-950/90 border border-red-500 p-8 rounded-lg shadow-2xl text-center backdrop-blur-md animate-in zoom-in duration-300 min-w-[400px]">
              <TriangleAlert className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
              <h2 className="text-3xl font-bold text-red-500 mb-2">POWER DEPLETED</h2>
              <p className="text-slate-300 mb-6">Life support failing. Systems unresponsive.</p>
              
              <div className="flex flex-col space-y-4">
                  <button 
                    onClick={handleRescue}
                    disabled={!canAffordRescue}
                    className={`p-4 rounded border-2 font-bold flex items-center justify-center transition-all ${
                        canAffordRescue 
                        ? 'border-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400' 
                        : 'border-slate-700 bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                     <Radio className="w-5 h-5 mr-3" />
                     {canAffordRescue ? `TRANSMIT SOS SIGNAL (-${TOW_COST} CR)` : `INSUFFICIENT CREDITS (${TOW_COST} CR)`}
                  </button>

                  {!canAffordRescue && (
                      <button 
                        onClick={handleGameOver}
                        className="p-3 text-red-500 hover:text-red-400 text-sm font-bold border border-transparent hover:border-red-500/30 rounded"
                      >
                          ACCEPT FATE
                      </button>
                  )}
              </div>
          </div>
      )}

      {/* Bottom Left: Controls Helper */}
      <div className="bg-slate-900/50 p-3 rounded text-xs text-slate-400 backdrop-blur-sm">
         <div><span className="text-white font-bold">WASD</span> THRUST (DRAINS POWER)</div>
         <div><span className="text-white font-bold">SHIFT</span> BOOST</div>
         <div><span className="text-white font-bold">L-CLICK</span> SCAN (DRAINS POWER)</div>
         <div><span className="text-white font-bold">E</span> DOCK (RECHARGE)</div>
      </div>
    </div>
  );
};

export default UIOverlay;
