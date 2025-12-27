import * as THREE from 'three';

// Game States
export enum GameState {
  LOADING = 'LOADING',
  MAIN_MENU = 'MAIN_MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE'
}

// Enemy States
export enum EnemyState {
  IDLE = 'IDLE',
  PATROL = 'PATROL',
  ALERT = 'ALERT',
  CHASE = 'CHASE',
  ATTACK = 'ATTACK',
  DEAD = 'DEAD'
}

// Enemy Types
export enum EnemyType {
  BASIC = 'BASIC',
  FAST = 'FAST',
  BOSS = 'BOSS'
}

// Pickup Types
export enum PickupType {
  HEALTH = 'HEALTH',
  AMMO = 'AMMO'
}

// Player Configuration
export interface PlayerConfig {
  health: number;
  maxHealth: number;
  speed: number;
  lookSensitivity: number;
  height: number;
}

// Weapon Configuration
export interface WeaponConfig {
  name: string;
  damage: number;
  fireRate: number;
  magazineSize: number;
  reloadTime: number;
  range: number;
  spread: number;
}

// Enemy Configuration
export interface EnemyConfig {
  type: EnemyType;
  health: number;
  speed: number;
  damage: number;
  attackRange: number;
  detectionRange: number;
  attackCooldown: number;
}

// Level Configuration
export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  enemySpawns: EnemySpawn[];
  pickupSpawns: PickupSpawn[];
  playerSpawn: THREE.Vector3;
  ambientColor: number;
  fogColor: number;
  fogDensity: number;
}

// Spawn Point
export interface EnemySpawn {
  position: THREE.Vector3;
  type: EnemyType;
  wave: number;
}

export interface PickupSpawn {
  position: THREE.Vector3;
  type: PickupType;
  respawnTime?: number;
}

// Entity Interface
export interface Entity {
  mesh: THREE.Object3D;
  update(delta: number): void;
  dispose(): void;
}

// Damageable Interface
export interface Damageable {
  health: number;
  maxHealth: number;
  takeDamage(amount: number): void;
  isDead(): boolean;
}

// Audio Types
export interface SoundConfig {
  id: string;
  src: string;
  volume: number;
  loop: boolean;
}

// Input State
export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  shoot: boolean;
  reload: boolean;
  pause: boolean;
  mouseMovement: { x: number; y: number };
}

// Game Stats
export interface GameStats {
  score: number;
  kills: number;
  accuracy: number;
  shotsFired: number;
  shotsHit: number;
  timeElapsed: number;
  currentLevel: number;
}

// Collision Layers
export const CollisionLayers = {
  PLAYER: 1,
  ENEMY: 2,
  ENVIRONMENT: 4,
  PROJECTILE: 8,
  PICKUP: 16
} as const;

// Color Palette
export const ColorPalette = {
  PRIMARY: 0x4A90D9,    // Blue (player elements)
  SECONDARY: 0xE74C3C,  // Red (enemies, danger)
  ACCENT: 0x2ECC71,     // Green (health, safe)
  NEUTRAL: 0x95A5A6,    // Gray (environment)
  DARK: 0x2C3E50,       // Dark blue (shadows)
  LIGHT: 0xECF0F1,      // Off-white (highlights)
  FLOOR: 0x3D5A80,      // Floor color
  WALL: 0x4A5568        // Wall color
} as const;

// Game Constants
export const GAME_CONSTANTS = {
  PLAYER: {
    DEFAULT_HEALTH: 100,
    DEFAULT_SPEED: 8,
    LOOK_SENSITIVITY: 0.0025,
    HEIGHT: 1.8,
    COLLISION_RADIUS: 0.5
  },
  WEAPON: {
    RIFLE_DAMAGE: 25,
    RIFLE_FIRE_RATE: 0.33,
    RIFLE_MAGAZINE: 30,
    RIFLE_RELOAD_TIME: 2,
    RIFLE_RANGE: 100,
    RIFLE_SPREAD: 0.02
  },
  ENEMY: {
    BASIC: {
      HEALTH: 30,
      SPEED: 3,
      DAMAGE: 10,
      ATTACK_RANGE: 2,
      DETECTION_RANGE: 20,
      ATTACK_COOLDOWN: 1.5
    },
    FAST: {
      HEALTH: 20,
      SPEED: 6,
      DAMAGE: 5,
      ATTACK_RANGE: 1.5,
      DETECTION_RANGE: 25,
      ATTACK_COOLDOWN: 0.8
    },
    BOSS: {
      HEALTH: 200,
      SPEED: 4,
      DAMAGE: 25,
      ATTACK_RANGE: 3,
      DETECTION_RANGE: 30,
      ATTACK_COOLDOWN: 2
    }
  },
  PICKUP: {
    HEALTH_AMOUNT: 25,
    AMMO_AMOUNT: 15,
    RESPAWN_TIME: 30
  }
} as const;
