import { Game } from '../core/Game';
import { InputState, GameState } from '../types';

export class InputManager {
  private game: Game;
  private keys: Set<string> = new Set();
  private mouseButtons: Set<number> = new Set();
  private mouseDelta: { x: number; y: number } = { x: 0, y: 0 };
  private isPointerLocked: boolean = false;

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
    this.setupEventListeners();
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
    
    // Request pointer lock on click if in menu
    if (!this.isPointerLocked && this.game.getGameState() === GameState.MAIN_MENU) {
      this.lockPointer();
    }
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
    // Update input state
    this.currentInput.forward = this.keys.has('KeyW') || this.keys.has('ArrowUp');
    this.currentInput.backward = this.keys.has('KeyS') || this.keys.has('ArrowDown');
    this.currentInput.left = this.keys.has('KeyA') || this.keys.has('ArrowLeft');
    this.currentInput.right = this.keys.has('KeyD') || this.keys.has('ArrowRight');
    this.currentInput.shoot = this.mouseButtons.has(0); // Left click
    this.currentInput.reload = this.keys.has('KeyR');
    this.currentInput.pause = this.keys.has('Escape');
    
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
    return this.isPointerLocked;
  }

  public dispose(): void {
    document.removeEventListener('keydown', this.onKeyDown.bind(this));
    document.removeEventListener('keyup', this.onKeyUp.bind(this));
    document.removeEventListener('mousedown', this.onMouseDown.bind(this));
    document.removeEventListener('mouseup', this.onMouseUp.bind(this));
    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
    document.removeEventListener('pointerlockchange', this.onPointerLockChange.bind(this));
    document.removeEventListener('pointerlockerror', this.onPointerLockError.bind(this));
  }
}
