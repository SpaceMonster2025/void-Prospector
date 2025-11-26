
import React, { useState, useEffect } from 'react';
import GameEngine from './components/GameEngine';
import StationMenu from './components/StationMenu';
import UIOverlay from './components/UIOverlay';
import { GameState, PlayerState } from './types';
import { INITIAL_UPGRADES, SHIP_STATS, SECTOR_BONUS_UNIT, MAX_ASTEROIDS } from './constants';
import { TriangleAlert, RefreshCw, Zap, Medal } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  
  // Persistence could be added here with localStorage
  const [playerState, setPlayerState] = useState<PlayerState>(() => {
     const saved = localStorage.getItem('void_prospector_save');
     if (saved) {
        // Migration logic
        const parsed = JSON.parse(saved);
        if (parsed.energy === undefined) {
            parsed.energy = SHIP_STATS.baseEnergy;
            parsed.maxEnergy = SHIP_STATS.baseEnergy;
            parsed.upgrades.batteryLevel = 1;
        }
        if (parsed.upgrades.solarChargingLevel === undefined) {
            parsed.upgrades.solarChargingLevel = 1;
        }
        if (parsed.sectorLevel === undefined) {
            parsed.sectorLevel = 1;
            parsed.sectorProgress = 0;
        }
        return parsed;
     }
     return {
       credits: 0,
       upgrades: INITIAL_UPGRADES,
       scannedItems: [],
       totalDiscoveries: 0,
       energy: SHIP_STATS.baseEnergy,
       maxEnergy: SHIP_STATS.baseEnergy,
       sectorLevel: 1,
       sectorProgress: 0,
     };
  });

  // Auto-save
  useEffect(() => {
     localStorage.setItem('void_prospector_save', JSON.stringify(playerState));
  }, [playerState]);

  const startGame = () => {
    // Reset energy on new game if dead
    if (playerState.energy <= 0) {
       setPlayerState(prev => ({...prev, energy: prev.maxEnergy}));
    }
    setGameState(GameState.PLAYING);
  };

  const resetGame = () => {
      setPlayerState({
       credits: 0,
       upgrades: INITIAL_UPGRADES,
       scannedItems: [],
       totalDiscoveries: 0,
       energy: SHIP_STATS.baseEnergy,
       maxEnergy: SHIP_STATS.baseEnergy,
       sectorLevel: 1,
       sectorProgress: 0,
      });
      setGameState(GameState.PLAYING);
  };

  const handleNextSector = () => {
      // Calculate Bonus: (Time Required * Objects) approx logic
      // Simplification: We award a massive bonus based on the full clear
      const bonus = SECTOR_BONUS_UNIT * MAX_ASTEROIDS;
      
      setPlayerState(prev => ({
          ...prev,
          credits: prev.credits + bonus,
          sectorLevel: prev.sectorLevel + 1,
          sectorProgress: 0,
          energy: prev.maxEnergy, // Free recharge for winning
      }));
      setGameState(GameState.PLAYING);
  };

  return (
    <div className="relative w-screen h-screen bg-slate-950 overflow-hidden select-none">
      
      {/* Game Layer */}
      <GameEngine 
        gameState={gameState} 
        setGameState={setGameState} 
        playerState={playerState}
        setPlayerState={setPlayerState}
      />

      {/* UI Layer */}
      {gameState === GameState.PLAYING && (
        <UIOverlay 
            playerState={playerState} 
            setPlayerState={setPlayerState}
            setGameState={setGameState}
        />
      )}

      {/* Station Menu */}
      {gameState === GameState.STATION && (
        <StationMenu 
          playerState={playerState} 
          setPlayerState={setPlayerState} 
          setGameState={setGameState}
        />
      )}

      {/* Main Menu */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-center z-50">
           <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-orange-500 mb-4 tracking-tight">
             VOID PROSPECTOR
           </h1>
           <p className="text-slate-400 max-w-md mb-8 text-lg">
             Explore the asteroid belt. Scan rare minerals. Upgrade your drone.
             <br/>
             <span className="text-sm opacity-70 mt-2 block">Don't crash before you upload your data.</span>
           </p>
           
           <button 
             onClick={startGame}
             className="px-8 py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded text-xl shadow-[0_0_20px_rgba(45,212,191,0.5)] transition-all transform hover:scale-105"
           >
             INITIATE LAUNCH SEQUENCE
           </button>
           
           <div className="mt-12 text-slate-600 text-sm">
             Use WASD to Fly • MOUSE to Aim • CLICK to Scan
           </div>
        </div>
      )}

      {/* Sector Cleared Screen */}
      {gameState === GameState.SECTOR_CLEARED && (
          <div className="absolute inset-0 bg-teal-950/90 flex flex-col items-center justify-center text-center z-50 animate-in fade-in duration-500">
             <Medal className="w-24 h-24 text-yellow-400 mb-6 animate-pulse" />
             <h1 className="text-5xl font-bold text-teal-400 mb-2 tracking-widest">SECTOR MAPPED</h1>
             <p className="text-teal-200 text-xl mb-8 max-w-md">
                 100% Analysis Complete. Regional data compiled.
             </p>
             
             <div className="bg-black/50 p-8 rounded-lg mb-8 border border-teal-500/50 shadow-2xl min-w-[300px]">
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-slate-300">
                        <span>Sector Level</span>
                        <span className="text-white font-bold">{playerState.sectorLevel}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                        <span>Objects Scanned</span>
                        <span className="text-white font-bold">{MAX_ASTEROIDS}</span>
                    </div>
                    <div className="h-px bg-slate-700 my-4"></div>
                    <div className="flex justify-between items-center text-yellow-400 text-lg">
                        <span>Completion Bonus</span>
                        <span className="font-bold">{(SECTOR_BONUS_UNIT * MAX_ASTEROIDS).toLocaleString()} CR</span>
                    </div>
                </div>
             </div>

             <button 
                onClick={handleNextSector}
                className="flex items-center px-8 py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded shadow-[0_0_20px_rgba(45,212,191,0.5)] transition-all transform hover:scale-105"
             >
                <Zap className="w-5 h-5 mr-2" /> INITIATE HYPERJUMP
             </button>
             <div className="mt-4 text-slate-500 text-sm">Jumping will generate a new sector map.</div>
          </div>
      )}

      {/* Game Over Screen */}
      {gameState === GameState.GAME_OVER && (
          <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center text-center z-50 animate-in fade-in duration-1000">
             <TriangleAlert className="w-24 h-24 text-red-500 mb-6 animate-pulse" />
             <h1 className="text-5xl font-bold text-red-500 mb-2 tracking-widest">CRITICAL FAILURE</h1>
             <p className="text-red-200 text-xl mb-8 max-w-md">
                 Energy cells depleted. Emergency beacon ignored. Drone lost to the void.
             </p>
             
             <div className="bg-black/50 p-6 rounded mb-8 border border-red-800">
                <div className="text-slate-400 text-sm uppercase">Final Stats</div>
                <div className="text-2xl text-white font-mono">{playerState.totalDiscoveries} Discoveries Logged</div>
             </div>

             <button 
                onClick={resetGame}
                className="flex items-center px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded shadow-lg transition-all"
             >
                <RefreshCw className="w-5 h-5 mr-2" /> REBOOT SYSTEM
             </button>
          </div>
      )}
    </div>
  );
};

export default App;
