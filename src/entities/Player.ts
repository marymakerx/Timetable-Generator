import * as THREE from 'three';
import { Game } from '../core/Game';
import { Weapon } from './Weapon';
import { GAME_CONSTANTS, Damageable, ColorPalette } from '../types';

export class Player implements Damageable {
  private game: Game;
  public mesh: THREE.Object3D;
  
  // Stats
  public health: number;
  public maxHealth: number;
  private speed: number;
  private lookSensitivity: number;
  
  // Camera/look
  private pitch: number = 0;
  private yaw: number = 0;
  private readonly maxPitch: number = Math.PI / 2 - 0.1;
  
  // Movement
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private moveDirection: THREE.Vector3 = new THREE.Vector3();
  private readonly friction: number = 10;
  private readonly acceleration: number = 50;
  
  // Collision
  private readonly collisionRadius: number = GAME_CONSTANTS.PLAYER.COLLISION_RADIUS;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  
  // Weapon
  public weapon: Weapon;
  
  // Invincibility frames
  private invincibilityTimer: number = 0;
  private readonly invincibilityDuration: number = 0.5;
  
  // Screen shake
  private shakeIntensity: number = 0;
  private shakeDecay: number = 5;

  constructor(game: Game, spawnPosition: THREE.Vector3) {
    this.game = game;
    
    // Initialize stats
    this.health = GAME_CONSTANTS.PLAYER.DEFAULT_HEALTH;
    this.maxHealth = GAME_CONSTANTS.PLAYER.DEFAULT_HEALTH;
    this.speed = GAME_CONSTANTS.PLAYER.DEFAULT_SPEED;
    this.lookSensitivity = GAME_CONSTANTS.PLAYER.LOOK_SENSITIVITY;
    
    // Create player mesh (invisible, just for position tracking)
    this.mesh = new THREE.Object3D();
    this.mesh.position.copy(spawnPosition);
    
    // Attach camera to player
    this.game.camera.position.set(0, GAME_CONSTANTS.PLAYER.HEIGHT, 0);
    this.mesh.add(this.game.camera);
    
    // Initialize weapon
    this.weapon = new Weapon(game);
    this.game.camera.add(this.weapon.mesh);
    
    // Initial UI update
    this.game.uiManager.updateHealth(this.health, this.maxHealth);
    this.game.uiManager.updateAmmo(this.weapon.currentAmmo, this.weapon.maxAmmo);
  }

  public update(delta: number): void {
    // Get input
    const input = this.game.inputManager.getInput();
    
    // Handle looking
    this.handleLook(input.mouseMovement);
    
    // Handle movement
    this.handleMovement(input, delta);
    
    // Handle shooting
    if (input.shoot) {
      this.weapon.shoot();
    }
    
    // Handle reload
    if (input.reload) {
      this.weapon.reload();
    }
    
    // Update weapon
    this.weapon.update(delta);
    
    // Update invincibility
    if (this.invincibilityTimer > 0) {
      this.invincibilityTimer -= delta;
    }
    
    // Apply screen shake
    if (this.shakeIntensity > 0) {
      this.applyScreenShake();
      this.shakeIntensity -= this.shakeDecay * delta;
      if (this.shakeIntensity < 0) {
        this.shakeIntensity = 0;
        // Reset camera position when shake ends
        this.game.camera.position.set(0, GAME_CONSTANTS.PLAYER.HEIGHT, 0);
      }
    }
    
    // Check for pickup collisions
    this.checkPickups();
  }

  private handleLook(mouseMovement: { x: number; y: number }): void {
    // Apply mouse movement to rotation
    this.yaw -= mouseMovement.x * this.lookSensitivity;
    this.pitch -= mouseMovement.y * this.lookSensitivity;
    
    // Clamp pitch
    this.pitch = Math.max(-this.maxPitch, Math.min(this.maxPitch, this.pitch));
    
    // Apply rotation to player (yaw)
    this.mesh.rotation.y = this.yaw;
    
    // Apply pitch to camera
    this.game.camera.rotation.x = this.pitch;
  }

  private handleMovement(input: { forward: boolean; backward: boolean; left: boolean; right: boolean }, delta: number): void {
    // Calculate move direction
    this.moveDirection.set(0, 0, 0);
    
    if (input.forward) this.moveDirection.z -= 1;
    if (input.backward) this.moveDirection.z += 1;
    if (input.left) this.moveDirection.x -= 1;
    if (input.right) this.moveDirection.x += 1;
    
    // Normalize if moving diagonally
    if (this.moveDirection.length() > 0) {
      this.moveDirection.normalize();
    }
    
    // Transform direction to world space based on player rotation
    this.moveDirection.applyQuaternion(this.mesh.quaternion);
    
    // Apply acceleration
    const targetVelocity = this.moveDirection.clone().multiplyScalar(this.speed);
    
    // Smooth velocity transition
    this.velocity.x += (targetVelocity.x - this.velocity.x) * Math.min(1, this.acceleration * delta);
    this.velocity.z += (targetVelocity.z - this.velocity.z) * Math.min(1, this.acceleration * delta);
    
    // Apply friction when not moving
    if (this.moveDirection.length() === 0) {
      this.velocity.x *= Math.max(0, 1 - this.friction * delta);
      this.velocity.z *= Math.max(0, 1 - this.friction * delta);
    }
    
    // Calculate new position
    const newPosition = this.mesh.position.clone();
    newPosition.x += this.velocity.x * delta;
    newPosition.z += this.velocity.z * delta;
    
    // Check collisions and apply movement
    if (!this.checkCollision(newPosition)) {
      this.mesh.position.copy(newPosition);
    } else {
      // Try sliding along walls
      const slideX = this.mesh.position.clone();
      slideX.x += this.velocity.x * delta;
      
      const slideZ = this.mesh.position.clone();
      slideZ.z += this.velocity.z * delta;
      
      if (!this.checkCollision(slideX)) {
        this.mesh.position.x = slideX.x;
      } else {
        this.velocity.x = 0;
      }
      
      if (!this.checkCollision(slideZ)) {
        this.mesh.position.z = slideZ.z;
      } else {
        this.velocity.z = 0;
      }
    }
    
    // Keep player in bounds
    this.mesh.position.x = Math.max(-24, Math.min(24, this.mesh.position.x));
    this.mesh.position.z = Math.max(-24, Math.min(24, this.mesh.position.z));
  }

  private checkCollision(position: THREE.Vector3): boolean {
    // Check against level objects
    const levelObjects = this.game.levelManager.getLevelObjects();
    
    for (const obj of levelObjects) {
      if (!obj.userData.isCollider) continue;
      if (!(obj instanceof THREE.Mesh)) continue;
      
      // Simple sphere-box collision
      const box = new THREE.Box3().setFromObject(obj);
      const closestPoint = new THREE.Vector3();
      box.clampPoint(position, closestPoint);
      
      const distance = position.distanceTo(closestPoint);
      if (distance < this.collisionRadius) {
        return true;
      }
    }
    
    return false;
  }

  private checkPickups(): void {
    const pickups = this.game.levelManager.getPickups();
    const playerPos = this.mesh.position;
    
    for (const pickup of pickups) {
      const distance = playerPos.distanceTo(pickup.mesh.position);
      
      if (distance < 1.5) {
        // Collect pickup
        pickup.collect(this);
        this.game.levelManager.removePickup(pickup);
        this.game.audioManager.playSound('pickup');
      }
    }
  }

  public takeDamage(amount: number): void {
    if (this.invincibilityTimer > 0) return;
    if (this.health <= 0) return;
    
    this.health = Math.max(0, this.health - amount);
    this.invincibilityTimer = this.invincibilityDuration;
    
    // Update UI
    this.game.uiManager.updateHealth(this.health, this.maxHealth);
    this.game.uiManager.showDamageEffect();
    
    // Play sound
    this.game.audioManager.playSound('playerHurt');
    
    // Screen shake
    this.shakeIntensity = 0.3;
    
    // Check for death
    if (this.health <= 0) {
      this.die();
    }
  }

  public heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.game.uiManager.updateHealth(this.health, this.maxHealth);
  }

  public addAmmo(amount: number): void {
    this.weapon.addAmmo(amount);
  }

  private die(): void {
    this.game.gameOver();
  }

  public isDead(): boolean {
    return this.health <= 0;
  }

  private applyScreenShake(): void {
    const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
    const shakeZ = (Math.random() - 0.5) * this.shakeIntensity;
    
    // Apply shake while preserving the camera's Y position (eye height)
    this.game.camera.position.x = shakeX;
    this.game.camera.position.z = shakeZ;
    // Keep Y at player height
    this.game.camera.position.y = GAME_CONSTANTS.PLAYER.HEIGHT;
  }

  public getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  public getDirection(): THREE.Vector3 {
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.game.camera.getWorldQuaternion(new THREE.Quaternion()));
    return direction;
  }

  public reset(spawnPosition: THREE.Vector3): void {
    // Reset position
    this.mesh.position.copy(spawnPosition);
    
    // Reset stats
    this.health = this.maxHealth;
    this.velocity.set(0, 0, 0);
    this.pitch = 0;
    this.yaw = 0;
    this.mesh.rotation.y = 0;
    this.game.camera.rotation.x = 0;
    this.invincibilityTimer = 0;
    this.shakeIntensity = 0;
    
    // Reset camera position
    this.game.camera.position.set(0, GAME_CONSTANTS.PLAYER.HEIGHT, 0);
    
    // Reset weapon
    this.weapon.reset();
    
    // Update UI
    this.game.uiManager.updateHealth(this.health, this.maxHealth);
    this.game.uiManager.updateAmmo(this.weapon.currentAmmo, this.weapon.maxAmmo);
  }

  public dispose(): void {
    this.weapon.dispose();
  }
}
