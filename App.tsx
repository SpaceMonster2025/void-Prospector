import React, { useState, useEffect } from 'react';
import GameEngine from './components/GameEngine';
import StationMenu from './components/StationMenu';
import UIOverlay from './components/UIOverlay';
import { GameState, PlayerState } from './types';
import { INITIAL_UPGRADES } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  
  // Persistence could be added here with localStorage
  const [playerState, setPlayerState] = useState<PlayerState>(() => {
     const saved = localStorage.getItem('void_prospector_save');
     if (saved) {
        return JSON.parse(saved);
     }
     return {
       credits: 0,
       upgrades: INITIAL_UPGRADES,
       scannedItems: [],
       totalDiscoveries: 0,
     };
  });

  // Auto-save
  useEffect(() => {
     localStorage.setItem('void_prospector_save', JSON.stringify(playerState));
  }, [playerState]);

  const startGame = () => {
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
        <UIOverlay playerState={playerState} />
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
    </div>
  );
};

export default App;