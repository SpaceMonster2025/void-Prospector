
import React from 'react';
import { PlayerState, ScannableObject, MINERAL_RARITY_COLOR } from '../types';
import { SHIP_STATS } from '../constants';
import { Database, Zap, Battery } from 'lucide-react';

interface UIOverlayProps {
  playerState: PlayerState;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ playerState }) => {
  const maxCargo = SHIP_STATS.baseCargo + (playerState.upgrades.cargoCapacityLevel * 2);
  const currentCargo = playerState.scannedItems.length;
  const cargoPercent = (currentCargo / maxCargo) * 100;

  const energyPercent = (playerState.energy / playerState.maxEnergy) * 100;

  return (
    <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between font-mono">
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
         <div className="bg-slate-900/80 border border-yellow-500/50 p-4 rounded backdrop-blur-sm w-64">
             <div className="flex items-center justify-between mb-2 text-yellow-400">
                <span className="flex items-center font-bold"><Battery className="w-4 h-4 mr-2"/> ENERGY CELL</span>
                <span className="text-xs">{Math.floor(playerState.energy)} / {playerState.maxEnergy}</span>
             </div>
             <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${energyPercent < 20 ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`} 
                  style={{ width: `${energyPercent}%` }}
                ></div>
             </div>
             {playerState.energy < SHIP_STATS.scanEnergyCost && (
                 <div className="text-red-500 text-xs mt-2 font-bold animate-pulse">LOW ENERGY - DOCK REQUIRED</div>
             )}
         </div>
      </div>

      {/* Top Right: Credits */}
      <div className="absolute top-6 right-6">
         <div className="bg-slate-900/80 border border-orange-500/50 p-2 px-4 rounded backdrop-blur-sm text-right">
             <div className="text-xs text-orange-300">CREDIT BALANCE</div>
             <div className="text-xl font-bold text-white">{playerState.credits.toLocaleString()} CR</div>
         </div>
      </div>

      {/* Center Reticle (Fixed) */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-50">
          <div className="w-8 h-8 border border-white rounded-full"></div>
          <div className="w-1 h-1 bg-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full"></div>
      </div>

      {/* Bottom Left: Controls Helper */}
      <div className="bg-slate-900/50 p-3 rounded text-xs text-slate-400 backdrop-blur-sm">
         <div><span className="text-white font-bold">WASD</span> THRUST</div>
         <div><span className="text-white font-bold">SHIFT</span> BOOST</div>
         <div><span className="text-white font-bold">L-CLICK</span> SCAN (COSTS ENERGY)</div>
         <div><span className="text-white font-bold">E</span> DOCK (RECHARGE)</div>
      </div>
    </div>
  );
};

export default UIOverlay;
