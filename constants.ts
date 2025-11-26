
import { Upgrades } from './types';

export const WORLD_RADIUS = 5000;
export const STATION_RADIUS = 300;
export const MAX_ASTEROIDS = 300;
export const TOW_COST = 500;

export const UPGRADE_COSTS = {
  engine: (level: number) => 100 * Math.pow(2, level),
  scannerSpeed: (level: number) => 150 * Math.pow(2, level),
  scannerRange: (level: number) => 200 * Math.pow(2, level),
  cargo: (level: number) => 300 * Math.pow(2, level),
  battery: (level: number) => 250 * Math.pow(2, level),
};

export const INITIAL_UPGRADES: Upgrades = {
  engineLevel: 1,
  scannerSpeedLevel: 1,
  scannerRangeLevel: 1,
  cargoCapacityLevel: 1,
  batteryLevel: 1,
};

export const SHIP_STATS = {
  baseSpeed: 5,
  boostMultiplier: 1.8,
  friction: 0.96,
  rotationSpeed: 0.1,
  baseScanRange: 300,
  baseScanSpeed: 0.5, // percent per second
  baseCargo: 5,
  baseEnergy: 100,
  energyPerLevel: 25,
  
  // Continuous Drain Rates (Energy per frame at 60fps)
  thrustDrain: 0.02, // Reduced from 0.15 (~1.2 energy/sec)
  idleDrain: 0.002,   // Reduced from 0.01 (~0.12 energy/sec)
  scanDrain: 0.1,   // Reduced from 0.25 (~6 energy/sec)
};

// View Settings
export const ZOOM_MIN = 0.4;
export const ZOOM_MAX = 2.5;
export const ZOOM_SENSITIVITY = 0.001;
export const MINIMAP_SIZE = 180;
export const MINIMAP_MARGIN = 20;

// Colors
export const COLORS = {
  background: '#0f172a', // slate-900
  grid: '#1e293b', // slate-800
  station: '#f97316', // orange-500
  hud: '#2dd4bf', // teal-400
  hudText: '#ccfbf1', // teal-100
  scanner: 'rgba(45, 212, 191, 0.2)', // teal-400 with opacity
  scannerActive: 'rgba(249, 115, 22, 0.3)', // orange-500 with opacity
  asteroidUnscanned: '#4c1d95', // violet-900 (Dark Purple)
};
