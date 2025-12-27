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
  private joystickTouchId: number | null = null;
  private joystickStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private joystickCurrentPos: { x: number; y: number } = { x: 0, y: 0 };
  private touchLookStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private touchLookActive: boolean = false;
  private touchLookTouchId: number | null = null;
  private touchShootActive: boolean = false;
  private touchReloadActive: boolean = false;

  // Input state for this frame
  private currentInput: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    shoot: false,
    reload: false,
    pause: false,
    jump: false,
    mouseMovement: { x: 0, y: 0 }
  };
  
  // Mobile jump button state
  private touchJumpActive: boolean = false;

  constructor(game: Game) {
    this.game = game;
    this.isMobile = this.detectMobile();
    this.setupEventListeners();
    
    if (this.isMobile) {
      this.createTouchControls();
      this.requestLandscapeOrientation();
    }
  }
  
  private detectMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
  }
  
  private requestLandscapeOrientation(): void {
    // Try to lock to landscape orientation on mobile
    const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
    if (orientation && typeof orientation.lock === 'function') {
      orientation.lock('landscape').catch(() => {
        // Orientation lock not supported or denied - that's okay
        console.log('Landscape orientation lock not available');
      });
    }
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
    this.currentInput.jump = this.keys.has('Space');
    
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
    
    // Add touch reload input
    if (this.touchReloadActive) {
      this.currentInput.reload = true;
    }
    
    // Add touch jump input
    if (this.touchJumpActive) {
      this.currentInput.jump = true;
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
    
    // Create look area FIRST (so it's behind buttons in DOM order)
    // This covers the right side of the screen for looking around
    const lookArea = document.createElement('div');
    lookArea.id = 'look-area';
    lookArea.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      width: 60%;
      height: 100%;
      pointer-events: auto;
      z-index: 1;
    `;
    this.touchControls.appendChild(lookArea);
    
    // Create joystick (left side for movement)
    const joystickContainer = document.createElement('div');
    joystickContainer.style.cssText = `
      position: absolute;
      bottom: 15%;
      left: 5%;
      width: 120px;
      height: 120px;
      pointer-events: auto;
      z-index: 10;
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
    
    // Create shoot button (right side) - higher z-index than look area
    const shootButton = document.createElement('div');
    shootButton.id = 'shoot-button';
    shootButton.style.cssText = `
      position: absolute;
      bottom: 15%;
      right: 5%;
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
      z-index: 10;
    `;
    shootButton.textContent = 'FIRE';
    this.touchControls.appendChild(shootButton);
    
    // Create reload button - higher z-index than look area
    const reloadButton = document.createElement('div');
    reloadButton.id = 'reload-button';
    reloadButton.style.cssText = `
      position: absolute;
      bottom: 35%;
      right: 6%;
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
      z-index: 10;
    `;
    reloadButton.textContent = 'R';
    this.touchControls.appendChild(reloadButton);
    
    // Create jump button (left side, above joystick) - higher z-index
    const jumpButton = document.createElement('div');
    jumpButton.id = 'jump-button';
    jumpButton.style.cssText = `
      position: absolute;
      bottom: 35%;
      left: 6%;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(46, 204, 113, 0.6);
      border: 3px solid rgba(46, 204, 113, 0.8);
      pointer-events: auto;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: Arial, sans-serif;
      font-size: 12px;
      font-weight: bold;
      color: white;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
      z-index: 10;
    `;
    jumpButton.textContent = 'JUMP';
    this.touchControls.appendChild(jumpButton);

    // Make controls responsive to orientation changes
    window.addEventListener('orientationchange', () => {
      if (!this.touchControls) return;
      // After rotation, allow the layout to adapt with new dimensions
      // and keep controls visible in both orientations
      setTimeout(() => {
        if (!this.touchControls) return;
        this.touchControls.style.width = '100%';
        this.touchControls.style.height = '100%';
        // Re-request landscape on orientation change
        this.requestLandscapeOrientation();
      }, 100);
    });
    
    // Setup touch event listeners with multi-touch support
    this.setupTouchListeners(joystickContainer, shootButton, reloadButton, lookArea, jumpButton);
  }
  
  private setupTouchListeners(
    joystickContainer: HTMLElement,
    shootButton: HTMLElement,
    reloadButton: HTMLElement,
    lookArea: HTMLElement,
    jumpButton: HTMLElement
  ): void {
    // Joystick touch events with touch identifier tracking
    joystickContainer.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const touch = e.changedTouches[0];
      this.joystickTouchId = touch.identifier;
      const rect = joystickContainer.getBoundingClientRect();
      this.joystickStartPos = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      this.joystickActive = true;
    }, { passive: false });
    
    joystickContainer.addEventListener('touchmove', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!this.joystickActive || !this.joystickInner || this.joystickTouchId === null) return;
      
      // Find the touch with our identifier
      let touch: Touch | null = null;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === this.joystickTouchId) {
          touch = e.touches[i];
          break;
        }
      }
      if (!touch) return;
      
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
    
    joystickContainer.addEventListener('touchend', (e) => {
      e.stopPropagation();
      // Check if our touch ended
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.joystickTouchId) {
          this.joystickActive = false;
          this.joystickTouchId = null;
          this.joystickCurrentPos = { x: 0, y: 0 };
          if (this.joystickInner) {
            this.joystickInner.style.transform = 'translate(-50%, -50%)';
          }
          break;
        }
      }
    });
    
    joystickContainer.addEventListener('touchcancel', (e) => {
      e.stopPropagation();
      this.joystickActive = false;
      this.joystickTouchId = null;
      this.joystickCurrentPos = { x: 0, y: 0 };
      if (this.joystickInner) {
        this.joystickInner.style.transform = 'translate(-50%, -50%)';
      }
    });
    
    // Shoot button events
    shootButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.touchShootActive = true;
      shootButton.style.background = 'rgba(231, 76, 60, 0.9)';
    }, { passive: false });
    
    shootButton.addEventListener('touchend', (e) => {
      e.stopPropagation();
      this.touchShootActive = false;
      shootButton.style.background = 'rgba(231, 76, 60, 0.6)';
    });
    
    shootButton.addEventListener('touchcancel', (e) => {
      e.stopPropagation();
      this.touchShootActive = false;
      shootButton.style.background = 'rgba(231, 76, 60, 0.6)';
    });
    
    // Reload button events
    reloadButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.touchReloadActive = true;
      reloadButton.style.background = 'rgba(52, 152, 219, 0.9)';
    }, { passive: false });
    
    reloadButton.addEventListener('touchend', (e) => {
      e.stopPropagation();
      this.touchReloadActive = false;
      reloadButton.style.background = 'rgba(52, 152, 219, 0.6)';
    });
    
    reloadButton.addEventListener('touchcancel', (e) => {
      e.stopPropagation();
      this.touchReloadActive = false;
      reloadButton.style.background = 'rgba(52, 152, 219, 0.6)';
    });
    
    // Look area touch events with touch identifier tracking
    lookArea.addEventListener('touchstart', (e) => {
      e.preventDefault();
      // Don't stop propagation - let it bubble but track our touch
      const touch = e.changedTouches[0];
      this.touchLookTouchId = touch.identifier;
      this.touchLookStartPos = { x: touch.clientX, y: touch.clientY };
      this.touchLookActive = true;
    }, { passive: false });
    
    lookArea.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!this.touchLookActive || this.touchLookTouchId === null) return;
      
      // Find the touch with our identifier
      let touch: Touch | null = null;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === this.touchLookTouchId) {
          touch = e.touches[i];
          break;
        }
      }
      if (!touch) return;
      
      const deltaX = touch.clientX - this.touchLookStartPos.x;
      const deltaY = touch.clientY - this.touchLookStartPos.y;
       
      // Add to mouse delta for look controls
      // Higher sensitivity for mobile look
      this.mouseDelta.x += deltaX * 1.5;
      this.mouseDelta.y += deltaY * 1.2;
       
      this.touchLookStartPos = { x: touch.clientX, y: touch.clientY };
    }, { passive: false });
    
    lookArea.addEventListener('touchend', (e) => {
      // Check if our touch ended
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.touchLookTouchId) {
          this.touchLookActive = false;
          this.touchLookTouchId = null;
          break;
        }
      }
    });
    
    lookArea.addEventListener('touchcancel', () => {
      this.touchLookActive = false;
      this.touchLookTouchId = null;
    });
    
    // Jump button events
    jumpButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.touchJumpActive = true;
      jumpButton.style.background = 'rgba(46, 204, 113, 0.9)';
    }, { passive: false });
    
    jumpButton.addEventListener('touchend', (e) => {
      e.stopPropagation();
      this.touchJumpActive = false;
      jumpButton.style.background = 'rgba(46, 204, 113, 0.6)';
    });
    
    jumpButton.addEventListener('touchcancel', (e) => {
      e.stopPropagation();
      this.touchJumpActive = false;
      jumpButton.style.background = 'rgba(46, 204, 113, 0.6)';
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
