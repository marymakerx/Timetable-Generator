import * as THREE from 'three';
import { Game } from '../core/Game';
import { EnemyState, EnemyConfig, Damageable, ColorPalette } from '../types';

export abstract class Enemy implements Damageable {
  protected game: Game;
  public mesh: THREE.Group;
  
  // Stats
  public health: number;
  public maxHealth: number;
  protected speed: number;
  protected damage: number;
  protected attackRange: number;
  protected detectionRange: number;
  protected attackCooldown: number;
  
  // State
  protected state: EnemyState = EnemyState.IDLE;
  protected attackTimer: number = 0;
  protected stateTimer: number = 0;
  
  // Target
  protected target: THREE.Vector3 | null = null;
  
  // Patrol
  protected patrolPoints: THREE.Vector3[] = [];
  protected currentPatrolIndex: number = 0;
  
  // Visual
  protected bodyMesh: THREE.Mesh;
  protected eyeMesh: THREE.Mesh;
  
  // Death animation
  protected isDying: boolean = false;
  protected deathTimer: number = 0;

  constructor(game: Game, position: THREE.Vector3, config: EnemyConfig) {
    this.game = game;
    
    // Initialize stats from config
    this.health = config.health;
    this.maxHealth = config.health;
    this.speed = config.speed;
    this.damage = config.damage;
    this.attackRange = config.attackRange;
    this.detectionRange = config.detectionRange;
    this.attackCooldown = config.attackCooldown;
    
    // Create mesh
    this.mesh = new THREE.Group();
    this.mesh.position.copy(position);
    this.mesh.position.y = 0;
    
    // Create body (will be overridden by subclasses)
    const { body, eye } = this.createBody();
    this.bodyMesh = body;
    this.eyeMesh = eye;
    this.mesh.add(this.bodyMesh);
    this.mesh.add(this.eyeMesh);
    
    // Generate patrol points
    this.generatePatrolPoints(position);
  }

  protected abstract createBody(): { body: THREE.Mesh; eye: THREE.Mesh };

  protected generatePatrolPoints(center: THREE.Vector3): void {
    const radius = 5;
    const points = 4;
    
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const point = new THREE.Vector3(
        center.x + Math.cos(angle) * radius,
        0,
        center.z + Math.sin(angle) * radius
      );
      this.patrolPoints.push(point);
    }
  }

  public update(delta: number): void {
    if (this.isDying) {
      this.updateDeath(delta);
      return;
    }
    
    // Update attack cooldown
    if (this.attackTimer > 0) {
      this.attackTimer -= delta;
    }
    
    // Update state timer
    this.stateTimer += delta;
    
    // Get player position
    const playerPos = this.game.player?.getPosition();
    if (!playerPos) return;
    
    // Calculate distance to player
    const distanceToPlayer = this.mesh.position.distanceTo(playerPos);
    
    // State machine
    switch (this.state) {
      case EnemyState.IDLE:
        this.updateIdle(delta, playerPos, distanceToPlayer);
        break;
      case EnemyState.PATROL:
        this.updatePatrol(delta, playerPos, distanceToPlayer);
        break;
      case EnemyState.ALERT:
        this.updateAlert(delta, playerPos, distanceToPlayer);
        break;
      case EnemyState.CHASE:
        this.updateChase(delta, playerPos, distanceToPlayer);
        break;
      case EnemyState.ATTACK:
        this.updateAttack(delta, playerPos, distanceToPlayer);
        break;
    }
    
    // Update visual facing direction
    this.updateFacing(playerPos);
  }

  protected updateIdle(delta: number, playerPos: THREE.Vector3, distance: number): void {
    // Check for player detection
    if (distance < this.detectionRange) {
      this.setState(EnemyState.ALERT);
      return;
    }
    
    // Start patrolling after idle time
    if (this.stateTimer > 2) {
      this.setState(EnemyState.PATROL);
    }
  }

  protected updatePatrol(delta: number, playerPos: THREE.Vector3, distance: number): void {
    // Check for player detection
    if (distance < this.detectionRange) {
      this.setState(EnemyState.ALERT);
      return;
    }
    
    // Move to patrol point
    if (this.patrolPoints.length > 0) {
      const targetPoint = this.patrolPoints[this.currentPatrolIndex];
      this.moveTowards(targetPoint, delta);
      
      // Check if reached patrol point
      const distToPoint = this.mesh.position.distanceTo(targetPoint);
      if (distToPoint < 1) {
        this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
      }
    }
  }

  protected updateAlert(delta: number, playerPos: THREE.Vector3, distance: number): void {
    // Brief alert state before chasing
    if (this.stateTimer > 0.5) {
      this.setState(EnemyState.CHASE);
    }
  }

  protected updateChase(delta: number, playerPos: THREE.Vector3, distance: number): void {
    // Check if in attack range
    if (distance < this.attackRange) {
      this.setState(EnemyState.ATTACK);
      return;
    }
    
    // Check if lost player
    if (distance > this.detectionRange * 1.5) {
      this.setState(EnemyState.PATROL);
      return;
    }
    
    // Move towards player
    this.moveTowards(playerPos, delta);
  }

  protected updateAttack(delta: number, playerPos: THREE.Vector3, distance: number): void {
    // Check if player moved out of range
    if (distance > this.attackRange * 1.2) {
      this.setState(EnemyState.CHASE);
      return;
    }
    
    // Attack if cooldown is ready
    if (this.attackTimer <= 0) {
      this.performAttack();
      this.attackTimer = this.attackCooldown;
    }
  }

  protected moveTowards(target: THREE.Vector3, delta: number): void {
    const direction = new THREE.Vector3();
    direction.subVectors(target, this.mesh.position);
    direction.y = 0;
    direction.normalize();
    
    // Calculate new position
    const newPosition = this.mesh.position.clone();
    newPosition.x += direction.x * this.speed * delta;
    newPosition.z += direction.z * this.speed * delta;
    
    // Check collision with level objects
    if (!this.checkCollision(newPosition)) {
      this.mesh.position.copy(newPosition);
    } else {
      // Try sliding along walls
      const slideX = this.mesh.position.clone();
      slideX.x += direction.x * this.speed * delta;
      
      const slideZ = this.mesh.position.clone();
      slideZ.z += direction.z * this.speed * delta;
      
      if (!this.checkCollision(slideX)) {
        this.mesh.position.x = slideX.x;
      }
      
      if (!this.checkCollision(slideZ)) {
        this.mesh.position.z = slideZ.z;
      }
    }
    
    // Simple collision with boundaries
    this.mesh.position.x = Math.max(-23, Math.min(23, this.mesh.position.x));
    this.mesh.position.z = Math.max(-23, Math.min(23, this.mesh.position.z));
  }

  protected checkCollision(position: THREE.Vector3): boolean {
    const collisionRadius = 0.8; // Enemy collision radius
    const levelObjects = this.game.levelManager.getLevelObjects();
    
    for (const obj of levelObjects) {
      if (!obj.userData.isCollider) continue;
      if (!(obj instanceof THREE.Mesh)) continue;
      
      // Simple sphere-box collision
      const box = new THREE.Box3().setFromObject(obj);
      const closestPoint = new THREE.Vector3();
      box.clampPoint(position, closestPoint);
      
      const distance = position.distanceTo(closestPoint);
      if (distance < collisionRadius) {
        return true;
      }
    }
    
    return false;
  }

  protected updateFacing(playerPos: THREE.Vector3): void {
    if (this.state === EnemyState.CHASE || this.state === EnemyState.ATTACK || this.state === EnemyState.ALERT) {
      // Face player
      const direction = new THREE.Vector3();
      direction.subVectors(playerPos, this.mesh.position);
      direction.y = 0;
      
      if (direction.length() > 0) {
        const angle = Math.atan2(direction.x, direction.z);
        this.mesh.rotation.y = angle;
      }
    } else if (this.state === EnemyState.PATROL && this.patrolPoints.length > 0) {
      // Face patrol direction
      const targetPoint = this.patrolPoints[this.currentPatrolIndex];
      const direction = new THREE.Vector3();
      direction.subVectors(targetPoint, this.mesh.position);
      direction.y = 0;
      
      if (direction.length() > 0.1) {
        const angle = Math.atan2(direction.x, direction.z);
        this.mesh.rotation.y = angle;
      }
    }
  }

  protected performAttack(): void {
    // Deal damage to player
    if (this.game.player) {
      const distance = this.mesh.position.distanceTo(this.game.player.getPosition());
      if (distance < this.attackRange * 1.2) {
        this.game.player.takeDamage(this.damage);
        this.game.audioManager.playSound('enemyHit');
      }
    }
  }

  protected setState(newState: EnemyState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.stateTimer = 0;
      
      // Play alert sound when detecting player
      if (newState === EnemyState.ALERT) {
        // Could play alert sound here
      }
    }
  }

  public takeDamage(amount: number): void {
    if (this.isDying) return;
    
    this.health -= amount;
    
    // Visual feedback - flash red
    this.flashRed();
    
    // Enter chase state if hit while idle/patrolling
    if (this.state === EnemyState.IDLE || this.state === EnemyState.PATROL) {
      this.setState(EnemyState.CHASE);
    }
    
    // Check for death
    if (this.health <= 0) {
      this.die();
    }
  }

  protected flashRed(): void {
    const originalColor = (this.bodyMesh.material as THREE.MeshStandardMaterial).color.getHex();
    (this.bodyMesh.material as THREE.MeshStandardMaterial).color.setHex(0xff0000);
    
    setTimeout(() => {
      if (this.bodyMesh && this.bodyMesh.material) {
        (this.bodyMesh.material as THREE.MeshStandardMaterial).color.setHex(originalColor);
      }
    }, 100);
  }

  protected die(): void {
    this.isDying = true;
    this.deathTimer = 0;
    this.state = EnemyState.DEAD;
    
    // Add score
    this.game.addScore(this.getScoreValue());
    
    // Play death sound
    this.game.audioManager.playSound('enemyDeath');
  }

  protected updateDeath(delta: number): void {
    this.deathTimer += delta;
    
    // Fall over animation
    this.mesh.rotation.x = Math.min(Math.PI / 2, this.deathTimer * 3);
    this.mesh.position.y = Math.max(-1, -this.deathTimer * 2);
    
    // Fade out
    const opacity = 1 - this.deathTimer;
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material.transparent = true;
        child.material.opacity = Math.max(0, opacity);
      }
    });
  }

  protected abstract getScoreValue(): number;

  public isDead(): boolean {
    return this.isDying && this.deathTimer > 1;
  }

  public getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  public dispose(): void {
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
