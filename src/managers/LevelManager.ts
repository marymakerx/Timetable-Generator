import * as THREE from 'three';
import { Game } from '../core/Game';
import { Enemy } from '../entities/Enemy';
import { BasicEnemy } from '../entities/EnemyTypes/BasicEnemy';
import { FastEnemy } from '../entities/EnemyTypes/FastEnemy';
import { BossEnemy } from '../entities/EnemyTypes/BossEnemy';
import { Pickup } from '../entities/Pickup';
import { EnemyType, PickupType, ColorPalette, LevelConfig, EnemySpawn, PickupSpawn } from '../types';

export class LevelManager {
  private game: Game;
  private currentLevel: number = 0;
  private enemies: Enemy[] = [];
  private pickups: Pickup[] = [];
  private levelObjects: THREE.Object3D[] = [];
  private playerSpawn: THREE.Vector3 = new THREE.Vector3(0, 1.8, 0);
  private currentWave: number = 0;
  private maxWave: number = 1;
  private waveSpawnDelay: number = 3;
  private waveTimer: number = 0;
  private waveActive: boolean = false;

  // Level configs
  private levelConfigs: LevelConfig[] = [
    // Level 1: Training Grounds
    {
      id: 1,
      name: 'Training Grounds',
      description: 'An open outdoor area to learn the basics',
      enemySpawns: [
        { position: new THREE.Vector3(10, 0, 10), type: EnemyType.BASIC, wave: 1 },
        { position: new THREE.Vector3(-10, 0, 10), type: EnemyType.BASIC, wave: 1 },
        { position: new THREE.Vector3(0, 0, 15), type: EnemyType.BASIC, wave: 1 },
        { position: new THREE.Vector3(15, 0, -5), type: EnemyType.BASIC, wave: 2 },
        { position: new THREE.Vector3(-15, 0, -5), type: EnemyType.BASIC, wave: 2 },
      ],
      pickupSpawns: [
        { position: new THREE.Vector3(5, 0.5, 5), type: PickupType.HEALTH },
        { position: new THREE.Vector3(-5, 0.5, 5), type: PickupType.AMMO },
        { position: new THREE.Vector3(0, 0.5, -10), type: PickupType.HEALTH },
      ],
      playerSpawn: new THREE.Vector3(0, 1.8, -15),
      ambientColor: 0x404060,
      fogColor: 0x1a1a2e,
      fogDensity: 0.015
    },
    // Level 2: The Warehouse
    {
      id: 2,
      name: 'The Warehouse',
      description: 'An indoor industrial environment',
      enemySpawns: [
        { position: new THREE.Vector3(8, 0, 8), type: EnemyType.BASIC, wave: 1 },
        { position: new THREE.Vector3(-8, 0, 8), type: EnemyType.BASIC, wave: 1 },
        { position: new THREE.Vector3(12, 0, 0), type: EnemyType.FAST, wave: 1 },
        { position: new THREE.Vector3(-12, 0, 0), type: EnemyType.BASIC, wave: 2 },
        { position: new THREE.Vector3(0, 0, 12), type: EnemyType.BASIC, wave: 2 },
        { position: new THREE.Vector3(8, 0, -8), type: EnemyType.FAST, wave: 2 },
        { position: new THREE.Vector3(-8, 0, -8), type: EnemyType.BASIC, wave: 3 },
        { position: new THREE.Vector3(0, 0, -12), type: EnemyType.BASIC, wave: 3 },
        { position: new THREE.Vector3(15, 0, 15), type: EnemyType.FAST, wave: 3 },
      ],
      pickupSpawns: [
        { position: new THREE.Vector3(10, 0.5, 0), type: PickupType.HEALTH },
        { position: new THREE.Vector3(-10, 0.5, 0), type: PickupType.AMMO },
        { position: new THREE.Vector3(0, 0.5, 10), type: PickupType.AMMO },
        { position: new THREE.Vector3(0, 0.5, -10), type: PickupType.HEALTH },
      ],
      playerSpawn: new THREE.Vector3(0, 1.8, -18),
      ambientColor: 0x303040,
      fogColor: 0x16213e,
      fogDensity: 0.02
    },
    // Level 3: The Arena (Boss)
    {
      id: 3,
      name: 'The Arena',
      description: 'Face the final challenge',
      enemySpawns: [
        { position: new THREE.Vector3(10, 0, 10), type: EnemyType.BASIC, wave: 1 },
        { position: new THREE.Vector3(-10, 0, 10), type: EnemyType.BASIC, wave: 1 },
        { position: new THREE.Vector3(10, 0, -10), type: EnemyType.FAST, wave: 2 },
        { position: new THREE.Vector3(-10, 0, -10), type: EnemyType.FAST, wave: 2 },
        { position: new THREE.Vector3(0, 0, 0), type: EnemyType.BOSS, wave: 3 },
      ],
      pickupSpawns: [
        { position: new THREE.Vector3(12, 0.5, 0), type: PickupType.HEALTH },
        { position: new THREE.Vector3(-12, 0.5, 0), type: PickupType.HEALTH },
        { position: new THREE.Vector3(0, 0.5, 12), type: PickupType.AMMO },
        { position: new THREE.Vector3(0, 0.5, -12), type: PickupType.AMMO },
      ],
      playerSpawn: new THREE.Vector3(0, 1.8, -20),
      ambientColor: 0x200000,
      fogColor: 0x0a0a15,
      fogDensity: 0.025
    }
  ];

  constructor(game: Game) {
    this.game = game;
  }

  public async loadLevel(levelId: number): Promise<void> {
    // Clear previous level
    this.clearLevel();
    
    // Get level config
    const config = this.levelConfigs[levelId - 1];
    if (!config) {
      console.error(`Level ${levelId} not found`);
      return;
    }
    
    this.currentLevel = levelId;
    this.playerSpawn = config.playerSpawn.clone();
    
    // Calculate max wave
    this.maxWave = Math.max(...config.enemySpawns.map(s => s.wave));
    this.currentWave = 0;
    this.waveActive = false;
    this.waveTimer = 0;
    
    // Setup scene
    this.setupLighting(config);
    this.setupFog(config);
    this.buildEnvironment(levelId);
    
    // Create pickups
    config.pickupSpawns.forEach(spawn => {
      this.createPickup(spawn);
    });
    
    // Start first wave
    this.startNextWave();
  }

  private clearLevel(): void {
    // Remove enemies
    this.enemies.forEach(enemy => {
      this.game.scene.remove(enemy.mesh);
      enemy.dispose();
    });
    this.enemies = [];
    
    // Remove pickups
    this.pickups.forEach(pickup => {
      this.game.scene.remove(pickup.mesh);
      pickup.dispose();
    });
    this.pickups = [];
    
    // Remove level objects
    this.levelObjects.forEach(obj => {
      this.game.scene.remove(obj);
    });
    this.levelObjects = [];
    
    // Clear scene children except camera
    while (this.game.scene.children.length > 0) {
      this.game.scene.remove(this.game.scene.children[0]);
    }
  }

  private setupLighting(config: LevelConfig): void {
    // Ambient light
    const ambient = new THREE.AmbientLight(config.ambientColor, 0.4);
    this.game.scene.add(ambient);
    this.levelObjects.push(ambient);
    
    // Directional light (sun)
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(10, 20, 10);
    directional.castShadow = true;
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    directional.shadow.camera.near = 0.5;
    directional.shadow.camera.far = 50;
    directional.shadow.camera.left = -30;
    directional.shadow.camera.right = 30;
    directional.shadow.camera.top = 30;
    directional.shadow.camera.bottom = -30;
    this.game.scene.add(directional);
    this.levelObjects.push(directional);
    
    // Point lights for atmosphere
    if (this.currentLevel === 3) {
      // Red lights for boss arena
      const light1 = new THREE.PointLight(0xff0000, 0.5, 20);
      light1.position.set(15, 5, 15);
      this.game.scene.add(light1);
      this.levelObjects.push(light1);
      
      const light2 = new THREE.PointLight(0xff0000, 0.5, 20);
      light2.position.set(-15, 5, -15);
      this.game.scene.add(light2);
      this.levelObjects.push(light2);
    }
  }

  private setupFog(config: LevelConfig): void {
    this.game.scene.fog = new THREE.FogExp2(config.fogColor, config.fogDensity);
    this.game.renderer.setClearColor(config.fogColor);
  }

  private buildEnvironment(levelId: number): void {
    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(50, 50);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: ColorPalette.FLOOR,
      roughness: 0.8,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.game.scene.add(floor);
    this.levelObjects.push(floor);
    
    // Create grid pattern on floor
    const gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x333333);
    gridHelper.position.y = 0.01;
    this.game.scene.add(gridHelper);
    this.levelObjects.push(gridHelper);
    
    // Build level-specific geometry
    switch (levelId) {
      case 1:
        this.buildLevel1();
        break;
      case 2:
        this.buildLevel2();
        break;
      case 3:
        this.buildLevel3();
        break;
    }
    
    // Create boundary walls
    this.createBoundaryWalls();
  }

  private buildLevel1(): void {
    // Training grounds - open area with some obstacles
    const boxMaterial = new THREE.MeshStandardMaterial({ 
      color: ColorPalette.NEUTRAL,
      roughness: 0.7
    });
    
    // Crates/barriers
    const cratePositions = [
      { x: 5, z: 0 },
      { x: -5, z: 0 },
      { x: 0, z: 5 },
      { x: 8, z: 8 },
      { x: -8, z: 8 },
      { x: 10, z: -5 },
      { x: -10, z: -5 },
    ];
    
    cratePositions.forEach(pos => {
      const crate = this.createCrate(pos.x, pos.z, boxMaterial);
      this.game.scene.add(crate);
      this.levelObjects.push(crate);
    });
    
    // Pillars
    const pillarMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x5a6a7a,
      roughness: 0.5
    });
    
    const pillarPositions = [
      { x: 15, z: 15 },
      { x: -15, z: 15 },
      { x: 15, z: -15 },
      { x: -15, z: -15 },
    ];
    
    pillarPositions.forEach(pos => {
      const pillar = this.createPillar(pos.x, pos.z, pillarMaterial);
      this.game.scene.add(pillar);
      this.levelObjects.push(pillar);
    });
  }

  private buildLevel2(): void {
    // Warehouse - more enclosed with rooms
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: ColorPalette.WALL,
      roughness: 0.9
    });
    
    const boxMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B4513,
      roughness: 0.8
    });
    
    // Central pillar
    const centerPillar = this.createPillar(0, 0, wallMaterial, 2, 6);
    this.game.scene.add(centerPillar);
    this.levelObjects.push(centerPillar);
    
    // Create interior walls
    const wallPositions = [
      { x: 10, z: 5, rotY: 0, width: 8 },
      { x: -10, z: 5, rotY: 0, width: 8 },
      { x: 10, z: -5, rotY: 0, width: 8 },
      { x: -10, z: -5, rotY: 0, width: 8 },
      { x: 5, z: 10, rotY: Math.PI / 2, width: 6 },
      { x: -5, z: -10, rotY: Math.PI / 2, width: 6 },
    ];
    
    wallPositions.forEach(pos => {
      const wall = this.createWall(pos.x, pos.z, pos.rotY, pos.width, wallMaterial);
      this.game.scene.add(wall);
      this.levelObjects.push(wall);
    });
    
    // Crates scattered around
    const cratePositions = [
      { x: 5, z: -5 },
      { x: -5, z: 5 },
      { x: 12, z: 12 },
      { x: -12, z: -12 },
      { x: 15, z: 0 },
      { x: -15, z: 0 },
    ];
    
    cratePositions.forEach(pos => {
      const crate = this.createCrate(pos.x, pos.z, boxMaterial);
      this.game.scene.add(crate);
      this.levelObjects.push(crate);
    });
  }

  private buildLevel3(): void {
    // Arena - circular with platforms
    const platformMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x4a1a1a,
      roughness: 0.6
    });
    
    const pillarMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2a0a0a,
      roughness: 0.4,
      metalness: 0.3
    });
    
    // Elevated platforms
    const platformPositions = [
      { x: 12, z: 0 },
      { x: -12, z: 0 },
      { x: 0, z: 12 },
      { x: 0, z: -12 },
    ];
    
    platformPositions.forEach(pos => {
      const platform = this.createPlatform(pos.x, pos.z, platformMaterial);
      this.game.scene.add(platform);
      this.levelObjects.push(platform);
    });
    
    // Corner pillars
    const pillarPositions = [
      { x: 18, z: 18 },
      { x: -18, z: 18 },
      { x: 18, z: -18 },
      { x: -18, z: -18 },
      { x: 18, z: 0 },
      { x: -18, z: 0 },
      { x: 0, z: 18 },
      { x: 0, z: -18 },
    ];
    
    pillarPositions.forEach(pos => {
      const pillar = this.createPillar(pos.x, pos.z, pillarMaterial, 1.5, 8);
      this.game.scene.add(pillar);
      this.levelObjects.push(pillar);
    });
    
    // Center arena marker
    const ringGeometry = new THREE.RingGeometry(8, 10, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x660000,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    this.game.scene.add(ring);
    this.levelObjects.push(ring);
  }

  private createCrate(x: number, z: number, material: THREE.Material): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const crate = new THREE.Mesh(geometry, material);
    crate.position.set(x, 1, z);
    crate.castShadow = true;
    crate.receiveShadow = true;
    crate.userData.isCollider = true;
    return crate;
  }

  private createPillar(x: number, z: number, material: THREE.Material, radius: number = 1, height: number = 5): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(radius, radius, height, 8);
    const pillar = new THREE.Mesh(geometry, material);
    pillar.position.set(x, height / 2, z);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    pillar.userData.isCollider = true;
    return pillar;
  }

  private createWall(x: number, z: number, rotY: number, width: number, material: THREE.Material): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(width, 4, 0.5);
    const wall = new THREE.Mesh(geometry, material);
    wall.position.set(x, 2, z);
    wall.rotation.y = rotY;
    wall.castShadow = true;
    wall.receiveShadow = true;
    wall.userData.isCollider = true;
    return wall;
  }

  private createPlatform(x: number, z: number, material: THREE.Material): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(6, 1, 6);
    const platform = new THREE.Mesh(geometry, material);
    platform.position.set(x, 0.5, z);
    platform.castShadow = true;
    platform.receiveShadow = true;
    platform.userData.isCollider = true;
    return platform;
  }

  private createBoundaryWalls(): void {
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: ColorPalette.DARK,
      roughness: 0.9
    });
    
    const size = 25;
    const height = 8;
    const thickness = 1;
    
    // North wall
    const northWall = new THREE.Mesh(
      new THREE.BoxGeometry(size * 2, height, thickness),
      wallMaterial
    );
    northWall.position.set(0, height / 2, size);
    northWall.userData.isCollider = true;
    this.game.scene.add(northWall);
    this.levelObjects.push(northWall);
    
    // South wall
    const southWall = new THREE.Mesh(
      new THREE.BoxGeometry(size * 2, height, thickness),
      wallMaterial
    );
    southWall.position.set(0, height / 2, -size);
    southWall.userData.isCollider = true;
    this.game.scene.add(southWall);
    this.levelObjects.push(southWall);
    
    // East wall
    const eastWall = new THREE.Mesh(
      new THREE.BoxGeometry(thickness, height, size * 2),
      wallMaterial
    );
    eastWall.position.set(size, height / 2, 0);
    eastWall.userData.isCollider = true;
    this.game.scene.add(eastWall);
    this.levelObjects.push(eastWall);
    
    // West wall
    const westWall = new THREE.Mesh(
      new THREE.BoxGeometry(thickness, height, size * 2),
      wallMaterial
    );
    westWall.position.set(-size, height / 2, 0);
    westWall.userData.isCollider = true;
    this.game.scene.add(westWall);
    this.levelObjects.push(westWall);
  }

  private startNextWave(): void {
    this.currentWave++;
    this.waveActive = true;
    
    const config = this.levelConfigs[this.currentLevel - 1];
    if (!config) return;
    
    // Spawn enemies for this wave
    const waveSpawns = config.enemySpawns.filter(s => s.wave === this.currentWave);
    waveSpawns.forEach(spawn => {
      this.spawnEnemy(spawn);
    });
  }

  private spawnEnemy(spawn: EnemySpawn): void {
    let enemy: Enemy;
    
    switch (spawn.type) {
      case EnemyType.FAST:
        enemy = new FastEnemy(this.game, spawn.position.clone());
        break;
      case EnemyType.BOSS:
        enemy = new BossEnemy(this.game, spawn.position.clone());
        this.game.uiManager.showBossHealth(true);
        break;
      case EnemyType.BASIC:
      default:
        enemy = new BasicEnemy(this.game, spawn.position.clone());
        break;
    }
    
    this.enemies.push(enemy);
    this.game.scene.add(enemy.mesh);
  }

  private createPickup(spawn: PickupSpawn): void {
    const pickup = new Pickup(this.game, spawn.position.clone(), spawn.type);
    this.pickups.push(pickup);
    this.game.scene.add(pickup.mesh);
  }

  public update(delta: number): void {
    // Update enemies
    this.enemies = this.enemies.filter(enemy => {
      enemy.update(delta);
      
      if (enemy.isDead()) {
        // Check if boss
        if (enemy instanceof BossEnemy) {
          this.game.uiManager.showBossHealth(false);
        }
        
        this.game.scene.remove(enemy.mesh);
        enemy.dispose();
        return false;
      }
      return true;
    });
    
    // Update pickups
    this.pickups.forEach(pickup => {
      pickup.update(delta);
    });
    
    // Check for wave completion
    if (this.waveActive && this.enemies.length === 0) {
      this.waveActive = false;
      
      if (this.currentWave < this.maxWave) {
        // Start timer for next wave
        this.waveTimer = this.waveSpawnDelay;
      }
    }
    
    // Handle wave timer
    if (!this.waveActive && this.waveTimer > 0) {
      this.waveTimer -= delta;
      if (this.waveTimer <= 0) {
        this.startNextWave();
      }
    }
    
    // Update boss health UI
    const boss = this.enemies.find(e => e instanceof BossEnemy) as BossEnemy | undefined;
    if (boss) {
      const healthPercent = (boss.health / boss.maxHealth) * 100;
      this.game.uiManager.updateBossHealth(healthPercent);
    }
  }

  public getPlayerSpawn(): THREE.Vector3 {
    return this.playerSpawn.clone();
  }

  public getEnemies(): Enemy[] {
    return this.enemies;
  }

  public getPickups(): Pickup[] {
    return this.pickups;
  }

  public removePickup(pickup: Pickup): void {
    const index = this.pickups.indexOf(pickup);
    if (index > -1) {
      this.pickups.splice(index, 1);
      this.game.scene.remove(pickup.mesh);
      pickup.dispose();
    }
  }

  public getLevelObjects(): THREE.Object3D[] {
    return this.levelObjects;
  }

  public isLevelComplete(): boolean {
    // Level is complete when all waves are done and no enemies remain
    return this.currentWave >= this.maxWave && this.enemies.length === 0 && !this.waveActive;
  }

  public getCurrentLevel(): number {
    return this.currentLevel;
  }

  public dispose(): void {
    this.clearLevel();
  }
}
