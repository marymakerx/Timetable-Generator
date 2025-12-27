import { Game } from './Game';

export class GameLoop {
  private game: Game;
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  
  // Delta time smoothing
  private deltaHistory: number[] = [];
  private maxDeltaHistory: number = 10;
  
  // FPS tracking
  private frameCount: number = 0;
  private fpsTime: number = 0;
  public currentFPS: number = 0;

  constructor(game: Game) {
    this.game = game;
  }

  public start(): void {
    if (this.isRunning) {
      console.log('GameLoop.start() - already running');
      return;
    }
    
    console.log('GameLoop.start() - starting game loop');
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop(): void {
    this.isRunning = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop = (currentTime: number): void => {
    if (!this.isRunning) return;
    
    // Calculate delta time
    let delta = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    // Clamp delta to prevent huge jumps
    delta = Math.min(delta, 0.1);
    
    // Smooth delta time
    this.deltaHistory.push(delta);
    if (this.deltaHistory.length > this.maxDeltaHistory) {
      this.deltaHistory.shift();
    }
    const smoothedDelta = this.deltaHistory.reduce((a, b) => a + b, 0) / this.deltaHistory.length;
    
    // Track FPS
    this.frameCount++;
    this.fpsTime += delta;
    if (this.fpsTime >= 1) {
      this.currentFPS = this.frameCount;
      this.frameCount = 0;
      this.fpsTime = 0;
    }
    
    // Update game
    this.game.update(smoothedDelta);
    
    // Render
    this.game.render();
    
    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  public isActive(): boolean {
    return this.isRunning;
  }

  public getFPS(): number {
    return this.currentFPS;
  }
}
