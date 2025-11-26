
export type Vector2 = { x: number; y: number };

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  STATION = 'STATION',
  GAME_OVER = 'GAME_OVER',
}

export enum MineralType {
  IRON = 'Iron',
  NICKEL = 'Nickel',
  SILICON = 'Silicon',
  COBALT = 'Cobalt',
  GOLD = 'Gold',
  IRIDIUM = 'Iridium',
  NEUTRONIUM = 'Neutronium',
  PSIONIC_CRYSTAL = 'Psionic Crystal',
  ARTIFACT = 'Alien Artifact',
}

export interface ScannableObject {
  id: string;
  position: Vector2;
  radius: number;
  type: MineralType;
  value: number;
  scanned: boolean;
  vertices: Vector2[]; // For polygon rendering
  rotation: number;
  rotationSpeed: number;
}

export interface PlayerState {
  credits: number;
  energy: number;
  maxEnergy: number;
  upgrades: Upgrades;
  scannedItems: ScannableObject[]; // Items currently in buffer (risk)
  totalDiscoveries: number;
}

export interface Upgrades {
  engineLevel: number;
  scannerSpeedLevel: number;
  scannerRangeLevel: number;
  cargoCapacityLevel: number;
  batteryLevel: number;
}

export interface Particle {
  id: string;
  position: Vector2;
  velocity: Vector2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export const MINERAL_VALUES: Record<MineralType, number> = {
  [MineralType.IRON]: 10,
  [MineralType.NICKEL]: 15,
  [MineralType.SILICON]: 20,
  [MineralType.COBALT]: 50,
  [MineralType.GOLD]: 100,
  [MineralType.IRIDIUM]: 250,
  [MineralType.NEUTRONIUM]: 500,
  [MineralType.PSIONIC_CRYSTAL]: 1000,
  [MineralType.ARTIFACT]: 5000,
};

export const MINERAL_RARITY_COLOR: Record<MineralType, string> = {
  [MineralType.IRON]: '#94a3b8', // slate-400
  [MineralType.NICKEL]: '#cbd5e1', // slate-300
  [MineralType.SILICON]: '#64748b', // slate-500
  [MineralType.COBALT]: '#3b82f6', // blue-500
  [MineralType.GOLD]: '#eab308', // yellow-500
  [MineralType.IRIDIUM]: '#a855f7', // purple-500
  [MineralType.NEUTRONIUM]: '#ec4899', // pink-500
  [MineralType.PSIONIC_CRYSTAL]: '#06b6d4', // cyan-500
  [MineralType.ARTIFACT]: '#f43f5e', // rose-500
};
