import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, PlayerState, ScannableObject, Vector2, MineralType, MINERAL_RARITY_COLOR, Particle } from '../types';
import { WORLD_RADIUS, STATION_RADIUS, MAX_ASTEROIDS, SHIP_STATS, COLORS, INITIAL_UPGRADES, ZOOM_MIN, ZOOM_MAX, ZOOM_SENSITIVITY, MINIMAP_SIZE, MINIMAP_MARGIN } from '../constants';
import * as Vec from '../utils/math';

interface GameEngineProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  playerState: PlayerState;
  setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
}

const GameEngine: React.FC<GameEngineProps> = ({ gameState, setGameState, playerState, setPlayerState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game Logic State (Refs for performance)
  const shipPos = useRef<Vector2>({ x: 0, y: 0 }); // Start at station
  const shipVel = useRef<Vector2>({ x: 0, y: 0 });
  const shipAngle = useRef<number>(0);
  const camPos = useRef<Vector2>({ x: 0, y: 0 }); // Center of the camera in world space
  const zoomLevel = useRef<number>(1.0);
  const targetZoom = useRef<number>(1.0);
  const asteroids = useRef<ScannableObject[]>([]);
  const particles = useRef<Particle[]>([]);
  
  // Inputs
  const keys = useRef<Set<string>>(new Set());
  const mousePos = useRef<Vector2>({ x: 0, y: 0 });
  const isMouseDown = useRef<boolean>(false);
  
  // Scanning State
  const scanTarget = useRef<ScannableObject | null>(null);
  const scanProgress = useRef<number>(0);

  // Helper to init world
  const initWorld = useCallback(() => {
    shipPos.current = { x: 0, y: 0 };
    shipVel.current = { x: 0, y: 0 };
    shipAngle.current = 0;
    particles.current = [];
    
    // Generate Asteroids
    const newAsteroids: ScannableObject[] = [];
    for (let i = 0; i < MAX_ASTEROIDS; i++) {
      // Distribution: Dense in middle, sparse in outer
      const angle = Math.random() * Math.PI * 2;
      const dist = Vec.randomRange(STATION_RADIUS + 200, WORLD_RADIUS);
      const pos = {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
      };

      // Determine Type based on distance
      let type = MineralType.IRON;
      const normalizedDist = dist / WORLD_RADIUS;
      const rand = Math.random();

      if (normalizedDist > 0.8) {
         if (rand > 0.9) type = MineralType.ARTIFACT;
         else if (rand > 0.7) type = MineralType.PSIONIC_CRYSTAL;
         else type = MineralType.NEUTRONIUM;
      } else if (normalizedDist > 0.4) {
         if (rand > 0.8) type = MineralType.IRIDIUM;
         else if (rand > 0.5) type = MineralType.GOLD;
         else type = MineralType.COBALT;
      } else {
         if (rand > 0.7) type = MineralType.SILICON;
         else if (rand > 0.4) type = MineralType.NICKEL;
         else type = MineralType.IRON;
      }

      const radius = Vec.randomRange(20, 60);
      newAsteroids.push({
        id: `ast_${i}`,
        position: pos,
        radius,
        type,
        value: 0, // Value handled by types, stored here if variable
        scanned: false,
        vertices: Vec.generatePolygon(radius, Math.floor(Vec.randomRange(5, 9))),
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: Vec.randomRange(-0.02, 0.02),
      });
    }
    asteroids.current = newAsteroids;
  }, []);

  // Initialization
  useEffect(() => {
    initWorld();
  }, [initWorld]);

  // Input Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keys.current.add(e.code);
    const handleKeyUp = (e: KeyboardEvent) => keys.current.delete(e.code);
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseDown = () => { isMouseDown.current = true; };
    const handleMouseUp = () => { isMouseDown.current = false; };
    const handleWheel = (e: WheelEvent) => {
      // Zoom logic
      const delta = -e.deltaY * ZOOM_SENSITIVITY;
      targetZoom.current = Math.min(Math.max(targetZoom.current + delta, ZOOM_MIN), ZOOM_MAX);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      if (gameState !== GameState.PLAYING) {
         if (gameState === GameState.MENU) return; 
      }

      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      // UPDATE ZOOM
      zoomLevel.current += (targetZoom.current - zoomLevel.current) * 0.1;

      // PHYSICS UPDATE ----------------------------
      if (gameState === GameState.PLAYING) {
        // Thrust
        const acc = { x: 0, y: 0 };
        const thrustPower = SHIP_STATS.baseSpeed * (0.1 + (playerState.upgrades.engineLevel * 0.02));
        if (keys.current.has('KeyW') || keys.current.has('ArrowUp')) acc.y -= 1;
        if (keys.current.has('KeyS') || keys.current.has('ArrowDown')) acc.y += 1;
        if (keys.current.has('KeyA') || keys.current.has('ArrowLeft')) acc.x -= 1;
        if (keys.current.has('KeyD') || keys.current.has('ArrowRight')) acc.x += 1;

        const isBoosting = keys.current.has('ShiftLeft');
        const finalThrust = isBoosting ? thrustPower * SHIP_STATS.boostMultiplier : thrustPower;

        if (acc.x !== 0 || acc.y !== 0) {
          const normAcc = Vec.normalize(acc);
          shipVel.current = Vec.add(shipVel.current, Vec.mult(normAcc, finalThrust * 0.1));
          
          // Spawn thruster particles
          if (Math.random() > 0.5) {
             const angle = Math.atan2(shipVel.current.y, shipVel.current.x) + Math.PI;
             particles.current.push({
               id: Math.random().toString(),
               position: Vec.add(shipPos.current, {x: Math.cos(angle)*10, y: Math.sin(angle)*10}),
               velocity: Vec.add(shipVel.current, {x: (Math.random()-0.5)*2, y: (Math.random()-0.5)*2}),
               life: 1.0,
               maxLife: 1.0,
               color: '#f97316',
               size: Math.random() * 3 + 1
             });
          }
        }

        // Friction
        shipVel.current = Vec.mult(shipVel.current, SHIP_STATS.friction);
        shipPos.current = Vec.add(shipPos.current, shipVel.current);

        // Station Docking Check
        const distToStation = Vec.mag(shipPos.current);
        if (distToStation < STATION_RADIUS + 50 && Vec.mag(shipVel.current) < 2) {
           if (keys.current.has('KeyE')) {
             setGameState(GameState.STATION);
             shipVel.current = {x:0, y:0};
             shipPos.current = {x:0, y: STATION_RADIUS - 50};
           }
        }
      }
      
      // CAMERA UPDATE (Lerp to ship position)
      const targetCamX = shipPos.current.x;
      const targetCamY = shipPos.current.y;
      camPos.current.x += (targetCamX - camPos.current.x) * 0.1;
      camPos.current.y += (targetCamY - camPos.current.y) * 0.1;

      // ANGLE CALCULATION (Must account for Zoom and Camera Pos)
      // Calculate Ship's screen position
      const shipScreenX = (shipPos.current.x - camPos.current.x) * zoomLevel.current + width / 2;
      const shipScreenY = (shipPos.current.y - camPos.current.y) * zoomLevel.current + height / 2;
      
      const dx = mousePos.current.x - shipScreenX;
      const dy = mousePos.current.y - shipScreenY;
      shipAngle.current = Math.atan2(dy, dx);


      // SCANNING LOGIC (Depends on Physics & Angles)
      if (gameState === GameState.PLAYING) {
        let foundTarget = false;
        const scanRange = SHIP_STATS.baseScanRange * (1 + playerState.upgrades.scannerRangeLevel * 0.2);
        const scanSpeed = SHIP_STATS.baseScanSpeed * (1 + playerState.upgrades.scannerSpeedLevel * 0.2);
        const mouseDir = Vec.normalize({ x: dx, y: dy });
        
        for (const ast of asteroids.current) {
          ast.rotation += ast.rotationSpeed; // Always rotate
          if (ast.scanned) continue;

          const distToAst = Vec.dist(shipPos.current, ast.position);
          if (distToAst < scanRange) {
             const dirToAst = Vec.normalize(Vec.sub(ast.position, shipPos.current));
             const dot = mouseDir.x * dirToAst.x + mouseDir.y * dirToAst.y;
             if (dot > 0.95) {
                foundTarget = true;
                if (scanTarget.current?.id !== ast.id) {
                   scanTarget.current = ast;
                   scanProgress.current = 0;
                }
                
                if (isMouseDown.current) {
                   const maxCargo = SHIP_STATS.baseCargo + (playerState.upgrades.cargoCapacityLevel * 2);
                   if (playerState.scannedItems.length < maxCargo) {
                     scanProgress.current += 0.016 * 60 * (scanSpeed / 100);
                     if (scanProgress.current >= 1) {
                        ast.scanned = true;
                        setPlayerState(prev => ({
                           ...prev,
                           scannedItems: [...prev.scannedItems, ast],
                           totalDiscoveries: prev.totalDiscoveries + 1
                        }));
                        scanTarget.current = null;
                        scanProgress.current = 0;
                        for(let k=0; k<10; k++) {
                           particles.current.push({
                              id: Math.random().toString(),
                              position: ast.position,
                              velocity: {x: (Math.random()-0.5)*5, y: (Math.random()-0.5)*5},
                              life: 1, maxLife: 1, color: '#2dd4bf', size: 3
                           });
                        }
                     }
                   }
                } else {
                   scanProgress.current = Math.max(0, scanProgress.current - 0.05);
                }
                break; 
             }
          }
        }
        if (!foundTarget) {
          scanTarget.current = null;
          scanProgress.current = 0;
        }

        particles.current.forEach(p => {
           p.position = Vec.add(p.position, p.velocity);
           p.life -= 0.02;
        });
        particles.current = particles.current.filter(p => p.life > 0);
      }


      // RENDERING ---------------------------------
      // Clear
      ctx.fillStyle = COLORS.background;
      ctx.fillRect(0, 0, width, height);
      
      ctx.save();
      // 1. Center view
      ctx.translate(width / 2, height / 2);
      // 2. Apply Zoom
      ctx.scale(zoomLevel.current, zoomLevel.current);
      // 3. Move camera to world position
      ctx.translate(-camPos.current.x, -camPos.current.y);

      // Grid / Starfield (Parallax simple)
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 1;
      const gridSize = 200;
      // We need to calculate grid start based on camera pos
      // The grid should appear fixed in world space
      const startX = Math.floor((camPos.current.x - (width/2)/zoomLevel.current) / gridSize) * gridSize;
      const endX = Math.ceil((camPos.current.x + (width/2)/zoomLevel.current) / gridSize) * gridSize;
      const startY = Math.floor((camPos.current.y - (height/2)/zoomLevel.current) / gridSize) * gridSize;
      const endY = Math.ceil((camPos.current.y + (height/2)/zoomLevel.current) / gridSize) * gridSize;

      ctx.beginPath();
      for (let x = startX; x <= endX; x += gridSize) {
         ctx.moveTo(x, startY); ctx.lineTo(x, endY);
      }
      for (let y = startY; y <= endY; y += gridSize) {
         ctx.moveTo(startX, y); ctx.lineTo(endX, y);
      }
      ctx.globalAlpha = 0.2;
      ctx.stroke();
      ctx.globalAlpha = 1.0;

      // Draw World Bounds
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, WORLD_RADIUS, 0, Math.PI * 2);
      ctx.stroke();

      // Draw Station
      ctx.fillStyle = COLORS.station;
      ctx.beginPath();
      ctx.arc(0, 0, STATION_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      // Station Details
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, STATION_RADIUS * 0.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-STATION_RADIUS, 0); ctx.lineTo(STATION_RADIUS, 0);
      ctx.moveTo(0, -STATION_RADIUS); ctx.lineTo(0, STATION_RADIUS);
      ctx.stroke();

      // Draw Asteroids
      // Viewport culling bounds in world space
      const viewL = camPos.current.x - (width/2)/zoomLevel.current - 100;
      const viewR = camPos.current.x + (width/2)/zoomLevel.current + 100;
      const viewT = camPos.current.y - (height/2)/zoomLevel.current - 100;
      const viewB = camPos.current.y + (height/2)/zoomLevel.current + 100;

      asteroids.current.forEach(ast => {
         // Simple Culling
         if (ast.position.x < viewL || ast.position.x > viewR) return;
         if (ast.position.y < viewT || ast.position.y > viewB) return;

         ctx.save();
         ctx.translate(ast.position.x, ast.position.y);
         ctx.rotate(ast.rotation);
         
         ctx.fillStyle = ast.scanned ? '#334155' : MINERAL_RARITY_COLOR[ast.type];
         ctx.strokeStyle = ast.scanned ? '#2dd4bf' : '#000000';
         ctx.lineWidth = 2;

         ctx.beginPath();
         if (ast.vertices.length > 0) {
            ctx.moveTo(ast.vertices[0].x, ast.vertices[0].y);
            for (let i = 1; i < ast.vertices.length; i++) {
               ctx.lineTo(ast.vertices[i].x, ast.vertices[i].y);
            }
         }
         ctx.closePath();
         ctx.fill();
         ctx.stroke();
         
         if (ast.scanned) {
            ctx.fillStyle = '#2dd4bf';
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
         }
         
         ctx.restore();
      });

      // Draw Particles
      particles.current.forEach(p => {
         ctx.fillStyle = p.color;
         ctx.globalAlpha = p.life;
         ctx.beginPath();
         ctx.arc(p.position.x, p.position.y, p.size, 0, Math.PI*2);
         ctx.fill();
         ctx.globalAlpha = 1.0;
      });

      // Draw Drone
      ctx.save();
      ctx.translate(shipPos.current.x, shipPos.current.y);
      ctx.rotate(shipAngle.current);
      
      // Drone Body
      ctx.fillStyle = '#e2e8f0'; // slate-200
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Dome/Eye
      ctx.fillStyle = '#0ea5e9'; // sky-500
      ctx.beginPath();
      ctx.arc(8, 0, 8, 0, Math.PI * 2);
      ctx.fill();

      // Engine Glow
      if (keys.current.has('KeyW') || keys.current.has('ArrowUp')) {
         ctx.fillStyle = '#f97316';
         ctx.beginPath();
         ctx.moveTo(-20, -5);
         ctx.lineTo(-35, 0);
         ctx.lineTo(-20, 5);
         ctx.fill();
      }
      ctx.restore();
      
      // Draw Scan FX
      if (scanTarget.current && !scanTarget.current.scanned) {
         ctx.save();
         ctx.translate(shipPos.current.x, shipPos.current.y);
         ctx.rotate(shipAngle.current);
         ctx.fillStyle = COLORS.scanner;
         ctx.beginPath();
         ctx.moveTo(0, 0);
         ctx.arc(0, 0, Vec.dist(shipPos.current, scanTarget.current.position), -0.2, 0.2);
         ctx.fill();
         ctx.restore();
         
         const t = scanTarget.current;
         ctx.strokeStyle = COLORS.hud;
         ctx.lineWidth = 4;
         ctx.beginPath();
         ctx.arc(t.position.x, t.position.y, t.radius + 15, -Math.PI/2, (-Math.PI/2) + (Math.PI * 2 * scanProgress.current));
         ctx.stroke();
      }

      ctx.restore(); // END WORLD CAMERA ------------------

      // MINIMAP RENDER (UI Space)
      const mmX = width - MINIMAP_SIZE - MINIMAP_MARGIN;
      const mmY = height - MINIMAP_SIZE - MINIMAP_MARGIN;
      // Map scale covers world radius + some padding
      const mapWorldScale = MINIMAP_SIZE / (WORLD_RADIUS * 2.2);

      ctx.save();
      ctx.translate(mmX, mmY);

      // Background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);
      ctx.strokeStyle = '#334155';
      ctx.strokeRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

      // Clip mask
      ctx.beginPath();
      ctx.rect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);
      ctx.clip();

      // Center Minimap Origin (0,0 world is center of minimap)
      ctx.translate(MINIMAP_SIZE / 2, MINIMAP_SIZE / 2);

      // Draw Station (Center)
      ctx.fillStyle = COLORS.station;
      ctx.beginPath();
      ctx.arc(0, 0, STATION_RADIUS * mapWorldScale, 0, Math.PI*2);
      ctx.fill();

      // Draw Asteroids (Dots)
      // Optimization: Only draw close ones? Or all? 300 is cheap for dots.
      asteroids.current.forEach(ast => {
        // Simple culling for minimap (if outside world bounds)
        // Draw scanned as bright teal, unscanned as dim slate
        ctx.fillStyle = ast.scanned ? '#2dd4bf' : '#475569'; 
        ctx.beginPath();
        // Scale down dot, but keep min size 1.5
        const rad = Math.max(1.5, ast.radius * mapWorldScale);
        ctx.arc(ast.position.x * mapWorldScale, ast.position.y * mapWorldScale, rad, 0, Math.PI*2);
        ctx.fill();
      });

      // Draw Player
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(shipPos.current.x * mapWorldScale, shipPos.current.y * mapWorldScale, 3, 0, Math.PI*2);
      ctx.fill();

      // Draw Viewport Rect (What the camera sees)
      const visibleW = width / zoomLevel.current;
      const visibleH = height / zoomLevel.current;
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(
          (camPos.current.x - visibleW/2) * mapWorldScale,
          (camPos.current.y - visibleH/2) * mapWorldScale,
          visibleW * mapWorldScale,
          visibleH * mapWorldScale
      );

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, playerState.upgrades, playerState.scannedItems]);

  const distToStation = Vec.mag(shipPos.current);
  const showDockPrompt = distToStation < STATION_RADIUS + 50 && gameState === GameState.PLAYING;

  return (
    <>
      <canvas ref={canvasRef} className="block w-full h-full" />
      {showDockPrompt && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white bg-black/70 px-6 py-3 rounded border border-orange-500 animate-pulse text-xl font-mono pointer-events-none">
          PRESS 'E' TO DOCK
        </div>
      )}
    </>
  );
};

export default GameEngine;