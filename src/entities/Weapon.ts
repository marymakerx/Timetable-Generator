import * as THREE from 'three';
import { Game } from '../core/Game';
import { GAME_CONSTANTS, ColorPalette } from '../types';

export class Weapon {
  private game: Game;
  public mesh: THREE.Group;
  
  // Weapon stats
  private damage: number;
  private fireRate: number;
  public maxAmmo: number;
  public currentAmmo: number;
  private reloadTime: number;
  private range: number;
  private spread: number;
  
  // State
  private fireTimer: number = 0;
  private isReloading: boolean = false;
  private reloadTimer: number = 0;
  
  // Visuals
  private muzzleFlash: THREE.PointLight;
  private muzzleFlashTimer: number = 0;
  
  // Raycasting
  private raycaster: THREE.Raycaster;
  
  // Animation
  private basePosition: THREE.Vector3;
  private kickbackAmount: number = 0;
  private swayAmount: THREE.Vector2 = new THREE.Vector2();

  constructor(game: Game) {
    this.game = game;
    
    // Initialize stats from constants
    this.damage = GAME_CONSTANTS.WEAPON.RIFLE_DAMAGE;
    this.fireRate = GAME_CONSTANTS.WEAPON.RIFLE_FIRE_RATE;
    this.maxAmmo = GAME_CONSTANTS.WEAPON.RIFLE_MAGAZINE;
    this.currentAmmo = this.maxAmmo;
    this.reloadTime = GAME_CONSTANTS.WEAPON.RIFLE_RELOAD_TIME;
    this.range = GAME_CONSTANTS.WEAPON.RIFLE_RANGE;
    this.spread = GAME_CONSTANTS.WEAPON.RIFLE_SPREAD;
    
    // Create weapon mesh
    this.mesh = this.createWeaponModel();
    
    // Position weapon in view
    this.basePosition = new THREE.Vector3(0.3, -0.3, -0.5);
    this.mesh.position.copy(this.basePosition);
    
    // Create muzzle flash
    this.muzzleFlash = new THREE.PointLight(0xffaa00, 0, 5);
    this.muzzleFlash.position.set(0, 0, -0.8);
    this.mesh.add(this.muzzleFlash);
    
    // Initialize raycaster
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = this.range;
  }

  private createWeaponModel(): THREE.Group {
    const group = new THREE.Group();
    
    // Main body material
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.4,
      metalness: 0.8
    });
    
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: ColorPalette.PRIMARY,
      roughness: 0.3,
      metalness: 0.6
    });
    
    // Rifle body (main)
    const bodyGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.6);
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0, -0.1);
    group.add(body);
    
    // Barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.025, 0.4, 8);
    const barrel = new THREE.Mesh(barrelGeometry, bodyMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, -0.5);
    group.add(barrel);
    
    // Stock
    const stockGeometry = new THREE.BoxGeometry(0.06, 0.1, 0.2);
    const stock = new THREE.Mesh(stockGeometry, bodyMaterial);
    stock.position.set(0, -0.02, 0.2);
    stock.rotation.x = -0.2;
    group.add(stock);
    
    // Magazine
    const magGeometry = new THREE.BoxGeometry(0.04, 0.15, 0.08);
    const mag = new THREE.Mesh(magGeometry, accentMaterial);
    mag.position.set(0, -0.12, 0);
    group.add(mag);
    
    // Sight
    const sightGeometry = new THREE.BoxGeometry(0.03, 0.04, 0.08);
    const sight = new THREE.Mesh(sightGeometry, accentMaterial);
    sight.position.set(0, 0.08, -0.1);
    group.add(sight);
    
    // Grip
    const gripGeometry = new THREE.BoxGeometry(0.04, 0.1, 0.06);
    const grip = new THREE.Mesh(gripGeometry, bodyMaterial);
    grip.position.set(0, -0.1, 0.1);
    grip.rotation.x = 0.3;
    group.add(grip);
    
    return group;
  }

  public update(delta: number): void {
    // Update fire timer
    if (this.fireTimer > 0) {
      this.fireTimer -= delta;
    }
    
    // Handle reload
    if (this.isReloading) {
      this.reloadTimer -= delta;
      
      if (this.reloadTimer <= 0) {
        this.completeReload();
      }
    }
    
    // Update muzzle flash
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= delta;
      this.muzzleFlash.intensity = this.muzzleFlashTimer > 0 ? 2 : 0;
    }
    
    // Apply kickback recovery
    if (this.kickbackAmount > 0) {
      this.kickbackAmount *= Math.pow(0.001, delta);
      if (this.kickbackAmount < 0.001) this.kickbackAmount = 0;
    }
    
    // Apply weapon sway
    this.applyWeaponSway(delta);
    
    // Update weapon position
    this.updateWeaponPosition();
  }

  private applyWeaponSway(delta: number): void {
    // Check keys directly to avoid consuming input state
    const targetSway = new THREE.Vector2();
    
    if (this.game.inputManager.isKeyPressed('KeyA') || this.game.inputManager.isKeyPressed('ArrowLeft')) {
      targetSway.x = 0.02;
    }
    if (this.game.inputManager.isKeyPressed('KeyD') || this.game.inputManager.isKeyPressed('ArrowRight')) {
      targetSway.x = -0.02;
    }
    if (this.game.inputManager.isKeyPressed('KeyW') || this.game.inputManager.isKeyPressed('ArrowUp')) {
      targetSway.y = -0.01;
    }
    if (this.game.inputManager.isKeyPressed('KeyS') || this.game.inputManager.isKeyPressed('ArrowDown')) {
      targetSway.y = 0.01;
    }
    
    // Smooth sway transition
    this.swayAmount.x += (targetSway.x - this.swayAmount.x) * 5 * delta;
    this.swayAmount.y += (targetSway.y - this.swayAmount.y) * 5 * delta;
  }

  private updateWeaponPosition(): void {
    // Base position with kickback
    this.mesh.position.x = this.basePosition.x + this.swayAmount.x;
    this.mesh.position.y = this.basePosition.y + this.swayAmount.y;
    this.mesh.position.z = this.basePosition.z + this.kickbackAmount * 0.1;
    
    // Rotation for kickback
    this.mesh.rotation.x = -this.kickbackAmount * 0.2;
  }

  public shoot(): void {
    // Check if can shoot
    if (this.fireTimer > 0) return;
    if (this.isReloading) return;
    if (this.currentAmmo <= 0) {
      this.game.audioManager.playSound('empty');
      this.reload();
      return;
    }
    
    // Fire!
    this.currentAmmo--;
    this.fireTimer = this.fireRate;
    this.game.stats.shotsFired++;
    
    // Update UI
    this.game.uiManager.updateAmmo(this.currentAmmo, this.maxAmmo);
    
    // Play sound
    this.game.audioManager.playSound('shoot');
    
    // Muzzle flash
    this.muzzleFlashTimer = 0.05;
    this.muzzleFlash.intensity = 2;
    
    // Kickback
    this.kickbackAmount = 0.5;
    
    // Perform raycast
    this.performRaycast();
  }

  private performRaycast(): void {
    // Get camera position and direction
    const camera = this.game.camera;
    const origin = new THREE.Vector3();
    camera.getWorldPosition(origin);
    
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion()));
    
    // Add spread
    direction.x += (Math.random() - 0.5) * this.spread;
    direction.y += (Math.random() - 0.5) * this.spread;
    direction.normalize();
    
    // Set up raycaster
    this.raycaster.set(origin, direction);
    
    // Get all potential targets
    const enemies = this.game.levelManager.getEnemies();
    const enemyMeshes = enemies.map(e => e.mesh);
    
    // Also check level objects for visual hit effects
    const levelObjects = this.game.levelManager.getLevelObjects();
    
    // First check enemies
    const enemyHits = this.raycaster.intersectObjects(enemyMeshes, true);
    
    if (enemyHits.length > 0) {
      const hit = enemyHits[0];
      
      // Find which enemy was hit
      let hitEnemy = null;
      for (const enemy of enemies) {
        if (enemy.mesh === hit.object || enemy.mesh.children.includes(hit.object as THREE.Object3D)) {
          hitEnemy = enemy;
          break;
        }
        // Check if hit object is descendant of enemy mesh
        let parent = hit.object.parent;
        while (parent) {
          if (parent === enemy.mesh) {
            hitEnemy = enemy;
            break;
          }
          parent = parent.parent;
        }
        if (hitEnemy) break;
      }
      
      if (hitEnemy) {
        hitEnemy.takeDamage(this.damage);
        this.game.stats.shotsHit++;
        this.createHitEffect(hit.point, true);
        return;
      }
    }
    
    // Check level objects for wall hits
    const levelHits = this.raycaster.intersectObjects(levelObjects, true);
    
    if (levelHits.length > 0) {
      const hit = levelHits[0];
      this.createHitEffect(hit.point, false);
    }
  }

  private createHitEffect(position: THREE.Vector3, isEnemy: boolean): void {
    // Create particle effect at hit point
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: isEnemy ? 0xff0000 : 0xffff00,
      transparent: true,
      opacity: 1
    });
    
    const particle = new THREE.Mesh(geometry, material);
    particle.position.copy(position);
    this.game.scene.add(particle);
    
    // Animate and remove
    let lifetime = 0;
    const animate = () => {
      lifetime += 0.016;
      
      const scale = 1 + lifetime * 5;
      particle.scale.set(scale, scale, scale);
      material.opacity = 1 - lifetime * 5;
      
      if (lifetime < 0.2) {
        requestAnimationFrame(animate);
      } else {
        this.game.scene.remove(particle);
        geometry.dispose();
        material.dispose();
      }
    };
    
    animate();
    
    // Play hit sound
    if (isEnemy) {
      this.game.audioManager.playSound('enemyHit');
    } else {
      this.game.audioManager.playSound('hit');
    }
  }

  public reload(): void {
    if (this.isReloading) return;
    if (this.currentAmmo === this.maxAmmo) return;
    
    this.isReloading = true;
    this.reloadTimer = this.reloadTime;
    
    // Update UI
    this.game.uiManager.updateAmmo(this.currentAmmo, this.maxAmmo, true);
    
    // Play sound
    this.game.audioManager.playSound('reload');
  }

  private completeReload(): void {
    this.currentAmmo = this.maxAmmo;
    this.isReloading = false;
    
    // Update UI
    this.game.uiManager.updateAmmo(this.currentAmmo, this.maxAmmo);
  }

  public addAmmo(amount: number): void {
    // Add ammo directly to current magazine for simplicity
    this.currentAmmo = Math.min(this.maxAmmo, this.currentAmmo + amount);
    this.game.uiManager.updateAmmo(this.currentAmmo, this.maxAmmo, this.isReloading);
  }

  public reset(): void {
    this.currentAmmo = this.maxAmmo;
    this.fireTimer = 0;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.kickbackAmount = 0;
    this.swayAmount.set(0, 0);
    this.mesh.position.copy(this.basePosition);
    this.mesh.rotation.set(0, 0, 0);
  }

  public dispose(): void {
    // Dispose geometries and materials
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });
  }
}
