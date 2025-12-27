import * as THREE from 'three';
import { Game } from '../../core/Game';
import { Enemy } from '../Enemy';
import { EnemyType, GAME_CONSTANTS, ColorPalette } from '../../types';

export class FastEnemy extends Enemy {
  private bobPhase: number = 0;
  
  constructor(game: Game, position: THREE.Vector3) {
    super(game, position, {
      type: EnemyType.FAST,
      health: GAME_CONSTANTS.ENEMY.FAST.HEALTH,
      speed: GAME_CONSTANTS.ENEMY.FAST.SPEED,
      damage: GAME_CONSTANTS.ENEMY.FAST.DAMAGE,
      attackRange: GAME_CONSTANTS.ENEMY.FAST.ATTACK_RANGE,
      detectionRange: GAME_CONSTANTS.ENEMY.FAST.DETECTION_RANGE,
      attackCooldown: GAME_CONSTANTS.ENEMY.FAST.ATTACK_COOLDOWN
    });
  }

  protected createBody(): { body: THREE.Mesh; eye: THREE.Mesh } {
    // Body - smaller, sleeker shape
    const bodyGeometry = new THREE.CapsuleGeometry(0.25, 0.8, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      roughness: 0.5,
      metalness: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.7;
    body.castShadow = true;
    
    // Head - more angular
    const headGeometry = new THREE.ConeGeometry(0.2, 0.4, 4);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      roughness: 0.5
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.4;
    head.rotation.x = Math.PI;
    head.castShadow = true;
    body.add(head);
    
    // Eye (single glowing eye)
    const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.8
    });
    const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eye.position.set(0, 1.2, 0.2);
    
    // Speed trails (decorative)
    const trailGeometry = new THREE.PlaneGeometry(0.1, 0.5);
    const trailMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    
    const leftTrail = new THREE.Mesh(trailGeometry, trailMaterial);
    leftTrail.position.set(-0.3, 0.7, -0.2);
    leftTrail.rotation.y = Math.PI / 4;
    body.add(leftTrail);
    
    const rightTrail = new THREE.Mesh(trailGeometry, trailMaterial);
    rightTrail.position.set(0.3, 0.7, -0.2);
    rightTrail.rotation.y = -Math.PI / 4;
    body.add(rightTrail);
    
    return { body, eye };
  }

  public update(delta: number): void {
    super.update(delta);
    
    // Add bobbing motion when moving
    if (!this.isDying) {
      this.bobPhase += delta * 15;
      this.mesh.position.y = Math.sin(this.bobPhase) * 0.1;
    }
  }

  protected getScoreValue(): number {
    return 150;
  }
}
