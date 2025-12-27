import { Game } from '../core/Game';
import { InputState, GameState } from '../types';

export class InputManager {
  private game: Game;
  private keys: Set<string> = new Set();
  private mouseButtons: Set<number> = new Set();
  private mouseDelta: { x: number; y: number } = { x: 0, y: 0 };
  private isPointerLocked: boolean = false;
  
  // Mobile touch controls
  private isMobile: boolean = false;
  private touchControls: HTMLElement | null = null;
  private joystickOuter: HTMLElement | null = null;
  private joystickInner: HTMLElement | null = null;
  private joystickActive: boolean = false;
  private joystickStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private joystickCurrentPos: { x: number; y: number } = { x: 0, y: 0 };
  private touchLookStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private touchLookActive: boolean = false;
  private touchShootActive: boolean = false;

  // Input state for this frame
  private currentInput: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    shoot: false,
    reload: false,
    pause: false,
    mouseMovement: { x: 0, y: 0 }
  };

  constructor(game: Game) {
    this.game = game;
    this.isMobile = this.detectMobile();
    this.setupEventListeners();
    
    if (this.isMobile) {
      this.createTouchControls();
    }
  }
  
  private detectMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
  }

  private setupEventListeners(): void {
    // Keyboard events
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));
    
    // Mouse events
    document.addEventListener('mousedown', this.onMouseDown.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    
    // Pointer lock events
    document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this));
    document.addEventListener('pointerlockerror', this.onPointerLockError.bind(this));
    
    // Prevent context menu
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private onKeyDown(event: KeyboardEvent): void {
    this.keys.add(event.code);
    
    // Handle pause on Escape
    if (event.code === 'Escape') {
      if (this.game.getGameState() === GameState.PLAYING) {
        this.game.pause();
      } else if (this.game.getGameState() === GameState.PAUSED) {
        this.game.resume();
      }
    }
    
    // Prevent default for game keys
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyR', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.keys.delete(event.code);
  }

  private onMouseDown(event: MouseEvent): void {
    this.mouseButtons.add(event.button);
    
    // Don't auto-lock pointer here - let the click-to-play handler manage this
    // The game.start() method will call lockPointer() when appropriate
  }

  private onMouseUp(event: MouseEvent): void {
    this.mouseButtons.delete(event.button);
  }

  private onMouseMove(event: MouseEvent): void {
    if (this.isPointerLocked) {
      this.mouseDelta.x += event.movementX;
      this.mouseDelta.y += event.movementY;
    }
  }

  private onPointerLockChange(): void {
    this.isPointerLocked = document.pointerLockElement === this.game.renderer.domElement;
    
    if (!this.isPointerLocked && this.game.getGameState() === GameState.PLAYING) {
      this.game.pause();
    }
  }

  private onPointerLockError(): void {
    console.error('Pointer lock error');
  }

  public lockPointer(): void {
    this.game.renderer.domElement.requestPointerLock();
  }

  public unlockPointer(): void {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  public getInput(): InputState {
    // Update input state from keyboard
    this.currentInput.forward = this.keys.has('KeyW') || this.keys.has('ArrowUp');
    this.currentInput.backward = this.keys.has('KeyS') || this.keys.has('ArrowDown');
    this.currentInput.left = this.keys.has('KeyA') || this.keys.has('ArrowLeft');
    this.currentInput.right = this.keys.has('KeyD') || this.keys.has('ArrowRight');
    this.currentInput.shoot = this.mouseButtons.has(0); // Left click
    this.currentInput.reload = this.keys.has('KeyR');
    this.currentInput.pause = this.keys.has('Escape');
    
    // Add touch joystick input
    if (this.isMobile && this.joystickActive) {
      // Joystick Y is inverted (up is negative)
      if (this.joystickCurrentPos.y < -0.3) this.currentInput.forward = true;
      if (this.joystickCurrentPos.y > 0.3) this.currentInput.backward = true;
      if (this.joystickCurrentPos.x < -0.3) this.currentInput.left = true;
      if (this.joystickCurrentPos.x > 0.3) this.currentInput.right = true;
    }
    
    // Add touch shoot input
    if (this.touchShootActive) {
      this.currentInput.shoot = true;
    }
    
    // Get mouse movement and reset delta
    this.currentInput.mouseMovement = { ...this.mouseDelta };
    this.mouseDelta = { x: 0, y: 0 };
    
    return this.currentInput;
  }

  public isKeyPressed(code: string): boolean {
    return this.keys.has(code);
  }

  public isMouseButtonPressed(button: number): boolean {
    return this.mouseButtons.has(button);
  }

  public getMouseDelta(): { x: number; y: number } {
    return { ...this.mouseDelta };
  }

  public isLocked(): boolean {
    return this.isPointerLocked || this.isMobile;
  }
  
  public isMobileDevice(): boolean {
    return this.isMobile;
  }
  
  private createTouchControls(): void {
    // Create touch controls container
    this.touchControls = document.createElement('div');
    this.touchControls.id = 'touch-controls';
    this.touchControls.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 200;
      display: none;
    `;
    document.body.appendChild(this.touchControls);
    
    // Create joystick (left side for movement)
    const joystickContainer = document.createElement('div');
    joystickContainer.style.cssText = `
      position: absolute;
      bottom: 80px;
      left: 40px;
      width: 120px;
      height: 120px;
      pointer-events: auto;
    `;
    
    this.joystickOuter = document.createElement('div');
    this.joystickOuter.style.cssText = `
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      border: 3px solid rgba(255, 255, 255, 0.4);
      position: relative;
    `;
    
    this.joystickInner = document.createElement('div');
    this.joystickInner.style.cssText = `
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.6);
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    `;
    
    this.joystickOuter.appendChild(this.joystickInner);
    joystickContainer.appendChild(this.joystickOuter);
    this.touchControls.appendChild(joystickContainer);
    
    // Create shoot button (right side)
    const shootButton = document.createElement('div');
    shootButton.id = 'shoot-button';
    shootButton.style.cssText = `
      position: absolute;
      bottom: 80px;
      right: 40px;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(231, 76, 60, 0.6);
      border: 3px solid rgba(231, 76, 60, 0.8);
      pointer-events: auto;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: Arial, sans-serif;
      font-size: 14px;
      font-weight: bold;
      color: white;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
    `;
    shootButton.textContent = 'FIRE';
    this.touchControls.appendChild(shootButton);
    
    // Create reload button
    const reloadButton = document.createElement('div');
    reloadButton.id = 'reload-button';
    reloadButton.style.cssText = `
      position: absolute;
      bottom: 180px;
      right: 50px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(52, 152, 219, 0.6);
      border: 3px solid rgba(52, 152, 219, 0.8);
      pointer-events: auto;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: Arial, sans-serif;
      font-size: 12px;
      font-weight: bold;
      color: white;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
    `;
    reloadButton.textContent = 'R';
    this.touchControls.appendChild(reloadButton);
    
    // Create look area (right half of screen for looking around)
    const lookArea = document.createElement('div');
    lookArea.id = 'look-area';
    lookArea.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      width: 55%;
      height: 100%;
      pointer-events: auto;
    `;
    this.touchControls.appendChild(lookArea);

    // Make controls responsive to orientation changes
    window.addEventListener('orientationchange', () => {
      if (!this.touchControls) return;
      // After rotation, allow the layout to adapt with new dimensions
      // and keep controls visible in both orientations
      setTimeout(() => {
        if (!this.touchControls) return;
        this.touchControls.style.width = '100%';
        this.touchControls.style.height = '100%';
      }, 50);
    });
    
    // Setup touch event listeners
    this.setupTouchListeners(joystickContainer, shootButton, reloadButton, lookArea);
  }
  
  private setupTouchListeners(
    joystickContainer: HTMLElement,
    shootButton: HTMLElement,
    reloadButton: HTMLElement,
    lookArea: HTMLElement
  ): void {
    // Joystick touch events
    joystickContainer.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = joystickContainer.getBoundingClientRect();
      this.joystickStartPos = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      this.joystickActive = true;
    }, { passive: false });
    
    joystickContainer.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!this.joystickActive || !this.joystickInner) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - this.joystickStartPos.x;
      const deltaY = touch.clientY - this.joystickStartPos.y;
      
      // Limit joystick movement
      const maxDistance = 35;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const clampedDistance = Math.min(distance, maxDistance);
      const angle = Math.atan2(deltaY, deltaX);
      
      const clampedX = Math.cos(angle) * clampedDistance;
      const clampedY = Math.sin(angle) * clampedDistance;
      
      this.joystickCurrentPos = {
        x: clampedX / maxDistance,
        y: clampedY / maxDistance
      };
      
      // Update joystick visual
      this.joystickInner.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`;
    }, { passive: false });
    
    joystickContainer.addEventListener('touchend', () => {
      this.joystickActive = false;
      this.joystickCurrentPos = { x: 0, y: 0 };
      if (this.joystickInner) {
        this.joystickInner.style.transform = 'translate(-50%, -50%)';
      }
    });
    
    // Shoot button events
    shootButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.touchShootActive = true;
      shootButton.style.background = 'rgba(231, 76, 60, 0.9)';
    }, { passive: false });
    
    shootButton.addEventListener('touchend', () => {
      this.touchShootActive = false;
      shootButton.style.background = 'rgba(231, 76, 60, 0.6)';
    });
    
    // Reload button events
    reloadButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.keys.add('KeyR');
      reloadButton.style.background = 'rgba(52, 152, 219, 0.9)';
    }, { passive: false });
    
    reloadButton.addEventListener('touchend', () => {
      this.keys.delete('KeyR');
      reloadButton.style.background = 'rgba(52, 152, 219, 0.6)';
    });
    
    // Look area touch events
    lookArea.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.touchLookStartPos = { x: touch.clientX, y: touch.clientY };
      this.touchLookActive = true;
    }, { passive: false });
    
    lookArea.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!this.touchLookActive) return;
      
      const touch = e.touches[0];
       const deltaX = touch.clientX - this.touchLookStartPos.x;
       const deltaY = touch.clientY - this.touchLookStartPos.y;
       
       // Add to mouse delta for look controls
       // Increase sensitivity for mobile look and dampen vertical slightly to reduce nausea
       this.mouseDelta.x += deltaX * 0.8;
       this.mouseDelta.y += deltaY * 0.6;
       
       this.touchLookStartPos = { x: touch.clientX, y: touch.clientY };
    }, { passive: false });
    
    lookArea.addEventListener('touchend', () => {
      this.touchLookActive = false;
    });
  }
  
  public showTouchControls(): void {
    if (this.touchControls) {
      this.touchControls.style.display = 'block';
    }
  }
  
  public hideTouchControls(): void {
    if (this.touchControls) {
      this.touchControls.style.display = 'none';
    }
  }

  public dispose(): void {
    document.removeEventListener('keydown', this.onKeyDown.bind(this));
    document.removeEventListener('keyup', this.onKeyUp.bind(this));
    document.removeEventListener('mousedown', this.onMouseDown.bind(this));
    document.removeEventListener('mouseup', this.onMouseUp.bind(this));
    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
    document.removeEventListener('pointerlockchange', this.onPointerLockChange.bind(this));
    document.removeEventListener('pointerlockerror', this.onPointerLockError.bind(this));
    
    if (this.touchControls) {
      this.touchControls.remove();
    }
  }
}
