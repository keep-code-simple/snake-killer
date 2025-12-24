/**
 * SNAKE KILLER - Leveling System
 * Handles XP accumulation, level progression, and difficulty scaling
 */

class LevelingSystem {
    constructor() {
        this.xp = 0;
        this.level = 1;
        this.totalKills = 0;
        this.score = 0;

        // Callbacks
        this.onLevelUp = null;
        this.onXpChange = null;
    }

    /**
     * Calculate XP required for a specific level
     * @param {number} level - Level to calculate for
     * @returns {number} XP required
     */
    getXpForLevel(level) {
        // Formula: 100 * level^1.5
        return Math.floor(100 * Math.pow(level, 1.5));
    }

    /**
     * Get current XP threshold for next level
     * @returns {number} XP needed to reach next level
     */
    getXpToNextLevel() {
        return this.getXpForLevel(this.level);
    }

    /**
     * Get XP progress within current level (0-1)
     * @returns {number} Progress percentage
     */
    getLevelProgress() {
        const required = this.getXpToNextLevel();
        return Math.min(this.xp / required, 1);
    }

    /**
     * Add XP from killing a snake
     * @param {number} amount - XP amount
     * @returns {boolean} True if leveled up
     */
    addXp(amount) {
        this.xp += amount;
        this.totalKills++;
        this.score += amount * 10;

        // Check for level up
        let leveledUp = false;
        while (this.xp >= this.getXpToNextLevel()) {
            this.xp -= this.getXpToNextLevel();
            this.level++;
            leveledUp = true;

            if (this.onLevelUp) {
                this.onLevelUp(this.level);
            }
        }

        if (this.onXpChange) {
            this.onXpChange(this.xp, this.getXpToNextLevel(), this.level);
        }

        return leveledUp;
    }

    /**
     * Get snake spawn rate for current level
     * @returns {number} Spawn interval in milliseconds
     */
    getSpawnRate() {
        // Decrease spawn interval as level increases
        const reduction = Math.floor((this.level - 1) / 2) * 100;
        return Math.max(
            GAME_CONSTANTS.SNAKE_MIN_SPAWN_RATE,
            GAME_CONSTANTS.SNAKE_SPAWN_RATE - reduction
        );
    }

    /**
     * Get difficulty info for current level
     * @returns {Object} Difficulty parameters
     */
    getDifficultyInfo() {
        return {
            healthMultiplier: 1 + (this.level - 1) * 0.2,
            speedMultiplier: 1 + (this.level - 1) * 0.1,
            spawnRate: this.getSpawnRate(),
            maxSnakes: 10 + Math.floor(this.level * 2)
        };
    }

    /**
     * Get current stats for HUD
     * @returns {Object} Current stats
     */
    getStats() {
        return {
            xp: this.xp,
            xpToNext: this.getXpToNextLevel(),
            level: this.level,
            kills: this.totalKills,
            score: this.score,
            progress: this.getLevelProgress()
        };
    }

    /**
     * Reset leveling system
     */
    reset() {
        this.xp = 0;
        this.level = 1;
        this.totalKills = 0;
        this.score = 0;

        if (this.onXpChange) {
            this.onXpChange(0, this.getXpToNextLevel(), 1);
        }
    }
}
