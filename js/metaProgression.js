// ============================================
// President Devil — Meta-Progression System
// localStorage-based persistence across runs
// ============================================

const META = {
    _key: 'president_devil_meta',

    // ─── Default save structure ────────────────
    _defaults() {
        return {
            currency: 0,          // "Red Ink" earned per run
            totalRuns: 0,
            totalWins: 0,
            totalKills: 0,
            totalDeaths: 0,
            bestTime: Infinity,
            totalRoomsExplored: 0,
            totalPanicsSurvived: 0,

            // Permanent upgrades (0 = locked, 1+ = level)
            upgrades: {
                tough_skin: 0,     // +10 max HP per level (max 3)
                quick_feet: 0,     // +5% move speed per level (max 3)
                steady_hand: 0,    // +10% melee damage per level (max 3)
                scavenger: 0,      // +15% item find chance per level (max 2)
                iron_will: 0,      // -10% corruption gain per level (max 3)
            },

            // Unlocks (true/false)
            unlocks: {
                chainsaw_start: false,     // Start with a Chainsaw
                crossbow_start: false,     // Start with a Crossbow
                extra_slot: false,         // +1 inventory slot
                panic_mastery: false,      // Panic events spawn 1 fewer enemy per wave
            },
        };
    },

    // ─── Upgrade definitions ────────────────
    UPGRADE_DEFS: {
        tough_skin:   { name: 'Tough Skin',   desc: '+10 max HP',          maxLevel: 3, cost: [50, 100, 200] },
        quick_feet:   { name: 'Quick Feet',   desc: '+5% move speed',      maxLevel: 3, cost: [40, 80, 160] },
        steady_hand:  { name: 'Steady Hand',  desc: '+10% melee damage',   maxLevel: 3, cost: [60, 120, 240] },
        scavenger:    { name: 'Scavenger',    desc: '+15% item find',      maxLevel: 2, cost: [80, 200] },
        iron_will:    { name: 'Iron Will',    desc: '-10% corruption gain', maxLevel: 3, cost: [50, 100, 200] },
    },

    UNLOCK_DEFS: {
        chainsaw_start: { name: 'Chainsaw Start',  desc: 'Begin with a Chainsaw', cost: 300 },
        crossbow_start: { name: 'Crossbow Start',  desc: 'Begin with a Crossbow', cost: 250 },
        extra_slot:     { name: 'Extra Slot',       desc: '+1 inventory slot',     cost: 400 },
        panic_mastery:  { name: 'Panic Mastery',    desc: '-1 enemy per panic wave', cost: 350 },
    },

    // ─── Load / Save ────────────────
    load() {
        try {
            const raw = localStorage.getItem(this._key);
            if (raw) {
                const saved = JSON.parse(raw);
                // Merge with defaults so new keys are always present
                const data = this._defaults();
                Object.assign(data, saved);
                Object.assign(data.upgrades, this._defaults().upgrades, saved.upgrades || {});
                Object.assign(data.unlocks, this._defaults().unlocks, saved.unlocks || {});
                return data;
            }
        } catch (e) {
            console.warn('Meta load failed:', e);
        }
        return this._defaults();
    },

    save(data) {
        try {
            localStorage.setItem(this._key, JSON.stringify(data));
        } catch (e) {
            console.warn('Meta save failed:', e);
        }
    },

    // ─── End-of-run processing ────────────────
    processRunEnd(stats, won) {
        const data = this.load();
        data.totalRuns++;
        if (won) data.totalWins++;
        else data.totalDeaths++;

        data.totalKills += (stats.enemiesKilled || 0);
        data.totalRoomsExplored += (stats.roomsExplored || 0);
        data.totalPanicsSurvived += (stats.panicsSurvived || 0);

        if (won && stats.timeAlive && stats.timeAlive < data.bestTime) {
            data.bestTime = stats.timeAlive;
        }

        // Currency: base + kill bonus + exploration + panic bonus
        let earned = 10; // base
        earned += (stats.enemiesKilled || 0) * 2;
        earned += (stats.roomsExplored || 0) * 3;
        earned += (stats.panicsSurvived || 0) * 15;
        if (won) earned += 50;

        data.currency += earned;
        this.save(data);

        return { earned, total: data.currency };
    },

    // ─── Purchase upgrade ────────────────
    buyUpgrade(key) {
        const data = this.load();
        const def = this.UPGRADE_DEFS[key];
        if (!def) return false;

        const level = data.upgrades[key] || 0;
        if (level >= def.maxLevel) return false;

        const cost = def.cost[level];
        if (data.currency < cost) return false;

        data.currency -= cost;
        data.upgrades[key] = level + 1;
        this.save(data);
        return true;
    },

    // ─── Purchase unlock ────────────────
    buyUnlock(key) {
        const data = this.load();
        const def = this.UNLOCK_DEFS[key];
        if (!def) return false;
        if (data.unlocks[key]) return false;

        if (data.currency < def.cost) return false;

        data.currency -= def.cost;
        data.unlocks[key] = true;
        this.save(data);
        return true;
    },

    // ─── Apply upgrades to player at game start ────────────────
    applyToPlayer(player) {
        const data = this.load();

        // Tough Skin: +10 max HP per level
        const toughSkin = data.upgrades.tough_skin || 0;
        if (toughSkin > 0) {
            player.maxHp += toughSkin * 10;
            player.hp = player.maxHp;
        }

        // Quick Feet: +5% speed per level (applied as passive-style multiplier)
        const quickFeet = data.upgrades.quick_feet || 0;
        if (quickFeet > 0) {
            player._metaSpeedMult = 1 + quickFeet * 0.05;
        }

        // Steady Hand: +10% melee damage per level
        const steadyHand = data.upgrades.steady_hand || 0;
        if (steadyHand > 0) {
            player._metaMeleeMult = 1 + steadyHand * 0.1;
        }

        // Iron Will: stored for corruption system
        player._metaCorruptMult = 1 - (data.upgrades.iron_will || 0) * 0.1;

        // Extra Slot unlock
        if (data.unlocks.extra_slot) {
            player.inventory.push(null); // add 7th slot
        }

        // Starting weapon unlocks
        if (data.unlocks.chainsaw_start) {
            const slot = player.inventory.findIndex(s => s === null);
            if (slot >= 0) {
                player.inventory[slot] = {
                    weapon: { ...CONFIG.WEAPONS.CHAINSAW },
                    durability: CONFIG.WEAPONS.CHAINSAW.durability,
                    type: 'weapon_chainsaw'
                };
            }
        }
        if (data.unlocks.crossbow_start) {
            const slot = player.inventory.findIndex(s => s === null);
            if (slot >= 0) {
                player.inventory[slot] = {
                    weapon: { ...CONFIG.WEAPONS.CROSSBOW },
                    type: 'weapon_crossbow'
                };
            }
        }
    },

    // ─── Get panic reduction (for panic_mastery unlock) ────
    getPanicEnemyReduction() {
        const data = this.load();
        return data.unlocks.panic_mastery ? 1 : 0;
    },

    // ─── Get scavenger bonus ────
    getScavengerBonus() {
        const data = this.load();
        return (data.upgrades.scavenger || 0) * 0.15;
    },

    // ─── Reset save (debug) ────
    reset() {
        localStorage.removeItem(this._key);
    }
};
