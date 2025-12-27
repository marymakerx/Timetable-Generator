import { Game } from './core/Game';

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('FPS Arena - Starting...');
  
  // Check for WebGL support
  if (!isWebGLAvailable()) {
    showWebGLError();
    return;
  }
  
  // Get game instance and initialize
  const game = Game.getInstance();
  
  try {
    await game.init();
    console.log('Game initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize game:', error);
    showError('Failed to load game. Please refresh and try again.');
  }
});

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

function showWebGLError(): void {
  const container = document.getElementById('game-container');
  if (container) {
    container.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background: #1a1a2e;
        color: #fff;
        font-family: Arial, sans-serif;
        text-align: center;
        padding: 20px;
      ">
        <h1 style="color: #e74c3c; margin-bottom: 20px;">WebGL Not Available</h1>
        <p style="max-width: 400px; line-height: 1.6;">
          Your browser doesn't support WebGL, which is required to run this game.
          Please try using a modern browser like Chrome, Firefox, or Edge.
        </p>
      </div>
    `;
  }
  
  // Hide loading screen
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
  }
}

function showError(message: string): void {
  const loadingText = document.getElementById('loading-text');
  if (loadingText) {
    loadingText.textContent = message;
    loadingText.style.color = '#e74c3c';
  }
}

// Prevent default right-click menu
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Handle visibility change (pause when tab is hidden)
document.addEventListener('visibilitychange', () => {
  const game = Game.getInstance();
  if (document.hidden && game.getGameState() === 'PLAYING') {
    game.pause();
  }
});
