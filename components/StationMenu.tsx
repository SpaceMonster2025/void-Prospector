
import React from 'react';
import { PlayerState, GameState, MINERAL_VALUES, MINERAL_RARITY_COLOR } from '../types';
import { UPGRADE_COSTS, INITIAL_UPGRADES, SHIP_STATS } from '../constants';
import { Rocket, ScanEye, Database, Zap, HardDrive, LogOut, Battery } from 'lucide-react';

interface StationMenuProps {
  playerState: PlayerState;
  setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
  setGameState: (state: GameState) => void;
}

const StationMenu: React.FC<StationMenuProps> = ({ playerState, setPlayerState, setGameState }) => {
  
  const sellAll = () => {
    let totalValue = 0;
    playerState.scannedItems.forEach(item => {
      totalValue += MINERAL_VALUES[item.type];
    });

    setPlayerState(prev => ({
      ...prev,
      credits: prev.credits + totalValue,
      scannedItems: []
    }));
  };

  const buyUpgrade = (type: keyof typeof INITIAL_UPGRADES) => {
    const currentLevel = playerState.upgrades[type];
    
    // Map the string key to the function
    const costFunc = type === 'engineLevel' ? UPGRADE_COSTS.engine : 
                     type === 'scannerSpeedLevel' ? UPGRADE_COSTS.scannerSpeed :
                     type === 'scannerRangeLevel' ? UPGRADE_COSTS.scannerRange :
                     type === 'batteryLevel' ? UPGRADE_COSTS.battery :
                     UPGRADE_COSTS.cargo;

    const cost = costFunc(currentLevel);

    if (playerState.credits >= cost) {
      setPlayerState(prev => {
        const newState = {
            ...prev,
            credits: prev.credits - cost,
            upgrades: {
            ...prev.upgrades,
            [type]: currentLevel + 1
            }
        };
        
        // Apply battery boost immediately if buying battery
        if (type === 'batteryLevel') {
            newState.maxEnergy = SHIP_STATS.baseEnergy + ((currentLevel) * SHIP_STATS.energyPerLevel);
            newState.energy = newState.maxEnergy; // Refill on upgrade
        }

        return newState;
      });
    }
  };

  const getUpgradeCost = (type: keyof typeof INITIAL_UPGRADES) => {
    const lvl = playerState.upgrades[type];
    if (type === 'engineLevel') return UPGRADE_COSTS.engine(lvl);
    if (type === 'scannerSpeedLevel') return UPGRADE_COSTS.scannerSpeed(lvl);
    if (type === 'scannerRangeLevel') return UPGRADE_COSTS.scannerRange(lvl);
    if (type === 'batteryLevel') return UPGRADE_COSTS.battery(lvl);
    return UPGRADE_COSTS.cargo(lvl);
  };

  return (
    <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-8 text-slate-100 font-mono">
      <div className="w-full max-w-5xl bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        
        {/* Header */}
        <header className="bg-slate-950 p-6 flex justify-between items-center border-b border-slate-700">
          <div>
            <h1 className="text-3xl font-bold text-orange-500 tracking-wider">ORBITAL STATION 7</h1>
            <p className="text-slate-400 text-sm">Docking Bay: SECURE</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-teal-400">{playerState.credits.toLocaleString()} CR</div>
            <div className="text-xs text-slate-500">CURRENT BALANCE</div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Scan Log / Sell */}
          <div className="w-1/2 p-6 border-r border-slate-700 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 flex items-center text-teal-300">
              <Database className="w-5 h-5 mr-2" /> SCAN BUFFER
            </h2>
            
            {playerState.scannedItems.length === 0 ? (
              <div className="text-slate-500 italic py-10 text-center border-2 border-dashed border-slate-700 rounded">
                No new scan data found.
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {playerState.scannedItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-700/50 p-3 rounded border border-slate-700">
                    <div className="flex items-center">
                       <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: MINERAL_RARITY_COLOR[item.type] }}></div>
                       <span>{item.type}</span>
                    </div>
                    <span className="font-bold text-teal-400">+{MINERAL_VALUES[item.type]} CR</span>
                  </div>
                ))}
              </div>
            )}
            
            {playerState.scannedItems.length > 0 && (
              <button 
                onClick={sellAll}
                className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded shadow-lg transition-colors flex justify-center items-center"
              >
                 UPLOAD DATA & CLAIM REWARDS
              </button>
            )}
            
            <div className="mt-8">
                <h3 className="text-lg font-bold text-slate-400 mb-2">Pilot Statistics</h3>
                <div className="bg-slate-900 p-4 rounded text-sm space-y-2">
                    <div className="flex justify-between"><span>Total Discoveries:</span> <span className="text-white">{playerState.totalDiscoveries}</span></div>
                    <div className="flex justify-between"><span>Clearance Level:</span> <span className="text-white">Alpha</span></div>
                    <div className="flex justify-between"><span>Max Energy:</span> <span className="text-yellow-400">{playerState.maxEnergy}</span></div>
                </div>
            </div>
          </div>

          {/* Right Panel: Upgrades */}
          <div className="w-1/2 p-6 bg-slate-800/50 overflow-y-auto">
             <h2 className="text-xl font-bold mb-4 flex items-center text-orange-300">
              <Zap className="w-5 h-5 mr-2" /> DRONE UPGRADES
            </h2>
            
            <div className="grid grid-cols-1 gap-4">
                {/* Engine */}
                <UpgradeCard 
                  title="Ion Thrusters" 
                  level={playerState.upgrades.engineLevel}
                  cost={getUpgradeCost('engineLevel')}
                  icon={<Rocket className="w-6 h-6 text-orange-500"/>}
                  canAfford={playerState.credits >= getUpgradeCost('engineLevel')}
                  onBuy={() => buyUpgrade('engineLevel')}
                  description="Increases flight speed and boost efficiency."
                />
                
                {/* Scanner Speed */}
                <UpgradeCard 
                  title="Analysis Cores" 
                  level={playerState.upgrades.scannerSpeedLevel}
                  cost={getUpgradeCost('scannerSpeedLevel')}
                  icon={<ScanEye className="w-6 h-6 text-teal-500"/>}
                  canAfford={playerState.credits >= getUpgradeCost('scannerSpeedLevel')}
                  onBuy={() => buyUpgrade('scannerSpeedLevel')}
                  description="Reduces time required to lock onto a target."
                />

                {/* Battery */}
                <UpgradeCard 
                  title="Energy Cells" 
                  level={playerState.upgrades.batteryLevel}
                  cost={getUpgradeCost('batteryLevel')}
                  icon={<Battery className="w-6 h-6 text-yellow-500"/>}
                  canAfford={playerState.credits >= getUpgradeCost('batteryLevel')}
                  onBuy={() => buyUpgrade('batteryLevel')}
                  description="Increases energy capacity, allowing for more scans per trip."
                />

                {/* Scanner Range */}
                <UpgradeCard 
                  title="Long-Range Sensors" 
                  level={playerState.upgrades.scannerRangeLevel}
                  cost={getUpgradeCost('scannerRangeLevel')}
                  icon={<Zap className="w-6 h-6 text-purple-500"/>}
                  canAfford={playerState.credits >= getUpgradeCost('scannerRangeLevel')}
                  onBuy={() => buyUpgrade('scannerRangeLevel')}
                  description="Increases maximum distance for scanning."
                />

                {/* Cargo */}
                <UpgradeCard 
                  title="Data Banks" 
                  level={playerState.upgrades.cargoCapacityLevel}
                  cost={getUpgradeCost('cargoCapacityLevel')}
                  icon={<HardDrive className="w-6 h-6 text-blue-500"/>}
                  canAfford={playerState.credits >= getUpgradeCost('cargoCapacityLevel')}
                  onBuy={() => buyUpgrade('cargoCapacityLevel')}
                  description="Increases buffer capacity for scan data."
                />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-slate-950 p-4 border-t border-slate-700 flex justify-end">
           <div className="mr-auto self-center text-slate-500 text-sm">Energy Recharged. Systems Nominal.</div>
           <button 
             onClick={() => setGameState(GameState.PLAYING)}
             className="px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded flex items-center"
           >
             <LogOut className="w-5 h-5 mr-2" /> LAUNCH DRONE
           </button>
        </footer>

      </div>
    </div>
  );
};

interface UpgradeCardProps {
  title: string;
  level: number;
  cost: number;
  icon: React.ReactNode;
  canAfford: boolean;
  onBuy: () => void;
  description: string;
}

const UpgradeCard: React.FC<UpgradeCardProps> = ({ title, level, cost, icon, canAfford, onBuy, description }) => (
  <div className="bg-slate-700 p-4 rounded flex items-center justify-between border border-slate-600">
     <div className="flex items-start space-x-4">
        <div className="p-3 bg-slate-800 rounded">{icon}</div>
        <div>
           <h3 className="font-bold text-white">{title} <span className="text-xs bg-slate-600 px-1 rounded text-slate-300 ml-2">LVL {level}</span></h3>
           <p className="text-xs text-slate-400 mt-1 max-w-[200px]">{description}</p>
        </div>
     </div>
     <div className="text-right">
        <div className="text-teal-400 font-bold mb-1">{cost} CR</div>
        <button 
           onClick={onBuy}
           disabled={!canAfford}
           className={`px-3 py-1 text-sm font-bold rounded ${canAfford ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'bg-slate-600 text-slate-400 cursor-not-allowed'}`}
        >
           UPGRADE
        </button>
     </div>
  </div>
);

export default StationMenu;
