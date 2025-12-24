# 🐍 Snake Killer

A fast-paced top-down shooter game where you battle waves of snakes that become progressively stronger as you level up. Built with vanilla JavaScript and HTML5 Canvas.

![Snake Killer](https://img.shields.io/badge/Game-Snake%20Killer-00ff88?style=for-the-badge)
![Tech](https://img.shields.io/badge/Tech-JavaScript%20%7C%20Canvas-00d4ff?style=for-the-badge)

## 🎮 How to Play

### Controls
| Control | Action |
|---------|--------|
| **W / ↑** | Move up |
| **S / ↓** | Move down |
| **A / ←** | Move left |
| **D / →** | Move right |
| **Mouse Click** | Shoot toward cursor |
| **Space** | Restart (when game over) |

### Objective
- Survive as long as possible while killing snakes
- Earn XP from each kill to level up
- Reach power-up milestones for special abilities
- Beat your high score!

## 🚀 Running the Game

### Option 1: Open Directly
Simply open `index.html` in your web browser:
```bash
open index.html
```

### Option 2: Local Server (Recommended)
Use a local server for best results:
```bash
# Using npx
npx -y serve .

# Or using Python
python -m http.server 8000
```
Then open `http://localhost:3000` (or `:8000` for Python) in your browser.

## 🌐 Deploy to GitHub Pages

1. Push this repository to GitHub
2. Go to Settings → Pages
3. Set source to "Deploy from a branch"
4. Select `main` branch and `/ (root)` folder
5. Click Save - your game will be live in ~1 minute!

## ⚡ Power-ups

Reach level milestones to unlock power-ups:

| Level | Power-up | Effect |
|-------|----------|--------|
| 3 | ⚡ Rapid Fire | 2x shooting speed for 10s |
| 5 | 🛡️ Shield | Invulnerability for 5s |
| 7 | 💥 Wide Shot | 3x bullet size for 10s |
| 10 | ☢️ Nuke | Instant damage to all snakes |

Power-ups repeat at higher levels (13, 15, 17, 20...).

## 📈 Difficulty Scaling

As you level up:
- Snake health increases (+20% per level)
- Snake speed increases (+10% per level)
- Spawn rate increases (more snakes at once)
- Maximum snakes on screen increases

## 🏗️ Project Structure

```
snake-killer/
├── index.html          # Main HTML file
├── styles.css          # Modern dark theme styling
├── js/
│   ├── utils.js        # Helper functions & constants
│   ├── bullet.js       # Bullet class
│   ├── snake.js        # Snake enemy class
│   ├── player.js       # Player class
│   ├── powerups.js     # Power-up system
│   ├── leveling.js     # XP & level system
│   ├── hud.js          # UI management
│   └── game.js         # Main game engine
└── README.md           # This file
```

## 🎨 Features

- **Smooth 60fps gameplay** using `requestAnimationFrame`
- **Modern dark theme** with neon accents and glow effects
- **Particle effects** and visual feedback
- **Responsive design** that works on different screen sizes
- **Clean, modular code** that's easy to extend

## 📝 License

MIT License - feel free to use, modify, and share!

---

Made with 💚 | Kill those snakes! 🐍🔫
