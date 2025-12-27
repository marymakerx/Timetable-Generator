import * as THREE from 'three';
import { Game } from '../../core/Game';
import { Enemy } from '../Enemy';
import { EnemyType, GAME_CONSTANTS, ColorPalette } from '../../types';

export class BasicEnemy extends Enemy {
  constructor(game: Game, position: THREE.Vector3) {
    super(game, position, {
      type: EnemyType.BASIC,
      health: GAME_CONSTANTS.ENEMY.BASIC.HEALTH,
      speed: GAME_CONSTANTS.ENEMY.BASIC.SPEED,
      damage: GAME_CONSTANTS.ENEMY.BASIC.DAMAGE,
      attackRange: GAME_CONSTANTS.ENEMY.BASIC.ATTACK_RANGE,
      detectionRange: GAME_CONSTANTS.ENEMY.BASIC.DETECTION_RANGE,
      attackCooldown: GAME_CONSTANTS.ENEMY.BASIC.ATTACK_COOLDOWN
    });
  }

  protected createBody(): { body: THREE.Mesh; eye: THREE.Mesh } {
    // Body - simple humanoid shape
    const bodyGeometry = new THREE.CapsuleGeometry(0.4, 1.2, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: ColorPalette.SECONDARY,
      roughness: 0.7,
      metalness: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    body.castShadow = true;
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: ColorPalette.SECONDARY,
      roughness: 0.7
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.9;
    head.castShadow = true;
    body.add(head);
    
    // Eye (visor)
    const eyeGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.1);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.5
    });
    const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eye.position.set(0, 1.95, 0.25);
    
    // Arms
    const armGeometry = new THREE.CapsuleGeometry(0.1, 0.5, 4, 8);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b0000,
      roughness: 0.7
    });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.5, 1.2, 0);
    leftArm.rotation.z = 0.3;
    body.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.5, 1.2, 0);
    rightArm.rotation.z = -0.3;
    body.add(rightArm);
    
    return { body, eye };
  }

  protected getScoreValue(): number {
    return 100;
  }
}
