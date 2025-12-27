import { Game } from '../core/Game';

export class UIManager {
  private game: Game;
  private hudContainer: HTMLElement | null = null;
  private healthBar: HTMLElement | null = null;
  private healthText: HTMLElement | null = null;
  private ammoText: HTMLElement | null = null;
  private scoreText: HTMLElement | null = null;
  private crosshair: HTMLElement | null = null;
  private damageOverlay: HTMLElement | null = null;
  private bossHealthContainer: HTMLElement | null = null;
  private bossHealthBar: HTMLElement | null = null;

  constructor(game: Game) {
    this.game = game;
  }

  public init(): void {
    this.createHUD();
    this.createDamageOverlay();
    this.createBossHealthBar();
    this.setupMenuButtons();
  }

  private createHUD(): void {
    // Create HUD container
    this.hudContainer = document.createElement('div');
    this.hudContainer.id = 'hud';
    this.hudContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 100;
      font-family: 'Arial', sans-serif;
    `;
    document.body.appendChild(this.hudContainer);

    // Create crosshair
    this.crosshair = document.createElement('div');
    this.crosshair.id = 'crosshair';
    this.crosshair.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 20px;
      height: 20px;
    `;
    this.crosshair.innerHTML = `
      <svg viewBox="0 0 20 20" style="width: 100%; height: 100%;">
        <line x1="10" y1="0" x2="10" y2="8" stroke="#fff" stroke-width="2"/>
        <line x1="10" y1="12" x2="10" y2="20" stroke="#fff" stroke-width="2"/>
        <line x1="0" y1="10" x2="8" y2="10" stroke="#fff" stroke-width="2"/>
        <line x1="12" y1="10" x2="20" y2="10" stroke="#fff" stroke-width="2"/>
        <circle cx="10" cy="10" r="2" fill="#fff"/>
      </svg>
    `;
    this.hudContainer.appendChild(this.crosshair);

    // Create score display (top left)
    this.scoreText = document.createElement('div');
    this.scoreText.id = 'score';
    this.scoreText.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      color: #fff;
      font-size: 24px;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    `;
    this.scoreText.textContent = 'SCORE: 0';
    this.hudContainer.appendChild(this.scoreText);

    // Create health bar container (bottom left)
    const healthContainer = document.createElement('div');
    healthContainer.style.cssText = `
      position: absolute;
      bottom: 30px;
      left: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    `;

    // Health bar background
    const healthBarBg = document.createElement('div');
    healthBarBg.style.cssText = `
      width: 200px;
      height: 20px;
      background: rgba(0,0,0,0.5);
      border: 2px solid #fff;
      border-radius: 4px;
      overflow: hidden;
    `;

    // Health bar fill
    this.healthBar = document.createElement('div');
    this.healthBar.id = 'health-bar';
    this.healthBar.style.cssText = `
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #e74c3c 0%, #2ecc71 100%);
      transition: width 0.2s ease;
    `;
    healthBarBg.appendChild(this.healthBar);

    // Health text
    this.healthText = document.createElement('div');
    this.healthText.id = 'health-text';
    this.healthText.style.cssText = `
      color: #fff;
      font-size: 18px;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
      min-width: 80px;
    `;
    this.healthText.textContent = '100/100 HP';

    healthContainer.appendChild(healthBarBg);
    healthContainer.appendChild(this.healthText);
    this.hudContainer.appendChild(healthContainer);

    // Create ammo display (bottom right)
    this.ammoText = document.createElement('div');
    this.ammoText.id = 'ammo';
    this.ammoText.style.cssText = `
      position: absolute;
      bottom: 30px;
      right: 20px;
      color: #fff;
      font-size: 24px;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    `;
    this.ammoText.innerHTML = '30/30 <span style="color: #4A90D9;">[R]</span>';
    this.hudContainer.appendChild(this.ammoText);
  }

  private createDamageOverlay(): void {
    this.damageOverlay = document.createElement('div');
    this.damageOverlay.id = 'damage-overlay';
    this.damageOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(ellipse at center, transparent 0%, rgba(231,76,60,0) 50%, rgba(231,76,60,0.5) 100%);
      pointer-events: none;
      z-index: 99;
      opacity: 0;
      transition: opacity 0.1s ease;
    `;
    document.body.appendChild(this.damageOverlay);
  }

  private createBossHealthBar(): void {
    this.bossHealthContainer = document.createElement('div');
    this.bossHealthContainer.id = 'boss-health';
    this.bossHealthContainer.style.cssText = `
      position: fixed;
      top: 50px;
      left: 50%;
      transform: translateX(-50%);
      width: 400px;
      display: none;
      flex-direction: column;
      align-items: center;
      z-index: 100;
    `;

    const bossName = document.createElement('div');
    bossName.style.cssText = `
      color: #e74c3c;
      font-size: 24px;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
      margin-bottom: 10px;
      font-family: 'Arial Black', sans-serif;
    `;
    bossName.textContent = 'THE GUARDIAN';

    const bossBarBg = document.createElement('div');
    bossBarBg.style.cssText = `
      width: 100%;
      height: 25px;
      background: rgba(0,0,0,0.7);
      border: 2px solid #e74c3c;
      border-radius: 4px;
      overflow: hidden;
    `;

    this.bossHealthBar = document.createElement('div');
    this.bossHealthBar.style.cssText = `
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #c0392b 0%, #e74c3c 100%);
      transition: width 0.3s ease;
    `;

    bossBarBg.appendChild(this.bossHealthBar);
    this.bossHealthContainer.appendChild(bossName);
    this.bossHealthContainer.appendChild(bossBarBg);
    document.body.appendChild(this.bossHealthContainer);
  }

  private setupMenuButtons(): void {
    // Resume button
    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => {
        this.game.resume();
      });
    }

    // Restart button
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        this.hidePauseMenu();
        this.game.restart();
      });
    }

    // Main menu button
    const mainMenuBtn = document.getElementById('main-menu-btn');
    if (mainMenuBtn) {
      mainMenuBtn.addEventListener('click', () => {
        this.hidePauseMenu();
        this.game.mainMenu();
      });
    }
  }

  public update(): void {
    // Update is called from game loop, but most updates are event-driven
  }

  public updateHealth(current: number, max: number): void {
    const percent = (current / max) * 100;
    
    if (this.healthBar) {
      this.healthBar.style.width = `${percent}%`;
      
      // Change color based on health
      if (percent > 60) {
        this.healthBar.style.background = 'linear-gradient(90deg, #27ae60 0%, #2ecc71 100%)';
      } else if (percent > 30) {
        this.healthBar.style.background = 'linear-gradient(90deg, #f39c12 0%, #f1c40f 100%)';
      } else {
        this.healthBar.style.background = 'linear-gradient(90deg, #c0392b 0%, #e74c3c 100%)';
      }
    }
    
    if (this.healthText) {
      this.healthText.textContent = `${Math.ceil(current)}/${max} HP`;
    }
  }

  public updateAmmo(current: number, max: number, isReloading: boolean = false): void {
    if (this.ammoText) {
      if (isReloading) {
        this.ammoText.innerHTML = '<span style="color: #f1c40f;">RELOADING...</span>';
      } else {
        const color = current === 0 ? '#e74c3c' : '#fff';
        this.ammoText.innerHTML = `<span style="color: ${color};">${current}/${max}</span> <span style="color: #4A90D9;">[R]</span>`;
      }
    }
  }

  public updateScore(score: number): void {
    if (this.scoreText) {
      this.scoreText.textContent = `SCORE: ${score}`;
    }
  }

  public showDamageEffect(): void {
    if (this.damageOverlay) {
      this.damageOverlay.style.opacity = '1';
      setTimeout(() => {
        if (this.damageOverlay) {
          this.damageOverlay.style.opacity = '0';
        }
      }, 150);
    }
  }

  public showBossHealth(show: boolean): void {
    if (this.bossHealthContainer) {
      this.bossHealthContainer.style.display = show ? 'flex' : 'none';
    }
  }

  public updateBossHealth(percent: number): void {
    if (this.bossHealthBar) {
      this.bossHealthBar.style.width = `${percent}%`;
    }
  }

  public showPauseMenu(): void {
    const pauseMenu = document.getElementById('pause-menu');
    if (pauseMenu) {
      pauseMenu.classList.add('visible');
    }
  }

  public hidePauseMenu(): void {
    const pauseMenu = document.getElementById('pause-menu');
    if (pauseMenu) {
      pauseMenu.classList.remove('visible');
    }
  }

  public showMainMenu(): void {
    const clickToPlay = document.getElementById('click-to-play');
    if (clickToPlay) {
      clickToPlay.classList.add('visible');
    }
  }

  public showGameOver(): void {
    this.showEndScreen('GAME OVER', '#e74c3c');
  }

  public showVictory(): void {
    this.showEndScreen('VICTORY!', '#2ecc71');
  }

  public showLevelComplete(level: number): void {
    // Create a temporary level complete notification
    const notification = document.createElement('div');
    notification.id = 'level-complete-notification';
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'Arial Black', sans-serif;
      font-size: 48px;
      color: #2ecc71;
      text-shadow: 0 0 20px rgba(46, 204, 113, 0.5);
      z-index: 700;
      animation: levelComplete 2s ease-out forwards;
      pointer-events: none;
    `;
    notification.textContent = `LEVEL ${level} COMPLETE!`;
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes levelComplete {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        40% { transform: translate(-50%, -50%) scale(1); }
        80% { opacity: 1; }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    // Remove after animation
    setTimeout(() => {
      notification.remove();
      style.remove();
    }, 2000);
  }

  private showEndScreen(title: string, color: string): void {
    const endScreen = document.createElement('div');
    endScreen.id = 'end-screen';
    endScreen.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 700;
    `;

    const titleEl = document.createElement('div');
    titleEl.style.cssText = `
      font-family: 'Arial Black', sans-serif;
      font-size: 64px;
      color: ${color};
      text-shadow: 0 0 20px ${color};
      margin-bottom: 20px;
    `;
    titleEl.textContent = title;

    const scoreEl = document.createElement('div');
    scoreEl.style.cssText = `
      font-family: 'Arial', sans-serif;
      font-size: 32px;
      color: #fff;
      margin-bottom: 40px;
    `;
    scoreEl.textContent = `Final Score: ${this.game.stats.score}`;

    const restartBtn = document.createElement('button');
    restartBtn.className = 'menu-button';
    restartBtn.textContent = 'Play Again';
    restartBtn.style.cssText = `
      font-family: 'Arial', sans-serif;
      font-size: 24px;
      color: #ECF0F1;
      background: #2C3E50;
      border: none;
      padding: 15px 40px;
      margin: 10px;
      cursor: pointer;
      border-radius: 5px;
      pointer-events: auto;
    `;
    restartBtn.addEventListener('click', () => {
      endScreen.remove();
      this.game.restart();
    });

    endScreen.appendChild(titleEl);
    endScreen.appendChild(scoreEl);
    endScreen.appendChild(restartBtn);
    document.body.appendChild(endScreen);
  }

  public hideAllMenus(): void {
    this.hidePauseMenu();
    
    const clickToPlay = document.getElementById('click-to-play');
    if (clickToPlay) {
      clickToPlay.classList.remove('visible');
    }
    
    const endScreen = document.getElementById('end-screen');
    if (endScreen) {
      endScreen.remove();
    }
  }

  public showHUD(): void {
    if (this.hudContainer) {
      this.hudContainer.style.display = 'block';
    }
  }

  public hideHUD(): void {
    if (this.hudContainer) {
      this.hudContainer.style.display = 'none';
    }
  }

  public dispose(): void {
    if (this.hudContainer) {
      this.hudContainer.remove();
    }
    if (this.damageOverlay) {
      this.damageOverlay.remove();
    }
    if (this.bossHealthContainer) {
      this.bossHealthContainer.remove();
    }
  }
}
