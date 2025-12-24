/**
 * SNAKE KILLER - Utility Functions
 * Common helper functions used throughout the game
 */

// ============================================
// MATH UTILITIES
// ============================================

/**
 * Calculate distance between two points
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Distance between points
 */
function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate angle between two points in radians
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Angle in radians
 */
function angleBetween(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Generate random number between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number
 */
function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Generate random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
function randomInt(min, max) {
    return Math.floor(randomRange(min, max + 1));
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum bound
 * @param {number} max - Maximum bound
 * @returns {number} Clamped value
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * Normalize a vector
 * @param {number} x - X component
 * @param {number} y - Y component
 * @returns {{x: number, y: number}} Normalized vector
 */
function normalize(x, y) {
    const length = Math.sqrt(x * x + y * y);
    if (length === 0) return { x: 0, y: 0 };
    return { x: x / length, y: y / length };
}

// ============================================
// COLLISION DETECTION
// ============================================

/**
 * Check circle-circle collision
 * @param {Object} c1 - First circle {x, y, radius}
 * @param {Object} c2 - Second circle {x, y, radius}
 * @returns {boolean} True if colliding
 */
function circleCollision(c1, c2) {
    const dist = distance(c1.x, c1.y, c2.x, c2.y);
    return dist < c1.radius + c2.radius;
}

/**
 * Check if point is inside circle
 * @param {number} px - Point X
 * @param {number} py - Point Y
 * @param {Object} circle - Circle {x, y, radius}
 * @returns {boolean} True if point is inside circle
 */
function pointInCircle(px, py, circle) {
    return distance(px, py, circle.x, circle.y) < circle.radius;
}

// ============================================
// VISUAL UTILITIES
// ============================================

/**
 * Convert HSL to RGB hex string
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} Hex color string
 */
function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    
    return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Create a glow effect color
 * @param {string} color - Base color
 * @param {number} alpha - Alpha value (0-1)
 * @returns {string} RGBA color string
 */
function glowColor(color, alpha) {
    // Extract rgb values from color string
    const match = color.match(/\d+/g);
    if (match && match.length >= 3) {
        return `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${alpha})`;
    }
    return color;
}

// ============================================
// GAME CONSTANTS
// ============================================

const GAME_CONSTANTS = {
    // Canvas
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 800,
    
    // Player
    PLAYER_RADIUS: 20,
    PLAYER_SPEED: 300,
    PLAYER_MAX_HEALTH: 100,
    PLAYER_SHOOT_COOLDOWN: 200, // ms
    
    // Bullet
    BULLET_RADIUS: 6,
    BULLET_SPEED: 600,
    BULLET_DAMAGE: 25,
    
    // Snake
    SNAKE_BASE_RADIUS: 15,
    SNAKE_BASE_SPEED: 100,
    SNAKE_BASE_HEALTH: 50,
    SNAKE_BASE_XP: 10,
    SNAKE_SPAWN_RATE: 1500, // ms
    SNAKE_MIN_SPAWN_RATE: 400, // ms (fastest spawn rate)
    
    // Colors
    COLORS: {
        PLAYER: '#00ff88',
        PLAYER_GLOW: 'rgba(0, 255, 136, 0.3)',
        BULLET: '#00d4ff',
        BULLET_GLOW: 'rgba(0, 212, 255, 0.5)',
        SNAKE_BODY: '#ff3366',
        SNAKE_HEAD: '#ff6688',
        BACKGROUND: '#0a0e17',
        GRID: 'rgba(255, 255, 255, 0.03)'
    }
};
