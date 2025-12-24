/**
 * SNAKE KILLER - Main Game Engine
 * Core game loop, state management, and coordination
 */

class Game {
    constructor() {
        // Get canvas and context
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        this.canvas.width = GAME_CONSTANTS.CANVAS_WIDTH;
        this.canvas.height = GAME_CONSTANTS.CANVAS_HEIGHT;

        // Initialize systems
        this.hud = new HUD();
        this.leveling = new LevelingSystem();
        this.powerupManager = new PowerupManager();
        // === NEW: Audio System ===
        this.audio = new AudioManager();

        // Game entities
        this.player = null;
        this.bullets = [];
        this.snakes = [];

        // Game state
        this.running = false;
        this.gameOver = false;
        this.lastTime = 0;
        this.lastSpawnTime = 0;

        // UI elements
        this.mainMenu = document.getElementById('main-menu');
        this.gameOverScreen = document.getElementById('game-over');

        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        // === NEW: Touch handler bindings ===
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handlePowerupActivation = this.handlePowerupActivation.bind(this);
        this.toggleSound = this.toggleSound.bind(this);

        // Setup callbacks
        this.setupCallbacks();

        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Setup system callbacks
     */
    setupCallbacks() {
        // Level up callback
        this.leveling.onLevelUp = (level) => {
            this.hud.showLevelUp();
            this.audio.play('levelup');
            this.updateBackground(level);
        };

        // XP change callback
        this.leveling.onXpChange = (xp, xpToNext, level) => {
            this.hud.updateXp(xp, xpToNext, level);
        };

        // Power-up HUD callback
        this.powerupManager.setHudCallback((powerups) => {
            // Update active list (top right)
            this.hud.updatePowerups(powerups);
            // Update toolbar state (bottom center)
            this.hud.updatePowerupToolbar(this.points, this.powerupManager.activePowerups);
        });
    }

    /**
     * Update background based on level
     * @param {number} level 
     */
    updateBackground(level) {
        const themes = ['bg-default', 'bg-space', 'bg-mars', 'bg-desert', 'bg-earth'];
        const themeIndex = (level - 1) % themes.length;

        themes.forEach(t => document.body.classList.remove(t));
        document.body.classList.add(themes[themeIndex]);
    }

    /**
     * Toggle sound state
     */
    toggleSound() {
        if (!this.audio) return;
        const enabled = this.audio.toggle();
        const btn = document.getElementById('sound-toggle');
        if (btn) {
            btn.classList.toggle('muted', !enabled);
            btn.textContent = enabled ? '🔊' : '🔇';
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Keyboard
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);

        // Mouse
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.canvas.addEventListener('mouseup', this.handleMouseUp);
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // === NEW: Touch events for mobile ===
        // Use passive: false to allow preventDefault for scroll blocking
        this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
        this.canvas.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });

        // Prevent default touch behaviors on the whole document during game
        document.addEventListener('touchmove', (e) => {
            if (this.running) {
                e.preventDefault();
            }
        }, { passive: false });

        // Menu buttons
        document.getElementById('start-btn').addEventListener('click', () => this.start());
        document.getElementById('restart-btn').addEventListener('click', () => this.restart());

        // === NEW: Sound Toggle ===
        const soundBtn = document.getElementById('sound-toggle');
        if (soundBtn) {
            // Init state visual
            if (this.audio && !this.audio.enabled) {
                soundBtn.classList.add('muted');
                soundBtn.textContent = '🔇';
            }
            soundBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.audio) this.audio.init();
                this.toggleSound();
            });
            // Also enable touch
            soundBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.audio) this.audio.init();
                this.toggleSound();
            }, { passive: false });
        }

        // Audio Init on Interaction
        const initAudio = () => { if (this.audio) this.audio.init(); };
        window.addEventListener('click', initAudio, { once: true });
        window.addEventListener('keydown', initAudio, { once: true });
        window.addEventListener('touchstart', initAudio, { once: true });
    }

    /**
     * Switch weapon by ID
     * @param {string} id 
     */
    switchWeapon(id) {
        if (!this.player) return;
        this.player.setWeapon(id);
        this.hud.updateWeaponToolbar(id);
    }

    /**
     * Handle key down event
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyDown(e) {
        if (this.player && this.running) {
            this.player.handleKeyInput(e.key, true);

            // Weapon Hotkeys
            if (e.key === '1') this.switchWeapon(WEAPONS.PISTOL.id);
            if (e.key === '2') this.switchWeapon(WEAPONS.RAPID.id);
            if (e.key === '3') this.switchWeapon(WEAPONS.SHOTGUN.id);
            if (e.key === '4') this.switchWeapon(WEAPONS.TANK.id);
        }

        // Restart on space when game over
        if (e.code === 'Space' && this.gameOver) {
            this.restart();
        }
    }

    /**
     * Handle key up event
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyUp(e) {
        if (this.player && this.running) {
            this.player.handleKeyInput(e.key, false);
        }
    }

    /**
     * Handle mouse move event
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseMove(e) {
        if (this.player && this.running) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.player.handleMouseInput(x, y);
        }
    }

    /**
     * Handle mouse down event
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseDown(e) {
        if (e.button === 0 && this.player && this.running) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.player.handleMouseInput(x, y, true);
        }
    }

    /**
     * Handle mouse up event
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseUp(e) {
        if (e.button === 0 && this.player) {
            this.player.handleMouseInput(this.player.mouseX, this.player.mouseY, false);
        }
    }

    // =====================================================
    // === NEW: TOUCH INPUT HANDLERS FOR MOBILE ===
    // =====================================================

    /**
     * Convert touch coordinates to canvas coordinates
     * Accounts for canvas scaling and device pixel ratio
     * @param {Touch} touch - Touch object
     * @returns {{x: number, y: number}} Canvas coordinates
     */
    getTouchCanvasCoords(touch) {
        const rect = this.canvas.getBoundingClientRect();

        // Get the scale factor between canvas internal size and display size
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        // Convert touch coordinates to canvas coordinates
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;

        return { x, y };
    }

    /**
     * Handle touch start event
     * @param {TouchEvent} e - Touch event
     */
    handleTouchStart(e) {
        e.preventDefault(); // Prevent scrolling and zooming

        if (!this.player || !this.running) return;

        // Use the first touch
        const touch = e.touches[0];
        if (!touch) return;

        const coords = this.getTouchCanvasCoords(touch);
        this.player.handleTouchInput(coords.x, coords.y, 'start');
    }

    /**
     * Handle touch move event
     * @param {TouchEvent} e - Touch event
     */
    handleTouchMove(e) {
        e.preventDefault(); // Prevent scrolling

        if (!this.player || !this.running) return;

        // Use the first touch
        const touch = e.touches[0];
        if (!touch) return;

        const coords = this.getTouchCanvasCoords(touch);
        this.player.handleTouchInput(coords.x, coords.y, 'move');
    }

    /**
     * Handle touch end event
     * @param {TouchEvent} e - Touch event
     */
    handleTouchEnd(e) {
        e.preventDefault();

        if (!this.player) return;

        // End touch input
        this.player.handleTouchInput(0, 0, 'end');
    }

    /**
     * Start the game
     */
    start() {
        // Hide menu
        this.mainMenu.classList.add('hidden');

        // Initialize player
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);

        // Reset systems
        this.bullets = [];
        this.snakes = [];
        this.leveling.reset();
        this.powerupManager.reset(this.player, this.snakes);
        this.hud.reset();

        // === NEW: Initialize points ===
        this.points = 0;
        this.hud.updatePoints(this.points);
        this.hud.initializePowerupToolbar(POWER_PACKS, this.handlePowerupActivation);

        // === NEW: Weapon Toolbar ===
        this.hud.initializeWeaponToolbar(WEAPONS, (id) => {
            if (this.player) {
                this.switchWeapon(id);
            }
        });
        this.hud.updateWeaponToolbar(this.player.currentWeapon.id);

        // Show HUD
        this.hud.show();

        // Start game loop
        this.running = true;
        this.gameOver = false;
        this.lastTime = performance.now();
        this.lastSpawnTime = this.lastTime;

        requestAnimationFrame(this.gameLoop);
    }

    /**
     * Restart the game
     */
    restart() {
        this.gameOverScreen.classList.add('hidden');
        this.start();
    }

    /**
     * Handle power-up activation attempt
     * @param {string} packId - ID of the power pack
     */
    handlePowerupActivation(packId) {
        if (!this.running || this.gameOver) return;

        // Find pack by ID
        const pack = Object.values(POWER_PACKS).find(p => p.id === packId);
        if (!pack) return;

        // Check conditions
        if (this.points < pack.cost) return;
        if (this.powerupManager.hasActivePowerup()) return;

        // Activate
        this.points -= pack.cost;
        this.hud.updatePoints(this.points);
        this.powerupManager.activate(pack, this.player, this.snakes);
        this.hud.showPowerupNotification(pack.name);
        this.audio.play('powerup');

        // Update toolbar
        this.hud.updatePowerupToolbar(this.points, this.powerupManager.activePowerups);
    }

    /**
     * Main game loop
     * @param {number} currentTime - Current timestamp
     */
    gameLoop(currentTime) {
        if (!this.running) return;

        // Calculate delta time
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Cap delta time to prevent large jumps
        const cappedDelta = Math.min(deltaTime, 0.1);

        // Update
        this.update(cappedDelta, currentTime);

        // Render
        this.render();

        // Continue loop
        requestAnimationFrame(this.gameLoop);
    }

    /**
     * Update game state
     * @param {number} deltaTime - Time since last frame
     * @param {number} currentTime - Current timestamp
     */
    update(deltaTime, currentTime) {
        // Update player
        const newBullet = this.player.update(deltaTime, this.canvas.width, this.canvas.height);
        if (newBullet) {
            if (Array.isArray(newBullet)) {
                this.bullets.push(...newBullet);
            } else {
                this.bullets.push(newBullet);
            }
            this.audio.play('shoot');
        }

        // Update power-ups (pass snakes for freeze expiration)
        this.powerupManager.update(deltaTime, this.player, this.snakes);

        // Spawn snakes
        this.spawnSnakes(currentTime);

        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.update(deltaTime, this.canvas.width, this.canvas.height);
            return bullet.active;
        });

        // Update snakes
        this.snakes.forEach(snake => {
            snake.update(deltaTime, this.player.x, this.player.y);
        });

        // Check collisions
        this.checkCollisions();

        // Remove inactive snakes
        this.snakes = this.snakes.filter(snake => snake.active);

        // Update HUD
        this.hud.updateHealth(this.player.health, this.player.maxHealth);
        this.hud.updateScore(this.leveling.score);
        this.hud.updateKills(this.leveling.totalKills);

        // Check for game over
        if (!this.player.active) {
            this.endGame();
        }
    }

    /**
     * Spawn snakes based on timing and difficulty
     * @param {number} currentTime - Current timestamp
     */
    spawnSnakes(currentTime) {
        const difficulty = this.leveling.getDifficultyInfo();

        // Check if it's time to spawn and we're under the limit
        if (currentTime - this.lastSpawnTime >= difficulty.spawnRate &&
            this.snakes.length < difficulty.maxSnakes) {

            this.snakes.push(new Snake(
                this.canvas.width,
                this.canvas.height,
                this.leveling.level
            ));
            this.lastSpawnTime = currentTime;
        }
    }

    /**
     * Check all collisions
     */
    checkCollisions() {
        const playerBounds = this.player.getCollisionBounds();

        // Check bullet-snake collisions
        this.bullets.forEach(bullet => {
            if (!bullet.active) return;
            const bulletBounds = bullet.getCollisionBounds();

            this.snakes.forEach(snake => {
                if (!snake.active) return;
                const snakeBounds = snake.getCollisionBounds();

                if (circleCollision(bulletBounds, snakeBounds)) {
                    bullet.destroy();
                    const killed = snake.takeDamage(bullet.damage);

                    if (killed) {
                        this.audio.play('hit');
                        this.leveling.addXp(snake.xpValue);

                        // === NEW: Health Regen every 5 kills ===
                        if (this.leveling.totalKills > 0 && this.leveling.totalKills % 5 === 0) {
                            const healAmount = 20; // Heal 20 HP
                            if (this.player.health < this.player.maxHealth) {
                                this.player.heal(healAmount);
                                this.hud.showHealNotification(healAmount);
                            }
                        }

                        // === NEW: Points system ===
                        this.points++;
                        this.hud.updatePoints(this.points);
                        this.hud.updatePowerupToolbar(this.points, this.powerupManager.activePowerups);
                    }
                }
            });
        });

        // Check snake-player collisions
        this.snakes.forEach(snake => {
            if (!snake.active) return;
            const snakeBounds = snake.getCollisionBounds();

            if (circleCollision(playerBounds, snakeBounds)) {
                // === IMPROVED: Reduced snake damage ===
                // Base damage 5 + size factor (was 10 + size)
                const damage = 5 + Math.floor(snake.radius * 0.5);
                this.player.takeDamage(damage);

                // Snake disappears after hitting player
                snake.active = false;
            }
        });
    }

    /**
     * End the game
     */
    endGame() {
        this.running = false;
        this.gameOver = true;

        // Update game over screen
        document.getElementById('final-score').textContent = this.leveling.score.toLocaleString();
        document.getElementById('final-level').textContent = this.leveling.level;
        document.getElementById('final-kills').textContent = this.leveling.totalKills;

        // Show game over screen
        this.gameOverScreen.classList.remove('hidden');
        this.hud.hide();
    }

    /**
     * Render the game
     */
    render() {
        const ctx = this.ctx;

        // Clear canvas
        ctx.fillStyle = GAME_CONSTANTS.COLORS.BACKGROUND;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid background
        this.drawGrid();

        // Draw game entities
        this.bullets.forEach(bullet => bullet.render(ctx));
        this.snakes.forEach(snake => snake.render(ctx));
        this.player.render(ctx);

        // Draw vignette effect
        this.drawVignette();
    }

    /**
     * Draw background grid
     */
    drawGrid() {
        const ctx = this.ctx;
        const gridSize = 50;

        ctx.strokeStyle = GAME_CONSTANTS.COLORS.GRID;
        ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= this.canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= this.canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }
    }

    /**
     * Draw vignette effect around edges
     */
    drawVignette() {
        const ctx = this.ctx;
        const gradient = ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.7
        );

        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.7, 'transparent');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
