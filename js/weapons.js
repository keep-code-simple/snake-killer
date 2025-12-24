/**
 * SNAKE KILLER - Weapon Configuration
 */

const WEAPONS = {
    PISTOL: {
        id: 'pistol',
        name: 'Pistol',
        icon: '🔫',
        description: 'Standard Issue',
        damage: 25,
        fireRate: 0.4,      // Time between shots
        bulletSpeed: 500,   // Increased speed
        bulletSize: 1.0,    // Standard size (6px)
        bulletColor: '#FFFF00',
        count: 1,
        spread: 0
    },
    RAPID: {
        id: 'rapid',
        name: 'SMG',
        icon: '⚡',
        description: 'Fast Fire',
        damage: 12,
        fireRate: 0.12,
        bulletSpeed: 600,
        bulletSize: 0.6,    // Small (3.6px)
        bulletColor: '#00FFFF',
        count: 1,
        spread: 0.1
    },
    SHOTGUN: {
        id: 'shotgun',
        name: 'Shotgun',
        icon: '💥',
        description: 'Spread Shot',
        damage: 18,
        fireRate: 0.9,
        bulletSpeed: 400,
        bulletSize: 0.7,    // Medium-Small pellets (4.2px)
        bulletColor: '#FF6600',
        count: 5,           // Increased count for better spread feel
        spread: 0.4
    },
    TANK: {
        id: 'tank',
        name: 'Cannon',
        icon: '💣',
        description: 'Heavy Hitter',
        damage: 100,
        fireRate: 1.2,
        bulletSpeed: 300,
        bulletSize: 4.0,    // Large (24px)
        bulletColor: '#FF0000',
        count: 1,
        spread: 0
    }
};
