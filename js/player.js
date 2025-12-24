/**
 * SNAKE KILLER - Player Class
 * Cartoon human character with gun, shooting animations, and state management
 * === ENHANCED: Touch input support for mobile devices ===
 */

class Player {
    /**
     * Create the player
     * @param {number} x - Starting X position
     * @param {number} y - Starting Y position
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = GAME_CONSTANTS.PLAYER_RADIUS;
        this.speed = GAME_CONSTANTS.PLAYER_SPEED;

        // Health
        this.maxHealth = GAME_CONSTANTS.PLAYER_MAX_HEALTH;
        this.health = this.maxHealth;

        // Shooting
        this.currentWeapon = WEAPONS.PISTOL;
        this.shootCooldown = this.currentWeapon.fireRate * 1000;
        this.lastShootTime = 0;

        // === NEW: Shooting animation state ===
        this.muzzleFlashTime = 0;      // Time remaining for muzzle flash
        this.recoilOffset = 0;          // Current recoil offset
        this.gunLength = 28;            // Gun barrel length for bullet spawn
        this.gunOffsetY = -8;           // Gun position relative to body center

        // Input state - Keyboard
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false
        };

        // Input state - Mouse/Pointer
        this.mouseX = x;
        this.mouseY = y;
        this.mouseDown = false;

        // === NEW: Touch input state ===
        this.touchActive = false;       // Is there an active touch?
        this.touchX = x;                // Touch target X position
        this.touchY = y;                // Touch target Y position
        this.touchMoveThreshold = 30;   // Distance from touch before moving stops

        // Power-up state (extended for new power packs)
        this.powerups = {
            rapidFire: false,
            wideShot: false,
            shield: false,
            fasterGuns: false,     // NEW: Faster fire rate + bullet speed
            freezeSnakes: false    // NEW: Freeze all snakes
        };

        // Visual
        this.color = GAME_CONSTANTS.COLORS.PLAYER;
        this.glowColor = GAME_CONSTANTS.COLORS.PLAYER_GLOW;
        this.rotation = 0;
        this.pulsePhase = 0;

        // Character colors for cartoon human
        this.skinColor = '#ffcc99';
        this.shirtColor = '#00aa55';
        this.pantsColor = '#2255aa';
        this.hairColor = '#442200';

        // State
        this.active = true;
        this.invulnerable = false;
        this.invulnerableTime = 0;
    }

    /**
     * Handle keyboard input
     * @param {string} key - Key pressed/released
     * @param {boolean} pressed - Whether key is pressed
     */
    handleKeyInput(key, pressed) {
        switch (key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.keys.up = pressed;
                break;
            case 's':
            case 'arrowdown':
                this.keys.down = pressed;
                break;
            case 'a':
            case 'arrowleft':
                this.keys.left = pressed;
                break;
            case 'd':
            case 'arrowright':
                this.keys.right = pressed;
                break;
        }
    }

    /**
     * Handle mouse input
     * @param {number} x - Mouse X position
     * @param {number} y - Mouse Y position
     * @param {boolean} down - Whether mouse button is pressed
     */
    handleMouseInput(x, y, down = null) {
        this.mouseX = x;
        this.mouseY = y;
        if (down !== null) {
            this.mouseDown = down;
        }
    }

    /**
     * === NEW: Handle touch input ===
     * Touch controls: Player moves toward touch, auto-fires while touching
     * @param {number} x - Touch X position (already converted to canvas coords)
     * @param {number} y - Touch Y position (already converted to canvas coords)
     * @param {string} type - 'start', 'move', or 'end'
     */
    handleTouchInput(x, y, type) {
        switch (type) {
            case 'start':
                this.touchActive = true;
                this.touchX = x;
                this.touchY = y;
                // Also set mouse position for aiming and enable auto-fire
                this.mouseX = x;
                this.mouseY = y;
                this.mouseDown = true;  // Auto-fire while touching
                break;

            case 'move':
                if (this.touchActive) {
                    this.touchX = x;
                    this.touchY = y;
                    // Update aim direction
                    this.mouseX = x;
                    this.mouseY = y;
                }
                break;

            case 'end':
                this.touchActive = false;
                this.mouseDown = false;  // Stop auto-fire
                break;
        }
    }

    /**
     * Update player state
     * @param {number} deltaTime - Time since last frame
     * @param {number} canvasWidth - Canvas width for bounds
     * @param {number} canvasHeight - Canvas height for bounds
     * @returns {Bullet|null} New bullet if shooting, null otherwise
     */
    update(deltaTime, canvasWidth, canvasHeight) {
        // Update pulse animation
        this.pulsePhase += deltaTime * 4;

        // === NEW: Update shooting animations ===
        if (this.muzzleFlashTime > 0) {
            this.muzzleFlashTime -= deltaTime;
        }
        // Smooth recoil recovery
        if (this.recoilOffset > 0) {
            this.recoilOffset = Math.max(0, this.recoilOffset - deltaTime * 40);
        }

        // Calculate movement
        let vx = 0;
        let vy = 0;

        // === TOUCH MODE: Player stays fixed, only aims at touch ===
        // Movement is keyboard-only (WASD/arrows)
        if (this.keys.up) vy -= 1;
        if (this.keys.down) vy += 1;
        if (this.keys.left) vx -= 1;
        if (this.keys.right) vx += 1;

        // Normalize diagonal movement
        if (vx !== 0 && vy !== 0) {
            const factor = 1 / Math.sqrt(2);
            vx *= factor;
            vy *= factor;
        }

        // Apply movement
        this.x += vx * this.speed * deltaTime;
        this.y += vy * this.speed * deltaTime;

        // Keep player in bounds
        this.x = clamp(this.x, this.radius, canvasWidth - this.radius);
        this.y = clamp(this.y, this.radius, canvasHeight - this.radius);

        // Update rotation to face mouse
        this.rotation = angleBetween(this.x, this.y, this.mouseX, this.mouseY);

        // Update invulnerability
        if (this.invulnerable) {
            this.invulnerableTime -= deltaTime;
            if (this.invulnerableTime <= 0) {
                this.invulnerable = false;
            }
        }

        // Handle shooting
        let bullet = null;
        if (this.mouseDown && this.canShoot()) {
            bullet = this.shoot();
        }

        return bullet;
    }

    /**
     * Check if player can shoot
     * @returns {boolean} True if can shoot
     */
    canShoot() {
        const now = Date.now();
        // Faster guns power-up stacks with rapid fire
        let cooldown = this.currentWeapon.fireRate * 1000;
        if (this.powerups.rapidFire) cooldown /= 2;
        if (this.powerups.fasterGuns) cooldown /= 1.5;
        return now - this.lastShootTime >= cooldown;
    }

    /**
     * Fire a bullet - spawns from gun barrel with animation
     * @returns {Bullet} New bullet
     */
    shoot() {
        this.lastShootTime = Date.now();

        // === NEW: Trigger shooting animation ===
        this.muzzleFlashTime = 0.08;  // 80ms muzzle flash
        this.recoilOffset = 5;         // Recoil pushback in pixels

        // Calculate gun barrel position
        const gunEndX = this.x + Math.cos(this.rotation) * (this.gunLength - this.recoilOffset);
        const gunEndY = this.y + Math.sin(this.rotation) * (this.gunLength - this.recoilOffset);

        // Offset perpendicular to aim direction for gun position
        const perpAngle = this.rotation - Math.PI / 2;
        const spawnX = gunEndX + Math.cos(perpAngle) * this.gunOffsetY * 0.3;
        const spawnY = gunEndY + Math.sin(perpAngle) * this.gunOffsetY * 0.3;

        // Multi-projectile support (Shotgun)
        if (this.currentWeapon.count > 1) {
            const bullets = [];
            const totalSpread = this.currentWeapon.spread;
            const startAngle = this.rotation - totalSpread / 2;
            const step = totalSpread / (this.currentWeapon.count - 1);

            for (let i = 0; i < this.currentWeapon.count; i++) {
                const angle = startAngle + step * i;
                bullets.push(new Bullet(spawnX, spawnY, angle, this.currentWeapon, this.powerups));
            }
            return bullets;
        } else {
            // Single shot with random spread
            const spread = (Math.random() - 0.5) * (this.currentWeapon.spread || 0);
            return new Bullet(spawnX, spawnY, this.rotation + spread, this.currentWeapon, this.powerups);
        }
    }

    /**
     * Set active weapon
     * @param {string} weaponId 
     */
    setWeapon(weaponId) {
        // Find weapon by ID
        const weapon = Object.values(WEAPONS).find(w => w.id === weaponId);
        if (weapon) {
            this.currentWeapon = weapon;
        }
    }

    /**
     * Take damage
     * @param {number} damage - Amount of damage
     * @returns {boolean} True if player died
     */
    /**
     * Take damage
     * @param {number} damage - Amount of damage
     * @returns {boolean} True if player died
     */
    takeDamage(damage) {
        if (this.invulnerable || this.powerups.shield) {
            return false;
        }

        this.health -= damage;
        // === IMPROVED: Longer invulnerability window ===
        this.setInvulnerable(1.0); // 1 second invulnerability

        if (this.health <= 0) {
            this.health = 0;
            this.active = false;
            return true;
        }
        return false;
    }

    /**
     * Heal the player
     * @param {number} amount - Amount to heal
     */
    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }

    /**
     * Set invulnerability
     * @param {number} duration - Duration in seconds
     */
    setInvulnerable(duration) {
        this.invulnerable = true;
        this.invulnerableTime = duration;
    }

    /**
     * Apply a power-up
     * @param {string} type - Power-up type
     * @param {number} duration - Duration in seconds
     */
    applyPowerup(type, duration) {
        if (this.powerups.hasOwnProperty(type)) {
            this.powerups[type] = true;
        }
    }

    /**
     * Remove a power-up
     * @param {string} type - Power-up type
     */
    removePowerup(type) {
        if (this.powerups.hasOwnProperty(type)) {
            this.powerups[type] = false;
        }
    }

    /**
     * Render the cartoon human character with gun
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Flickering effect when invulnerable
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // === Draw shield effect (if active) ===
        if (this.powerups.shield) {
            this.drawShieldEffect(ctx);
        }

        // === Draw character glow ===
        this.drawGlow(ctx);

        // === Draw the cartoon human character ===
        this.drawCharacter(ctx);

        // === Draw the gun with animations ===
        this.drawGun(ctx);

        // === Draw muzzle flash if shooting ===
        if (this.muzzleFlashTime > 0) {
            this.drawMuzzleFlash(ctx);
        }

        ctx.restore();
    }

    /**
     * Draw shield bubble effect
     * @param {CanvasRenderingContext2D} ctx
     */
    drawShieldEffect(ctx) {
        const shieldRadius = this.radius * 1.8;
        const gradient = ctx.createRadialGradient(0, 0, this.radius, 0, 0, shieldRadius);
        gradient.addColorStop(0, 'rgba(0, 212, 255, 0)');
        gradient.addColorStop(0.7, 'rgba(0, 212, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 212, 255, 0.6)');

        ctx.beginPath();
        ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    /**
     * Draw ambient glow around character
     * @param {CanvasRenderingContext2D} ctx
     */
    drawGlow(ctx) {
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.1;
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 2 * pulse);
        glowGradient.addColorStop(0, this.glowColor);
        glowGradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 2 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();
    }

    /**
     * Draw cartoon human character (top-down view)
     * @param {CanvasRenderingContext2D} ctx
     */
    drawCharacter(ctx) {
        const r = this.radius;

        // Body (oval torso from top-down view)
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.7, r * 0.9, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.shirtColor;
        ctx.fill();
        ctx.strokeStyle = '#006633';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Shirt details (stripes)
        ctx.beginPath();
        ctx.moveTo(-r * 0.3, -r * 0.6);
        ctx.lineTo(-r * 0.3, r * 0.6);
        ctx.moveTo(r * 0.3, -r * 0.6);
        ctx.lineTo(r * 0.3, r * 0.6);
        ctx.strokeStyle = '#008844';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Head (circle)
        const headX = r * 0.5;  // Head is forward-facing
        const headY = 0;
        const headRadius = r * 0.45;

        ctx.beginPath();
        ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.skinColor;
        ctx.fill();
        ctx.strokeStyle = '#cc9966';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Hair (on top of head)
        ctx.beginPath();
        ctx.arc(headX, headY - headRadius * 0.2, headRadius * 0.8, Math.PI, 0);
        ctx.fillStyle = this.hairColor;
        ctx.fill();

        // Eyes (looking forward)
        const eyeOffset = headRadius * 0.35;
        const eyeY = headY;
        const eyeX = headX + headRadius * 0.3;

        // Left eye
        ctx.beginPath();
        ctx.arc(eyeX, eyeY - eyeOffset * 0.5, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeX + 1, eyeY - eyeOffset * 0.5, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();

        // Right eye
        ctx.beginPath();
        ctx.arc(eyeX, eyeY + eyeOffset * 0.5, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeX + 1, eyeY + eyeOffset * 0.5, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();

        // Arms (reaching toward gun)
        // Back arm
        ctx.beginPath();
        ctx.moveTo(0, r * 0.5);
        ctx.lineTo(r * 0.3 - this.recoilOffset * 0.3, r * 0.7);
        ctx.lineTo(r * 0.8 - this.recoilOffset * 0.5, r * 0.4);
        ctx.lineWidth = 6;
        ctx.strokeStyle = this.skinColor;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Front arm (holding gun - on the other side)
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.5);
        ctx.lineTo(r * 0.3 - this.recoilOffset * 0.3, -r * 0.7);
        ctx.lineTo(r * 0.8 - this.recoilOffset * 0.5, -r * 0.4);
        ctx.lineWidth = 6;
        ctx.strokeStyle = this.skinColor;
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    /**
     * Draw the gun with recoil animation
     * @param {CanvasRenderingContext2D} ctx
     */
    drawGun(ctx) {
        const r = this.radius;
        const recoil = this.recoilOffset;

        // Gun position (held in front of character)
        const gunStartX = r * 0.5 - recoil * 0.3;
        const gunStartY = this.gunOffsetY * 0.5;

        // Gun body (rectangle)
        ctx.save();
        ctx.translate(gunStartX, gunStartY);

        // Gun handle
        ctx.fillStyle = '#333333';
        ctx.fillRect(-4, 3, 8, 12);

        // Gun barrel
        ctx.fillStyle = '#555555';
        ctx.fillRect(0, -3, this.gunLength - recoil, 6);

        // Gun body
        ctx.fillStyle = '#444444';
        ctx.fillRect(-6, -4, 14, 8);

        // Gun details (trigger guard)
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 8, 4, 0, Math.PI);
        ctx.stroke();

        // Barrel tip
        ctx.fillStyle = '#333333';
        ctx.fillRect(this.gunLength - recoil - 3, -4, 3, 8);

        // Gun sight
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(this.gunLength - recoil - 6, -5, 2, 2);

        ctx.restore();
    }

    /**
     * Draw muzzle flash effect when shooting
     * @param {CanvasRenderingContext2D} ctx
     */
    drawMuzzleFlash(ctx) {
        const gunEndX = this.gunLength - this.recoilOffset + this.radius * 0.5;
        const gunEndY = this.gunOffsetY * 0.5;

        // Flash intensity based on remaining time
        const intensity = this.muzzleFlashTime / 0.08;

        // Outer flash glow
        const gradient = ctx.createRadialGradient(
            gunEndX, gunEndY, 0,
            gunEndX, gunEndY, 20 * intensity
        );
        gradient.addColorStop(0, `rgba(255, 200, 50, ${intensity})`);
        gradient.addColorStop(0.3, `rgba(255, 150, 0, ${intensity * 0.7})`);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(gunEndX, gunEndY, 20 * intensity, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Inner bright flash
        ctx.beginPath();
        ctx.arc(gunEndX + 5, gunEndY, 8 * intensity, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 200, ${intensity})`;
        ctx.fill();

        // Flash spikes
        ctx.save();
        ctx.translate(gunEndX, gunEndY);
        ctx.fillStyle = `rgba(255, 220, 100, ${intensity * 0.8})`;

        for (let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 4);
            ctx.beginPath();
            ctx.moveTo(0, -2);
            ctx.lineTo(15 * intensity, 0);
            ctx.lineTo(0, 2);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }

    /**
     * Get collision bounds
     * @returns {Object} Circle collision data
     */
    getCollisionBounds() {
        return {
            x: this.x,
            y: this.y,
            radius: this.radius
        };
    }

    /**
     * Reset player to initial state
     * @param {number} x - New X position
     * @param {number} y - New Y position
     */
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.health = this.maxHealth;
        this.active = true;
        this.invulnerable = false;
        this.muzzleFlashTime = 0;
        this.recoilOffset = 0;
        // Reset touch state
        this.touchActive = false;
        this.mouseDown = false;
        this.powerups = {
            rapidFire: false,
            wideShot: false,
            shield: false,
            fasterGuns: false,
            freezeSnakes: false
        };
    }
}
