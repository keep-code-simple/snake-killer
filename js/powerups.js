/**
 * SNAKE KILLER - Power-ups System
 * Manages power-up awarding, duration, and effects
 * === ENHANCED: Kill-based milestone power packs ===
 */

// Original level-based power-up definitions
const POWERUP_TYPES = {
    RAPID_FIRE: {
        id: 'rapidFire',
        name: 'RAPID FIRE',
        icon: '⚡',
        duration: 10,
        color: '#ffaa00'
    },
    WIDE_SHOT: {
        id: 'wideShot',
        name: 'WIDE SHOT',
        icon: '💥',
        duration: 10,
        color: '#ff6688'
    },
    SHIELD: {
        id: 'shield',
        name: 'SHIELD',
        icon: '🛡️',
        duration: 5,
        color: '#00d4ff'
    },
    NUKE: {
        id: 'nuke',
        name: 'NUKE',
        icon: '☢️',
        duration: 0, // Instant
        color: '#ff3366'
    }
};

// === NEW: Kill-based power pack definitions ===
const POWER_PACKS = {
    FASTER_GUNS: {
        id: 'fasterGuns',
        name: 'FASTER GUNS',
        icon: '🔫',
        duration: 12,
        color: '#ff9900',
        description: 'Faster fire rate + bullet speed',
        cost: 10
    },
    SHIELD_PROTECTION: {
        id: 'shield',
        name: 'SHIELD PROTECTION',
        icon: '🛡️',
        duration: 8,
        color: '#00d4ff',
        description: 'Absorb snake damage',
        cost: 10
    },
    FREEZE_SNAKES: {
        id: 'freezeSnakes',
        name: 'FREEZE SNAKES',
        icon: '❄️',
        duration: 5,
        color: '#66ccff',
        description: 'Freeze all snakes',
        cost: 10
    },
    // === NEW: Call for Help power pack ===
    CALL_FOR_HELP: {
        id: 'callForHelp',
        name: 'CALL FOR HELP',
        icon: '🪂',
        duration: 15,  // Total time including descent
        color: '#ff8800',
        description: 'Summon NPC ally with parachute',
        cost: 10
    }
};

// Kill milestones REMOVED in favor of points system

// Level milestones for power-ups (original system)
const POWERUP_MILESTONES = {
    // Legacy support or remove if desired. Keeping for now but focusing on points.
};

/**
 * PowerupManager class
 * Handles active power-ups, kill milestones, and their timers
 */
class PowerupManager {
    constructor() {
        this.activePowerups = new Map(); // Map of powerup id -> remaining time
        this.hudCallback = null;
        this.frozenSnakes = [];  // Reference to snakes array for freeze effect
    }

    /**
     * Set callback for HUD updates
     * @param {Function} callback - Function to call when power-ups change
     */
    setHudCallback(callback) {
        this.hudCallback = callback;
    }

    /**
     * Get power-up for a level milestone
     * @param {number} level - Level reached
     * @returns {Object|null} Power-up type or null if no milestone
     */
    getPowerupForLevel(level) {
        return POWERUP_MILESTONES[level] || null;
    }

    /**
     * Check if any power-up is currently active
     * @returns {boolean} True if a power-up is active
     */
    hasActivePowerup() {
        return this.activePowerups.size > 0;
    }

    /* checkKillMilestones removed */

    /**
     * Activate a power-up
     * @param {Object} powerup - Power-up type object
     * @param {Player} player - Player to apply power-up to
     * @param {Array} snakes - Array of snakes (for nuke/freeze)
     * @param {Object} gameContext - Optional game context for ally spawning
     * @returns {Object} Power-up data for notification
     */
    activate(powerup, player, snakes = [], gameContext = null) {
        if (powerup.id === 'nuke') {
            // Instant effect - damage all snakes
            this.triggerNuke(snakes);
        } else if (powerup.id === 'freezeSnakes') {
            // === Freeze all snakes ===
            this.triggerFreeze(snakes, powerup.duration);
            this.activePowerups.set(powerup.id, {
                ...powerup,
                remainingTime: powerup.duration
            });
            this.updateHud();
        } else if (powerup.id === 'callForHelp') {
            // === NEW: Call for Help - spawn NPC ally ===
            // Store pending ally spawn flag for game to handle
            this.pendingAllySpawn = true;
            this.activePowerups.set(powerup.id, {
                ...powerup,
                remainingTime: powerup.duration
            });
            this.updateHud();
        } else {
            // Duration-based power-up
            player.applyPowerup(powerup.id, powerup.duration);
            this.activePowerups.set(powerup.id, {
                ...powerup,
                remainingTime: powerup.duration
            });
            this.updateHud();
        }

        return powerup;
    }

    /**
     * Trigger nuke effect - damage all snakes
     * @param {Array} snakes - Array of snakes
     * @returns {number} Total XP from killed snakes
     */
    triggerNuke(snakes) {
        let totalXp = 0;
        const nukeDamage = 100;

        snakes.forEach(snake => {
            if (snake.active) {
                const killed = snake.takeDamage(nukeDamage);
                if (killed) {
                    totalXp += snake.xpValue;
                }
            }
        });

        return totalXp;
    }

    /**
     * === NEW: Trigger freeze effect - freeze all snakes ===
     * @param {Array} snakes - Array of snakes
     * @param {number} duration - Freeze duration in seconds
     */
    triggerFreeze(snakes, duration) {
        this.frozenSnakes = snakes;
        snakes.forEach(snake => {
            if (snake.active) {
                snake.frozen = true;
            }
        });
    }

    /**
     * === NEW: Unfreeze all snakes ===
     * @param {Array} snakes - Array of snakes
     */
    unfreezeAll(snakes) {
        snakes.forEach(snake => {
            snake.frozen = false;
        });
        this.frozenSnakes = [];
    }

    /**
     * Update power-up timers
     * @param {number} deltaTime - Time since last frame
     * @param {Player} player - Player to remove expired power-ups from
     * @param {Array} snakes - Array of snakes (for freeze expiration)
     */
    update(deltaTime, player, snakes = []) {
        let changed = false;

        for (const [id, powerup] of this.activePowerups) {
            powerup.remainingTime -= deltaTime;

            if (powerup.remainingTime <= 0) {
                // Handle power-up expiration
                if (id === 'freezeSnakes') {
                    // Unfreeze snakes when freeze expires
                    this.unfreezeAll(snakes);
                } else if (id === 'callForHelp') {
                    // === NEW: Call for Help manages its own cleanup ===
                    // Ally despawn is handled by the Ally class itself
                    // Just remove from active powerups
                } else {
                    player.removePowerup(id);
                }
                this.activePowerups.delete(id);
                changed = true;
            }
        }

        if (changed) {
            this.updateHud();
        }
    }

    /**
     * Get all active power-ups for HUD display
     * @returns {Array} Array of active power-up data
     */
    getActivePowerups() {
        return Array.from(this.activePowerups.values());
    }

    /**
     * Update HUD with current power-ups
     */
    updateHud() {
        if (this.hudCallback) {
            this.hudCallback(this.getActivePowerups());
        }
    }

    /**
     * Check if a specific power-up is active
     * @param {string} id - Power-up id
     * @returns {boolean} True if active
     */
    isActive(id) {
        return this.activePowerups.has(id);
    }

    /**
     * Reset all power-ups
     * @param {Player} player - Player to clear power-ups from
     * @param {Array} snakes - Optional snakes array to unfreeze
     */
    reset(player, snakes = []) {
        for (const id of this.activePowerups.keys()) {
            if (id === 'freezeSnakes') {
                this.unfreezeAll(snakes);
            } else {
                player.removePowerup(id);
            }
        }
        this.activePowerups.clear();
        this.updateHud();
    }
}
