/**
 * SNAKE KILLER - Bullet Class
 * Handles bullet creation, movement, and rendering
 */

class Bullet {
    /**
     * Create a new bullet
     * @param {number} x - Starting X position
     * @param {number} y - Starting Y position
     * @param {number} angle - Direction angle in radians
     * @param {Object} weapon - Weapon configuration
     * @param {Object} modifiers - Power-up modifiers
     */
    constructor(x, y, angle, weapon, modifiers = {}) {
        this.x = x;
        this.y = y;
        this.angle = angle;

        // Apply weapon stats and modifiers
        const speedMult = modifiers.fasterGuns ? 1.5 : 1;

        // Use default if weapon not provided (fallback)
        const w = weapon || {
            bulletSize: 1,
            bulletSpeed: GAME_CONSTANTS.BULLET_SPEED,
            damage: GAME_CONSTANTS.BULLET_DAMAGE,
            bulletColor: GAME_CONSTANTS.COLORS.BULLET
        };

        this.radius = Math.max(2, w.bulletSize * GAME_CONSTANTS.BULLET_RADIUS * (modifiers.wideShot ? 1.5 : 1));
        this.speed = w.bulletSpeed * speedMult;
        this.damage = w.damage * (modifiers.wideShot ? 1.5 : 1);

        // Calculate velocity components
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;

        // Visual properties
        this.color = w.bulletColor || GAME_CONSTANTS.COLORS.BULLET;
        this.glowColor = GAME_CONSTANTS.COLORS.BULLET_GLOW;
        this.trail = []; // Store previous positions for trail effect
        this.maxTrailLength = 8;

        // State
        this.active = true;
    }

    /**
     * Update bullet position
     * @param {number} deltaTime - Time since last frame in seconds
     * @param {number} canvasWidth - Canvas width for bounds checking
     * @param {number} canvasHeight - Canvas height for bounds checking
     */
    update(deltaTime, canvasWidth, canvasHeight) {
        // Store current position in trail
        this.trail.unshift({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.pop();
        }

        // Update position
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Check if bullet is out of bounds
        const margin = this.radius * 2;
        if (this.x < -margin || this.x > canvasWidth + margin ||
            this.y < -margin || this.y > canvasHeight + margin) {
            this.active = false;
        }
    }

    /**
     * Render the bullet
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    render(ctx) {
        ctx.save();

        // Draw trail
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            const alpha = 1 - (i / this.trail.length);
            const size = this.radius * (1 - i * 0.1);

            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            ctx.fillStyle = glowColor(this.color, alpha * 0.5);
            ctx.fill();
        }

        // Draw glow effect
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius * 3
        );
        gradient.addColorStop(0, this.glowColor);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw main bullet
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Draw core highlight
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3,
            this.radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();

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
     * Mark bullet as destroyed
     */
    destroy() {
        this.active = false;
    }
}
