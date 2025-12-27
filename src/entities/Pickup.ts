import * as THREE from 'three';
import { Game } from '../core/Game';
import { Player } from './Player';
import { PickupType, GAME_CONSTANTS, ColorPalette } from '../types';

export class Pickup {
  private game: Game;
  public mesh: THREE.Group;
  private type: PickupType;
  private rotationSpeed: number = 2;
  private bobPhase: number = 0;
  private bobSpeed: number = 3;
  private bobHeight: number = 0.2;
  private baseY: number;
  private glowLight: THREE.PointLight;

  constructor(game: Game, position: THREE.Vector3, type: PickupType) {
    this.game = game;
    this.type = type;
    this.baseY = position.y;
    
    // Create mesh group
    this.mesh = new THREE.Group();
    this.mesh.position.copy(position);
    
    // Create pickup based on type
    const pickupMesh = this.createPickupMesh();
    this.mesh.add(pickupMesh);
    
    // Add glow light
    const glowColor = type === PickupType.HEALTH ? ColorPalette.ACCENT : ColorPalette.PRIMARY;
    this.glowLight = new THREE.PointLight(glowColor, 0.5, 3);
    this.glowLight.position.y = 0.5;
    this.mesh.add(this.glowLight);
  }

  private createPickupMesh(): THREE.Object3D {
    const group = new THREE.Object3D();
    
    if (this.type === PickupType.HEALTH) {
      // Health pickup - cross shape
      const material = new THREE.MeshStandardMaterial({
        color: ColorPalette.ACCENT,
        emissive: ColorPalette.ACCENT,
        emissiveIntensity: 0.3,
        roughness: 0.3,
        metalness: 0.5
      });
      
      // Vertical bar
      const vertGeometry = new THREE.BoxGeometry(0.15, 0.5, 0.15);
      const vertBar = new THREE.Mesh(vertGeometry, material);
      vertBar.position.y = 0.5;
      group.add(vertBar);
      
      // Horizontal bar
      const horizGeometry = new THREE.BoxGeometry(0.5, 0.15, 0.15);
      const horizBar = new THREE.Mesh(horizGeometry, material);
      horizBar.position.y = 0.5;
      group.add(horizBar);
      
      // Base container
      const baseGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 8);
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a6b3a,
        roughness: 0.5
      });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = 0.1;
      group.add(base);
      
    } else {
      // Ammo pickup - box with bullets
      const material = new THREE.MeshStandardMaterial({
        color: ColorPalette.PRIMARY,
        emissive: ColorPalette.PRIMARY,
        emissiveIntensity: 0.3,
        roughness: 0.4,
        metalness: 0.6
      });
      
      // Ammo box
      const boxGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.35);
      const box = new THREE.Mesh(boxGeometry, material);
      box.position.y = 0.4;
      group.add(box);
      
      // Bullet representations
      const bulletMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.8,
        roughness: 0.2
      });
      
      for (let i = 0; i < 3; i++) {
        const bulletGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 6);
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        bullet.position.set(-0.12 + i * 0.12, 0.65, 0);
        bullet.rotation.x = Math.PI / 6;
        group.add(bullet);
      }
    }
    
    return group;
  }

  public update(delta: number): void {
    // Rotate
    this.mesh.rotation.y += this.rotationSpeed * delta;
    
    // Bob up and down
    this.bobPhase += this.bobSpeed * delta;
    this.mesh.position.y = this.baseY + Math.sin(this.bobPhase) * this.bobHeight;
    
    // Pulse glow
    const glowIntensity = 0.3 + Math.sin(this.bobPhase * 2) * 0.2;
    this.glowLight.intensity = glowIntensity;
  }

  public collect(player: Player): void {
    switch (this.type) {
      case PickupType.HEALTH:
        player.heal(GAME_CONSTANTS.PICKUP.HEALTH_AMOUNT);
        break;
      case PickupType.AMMO:
        player.addAmmo(GAME_CONSTANTS.PICKUP.AMMO_AMOUNT);
        break;
    }
  }

  public getType(): PickupType {
    return this.type;
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
