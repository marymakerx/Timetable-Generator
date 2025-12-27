import * as THREE from 'three';
import { GameState, GameStats } from '../types';
import { GameLoop } from './GameLoop';
import { InputManager } from '../managers/InputManager';
import { AudioManager } from '../managers/AudioManager';
import { UIManager } from '../managers/UIManager';
import { LevelManager } from '../managers/LevelManager';
import { Player } from '../entities/Player';

export class Game {
  private static instance: Game;
  
  // Three.js core
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  
  // Managers
  public inputManager: InputManager;
  public audioManager: AudioManager;
  public uiManager: UIManager;
  public levelManager: LevelManager;
  
  // Game state
  private gameState: GameState = GameState.LOADING;
  private gameLoop: GameLoop;
  
  // Player
  public player: Player | null = null;
  
  // Stats
  public stats: GameStats = {
    score: 0,
    kills: 0,
    accuracy: 0,
    shotsFired: 0,
    shotsHit: 0,
    timeElapsed: 0,
    currentLevel: 1
  };
  
  // Container
  private container: HTMLElement;

  private constructor() {
    // Get container
    this.container = document.getElementById('game-container')!;
    
    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x1a1a2e);
    this.container.appendChild(this.renderer.domElement);
    
    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x1a1a2e, 0.02);
    
    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    // Initialize managers
    this.inputManager = new InputManager(this);
    this.audioManager = new AudioManager();
    this.uiManager = new UIManager(this);
    this.levelManager = new LevelManager(this);
    
    // Initialize game loop
    this.gameLoop = new GameLoop(this);
    
    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    // Update loading progress
    this.updateLoadingProgress(10, 'Initializing renderer...');
  }

  public static getInstance(): Game {
    if (!Game.instance) {
      Game.instance = new Game();
    }
    return Game.instance;
  }

  public async init(): Promise<void> {
    try {
      // Load audio
      this.updateLoadingProgress(30, 'Loading audio...');
      await this.audioManager.init();
      
      // Initialize UI
      this.updateLoadingProgress(50, 'Setting up UI...');
      this.uiManager.init();
      
      // Load first level
      this.updateLoadingProgress(70, 'Loading level...');
      await this.levelManager.loadLevel(1);
      
      // Initialize player
      this.updateLoadingProgress(90, 'Spawning player...');
      this.initPlayer();
      
      // Complete loading
      this.updateLoadingProgress(100, 'Ready!');
      
      // Wait a moment before hiding loading screen
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Show click to play
      this.hideLoadingScreen();
      this.showClickToPlay();
      
      // Render initial frame so the scene is visible
      this.render();
      
    } catch (error) {
      console.error('Failed to initialize game:', error);
      this.updateLoadingProgress(0, 'Error loading game!');
    }
  }

  private initPlayer(): void {
    const spawnPoint = this.levelManager.getPlayerSpawn();
    console.log('Initializing player at spawn point:', spawnPoint);
    this.player = new Player(this, spawnPoint);
    this.scene.add(this.player.mesh);
    console.log('Player mesh added to scene. Scene children count:', this.scene.children.length);
    console.log('Camera world position:', this.camera.getWorldPosition(new THREE.Vector3()));
  }

  public start(): void {
    console.log('Game.start() called, current state:', this.gameState);
    
    if (this.gameState === GameState.LOADING) {
      console.warn('Game.start() aborted - still in LOADING state');
      return;
    }
    
    // Prevent starting if already playing
    if (this.gameState === GameState.PLAYING) {
      console.warn('Game.start() aborted - already playing');
      return;
    }
    
    console.log('Starting game...');
    this.setGameState(GameState.PLAYING);
    
    // Start game loop first, then request pointer lock
    // This ensures the game is running even if pointer lock fails
    this.gameLoop.start();
    this.audioManager.playMusic('level1');
    
    // Show touch controls on mobile
    if (this.inputManager.isMobileDevice()) {
      this.inputManager.showTouchControls();
    } else {
      // Request pointer lock on desktop - this may fail but game should still work
      try {
        this.inputManager.lockPointer();
      } catch (e) {
        console.warn('Failed to lock pointer:', e);
      }
    }
    
    console.log('Game started successfully, state:', this.gameState);
  }

  public pause(): void {
    if (this.gameState !== GameState.PLAYING) return;
    
    this.setGameState(GameState.PAUSED);
    this.inputManager.unlockPointer();
    this.inputManager.hideTouchControls();
    this.uiManager.showPauseMenu();
    this.audioManager.pauseMusic();
  }

  public resume(): void {
    if (this.gameState !== GameState.PAUSED) return;
    
    this.setGameState(GameState.PLAYING);
    if (this.inputManager.isMobileDevice()) {
      this.inputManager.showTouchControls();
    } else {
      this.inputManager.lockPointer();
    }
    this.uiManager.hidePauseMenu();
    this.audioManager.resumeMusic();
  }

  public gameOver(): void {
    this.setGameState(GameState.GAME_OVER);
    this.inputManager.unlockPointer();
    this.audioManager.playSound('gameOver');
    this.audioManager.stopMusic();
    this.uiManager.showGameOver();
  }

  public victory(): void {
    this.setGameState(GameState.VICTORY);
    this.inputManager.unlockPointer();
    this.audioManager.playSound('victory');
    this.audioManager.stopMusic();
    this.uiManager.showVictory();
  }

  public levelComplete(): void {
    // Prevent multiple level complete triggers
    if (this.gameState === GameState.LEVEL_COMPLETE) return;
    
    this.setGameState(GameState.LEVEL_COMPLETE);
    this.audioManager.playSound('levelComplete');
    
    // Show level complete message
    this.uiManager.showLevelComplete(this.stats.currentLevel);
    
    // Auto-advance to next level after delay
    setTimeout(() => {
      this.nextLevel();
    }, 2000);
  }

  public async nextLevel(): Promise<void> {
    const nextLevelId = this.stats.currentLevel + 1;
    
    if (nextLevelId > 3) {
      this.victory();
      return;
    }
    
    this.stats.currentLevel = nextLevelId;
    await this.levelManager.loadLevel(nextLevelId);
    
    // Reset player position
    if (this.player) {
      const spawnPoint = this.levelManager.getPlayerSpawn();
      this.player.reset(spawnPoint);
    }
    
    this.setGameState(GameState.PLAYING);
    this.inputManager.lockPointer();
    this.audioManager.playMusic(`level${nextLevelId}`);
  }

  public restart(): void {
    // Reset stats
    this.stats = {
      score: 0,
      kills: 0,
      accuracy: 0,
      shotsFired: 0,
      shotsHit: 0,
      timeElapsed: 0,
      currentLevel: 1
    };
    
    // Reload level
    this.levelManager.loadLevel(1);
    
    // Reset player
    if (this.player) {
      const spawnPoint = this.levelManager.getPlayerSpawn();
      this.player.reset(spawnPoint);
    }
    
    // Start game
    this.setGameState(GameState.PLAYING);
    this.inputManager.lockPointer();
    this.uiManager.hideAllMenus();
    this.audioManager.playMusic('level1');
  }

  public mainMenu(): void {
    // Stop the game loop
    this.gameLoop.stop();
    
    // Hide touch controls
    this.inputManager.hideTouchControls();
    
    // Reset stats
    this.stats = {
      score: 0,
      kills: 0,
      accuracy: 0,
      shotsFired: 0,
      shotsHit: 0,
      timeElapsed: 0,
      currentLevel: 1
    };
    
    // Reload level 1
    this.levelManager.loadLevel(1);
    
    // Reset player
    if (this.player) {
      const spawnPoint = this.levelManager.getPlayerSpawn();
      this.player.reset(spawnPoint);
    }
    
    this.setGameState(GameState.MAIN_MENU);
    this.inputManager.unlockPointer();
    this.uiManager.hideAllMenus();
    this.uiManager.showMainMenu();
    this.audioManager.playMusic('menu');
    
    // Re-attach click-to-play handler
    this.attachClickToPlayHandler();
    
    // Render a frame so the scene is visible behind the menu
    this.render();
  }
  
  private attachClickToPlayHandler(): void {
    const clickToPlay = document.getElementById('click-to-play');
    if (clickToPlay) {
      // Remove any existing listeners by cloning and replacing
      const newClickToPlay = clickToPlay.cloneNode(true) as HTMLElement;
      clickToPlay.parentNode?.replaceChild(newClickToPlay, clickToPlay);
      
      const handleStart = () => {
        console.log('Click-to-play activated (re-attached)!');
        newClickToPlay.classList.remove('visible');
        newClickToPlay.removeEventListener('click', handleStart);
        newClickToPlay.removeEventListener('touchstart', handleStart);
        
        // Small delay to ensure the overlay is hidden before starting
        requestAnimationFrame(() => {
          this.start();
        });
      };
      
      newClickToPlay.addEventListener('click', handleStart);
      newClickToPlay.addEventListener('touchstart', handleStart, { passive: false });
    }
  }

  public update(delta: number): void {
    if (this.gameState !== GameState.PLAYING) return;
    
    // Update stats
    this.stats.timeElapsed += delta;
    
    // Update player
    if (this.player) {
      this.player.update(delta);
    }
    
    // Update level (enemies, pickups, etc.)
    this.levelManager.update(delta);
    
    // Update UI
    this.uiManager.update();
    
    // Check for level completion
    if (this.levelManager.isLevelComplete()) {
      this.levelComplete();
    }
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public getGameState(): GameState {
    return this.gameState;
  }

  public setGameState(state: GameState): void {
    this.gameState = state;
  }

  public addScore(points: number): void {
    this.stats.score += points;
    this.stats.kills++;
    this.uiManager.updateScore(this.stats.score);
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private updateLoadingProgress(percent: number, text: string): void {
    const loadingBar = document.getElementById('loading-bar');
    const loadingText = document.getElementById('loading-text');
    
    if (loadingBar) {
      loadingBar.style.width = `${percent}%`;
    }
    if (loadingText) {
      loadingText.textContent = text;
    }
  }

  private hideLoadingScreen(): void {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
    }
  }

  private showClickToPlay(): void {
    console.log('showClickToPlay() called');
    const clickToPlay = document.getElementById('click-to-play');
    if (clickToPlay) {
      clickToPlay.classList.add('visible');
      
      const handleStart = (e: Event) => {
        e.preventDefault();
        console.log('Click-to-play activated!');
        clickToPlay.classList.remove('visible');
        clickToPlay.removeEventListener('click', handleStart);
        clickToPlay.removeEventListener('touchstart', handleStart);
        
        // Small delay to ensure the overlay is hidden before starting
        requestAnimationFrame(() => {
          this.start();
        });
      };
      
      clickToPlay.addEventListener('click', handleStart);
      clickToPlay.addEventListener('touchstart', handleStart, { passive: false });
    } else {
      console.error('click-to-play element not found!');
    }
    this.setGameState(GameState.MAIN_MENU);
    console.log('Game state set to MAIN_MENU');
  }

  public dispose(): void {
    this.gameLoop.stop();
    this.inputManager.dispose();
    this.audioManager.dispose();
    this.levelManager.dispose();
    if (this.player) {
      this.player.dispose();
    }
    this.renderer.dispose();
  }
}
