# FPS Arena - 3D First-Person Shooter

A browser-based 3D first-person shooter game built with Three.js, featuring low-poly stylized graphics, three challenging levels, and a boss fight!

![FPS Arena](https://img.shields.io/badge/Game-FPS%20Arena-blue)
![Three.js](https://img.shields.io/badge/Three.js-0.160-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)

## Play Now

[Play FPS Arena](https://marymakerx.github.io/Timetable-Generator/)

## Features

- **3D Graphics**: Low-poly stylized visuals with smooth performance
- **3 Unique Levels**: 
  - Training Grounds (Tutorial)
  - The Warehouse (Medium difficulty)
  - The Arena (Boss fight)
- **Enemy Types**:
  - Basic enemies with patrol AI
  - Fast enemies that flank
  - Boss with multiple attack phases
- **Weapons & Combat**:
  - Rifle with ammo management
  - Reload mechanics
  - Hit feedback with particle effects
- **Full Audio**:
  - Weapon sounds
  - Enemy sounds
  - Background music
- **HUD**:
  - Health bar
  - Ammo counter
  - Score display
  - Boss health bar

## Controls

| Key | Action |
|-----|--------|
| W | Move Forward |
| S | Move Backward |
| A | Strafe Left |
| D | Strafe Right |
| Mouse | Look Around |
| Left Click | Shoot |
| R | Reload |
| ESC | Pause Menu |

## Technology Stack

- **Three.js** - 3D rendering
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **Howler.js** - Audio management
- **GitHub Pages** - Hosting

## Local Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/marymakerx/Timetable-Generator.git
cd Timetable-Generator

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── core/           # Game core (Game, GameLoop)
├── managers/       # System managers (Audio, Input, UI, Level)
├── entities/       # Game entities (Player, Enemies, Pickups)
│   └── EnemyTypes/ # Enemy type implementations
├── types/          # TypeScript interfaces
└── main.ts         # Entry point
```

## Game Mechanics

### Player
- 100 HP starting health
- WASD movement with smooth acceleration
- First-person mouse look
- Collision detection with environment

### Enemies
| Type | Health | Speed | Damage | Score |
|------|--------|-------|--------|-------|
| Basic | 30 | Slow | 10 | 100 |
| Fast | 20 | Fast | 5 | 150 |
| Boss | 200 | Medium | 25 | 1000 |

### Rifle
- Damage: 25 per hit
- Magazine: 30 rounds
- Fire Rate: 3 rounds/second
- Reload Time: 2 seconds

## Contributing

Feel free to submit issues and pull requests!

## License

MIT License - see LICENSE file for details
