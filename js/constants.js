// ============================================
// President Devil — Constants & Configuration
// ============================================

const CONFIG = {
    // Display
    GAME_WIDTH: 800,
    GAME_HEIGHT: 600,
    TILE_SIZE: 16,
    SCALE: 3, // 16px tiles rendered at 48px

    // Player
    PLAYER_SPEED: 80,
    PLAYER_MAX_HP: 100,
    PLAYER_MELEE_RANGE: 32, // ~2 body lengths in pixels (before scale)
    PLAYER_MELEE_COOLDOWN: 400, // ms between auto-attacks
    PLAYER_INVULN_TIME: 500, // ms of invulnerability after being hit

    // Inventory
    INVENTORY_SLOTS: 6,

    // Corruption
    CORRUPTION_MAX: 100,
    CORRUPTION_DECAY_RATE: 0.05, // per second when idle
    CORRUPTION_COMBAT_GAIN: 2, // per melee hit
    CORRUPTION_HORDE_THRESHOLD: 60, // triggers panic event

    // Dungeon Generation
    DUNGEON_WIDTH: 60, // tiles
    DUNGEON_HEIGHT: 60, // tiles
    MIN_ROOM_SIZE: 5,
    MAX_ROOM_SIZE: 12,
    MAX_ROOMS: 15,

    // Enemies
    ENEMY_SPEED_PATROL: 7.5,
    ENEMY_SPEED_CHASE: 15,
    ENEMY_DETECTION_RANGE: 80, // pixels
    ENEMY_ATTACK_RANGE: 16,
    ENEMY_ATTACK_COOLDOWN: 800,

    // Note: Visibility values moved below with colors

    // Panic Events
    PANIC_WAVE_COUNT: 3,
    PANIC_ENEMIES_PER_WAVE: 5,
    PANIC_WAVE_DELAY: 3000, // ms between waves

    // Weapons
    WEAPONS: {
        FISTS: {
            name: 'Fists',
            damage: 5,
            speed: 400, // ms cooldown
            durability: Infinity,
            corruption: 0.5,
            type: 'melee'
        },
        BAT: {
            name: 'Baseball Bat',
            damage: 15,
            speed: 600,
            durability: 30,
            corruption: 1,
            type: 'melee'
        },
        KNIFE: {
            name: 'Knife',
            damage: 10,
            speed: 300,
            durability: 20,
            corruption: 0.5,
            type: 'melee'
        },
        CHAINSAW: {
            name: 'Chainsaw',
            damage: 25,
            speed: 200,
            durability: 50,
            corruption: 3,
            type: 'melee'
        },
        HANDGUN: {
            name: 'Handgun',
            damage: 20,
            speed: 500,
            range: 200,
            corruption: 1.5,
            type: 'ranged'
        },
        SHOTGUN: {
            name: 'Shotgun',
            damage: 35,
            speed: 900,
            range: 120,
            spread: 3, // number of pellets
            corruption: 4,
            type: 'ranged'
        },
        CROSSBOW: {
            name: 'Crossbow',
            damage: 18,
            speed: 1200,
            range: 250,
            corruption: 0.3,
            type: 'ranged'
        },
        GRENADE: {
            name: 'Grenade',
            damage: 50,
            speed: 1500,
            range: 150,
            aoeRadius: 60,
            corruption: 5,
            type: 'ranged',
            consumable: true
        }
    },

    // Visibility
    VISIBILITY_RADIUS: 160, // pixels around player that are fully visible
    FOG_RADIUS: 250, // pixels — dim visibility zone

    // Passive Items
    PASSIVE_ITEMS: {
        IRON_BOOTS: { name: 'Iron Boots', description: 'Move 15% slower but take 25% less damage', speedMult: 0.85, damageTakenMult: 0.75 },
        ADRENALINE: { name: 'Adrenaline Shot', description: 'Move 20% faster, melee 30% faster', speedMult: 1.2, meleeSpeedMult: 0.7 },
        BLOOD_PACT: { name: 'Blood Pact', description: 'Deal 40% more melee damage, corruption decays slower', meleeDamageMult: 1.4, corruptDecayMult: 0.5 },
        QUIET_SHOES: { name: 'Quiet Shoes', description: 'Weapons generate 50% less noise/corruption', corruptionMult: 0.5 },
        THICK_SKIN: { name: 'Thick Skin', description: '+30 max HP', maxHpBonus: 30 },
    },

    // Colors (placeholder until pixel art)
    COLORS: {
        FLOOR_OFFICE: 0x5c5c80,
        FLOOR_MARBLE: 0x707090,
        FLOOR_CONCRETE: 0x585868,
        WALL: 0x9999bb,
        WALL_EDGE: 0x666688,
        WALL_RITUAL: 0x9a3030,
        FLOOR_BOSS: 0x553030,
        DOOR: 0xaa9060,
        DOOR_LOCKED: 0xddbb33,
        DOOR_SEALED: 0xee3333,
        PLAYER: 0xf0e0d0,
        ENEMY_CRAWLER: 0x55cc55,
        ENEMY_LURKER: 0xbb55ff,
        ITEM_HEALTH: 0xff4444,
        ITEM_AMMO: 0xffcc44,
        ITEM_KEY: 0xffff44,
        ITEM_WEAPON: 0x44ccff,
        ITEM_PASSIVE: 0xff88ff,
        ENEMY_BRUTE: 0xcc4444,
        ENEMY_SHADE: 0x333366,
        CORRUPTION: 0x8a1a3a,
        HUD_BG: 0x111111,
        HUD_TEXT: 0xcccccc,
        BLOOD: 0x880000
    }
};
