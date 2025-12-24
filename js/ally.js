/**
 * SNAKE KILLER - NPC Ally Class
 * Friendly NPC that assists the player via the "Call for Help" power pack.
 * Features parachute descent, combat AI targeting snakes, and time-based lifespan.
 */

class Ally {
    /**
     * Create a new NPC ally
     * @param {number} canvasWidth - Canvas width for spawn positioning
     * @param {number} canvasHeight - Canvas height for landing position
     * @param {Object} playerWeapon - Player's current weapon to copy
     */
    constructor(canvasWidth, canvasHeight, playerWeapon) {
        // === SPAWN POSITION ===
        // Spawn at top of screen with random X position (avoid edges)
        this.x = randomRange(120, canvasWidth - 120);
        this.y = -60;  // Start above the screen
        this.landingY = canvasHeight * 0.6;  // Land at 60% screen height
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        // === CHARACTER PROPERTIES ===
        this.radius = GAME_CONSTANTS.PLAYER_RADIUS * 0.9;  // Slightly smaller than player
        this.speed = GAME_CONSTANTS.PLAYER_SPEED * 0.7;    // Slower movement

        // === STATE MACHINE ===
        // States: 'descending', 'landing', 'active', 'despawning', 'inactive'
        this.state = 'descending';
        this.active = true;

        // === PARACHUTE DESCENT ===
        this.descentSpeed = 120;          // Pixels per second during descent
        this.parachuteSwing = 0;          // Oscillation phase for swinging animation
        this.parachuteSwingSpeed = 3;     // Swing animation speed

        // === LANDING ANIMATION ===
        this.landingDustTime = 0;         // Time remaining for dust cloud effect

        // === COMBAT PROPERTIES ===
        // Copy player's weapon stats but with slower fire rate
        this.weapon = { ...playerWeapon };
        this.fireRateMultiplier = 1.3;    // 30% slower than player
        this.shootCooldown = this.weapon.fireRate * 1000 * this.fireRateMultiplier;
        this.lastShootTime = 0;

        // === TARGETING ===
        this.targetSnake = null;          // Current target snake
        this.rotation = 0;                // Facing direction

        // === LIFESPAN ===
        // Time-based despawn: 12 seconds after landing
        this.lifespan = 12;               // Seconds of active combat time
        this.timeAlive = 0;               // Time since landing

        // === DESPAWN ANIMATION ===
        this.despawnFade = 1;             // Alpha for fade-out effect
        this.despawnDuration = 0.5;       // Seconds for despawn animation

        // === VISUAL DISTINCTION ===
        // Different colors from player (orange theme)
        this.shirtColor = '#ff8800';      // Orange shirt
        this.pantsColor = '#cc9944';      // Tan pants
        this.skinColor = '#ffcc99';       // Same skin
        this.hairColor = '#553311';       // Brown hair
        this.glowColor = 'rgba(255, 136, 0, 0.3)';  // Orange glow

        // === ANIMATION ===
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.muzzleFlashTime = 0;
        this.recoilOffset = 0;
        this.gunLength = 26;
        this.gunOffsetY = -8;
    }

    /**
     * Update ally state and behavior
     * @param {number} deltaTime - Time since last frame in seconds
     * @param {Array} snakes - Array of active snakes
     * @returns {Bullet|Bullet[]|null} New bullet(s) if shooting
     */
    update(deltaTime, snakes) {
        if (!this.active) return null;

        let newBullets = null;

        // === UPDATE ANIMATIONS ===
        this.pulsePhase += deltaTime * 4;
        if (this.muzzleFlashTime > 0) {
            this.muzzleFlashTime -= deltaTime;
        }
        if (this.recoilOffset > 0) {
            this.recoilOffset = Math.max(0, this.recoilOffset - deltaTime * 40);
        }

        // === STATE MACHINE ===
        switch (this.state) {
            case 'descending':
                newBullets = this.updateDescending(deltaTime);
                break;
            case 'landing':
                newBullets = this.updateLanding(deltaTime);
                break;
            case 'active':
                newBullets = this.updateActive(deltaTime, snakes);
                break;
            case 'despawning':
                this.updateDespawning(deltaTime);
                break;
        }

        return newBullets;
    }

    /**
     * === PARACHUTE DESCENT PHASE ===
     * NPC descends from top of screen with parachute animation
     */
    updateDescending(deltaTime) {
        // Move downward
        this.y += this.descentSpeed * deltaTime;

        // Parachute swinging animation
        this.parachuteSwing += this.parachuteSwingSpeed * deltaTime;

        // Small horizontal drift based on swing
        this.x += Math.sin(this.parachuteSwing) * 20 * deltaTime;

        // Keep within bounds
        this.x = clamp(this.x, 80, this.canvasWidth - 80);

        // Check if landed
        if (this.y >= this.landingY) {
            this.y = this.landingY;
            this.state = 'landing';
            this.landingDustTime = 0.4;  // 400ms dust cloud
        }

        return null;
    }

    /**
     * === LANDING ANIMATION PHASE ===
     * Brief landing animation with dust cloud
     */
    updateLanding(deltaTime) {
        this.landingDustTime -= deltaTime;

        if (this.landingDustTime <= 0) {
            this.state = 'active';
            this.timeAlive = 0;
        }

        return null;
    }

    /**
     * === ACTIVE COMBAT PHASE ===
     * NPC moves toward snakes and shoots them
     */
    updateActive(deltaTime, snakes) {
        // Update lifespan timer
        this.timeAlive += deltaTime;

        // Check for despawn
        if (this.timeAlive >= this.lifespan) {
            this.state = 'despawning';
            this.despawnFade = 1;
            return null;
        }

        let newBullets = null;

        // === FIND TARGET ===
        // Target nearest active snake
        this.targetSnake = this.findNearestSnake(snakes);

        if (this.targetSnake) {
            // === ROTATE TO FACE TARGET ===
            this.rotation = angleBetween(this.x, this.y, this.targetSnake.x, this.targetSnake.y);

            // === MOVE TOWARD TARGET (if far enough) ===
            const dist = distance(this.x, this.y, this.targetSnake.x, this.targetSnake.y);
            const keepDistance = 150;  // Maintain safe distance from snakes

            if (dist > keepDistance) {
                // Move toward snake
                const dx = this.targetSnake.x - this.x;
                const dy = this.targetSnake.y - this.y;
                const nx = dx / dist;
                const ny = dy / dist;

                this.x += nx * this.speed * deltaTime;
                this.y += ny * this.speed * deltaTime;
            } else if (dist < keepDistance * 0.7) {
                // Back away if too close
                const dx = this.x - this.targetSnake.x;
                const dy = this.y - this.targetSnake.y;
                const nx = dx / dist;
                const ny = dy / dist;

                this.x += nx * this.speed * 0.5 * deltaTime;
                this.y += ny * this.speed * 0.5 * deltaTime;
            }

            // Keep within bounds
            this.x = clamp(this.x, this.radius, this.canvasWidth - this.radius);
            this.y = clamp(this.y, this.radius, this.canvasHeight - this.radius);

            // === SHOOT AT TARGET ===
            if (this.canShoot()) {
                newBullets = this.shoot();
            }
        } else {
            // No snakes - idle and look around
            this.rotation += deltaTime * 0.5;
        }

        return newBullets;
    }

    /**
     * === DESPAWN PHASE ===
     * Fade out animation before removal
     */
    updateDespawning(deltaTime) {
        this.despawnFade -= deltaTime / this.despawnDuration;

        if (this.despawnFade <= 0) {
            this.despawnFade = 0;
            this.active = false;
            this.state = 'inactive';
        }
    }

    /**
     * === TARGETING LOGIC ===
     * Find the nearest active snake to target
     * @param {Array} snakes - Array of snakes
     * @returns {Snake|null} Nearest snake or null
     */
    findNearestSnake(snakes) {
        let nearest = null;
        let minDist = Infinity;

        snakes.forEach(snake => {
            if (!snake.active) return;

            const dist = distance(this.x, this.y, snake.x, snake.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = snake;
            }
        });

        return nearest;
    }

    /**
     * Check if ally can shoot
     * @returns {boolean} True if can shoot
     */
    canShoot() {
        const now = Date.now();
        return now - this.lastShootTime >= this.shootCooldown;
    }

    /**
     * Fire bullets at target
     * Uses same weapon mechanics as player
     * @returns {Bullet|Bullet[]} New bullet(s)
     */
    shoot() {
        this.lastShootTime = Date.now();

        // Trigger shooting animation
        this.muzzleFlashTime = 0.08;
        this.recoilOffset = 4;

        // Calculate gun barrel position
        const gunEndX = this.x + Math.cos(this.rotation) * (this.gunLength - this.recoilOffset);
        const gunEndY = this.y + Math.sin(this.rotation) * (this.gunLength - this.recoilOffset);

        // Offset for gun position
        const perpAngle = this.rotation - Math.PI / 2;
        const spawnX = gunEndX + Math.cos(perpAngle) * this.gunOffsetY * 0.3;
        const spawnY = gunEndY + Math.sin(perpAngle) * this.gunOffsetY * 0.3;

        // Multi-projectile support (if using shotgun)
        if (this.weapon.count > 1) {
            const bullets = [];
            const totalSpread = this.weapon.spread;
            const startAngle = this.rotation - totalSpread / 2;
            const step = totalSpread / (this.weapon.count - 1);

            for (let i = 0; i < this.weapon.count; i++) {
                const angle = startAngle + step * i;
                // Create bullet with empty modifiers (ally doesn't benefit from player powerups)
                bullets.push(new Bullet(spawnX, spawnY, angle, this.weapon, {}));
            }
            return bullets;
        } else {
            // Single shot with random spread
            const spread = (Math.random() - 0.5) * (this.weapon.spread || 0);
            return new Bullet(spawnX, spawnY, this.rotation + spread, this.weapon, {});
        }
    }

    /**
     * Get remaining lifespan as percentage (for HUD)
     * @returns {number} 0-1 percentage of lifespan remaining
     */
    getLifespanPercent() {
        if (this.state !== 'active') return 1;
        return 1 - (this.timeAlive / this.lifespan);
    }

    /**
     * Get remaining seconds
     * @returns {number} Seconds remaining
     */
    getRemainingTime() {
        if (this.state === 'descending' || this.state === 'landing') {
            return this.lifespan;
        }
        return Math.max(0, this.lifespan - this.timeAlive);
    }

    /**
     * Render the ally NPC
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    render(ctx) {
        if (!this.active) return;

        ctx.save();

        // Apply despawn fade
        if (this.state === 'despawning') {
            ctx.globalAlpha = this.despawnFade;
        }

        // === DRAW PARACHUTE (during descent) ===
        if (this.state === 'descending') {
            this.drawParachute(ctx);
        }

        // === DRAW LANDING DUST (during landing) ===
        if (this.state === 'landing' && this.landingDustTime > 0) {
            this.drawLandingDust(ctx);
        }

        // === DRAW CHARACTER ===
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Draw glow
        this.drawGlow(ctx);

        // Draw character body
        this.drawCharacter(ctx);

        // Draw gun (only when active or landing)
        if (this.state === 'active' || this.state === 'landing') {
            this.drawGun(ctx);
        }

        // Draw muzzle flash
        if (this.muzzleFlashTime > 0) {
            this.drawMuzzleFlash(ctx);
        }

        ctx.restore();

        // === DRAW LIFESPAN INDICATOR (when active) ===
        if (this.state === 'active') {
            this.drawLifespanBar(ctx);
        }

        ctx.restore();
    }

    /**
     * Draw parachute during descent
     */
    drawParachute(ctx) {
        const swing = Math.sin(this.parachuteSwing) * 0.15;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(swing);

        // Parachute canopy
        const canopyWidth = 70;
        const canopyHeight = 40;
        const canopyY = -80;

        // Main canopy (semi-circle with segments)
        ctx.beginPath();
        ctx.arc(0, canopyY, canopyWidth / 2, Math.PI, 0);
        ctx.fillStyle = '#ff8800';
        ctx.fill();
        ctx.strokeStyle = '#cc6600';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Canopy segments
        for (let i = 1; i < 5; i++) {
            const segX = -canopyWidth / 2 + (canopyWidth / 5) * i;
            ctx.beginPath();
            ctx.moveTo(segX, canopyY);
            ctx.lineTo(segX, canopyY - canopyHeight * 0.8);
            ctx.strokeStyle = '#cc6600';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Suspension lines
        ctx.strokeStyle = '#886644';
        ctx.lineWidth = 1;

        // Left lines
        ctx.beginPath();
        ctx.moveTo(-canopyWidth / 2 + 5, canopyY);
        ctx.lineTo(-10, -20);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-canopyWidth / 4, canopyY);
        ctx.lineTo(-5, -20);
        ctx.stroke();

        // Right lines
        ctx.beginPath();
        ctx.moveTo(canopyWidth / 2 - 5, canopyY);
        ctx.lineTo(10, -20);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(canopyWidth / 4, canopyY);
        ctx.lineTo(5, -20);
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Draw landing dust cloud
     */
    drawLandingDust(ctx) {
        const alpha = this.landingDustTime / 0.4;
        const spread = (1 - alpha) * 40;

        ctx.save();
        ctx.globalAlpha = alpha * 0.5;

        // Dust particles
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const dustX = this.x + Math.cos(angle) * spread;
            const dustY = this.y + this.radius + Math.sin(angle) * spread * 0.3;

            ctx.beginPath();
            ctx.arc(dustX, dustY, 8 + spread * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = '#aa9977';
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * Draw ambient glow
     */
    drawGlow(ctx) {
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.1;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 2 * pulse);
        gradient.addColorStop(0, this.glowColor);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 2 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    /**
     * Draw the ally character (similar to player but different colors)
     */
    drawCharacter(ctx) {
        const r = this.radius;

        // Body
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.7, r * 0.9, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.shirtColor;
        ctx.fill();
        ctx.strokeStyle = '#cc6600';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Shirt stripes
        ctx.beginPath();
        ctx.moveTo(-r * 0.3, -r * 0.6);
        ctx.lineTo(-r * 0.3, r * 0.6);
        ctx.moveTo(r * 0.3, -r * 0.6);
        ctx.lineTo(r * 0.3, r * 0.6);
        ctx.strokeStyle = '#dd7700';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Head
        const headX = r * 0.5;
        const headY = 0;
        const headRadius = r * 0.45;

        ctx.beginPath();
        ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.skinColor;
        ctx.fill();
        ctx.strokeStyle = '#cc9966';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Hair
        ctx.beginPath();
        ctx.arc(headX, headY - headRadius * 0.2, headRadius * 0.8, Math.PI, 0);
        ctx.fillStyle = this.hairColor;
        ctx.fill();

        // Eyes
        const eyeOffset = headRadius * 0.35;
        const eyeX = headX + headRadius * 0.3;

        // Left eye
        ctx.beginPath();
        ctx.arc(eyeX, headY - eyeOffset * 0.5, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeX + 1, headY - eyeOffset * 0.5, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();

        // Right eye
        ctx.beginPath();
        ctx.arc(eyeX, headY + eyeOffset * 0.5, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeX + 1, headY + eyeOffset * 0.5, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();

        // Arms
        ctx.beginPath();
        ctx.moveTo(0, r * 0.5);
        ctx.lineTo(r * 0.3 - this.recoilOffset * 0.3, r * 0.7);
        ctx.lineTo(r * 0.8 - this.recoilOffset * 0.5, r * 0.4);
        ctx.lineWidth = 5;
        ctx.strokeStyle = this.skinColor;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, -r * 0.5);
        ctx.lineTo(r * 0.3 - this.recoilOffset * 0.3, -r * 0.7);
        ctx.lineTo(r * 0.8 - this.recoilOffset * 0.5, -r * 0.4);
        ctx.lineWidth = 5;
        ctx.strokeStyle = this.skinColor;
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    /**
     * Draw the gun
     */
    drawGun(ctx) {
        const r = this.radius;
        const recoil = this.recoilOffset;
        const gunStartX = r * 0.5 - recoil * 0.3;
        const gunStartY = this.gunOffsetY * 0.5;

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

        // Trigger guard
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 8, 4, 0, Math.PI);
        ctx.stroke();

        // Barrel tip
        ctx.fillStyle = '#333333';
        ctx.fillRect(this.gunLength - recoil - 3, -4, 3, 8);

        // Gun sight (orange for ally)
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(this.gunLength - recoil - 6, -5, 2, 2);

        ctx.restore();
    }

    /**
     * Draw muzzle flash
     */
    drawMuzzleFlash(ctx) {
        const gunEndX = this.gunLength - this.recoilOffset + this.radius * 0.5;
        const gunEndY = this.gunOffsetY * 0.5;
        const intensity = this.muzzleFlashTime / 0.08;

        const gradient = ctx.createRadialGradient(
            gunEndX, gunEndY, 0,
            gunEndX, gunEndY, 18 * intensity
        );
        gradient.addColorStop(0, `rgba(255, 180, 50, ${intensity})`);
        gradient.addColorStop(0.3, `rgba(255, 130, 0, ${intensity * 0.7})`);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(gunEndX, gunEndY, 18 * intensity, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(gunEndX + 4, gunEndY, 7 * intensity, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 200, ${intensity})`;
        ctx.fill();
    }

    /**
     * Draw lifespan indicator bar above ally
     */
    drawLifespanBar(ctx) {
        const barWidth = this.radius * 2;
        const barHeight = 4;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.radius - 16;
        const percent = this.getLifespanPercent();

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Fill
        const fillColor = percent > 0.5 ? '#ff8800' :
            percent > 0.25 ? '#ffaa00' : '#ff4400';
        ctx.fillStyle = fillColor;
        ctx.fillRect(barX, barY, barWidth * percent, barHeight);

        // Border
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
}
