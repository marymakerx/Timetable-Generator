# 3D First-Person Shooter Game - Implementation Plan

## Project Overview

A browser-based 3D first-person shooter game with low-poly stylized graphics, featuring 3 levels of increasing difficulty, dummy AI enemies, and full audio support. The game will be hosted on GitHub Pages as a static web application.

---

## Technology Stack

### Core Technologies
| Technology | Purpose | Justification |
|------------|---------|---------------|
| **Three.js** | 3D rendering engine | Industry standard for web 3D, excellent documentation, large community |
| **TypeScript** | Programming language | Type safety, better IDE support, maintainable codebase |
| **Vite** | Build tool | Fast development, excellent HMR, optimized production builds |
| **Howler.js** | Audio management | Cross-browser audio support, spatial audio, easy API |

### Development Tools
- **GitHub Actions** - CI/CD for automatic deployment to GitHub Pages
- **ESLint/Prettier** - Code quality and formatting
- **Git LFS** - Large file storage for audio assets

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Game Application                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Scenes    │  │   Systems   │  │      Managers           │  │
│  ├─────────────┤  ├─────────────┤  ├─────────────────────────┤  │
│  │ MainMenu    │  │ Input       │  │ GameStateManager        │  │
│  │ Level1      │  │ Physics     │  │ AudioManager            │  │
│  │ Level2      │  │ AI          │  │ AssetManager            │  │
│  │ Level3      │  │ Combat      │  │ UIManager               │  │
│  │ GameOver    │  │ Spawning    │  │ LevelManager            │  │
│  │ Victory     │  │             │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Entity Components                        ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ Player │ Enemy │ Weapon │ Projectile │ Pickup │ Environment ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Three.js / Howler.js                     ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
fps-game/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Pages deployment
├── public/
│   ├── assets/
│   │   ├── models/                 # 3D models (GLB format)
│   │   │   ├── player/
│   │   │   ├── enemies/
│   │   │   ├── weapons/
│   │   │   └── environment/
│   │   ├── textures/               # Texture files
│   │   ├── audio/
│   │   │   ├── sfx/                # Sound effects
│   │   │   └── music/              # Background music
│   │   └── fonts/                  # Custom fonts
│   └── favicon.ico
├── src/
│   ├── core/
│   │   ├── Game.ts                 # Main game class
│   │   ├── GameLoop.ts             # Update/render loop
│   │   └── Constants.ts            # Game constants
│   ├── managers/
│   │   ├── GameStateManager.ts     # Game state machine
│   │   ├── AudioManager.ts         # Sound management
│   │   ├── AssetManager.ts         # Asset loading
│   │   ├── UIManager.ts            # HUD and menus
│   │   ├── LevelManager.ts         # Level loading/transitions
│   │   └── InputManager.ts         # Keyboard/mouse input
│   ├── entities/
│   │   ├── Player.ts               # Player controller
│   │   ├── Enemy.ts                # Enemy base class
│   │   ├── EnemyTypes/
│   │   │   ├── BasicEnemy.ts       # Standard enemy
│   │   │   ├── FastEnemy.ts        # Quick enemy
│   │   │   └── BossEnemy.ts        # Boss enemy
│   │   ├── Weapon.ts               # Weapon class
│   │   ├── Projectile.ts           # Bullet/projectile
│   │   └── Pickup.ts               # Health/ammo pickups
│   ├── systems/
│   │   ├── PhysicsSystem.ts        # Collision detection
│   │   ├── AISystem.ts             # Enemy AI behavior
│   │   ├── CombatSystem.ts         # Damage calculation
│   │   └── SpawnSystem.ts          # Enemy spawning
│   ├── scenes/
│   │   ├── BaseScene.ts            # Scene base class
│   │   ├── MainMenuScene.ts        # Main menu
│   │   ├── Level1Scene.ts          # Tutorial level
│   │   ├── Level2Scene.ts          # Medium difficulty
│   │   ├── Level3Scene.ts          # Hard/boss level
│   │   ├── GameOverScene.ts        # Death screen
│   │   └── VictoryScene.ts         # Win screen
│   ├── ui/
│   │   ├── HUD.ts                  # In-game HUD
│   │   ├── Crosshair.ts            # Crosshair component
│   │   ├── HealthBar.ts            # Health display
│   │   ├── AmmoCounter.ts          # Ammo display
│   │   └── ScoreDisplay.ts         # Score display
│   ├── utils/
│   │   ├── MathUtils.ts            # Math helpers
│   │   ├── GeometryFactory.ts      # Low-poly shape generators
│   │   └── ColorPalette.ts         # Color scheme
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces
│   ├── main.ts                     # Entry point
│   └── style.css                   # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Game Systems Design

### 1. Player System

```typescript
interface PlayerConfig {
  health: number;           // 100
  maxHealth: number;        // 100
  speed: number;            // Movement speed
  lookSensitivity: number;  // Mouse sensitivity
  height: number;           // Camera height
}
```

**Features:**
- First-person camera with mouse look
- WASD movement with smooth acceleration/deceleration
- Collision detection with environment
- Health system with damage feedback
- Death and respawn handling

### 2. Enemy AI System

```
┌─────────────────────────────────────────────────────────┐
│                    Enemy State Machine                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│    ┌──────────┐         ┌──────────┐                    │
│    │   IDLE   │ ──────► │  PATROL  │                    │
│    └──────────┘         └──────────┘                    │
│         │                    │                           │
│         │    Player          │ Player                    │
│         │    Detected        │ Detected                  │
│         ▼                    ▼                           │
│    ┌──────────┐         ┌──────────┐                    │
│    │  CHASE   │ ◄────── │  ALERT   │                    │
│    └──────────┘         └──────────┘                    │
│         │                                                │
│         │ In Range                                       │
│         ▼                                                │
│    ┌──────────┐                                          │
│    │  ATTACK  │                                          │
│    └──────────┘                                          │
│         │                                                │
│         │ Health = 0                                     │
│         ▼                                                │
│    ┌──────────┐                                          │
│    │   DEAD   │                                          │
│    └──────────┘                                          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Enemy Types:**

| Type | Health | Speed | Damage | Behavior |
|------|--------|-------|--------|----------|
| Basic | 30 | Slow | 10 | Simple chase |
| Fast | 20 | Fast | 5 | Flanking |
| Boss | 200 | Medium | 25 | Multi-phase |

### 3. Weapon System

**Rifle Specifications:**
- Damage: 25 per hit
- Fire Rate: 3 rounds/second
- Magazine Size: 30 rounds
- Reload Time: 2 seconds
- Range: 100 units
- Accuracy: High (minimal spread)

### 4. Level Design

#### Level 1: Training Grounds (Tutorial)
- **Theme:** Open outdoor area with simple obstacles
- **Enemies:** 5 Basic enemies (spawned in waves)
- **Objective:** Eliminate all enemies
- **Features:**
  - Tutorial prompts for controls
  - Abundant health pickups
  - Simple layout for learning
- **Color Palette:** Greens, browns, soft blues

#### Level 2: The Warehouse (Medium)
- **Theme:** Indoor industrial environment
- **Enemies:** 10 Basic + 3 Fast enemies
- **Objective:** Clear all areas
- **Features:**
  - Cover objects
  - Multiple rooms
  - Hidden ammo caches
- **Color Palette:** Grays, oranges, industrial tones

#### Level 3: The Arena (Boss)
- **Theme:** Circular arena with platforms
- **Enemies:** Wave system + Boss
- **Objective:** Defeat the boss
- **Features:**
  - Wave-based enemy spawns
  - Boss with multiple phases
  - Dynamic environment elements
- **Color Palette:** Reds, blacks, dramatic lighting

### 5. Audio System

**Sound Categories:**

| Category | Sounds |
|----------|--------|
| Weapon | Shoot, reload, empty clip |
| Player | Footsteps, damage taken, death |
| Enemy | Alert, attack, damage, death |
| UI | Button hover, click, level complete |
| Ambient | Background music per level |

**Audio Sources:**
- Use royalty-free audio from:
  - Freesound.org
  - OpenGameArt.org
  - Generated via JSFXR for retro-style effects

---

## Visual Style Guide

### Low-Poly Aesthetic

```
Color Palette:
┌─────────────────────────────────────────────────────────┐
│  Primary    │  #4A90D9  │  Blue (player elements)      │
│  Secondary  │  #E74C3C  │  Red (enemies, danger)       │
│  Accent     │  #2ECC71  │  Green (health, safe)        │
│  Neutral    │  #95A5A6  │  Gray (environment)          │
│  Dark       │  #2C3E50  │  Dark blue (shadows)         │
│  Light      │  #ECF0F1  │  Off-white (highlights)      │
└─────────────────────────────────────────────────────────┘
```

### Rendering Features
- Flat shading for low-poly look
- Simple directional lighting
- Subtle fog for depth
- Screen shake on damage
- Particle effects for:
  - Muzzle flash
  - Hit impacts
  - Enemy death
  - Pickups

---

## Game Flow

```
┌─────────────┐
│   START     │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│  MAIN MENU  │ ───►│   OPTIONS   │
└──────┬──────┘     └─────────────┘
       │
       │ Play
       ▼
┌─────────────┐
│   LEVEL 1   │ ───► Death ───► Game Over ───► Main Menu
└──────┬──────┘
       │ Complete
       ▼
┌─────────────┐
│   LEVEL 2   │ ───► Death ───► Game Over ───► Main Menu
└──────┬──────┘
       │ Complete
       ▼
┌─────────────┐
│   LEVEL 3   │ ───► Death ───► Game Over ───► Main Menu
└──────┬──────┘
       │ Complete
       ▼
┌─────────────┐
│   VICTORY   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  MAIN MENU  │
└─────────────┘
```

---

## Implementation Phases

### Phase 1: Project Setup and Core Systems
- [ ] Initialize Vite + TypeScript project
- [ ] Set up Three.js rendering pipeline
- [ ] Implement basic scene management
- [ ] Create game loop with delta time
- [ ] Set up input handling (keyboard + mouse)
- [ ] Configure GitHub Actions for deployment

### Phase 2: Player Controller
- [ ] First-person camera with mouse look
- [ ] WASD movement with collision
- [ ] Player health system
- [ ] Damage feedback (screen flash, shake)

### Phase 3: Weapon System
- [ ] Rifle model and positioning
- [ ] Shooting mechanics with raycasting
- [ ] Ammo management
- [ ] Reload system
- [ ] Muzzle flash effect

### Phase 4: Enemy System
- [ ] Enemy base class
- [ ] Basic enemy type
- [ ] AI state machine
- [ ] Pathfinding (simple waypoint system)
- [ ] Enemy damage and death
- [ ] Fast enemy variant

### Phase 5: Level Design
- [ ] Level 1: Tutorial area
- [ ] Level 2: Warehouse environment
- [ ] Level 3: Boss arena
- [ ] Level transitions
- [ ] Spawn points and pickups

### Phase 6: UI and HUD
- [ ] Main menu screen
- [ ] In-game HUD (health, ammo, score)
- [ ] Crosshair
- [ ] Pause menu
- [ ] Game over / victory screens

### Phase 7: Audio Integration
- [ ] Audio manager setup
- [ ] Weapon sounds
- [ ] Enemy sounds
- [ ] UI sounds
- [ ] Background music

### Phase 8: Boss Fight
- [ ] Boss enemy class
- [ ] Multiple attack patterns
- [ ] Phase transitions
- [ ] Boss health bar

### Phase 9: Polish and Testing
- [ ] Particle effects
- [ ] Screen effects
- [ ] Balance tuning
- [ ] Performance optimization
- [ ] Cross-browser testing

### Phase 10: Deployment
- [ ] Final build optimization
- [ ] GitHub Pages deployment
- [ ] README documentation
- [ ] Create gameplay screenshots/GIF

---

## Technical Considerations

### Performance Optimization
- Use object pooling for projectiles and particles
- Implement frustum culling
- Keep polygon count low (target < 500 polys per object)
- Use texture atlases
- Minimize draw calls

### Browser Compatibility
- Target modern browsers (Chrome, Firefox, Safari, Edge)
- Handle pointer lock API for mouse capture
- Implement mobile detection with "Desktop Only" message

### Collision Detection
- Use simple box/sphere colliders
- Raycasting for weapon hits
- Separate collision layers for player, enemies, environment

### Save System (Optional Enhancement)
- LocalStorage for high scores
- Level progress persistence

---

## Asset Requirements

### 3D Models (Low-Poly)
| Asset | Polygon Budget | Notes |
|-------|---------------|-------|
| Player Arms/Gun | 300 | First-person view only |
| Basic Enemy | 200 | Humanoid shape |
| Fast Enemy | 150 | Smaller, agile |
| Boss | 500 | Larger, more detail |
| Crate | 12 | Simple cube |
| Pillar | 24 | Cylinder |
| Wall Section | 6 | Flat plane |
| Health Pack | 50 | Cross/heart shape |
| Ammo Box | 24 | Rectangle box |

### Audio Files
| Sound | Format | Duration |
|-------|--------|----------|
| Rifle Shot | MP3/OGG | 0.2s |
| Rifle Reload | MP3/OGG | 2s |
| Empty Clip | MP3/OGG | 0.1s |
| Player Hurt | MP3/OGG | 0.3s |
| Player Death | MP3/OGG | 1s |
| Footsteps | MP3/OGG | Loop |
| Enemy Alert | MP3/OGG | 0.5s |
| Enemy Attack | MP3/OGG | 0.3s |
| Enemy Death | MP3/OGG | 0.5s |
| Pickup | MP3/OGG | 0.3s |
| Menu Music | MP3/OGG | Loop |
| Level 1 Music | MP3/OGG | Loop |
| Level 2 Music | MP3/OGG | Loop |
| Level 3 Music | MP3/OGG | Loop |
| Victory Jingle | MP3/OGG | 3s |
| Game Over | MP3/OGG | 2s |

---

## Controls

| Input | Action |
|-------|--------|
| W | Move Forward |
| S | Move Backward |
| A | Strafe Left |
| D | Strafe Right |
| Mouse Move | Look Around |
| Left Click | Shoot |
| R | Reload |
| ESC | Pause Menu |

---

## HUD Layout

```
+---------------------------------------------------------------+
|                                                               |
|   SCORE: 0000                                                 |
|                                                               |
|                                                               |
|                                                               |
|                                                               |
|                            +                                  |
|                        crosshair                              |
|                                                               |
|                                                               |
|                                                               |
|                                                               |
|                                                               |
|   ======== 80/100 HP                          30/30 AMMO R    |
+---------------------------------------------------------------+
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Performance issues | Medium | High | Strict polygon budgets, object pooling |
| Complex AI bugs | Medium | Medium | Simple state machine, thorough testing |
| Audio loading delays | Low | Medium | Preload all assets, show loading screen |
| Browser compatibility | Low | High | Test on major browsers, use polyfills |
| Scope creep | High | High | Stick to defined features, phase-based approach |

---

## Success Metrics

- Game loads within 5 seconds
- Maintains 60 FPS on mid-range hardware
- All 3 levels are completable
- Audio plays without issues
- Works on Chrome, Firefox, Safari, Edge
- Responsive controls with no input lag

---

## Deployment Configuration

### GitHub Actions Workflow

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Vite Configuration for GitHub Pages

```typescript
// vite.config.ts
export default defineConfig({
  base: '/Timetable-Generator/',  // Repository name
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
```

---

## Summary

This plan outlines a complete 3D first-person shooter game built with:
- **Three.js** for 3D rendering
- **TypeScript** for type-safe code
- **Vite** for fast development
- **Howler.js** for audio
- **GitHub Pages** for hosting

The game features:
- Low-poly stylized graphics
- 3 progressively difficult levels
- Single weapon with ammo system
- Three enemy types including a boss
- Full audio with music and sound effects
- Clean HUD showing health, ammo, and score

The implementation is divided into 10 phases, progressing from core systems to final polish.