/**
 * SNAKE KILLER - HUD (Heads-Up Display)
 * Manages all UI updates during gameplay
 */

class HUD {
    constructor() {
        // Get DOM elements
        this.container = document.getElementById('hud');

        // Health
        this.healthBar = document.getElementById('health-bar');
        this.healthText = document.getElementById('health-text');

        // XP and Level
        this.xpBar = document.getElementById('xp-bar');
        this.xpText = document.getElementById('xp-text');
        this.levelText = document.getElementById('level-text');

        // Stats
        this.scoreText = document.getElementById('score-text');
        this.killsText = document.getElementById('kills-text');

        // Power-ups
        this.powerupsContainer = document.getElementById('powerups-container');

        // Notifications
        this.levelUpNotification = document.getElementById('level-up-notification');
        this.powerupNotification = document.getElementById('powerup-notification');
        this.powerupName = document.getElementById('powerup-name');
    }

    /**
     * Show the HUD
     */
    show() {
        this.container.classList.remove('hidden');
    }

    /**
     * Hide the HUD
     */
    hide() {
        this.container.classList.add('hidden');
    }

    /**
     * Update health display
     * @param {number} current - Current health
     * @param {number} max - Maximum health
     */
    updateHealth(current, max) {
        const percent = (current / max) * 100;
        this.healthBar.style.width = `${percent}%`;
        this.healthText.textContent = Math.ceil(current);

        // Change color based on health level
        if (percent > 50) {
            this.healthBar.style.background = 'linear-gradient(90deg, #ff3366, #ff6688)';
        } else if (percent > 25) {
            this.healthBar.style.background = 'linear-gradient(90deg, #ffaa00, #ffcc44)';
        } else {
            this.healthBar.style.background = 'linear-gradient(90deg, #ff0033, #ff3355)';
        }
    }

    /**
     * Update XP display
     * @param {number} current - Current XP
     * @param {number} required - XP required for next level
     * @param {number} level - Current level
     */
    updateXp(current, required, level) {
        const percent = (current / required) * 100;
        this.xpBar.style.width = `${percent}%`;
        this.xpText.textContent = `${current} / ${required} XP`;
        this.levelText.textContent = `LVL ${level}`;
    }

    /**
     * Update score display
     * @param {number} score - Current score
     */
    updateScore(score) {
        this.scoreText.textContent = score.toLocaleString();
    }

    /**
     * Update kills display
     * @param {number} kills - Total kills
     */
    updateKills(kills) {
        this.killsText.textContent = kills;
    }

    /**
     * Update active power-ups display
     * @param {Array} powerups - Array of active power-ups
     */
    updatePowerups(powerups) {
        this.powerupsContainer.innerHTML = '';

        powerups.forEach(powerup => {
            const element = document.createElement('div');
            element.className = 'powerup-icon';
            element.style.borderColor = powerup.color;
            element.innerHTML = `
                <span class="icon">${powerup.icon}</span>
                <span class="timer" style="color: ${powerup.color}">${Math.ceil(powerup.remainingTime)}s</span>
            `;
            this.powerupsContainer.appendChild(element);
        });
    }

    /**
     * Show level up notification
     */
    showLevelUp() {
        this.levelUpNotification.classList.remove('hidden');

        // Hide after animation
        setTimeout(() => {
            this.levelUpNotification.classList.add('hidden');
        }, 2000);
    }

    /**
     * Show power-up notification
     * @param {string} name - Power-up name
     */
    showPowerupNotification(name) {
        this.powerupName.textContent = name;
        this.powerupNotification.classList.remove('hidden');

        // Hide after animation
        setTimeout(() => {
            this.powerupNotification.classList.add('hidden');
        }, 2000);
    }

    /**
     * Update all HUD elements
     * @param {Object} stats - Stats object from leveling system
     * @param {Object} player - Player object
     */
    updateAll(stats, player) {
        this.updateHealth(player.health, player.maxHealth);
        this.updateXp(stats.xp, stats.xpToNext, stats.level);
        this.updateScore(stats.score);
        this.updateKills(stats.kills);
    }

    /**
     * Reset HUD to initial state
     */
    reset() {
        this.updateHealth(100, 100);
        this.updateXp(0, 100, 1);
        this.updateScore(0);
        this.updateKills(0);
        this.powerupsContainer.innerHTML = '';
    }
}
