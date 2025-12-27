import * as THREE from 'three';
import { Game } from '../../core/Game';
import { Enemy } from '../Enemy';
import { EnemyState, EnemyType, GAME_CONSTANTS, ColorPalette } from '../../types';

enum BossPhase {
  PHASE_1 = 1,
  PHASE_2 = 2,
  PHASE_3 = 3
}

export class BossEnemy extends Enemy {
  private phase: BossPhase = BossPhase.PHASE_1;
  private phaseTransitioning: boolean = false;
  private phaseTransitionTimer: number = 0;
  private specialAttackTimer: number = 0;
  private specialAttackCooldown: number = 5;
  private rotationSpeed: number = 0;
  
  // Visual elements
  private coreMesh: THREE.Mesh | null = null;
  private orbits: THREE.Object3D[] = [];
  private pulsePhase: number = 0;
  
  // Disposed flag to prevent effects after cleanup
  private disposed: boolean = false;

  constructor(game: Game, position: THREE.Vector3) {
    super(game, position, {
      type: EnemyType.BOSS,
      health: GAME_CONSTANTS.ENEMY.BOSS.HEALTH,
      speed: GAME_CONSTANTS.ENEMY.BOSS.SPEED,
      damage: GAME_CONSTANTS.ENEMY.BOSS.DAMAGE,
      attackRange: GAME_CONSTANTS.ENEMY.BOSS.ATTACK_RANGE,
      detectionRange: GAME_CONSTANTS.ENEMY.BOSS.DETECTION_RANGE,
      attackCooldown: GAME_CONSTANTS.ENEMY.BOSS.ATTACK_COOLDOWN
    });
    
    // Boss starts in chase mode immediately
    this.state = EnemyState.CHASE;
  }

  protected createBody(): { body: THREE.Mesh; eye: THREE.Mesh } {
    // Main body - large imposing figure
    const bodyGeometry = new THREE.DodecahedronGeometry(1.5, 1);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a0080,
      roughness: 0.3,
      metalness: 0.7
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 2;
    body.castShadow = true;
    
    // Glowing core
    const coreGeometry = new THREE.IcosahedronGeometry(0.5, 1);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0066,
      emissive: 0xff0066,
      emissiveIntensity: 1
    });
    this.coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    this.coreMesh.position.y = 0;
    body.add(this.coreMesh);
    
    // Eye (central glowing eye)
    const eyeGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 1
    });
    const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eye.position.set(0, 2, 1.3);
    
    // Orbiting elements
    for (let i = 0; i < 4; i++) {
      const orbitContainer = new THREE.Object3D();
      orbitContainer.rotation.y = (i / 4) * Math.PI * 2;
      
      const orbitGeometry = new THREE.OctahedronGeometry(0.3);
      const orbitMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.5
      });
      const orbitMesh = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbitMesh.position.set(2.5, 0, 0);
      
      orbitContainer.add(orbitMesh);
      body.add(orbitContainer);
      this.orbits.push(orbitContainer);
    }
    
    // Crown/spikes
    for (let i = 0; i < 6; i++) {
      const spikeGeometry = new THREE.ConeGeometry(0.2, 0.8, 4);
      const spikeMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a0050,
        roughness: 0.4,
        metalness: 0.6
      });
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      
      const angle = (i / 6) * Math.PI * 2;
      spike.position.set(
        Math.cos(angle) * 1.2,
        1.3,
        Math.sin(angle) * 1.2
      );
      spike.rotation.z = Math.PI - 0.5;
      spike.rotation.y = angle;
      spike.castShadow = true;
      body.add(spike);
    }
    
    // Add point light for dramatic effect
    const light = new THREE.PointLight(0xff0066, 1, 10);
    light.position.y = 0;
    body.add(light);
    
    return { body, eye };
  }

  public update(delta: number): void {
    // Handle phase transition
    if (this.phaseTransitioning) {
      this.updatePhaseTransition(delta);
      return;
    }
    
    // Check for phase changes
    this.checkPhaseChange();
    
    // Update special attack
    this.specialAttackTimer -= delta;
    if (this.specialAttackTimer <= 0 && this.state === EnemyState.ATTACK) {
      this.performSpecialAttack();
      this.specialAttackTimer = this.specialAttackCooldown;
    }
    
    // Update visual effects
    this.updateVisuals(delta);
    
    // Call parent update
    super.update(delta);
  }

  private checkPhaseChange(): void {
    const healthPercent = this.health / this.maxHealth;
    
    if (healthPercent <= 0.33 && this.phase !== BossPhase.PHASE_3) {
      this.startPhaseTransition(BossPhase.PHASE_3);
    } else if (healthPercent <= 0.66 && this.phase === BossPhase.PHASE_1) {
      this.startPhaseTransition(BossPhase.PHASE_2);
    }
  }

  private startPhaseTransition(newPhase: BossPhase): void {
    this.phase = newPhase;
    this.phaseTransitioning = true;
    this.phaseTransitionTimer = 2;
    
    // Update stats based on phase
    switch (newPhase) {
      case BossPhase.PHASE_2:
        this.speed = GAME_CONSTANTS.ENEMY.BOSS.SPEED * 1.3;
        this.attackCooldown = GAME_CONSTANTS.ENEMY.BOSS.ATTACK_COOLDOWN * 0.8;
        this.specialAttackCooldown = 4;
        break;
      case BossPhase.PHASE_3:
        this.speed = GAME_CONSTANTS.ENEMY.BOSS.SPEED * 1.5;
        this.damage = GAME_CONSTANTS.ENEMY.BOSS.DAMAGE * 1.5;
        this.attackCooldown = GAME_CONSTANTS.ENEMY.BOSS.ATTACK_COOLDOWN * 0.6;
        this.specialAttackCooldown = 3;
        break;
    }
  }

  private updatePhaseTransition(delta: number): void {
    this.phaseTransitionTimer -= delta;
    
    // Visual effect during transition
    const intensity = Math.sin(this.phaseTransitionTimer * 10) * 0.5 + 0.5;
    if (this.coreMesh && this.coreMesh.material instanceof THREE.MeshStandardMaterial) {
      this.coreMesh.material.emissiveIntensity = 1 + intensity * 2;
    }
    
    // Scale pulse
    const scale = 1 + Math.sin(this.phaseTransitionTimer * 5) * 0.2;
    this.mesh.scale.set(scale, scale, scale);
    
    if (this.phaseTransitionTimer <= 0) {
      this.phaseTransitioning = false;
      this.mesh.scale.set(1, 1, 1);
    }
  }

  private updateVisuals(delta: number): void {
    // Rotate orbits
    this.rotationSpeed = this.phase * 1.5;
    this.orbits.forEach((orbit, index) => {
      orbit.rotation.y += delta * this.rotationSpeed * (index % 2 === 0 ? 1 : -1);
    });
    
    // Pulse core
    this.pulsePhase += delta * 3;
    if (this.coreMesh && this.coreMesh.material instanceof THREE.MeshStandardMaterial) {
      const pulseIntensity = 0.5 + Math.sin(this.pulsePhase) * 0.5;
      this.coreMesh.material.emissiveIntensity = pulseIntensity + this.phase * 0.3;
    }
    
    // Change color based on phase
    if (this.bodyMesh && this.bodyMesh.material instanceof THREE.MeshStandardMaterial) {
      switch (this.phase) {
        case BossPhase.PHASE_1:
          this.bodyMesh.material.color.setHex(0x4a0080);
          break;
        case BossPhase.PHASE_2:
          this.bodyMesh.material.color.setHex(0x800040);
          break;
        case BossPhase.PHASE_3:
          this.bodyMesh.material.color.setHex(0x800000);
          break;
      }
    }
  }

  private performSpecialAttack(): void {
    if (!this.game.player) return;
    
    const playerPos = this.game.player.getPosition();
    const bossPos = this.mesh.position;
    const distance = bossPos.distanceTo(playerPos);
    
    // Different attacks based on phase
    switch (this.phase) {
      case BossPhase.PHASE_1:
        // Ground slam - area damage
        if (distance < 8) {
          this.game.player.takeDamage(this.damage * 0.5);
          this.createGroundSlamEffect();
        }
        break;
        
      case BossPhase.PHASE_2:
        // Dash attack
        this.performDashAttack(playerPos);
        break;
        
      case BossPhase.PHASE_3:
        // Combined attack
        if (distance < 10) {
          this.game.player.takeDamage(this.damage * 0.75);
          this.createGroundSlamEffect();
        }
        this.performDashAttack(playerPos);
        break;
    }
  }

  private createGroundSlamEffect(): void {
    if (this.disposed) return;
    
    // Store position before mesh might be removed
    const effectPosition = this.mesh.position.clone();
    
    // Create expanding ring effect
    const ringGeometry = new THREE.RingGeometry(0.5, 1, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0066,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(effectPosition);
    ring.position.y = 0.1;
    
    try {
      this.game.scene.add(ring);
    } catch (e) {
      ringGeometry.dispose();
      ringMaterial.dispose();
      return;
    }
    
    // Animate ring
    let scale = 1;
    const animate = () => {
      if (this.disposed) {
        try {
          this.game.scene.remove(ring);
        } catch (e) {
          // Ignore
        }
        ringGeometry.dispose();
        ringMaterial.dispose();
        return;
      }
      
      scale += 0.5;
      ring.scale.set(scale, scale, 1);
      ringMaterial.opacity = Math.max(0, 1 - scale / 10);
      
      if (scale < 10) {
        requestAnimationFrame(animate);
      } else {
        try {
          this.game.scene.remove(ring);
        } catch (e) {
          // Ignore
        }
        ringGeometry.dispose();
        ringMaterial.dispose();
      }
    };
    animate();
    
    this.game.audioManager.playSound('enemyHit');
  }

  private performDashAttack(targetPos: THREE.Vector3): void {
    const direction = new THREE.Vector3();
    direction.subVectors(targetPos, this.mesh.position);
    direction.y = 0;
    direction.normalize();
    
    // Quick dash towards player
    const dashDistance = 5;
    const newPos = this.mesh.position.clone();
    newPos.x += direction.x * dashDistance;
    newPos.z += direction.z * dashDistance;
    
    // Clamp to bounds
    newPos.x = Math.max(-23, Math.min(23, newPos.x));
    newPos.z = Math.max(-23, Math.min(23, newPos.z));
    
    // Create dash trail effect
    this.createDashTrail(this.mesh.position.clone(), newPos);
    
    // Move boss
    this.mesh.position.copy(newPos);
    
    // Check for collision with player
    if (this.game.player) {
      const distToPlayer = newPos.distanceTo(this.game.player.getPosition());
      if (distToPlayer < 2) {
        this.game.player.takeDamage(this.damage);
      }
    }
  }

  private createDashTrail(start: THREE.Vector3, end: THREE.Vector3): void {
    if (this.disposed) return;
    
    const trailGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array([
      start.x, start.y + 2, start.z,
      end.x, end.y + 2, end.z
    ]);
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const trailMaterial = new THREE.LineBasicMaterial({
      color: 0xff0066,
      transparent: true,
      opacity: 1
    });
    const trail = new THREE.Line(trailGeometry, trailMaterial);
    
    try {
      this.game.scene.add(trail);
    } catch (e) {
      trailGeometry.dispose();
      trailMaterial.dispose();
      return;
    }
    
    // Fade out trail
    let opacity = 1;
    const fadeTrail = () => {
      if (this.disposed) {
        try {
          this.game.scene.remove(trail);
        } catch (e) {
          // Ignore
        }
        trailGeometry.dispose();
        trailMaterial.dispose();
        return;
      }
      
      opacity -= 0.05;
      trailMaterial.opacity = opacity;
      
      if (opacity > 0) {
        requestAnimationFrame(fadeTrail);
      } else {
        try {
          this.game.scene.remove(trail);
        } catch (e) {
          // Ignore
        }
        trailGeometry.dispose();
        trailMaterial.dispose();
      }
    };
    fadeTrail();
  }

  protected getScoreValue(): number {
    return 1000;
  }

  protected die(): void {
    // Extended death sequence for boss
    super.die();
    
    // Create explosion effect
    this.createDeathExplosion();
  }

  private createDeathExplosion(): void {
    // Store position before mesh might be removed
    const deathPosition = this.mesh.position.clone();
    
    // Create multiple expanding spheres
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        // Check if disposed before creating effects
        if (this.disposed) return;
        
        const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const sphereMaterial = new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? 0xff0066 : 0x00ffff,
          transparent: true,
          opacity: 1
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.copy(deathPosition);
        sphere.position.y += 2;
        sphere.position.x += (Math.random() - 0.5) * 2;
        sphere.position.z += (Math.random() - 0.5) * 2;
        
        try {
          this.game.scene.add(sphere);
        } catch (e) {
          // Scene might be disposed, clean up and return
          sphereGeometry.dispose();
          sphereMaterial.dispose();
          return;
        }
        
        let scale = 1;
        const expand = () => {
          if (this.disposed) {
            // Clean up if disposed during animation
            try {
              this.game.scene.remove(sphere);
            } catch (e) {
              // Ignore if scene is gone
            }
            sphereGeometry.dispose();
            sphereMaterial.dispose();
            return;
          }
          
          scale += 0.3;
          sphere.scale.set(scale, scale, scale);
          sphereMaterial.opacity = Math.max(0, 1 - scale / 5);
          
          if (scale < 5) {
            requestAnimationFrame(expand);
          } else {
            try {
              this.game.scene.remove(sphere);
            } catch (e) {
              // Ignore if scene is gone
            }
            sphereGeometry.dispose();
            sphereMaterial.dispose();
          }
        };
        expand();
      }, i * 200);
    }
  }
  
  public dispose(): void {
    this.disposed = true;
    super.dispose();
  }
}
