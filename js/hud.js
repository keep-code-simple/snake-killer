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
        this.pointsText = document.getElementById('points-text');

        // Power-ups
        // Mapped to 'active-effects-container' now
        this.powerupsContainer = document.getElementById('active-effects-container');
        this.powerupToolbar = document.getElementById('powerup-toolbar');

        // Notifications
        this.levelUpNotification = document.getElementById('level-up-notification');
        this.powerupNotification = document.getElementById('powerup-notification');
        this.powerupName = document.getElementById('powerup-name');

        // === NEW: Heal notification ===
        this.healNotification = document.getElementById('heal-notification');
        this.healText = this.healNotification.querySelector('.heal-text');
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
     * Update points display
     * @param {number} points 
     */
    updatePoints(points) {
        if (this.pointsText) this.pointsText.textContent = points;
    }

    /**
     * Initialize power-up toolbar buttons
     * @param {Object} packs - POWER_PACKS object
     * @param {Function} callback - Activation callback
     */
    initializePowerupToolbar(packs, callback) {
        if (!this.powerupToolbar) return;
        this.powerupToolbar.innerHTML = '';

        Object.values(packs).forEach(pack => {
            const btn = document.createElement('div');
            btn.className = 'powerup-btn';
            btn.id = `btn-${pack.id}`;
            btn.dataset.cost = pack.cost;

            const activate = (e) => {
                e.preventDefault();
                e.stopPropagation();
                callback(pack.id);
            };
            btn.addEventListener('touchstart', activate, { passive: false });
            btn.addEventListener('click', activate);

            btn.innerHTML = `
                <span class="icon">${pack.icon}</span>
                <span class="cost">${pack.cost} PTS</span>
                <div class="powerup-progress"></div>
            `;
            this.powerupToolbar.appendChild(btn);
        });
    }

    /**
     * Update toolbar visual state
     * @param {number} points 
     * @param {Map} activePowerups 
     */
    updatePowerupToolbar(points, activePowerups) {
        if (!this.powerupToolbar) return;
        const buttons = this.powerupToolbar.querySelectorAll('.powerup-btn');
        const anyActive = activePowerups.size > 0;

        buttons.forEach(btn => {
            const packId = btn.id.replace('btn-', '');
            const cost = parseInt(btn.dataset.cost);
            const isActive = activePowerups.has(packId);

            // Available if: enough points AND not active AND no other active
            const isAvailable = points >= cost && !isActive && !anyActive;

            btn.classList.toggle('active', isActive);
            btn.classList.toggle('available', isAvailable);

            // Update status text
            const costText = btn.querySelector('.cost');
            if (isActive) {
                costText.textContent = 'ACTIVE';
            } else {
                costText.textContent = `${cost} PTS`;
            }

            // Visual dimming
            if (!isActive && !isAvailable) {
                btn.style.opacity = '0.4';
            } else {
                btn.style.opacity = '1';
            }
        });
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
     * === NEW: Show heal notification ===
     * @param {number} amount - Amount healed
     */
    showHealNotification(amount) {
        this.healText.textContent = `+${amount} HP`;
        this.healNotification.classList.remove('hidden');

        // Restart animation
        this.healNotification.style.animation = 'none';
        this.healNotification.offsetHeight; /* trigger reflow */
        this.healNotification.style.animation = 'healNotify 1.5s ease forwards';

        // Hide after animation
        setTimeout(() => {
            this.healNotification.classList.add('hidden');
        }, 1500);
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
     * Initialize weapon toolbar
     * @param {Object} weapons 
     * @param {Function} callback 
     */
    initializeWeaponToolbar(weapons, callback) {
        const container = document.getElementById('weapon-toolbar');
        if (!container) return;
        container.innerHTML = '';

        Object.values(weapons).forEach(w => {
            const btn = document.createElement('div');
            btn.className = 'weapon-btn';
            btn.id = `weapon-${w.id}`;
            btn.title = w.name;
            btn.innerHTML = w.icon;

            const select = (e) => {
                e.preventDefault();
                e.stopPropagation();
                callback(w.id);
            };
            btn.addEventListener('click', select);
            btn.addEventListener('touchstart', select, { passive: false });

            container.appendChild(btn);
        });
    }

    /**
     * Update active weapon highlight
     * @param {string} activeWeaponId 
     */
    updateWeaponToolbar(activeWeaponId) {
        const container = document.getElementById('weapon-toolbar');
        if (!container) return;
        const buttons = container.querySelectorAll('.weapon-btn');
        buttons.forEach(btn => {
            const id = btn.id.replace('weapon-', '');
            if (id === activeWeaponId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
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
