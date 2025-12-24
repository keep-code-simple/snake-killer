/**
 * SNAKE KILLER - Snake Enemy Class
 * Handles snake spawning, movement AI, and rendering
 */

class Snake {
    /**
     * Create a new snake enemy
     * @param {number} canvasWidth - Canvas width for spawn positioning
     * @param {number} canvasHeight - Canvas height for spawn positioning
     * @param {number} level - Current player level for scaling
     */
    constructor(canvasWidth, canvasHeight, level) {
        // Spawn at random edge
        this.spawnAtEdge(canvasWidth, canvasHeight);

        // Scale stats based on level
        const levelMultiplier = 1 + (level - 1) * 0.2;
        const speedMultiplier = 1 + (level - 1) * 0.1;

        // Randomize individual snake properties for variety
        const sizeVariation = randomRange(0.8, 1.3);
        const speedVariation = randomRange(0.8, 1.2);

        this.radius = GAME_CONSTANTS.SNAKE_BASE_RADIUS * sizeVariation;
        this.speed = GAME_CONSTANTS.SNAKE_BASE_SPEED * speedMultiplier * speedVariation;
        this.baseSpeed = this.speed;  // Store base speed for freeze/unfreeze
        this.maxHealth = Math.floor(GAME_CONSTANTS.SNAKE_BASE_HEALTH * levelMultiplier * sizeVariation);
        this.health = this.maxHealth;
        this.xpValue = Math.floor(GAME_CONSTANTS.SNAKE_BASE_XP * levelMultiplier);

        // Visual properties - color based on strength
        this.hue = this.calculateHue(levelMultiplier * sizeVariation);
        this.bodySegments = this.createBodySegments();

        // Movement
        this.vx = 0;
        this.vy = 0;
        this.targetX = canvasWidth / 2;
        this.targetY = canvasHeight / 2;

        // Animation
        this.wobbleOffset = Math.random() * Math.PI * 2;
        this.wobbleSpeed = randomRange(3, 6);

        // State
        this.active = true;
        this.hitFlash = 0;

        // === NEW: Freeze state for freeze power-up ===
        this.frozen = false;
    }

    /**
     * Spawn snake at a random screen edge
     * @param {number} canvasWidth - Canvas width
     * @param {number} canvasHeight - Canvas height
     */
    spawnAtEdge(canvasWidth, canvasHeight) {
        const edge = randomInt(0, 3);
        const margin = 50;

        switch (edge) {
            case 0: // Top
                this.x = randomRange(0, canvasWidth);
                this.y = -margin;
                break;
            case 1: // Right
                this.x = canvasWidth + margin;
                this.y = randomRange(0, canvasHeight);
                break;
            case 2: // Bottom
                this.x = randomRange(0, canvasWidth);
                this.y = canvasHeight + margin;
                break;
            case 3: // Left
                this.x = -margin;
                this.y = randomRange(0, canvasHeight);
                break;
        }
    }

    /**
     * Calculate hue based on snake strength
     * @param {number} strength - Strength multiplier
     * @returns {number} Hue value
     */
    calculateHue(strength) {
        // Weak snakes are green, strong ones are red/purple
        const baseHue = 120; // Green
        const hueShift = Math.min(strength - 1, 2) * 60;
        return (baseHue - hueShift + 360) % 360;
    }

    /**
     * Create body segment positions for snake rendering
     * @returns {Array} Array of segment objects
     */
    createBodySegments() {
        const segments = [];
        const numSegments = randomInt(4, 7);

        for (let i = 0; i < numSegments; i++) {
            segments.push({
                x: this.x,
                y: this.y,
                radius: this.radius * (1 - i * 0.1)
            });
        }

        return segments;
    }

    /**
     * Update snake position and behavior
     * @param {number} deltaTime - Time since last frame
     * @param {number} playerX - Player X position
     * @param {number} playerY - Player Y position
     */
    update(deltaTime, playerX, playerY) {
        // === NEW: Skip movement if frozen ===
        if (this.frozen) {
            // Still update hit flash even when frozen
            if (this.hitFlash > 0) {
                this.hitFlash -= deltaTime * 5;
            }
            return;
        }

        // Update target position (move toward player)
        this.targetX = playerX;
        this.targetY = playerY;

        // Calculate direction to player
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            // Normalize and apply speed
            this.vx = (dx / dist) * this.speed;
            this.vy = (dy / dist) * this.speed;
        }

        // Add wobble for organic movement
        const wobble = Math.sin(Date.now() * 0.005 * this.wobbleSpeed + this.wobbleOffset);
        const perpX = -this.vy;
        const perpY = this.vx;
        const wobbleStrength = 0.3;

        // Update position
        this.x += (this.vx + perpX * wobble * wobbleStrength) * deltaTime;
        this.y += (this.vy + perpY * wobble * wobbleStrength) * deltaTime;

        // Update body segments (follow the head)
        this.updateBodySegments();

        // Update hit flash
        if (this.hitFlash > 0) {
            this.hitFlash -= deltaTime * 5;
        }
    }

    /**
     * Update body segment positions to follow head
     */
    updateBodySegments() {
        if (this.bodySegments.length === 0) return;

        // Head follows actual position
        this.bodySegments[0].x = this.x;
        this.bodySegments[0].y = this.y;

        // Each segment follows the one ahead
        for (let i = 1; i < this.bodySegments.length; i++) {
            const prev = this.bodySegments[i - 1];
            const curr = this.bodySegments[i];
            const spacing = this.radius * 0.8;

            const dx = prev.x - curr.x;
            const dy = prev.y - curr.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > spacing) {
                const ratio = spacing / dist;
                curr.x = prev.x - dx * ratio;
                curr.y = prev.y - dy * ratio;
            }
        }
    }

    /**
     * Render the snake
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    render(ctx) {
        ctx.save();

        // Determine colors based on state
        const flashAlpha = Math.max(0, this.hitFlash);

        // === NEW: Apply frozen blue tint if frozen ===
        let bodyColor, headColor;
        if (this.frozen) {
            // Frozen snakes have icy blue color
            bodyColor = 'rgba(100, 180, 255, 0.9)';
            headColor = 'rgba(150, 200, 255, 0.95)';
        } else if (flashAlpha > 0) {
            bodyColor = `rgba(255, 255, 255, ${flashAlpha})`;
            headColor = `rgba(255, 255, 255, ${flashAlpha})`;
        } else {
            bodyColor = hslToHex(this.hue, 70, 45);
            headColor = hslToHex(this.hue, 80, 55);
        }

        // Draw body segments (back to front)
        for (let i = this.bodySegments.length - 1; i >= 0; i--) {
            const segment = this.bodySegments[i];
            const isHead = i === 0;

            // Glow effect
            ctx.beginPath();
            ctx.arc(segment.x, segment.y, segment.radius * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, ${100 - this.hue * 0.3}, ${100 - this.hue * 0.3}, 0.2)`;
            ctx.fill();

            // Main body
            ctx.beginPath();
            ctx.arc(segment.x, segment.y, segment.radius, 0, Math.PI * 2);
            ctx.fillStyle = isHead ? headColor : bodyColor;
            ctx.fill();

            // Pattern/scales
            if (!isHead && i % 2 === 0) {
                ctx.beginPath();
                ctx.arc(segment.x, segment.y, segment.radius * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = hslToHex(this.hue, 60, 35);
                ctx.fill();
            }
        }

        // Draw eyes on head
        const head = this.bodySegments[0];
        const eyeOffset = this.radius * 0.4;
        const eyeRadius = this.radius * 0.25;

        // Calculate eye positions based on movement direction
        const angle = Math.atan2(this.vy, this.vx);
        const eyeAngle1 = angle - Math.PI * 0.25;
        const eyeAngle2 = angle + Math.PI * 0.25;

        // Left eye
        const eye1X = head.x + Math.cos(eyeAngle1) * eyeOffset;
        const eye1Y = head.y + Math.sin(eyeAngle1) * eyeOffset;

        // Right eye
        const eye2X = head.x + Math.cos(eyeAngle2) * eyeOffset;
        const eye2Y = head.y + Math.sin(eyeAngle2) * eyeOffset;

        // Draw eyes
        [{ x: eye1X, y: eye1Y }, { x: eye2X, y: eye2Y }].forEach(eye => {
            // White part
            ctx.beginPath();
            ctx.arc(eye.x, eye.y, eyeRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            // Pupil
            ctx.beginPath();
            ctx.arc(eye.x + Math.cos(angle) * eyeRadius * 0.3,
                eye.y + Math.sin(angle) * eyeRadius * 0.3,
                eyeRadius * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = '#000000';
            ctx.fill();
        });

        // Draw health bar if damaged
        if (this.health < this.maxHealth) {
            const barWidth = this.radius * 2;
            const barHeight = 4;
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.radius - 12;
            const healthPercent = this.health / this.maxHealth;

            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            // Health fill
            ctx.fillStyle = healthPercent > 0.5 ? '#00ff88' :
                healthPercent > 0.25 ? '#ffaa00' : '#ff3366';
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        }

        ctx.restore();
    }

    /**
     * Take damage from a bullet
     * @param {number} damage - Amount of damage
     * @returns {boolean} True if snake died
     */
    takeDamage(damage) {
        this.health -= damage;
        this.hitFlash = 1;

        if (this.health <= 0) {
            this.active = false;
            return true;
        }
        return false;
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
}
