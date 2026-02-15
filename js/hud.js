// ============================================
// President Devil — HUD & UI Overlay
// ============================================

class HUD {
    constructor(scene) {
        this.scene = scene;
        this.elements = {};

        const depth = 200;
        const y = CONFIG.GAME_HEIGHT - 50;

        // Background bar
        this.elements.bgBar = scene.add.rectangle(
            CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT - 30,
            CONFIG.GAME_WIDTH, 60,
            CONFIG.COLORS.HUD_BG
        );
        this.elements.bgBar.setScrollFactor(0);
        this.elements.bgBar.setDepth(depth);
        this.elements.bgBar.setAlpha(0.85);

        // Health bar
        this.elements.healthLabel = scene.add.text(10, y - 5, 'HP', {
            fontSize: '10px', fill: '#cc4444', fontFamily: 'monospace'
        });
        this.elements.healthLabel.setScrollFactor(0).setDepth(depth + 1);

        this.elements.healthBarBg = scene.add.rectangle(50, y, 80, 10, 0x333333);
        this.elements.healthBarBg.setScrollFactor(0).setDepth(depth + 1);
        this.elements.healthBarBg.setOrigin(0, 0.5);

        this.elements.healthBar = scene.add.rectangle(50, y, 80, 10, 0xff4444);
        this.elements.healthBar.setScrollFactor(0).setDepth(depth + 1);
        this.elements.healthBar.setOrigin(0, 0.5);

        // Corruption meter
        this.elements.corruptLabel = scene.add.text(10, y + 10, 'COR', {
            fontSize: '10px', fill: '#8a1a3a', fontFamily: 'monospace'
        });
        this.elements.corruptLabel.setScrollFactor(0).setDepth(depth + 1);

        this.elements.corruptBarBg = scene.add.rectangle(50, y + 15, 80, 8, 0x222222);
        this.elements.corruptBarBg.setScrollFactor(0).setDepth(depth + 1);
        this.elements.corruptBarBg.setOrigin(0, 0.5);

        this.elements.corruptBar = scene.add.rectangle(50, y + 15, 0, 8, CONFIG.COLORS.CORRUPTION);
        this.elements.corruptBar.setScrollFactor(0).setDepth(depth + 1);
        this.elements.corruptBar.setOrigin(0, 0.5);

        // Inventory slots
        this.inventorySlots = [];
        const slotStartX = 180;
        const slotY = y + 5;
        const slotSize = 24;
        const slotGap = 4;

        // Fists (slot 0)
        const fistSlot = scene.add.rectangle(
            slotStartX - slotSize - slotGap, slotY,
            slotSize, slotSize, 0x333333
        );
        fistSlot.setScrollFactor(0).setDepth(depth + 1);
        fistSlot.setStrokeStyle(1, 0x888888);
        this.elements.fistSlot = fistSlot;

        const fistLabel = scene.add.text(
            slotStartX - slotSize - slotGap, slotY - 14,
            '0', { fontSize: '8px', fill: '#999', fontFamily: 'monospace' }
        );
        fistLabel.setScrollFactor(0).setDepth(depth + 1);
        fistLabel.setOrigin(0.5);
        this.elements.fistLabel = fistLabel;

        for (let i = 0; i < CONFIG.INVENTORY_SLOTS; i++) {
            const sx = slotStartX + i * (slotSize + slotGap);
            const slot = scene.add.rectangle(sx, slotY, slotSize, slotSize, 0x222222);
            slot.setScrollFactor(0).setDepth(depth + 1);
            slot.setStrokeStyle(1, 0x555555);

            const label = scene.add.text(sx, slotY - 14, `${i + 1}`, {
                fontSize: '8px', fill: '#999', fontFamily: 'monospace'
            });
            label.setScrollFactor(0).setDepth(depth + 1);
            label.setOrigin(0.5);

            const itemIcon = scene.add.rectangle(sx, slotY, slotSize - 6, slotSize - 6, 0x444444);
            itemIcon.setScrollFactor(0).setDepth(depth + 2);
            itemIcon.setVisible(false);

            this.inventorySlots.push({ bg: slot, label: label, icon: itemIcon });
        }

        // Active weapons display
        this.elements.meleeText = scene.add.text(500, y - 8, 'Melee: Fists', {
            fontSize: '10px', fill: '#aaa', fontFamily: 'monospace'
        });
        this.elements.meleeText.setScrollFactor(0).setDepth(depth + 1);

        this.elements.rangedText = scene.add.text(500, y + 5, 'Ranged: None', {
            fontSize: '10px', fill: '#aaa', fontFamily: 'monospace'
        });
        this.elements.rangedText.setScrollFactor(0).setDepth(depth + 1);

        // Durability / ammo
        this.elements.durabilityText = scene.add.text(650, y - 8, '', {
            fontSize: '10px', fill: '#8af', fontFamily: 'monospace'
        });
        this.elements.durabilityText.setScrollFactor(0).setDepth(depth + 1);

        this.elements.ammoText = scene.add.text(650, y + 5, '', {
            fontSize: '10px', fill: '#fa8', fontFamily: 'monospace'
        });
        this.elements.ammoText.setScrollFactor(0).setDepth(depth + 1);

        // Panic indicator
        this.elements.panicText = scene.add.text(
            CONFIG.GAME_WIDTH / 2, 30, '', {
                fontSize: '16px', fill: '#ff2222', fontFamily: 'monospace',
                fontStyle: 'bold'
            }
        );
        this.elements.panicText.setScrollFactor(0).setDepth(depth + 1);
        this.elements.panicText.setOrigin(0.5);
        this.elements.panicText.setVisible(false);

        // Minimap
        this.minimap = {
            x: CONFIG.GAME_WIDTH - 110,
            y: 10,
            width: 100,
            height: 100,
            graphics: scene.add.graphics()
        };
        this.minimap.graphics.setScrollFactor(0).setDepth(depth + 1);
    }

    update(player, corruption, dungeon, panicState) {
        // Health bar
        const hpPercent = player.hp / player.maxHp;
        this.elements.healthBar.setSize(80 * hpPercent, 10);
        if (hpPercent < 0.3) {
            this.elements.healthBar.setFillStyle(0xff0000);
        } else if (hpPercent < 0.6) {
            this.elements.healthBar.setFillStyle(0xffaa00);
        } else {
            this.elements.healthBar.setFillStyle(0xff4444);
        }

        // Corruption bar
        const corPercent = corruption.value / CONFIG.CORRUPTION_MAX;
        this.elements.corruptBar.setSize(80 * corPercent, 8);

        // Inventory slots
        for (let i = 0; i < CONFIG.INVENTORY_SLOTS; i++) {
            const slot = this.inventorySlots[i];
            const item = player.inventory[i];

            if (item) {
                slot.icon.setVisible(true);
                // Color code by item type
                if (item.weapon) {
                    slot.icon.setFillStyle(CONFIG.COLORS.ITEM_WEAPON);
                } else if (item.type === 'health') {
                    slot.icon.setFillStyle(CONFIG.COLORS.ITEM_HEALTH);
                } else if (item.type && item.type.startsWith('ammo')) {
                    slot.icon.setFillStyle(CONFIG.COLORS.ITEM_AMMO);
                } else if (item.type === 'key') {
                    slot.icon.setFillStyle(CONFIG.COLORS.ITEM_KEY);
                } else {
                    slot.icon.setFillStyle(0x888888);
                }
            } else {
                slot.icon.setVisible(false);
            }

            // Highlight active melee slot
            if (i === player.activeMeleeSlot) {
                slot.bg.setStrokeStyle(2, 0x44ff44);
            } else if (i === player.activeRangedSlot) {
                slot.bg.setStrokeStyle(2, 0xff8844);
            } else {
                slot.bg.setStrokeStyle(1, 0x555555);
            }
        }

        // Fist slot highlight
        if (player.activeMeleeSlot === -1) {
            this.elements.fistSlot.setStrokeStyle(2, 0x44ff44);
        } else {
            this.elements.fistSlot.setStrokeStyle(1, 0x888888);
        }

        // Active weapon text
        this.elements.meleeText.setText(`Melee: ${player.meleeWeapon.name}`);
        this.elements.rangedText.setText(`Ranged: ${player.rangedWeapon ? player.rangedWeapon.name : 'None'}`);

        // Durability
        if (player.activeMeleeSlot >= 0) {
            const item = player.inventory[player.activeMeleeSlot];
            if (item) {
                this.elements.durabilityText.setText(`Dur: ${item.durability}`);
            }
        } else {
            this.elements.durabilityText.setText('');
        }

        // Ammo count
        if (player.rangedWeapon) {
            const ammoType = {
                'Handgun': 'ammo_pistol',
                'Shotgun': 'ammo_shotgun',
                'Crossbow': 'ammo_crossbow',
                'Grenade': 'grenade'
            }[player.rangedWeapon.name];
            let total = 0;
            for (const item of player.inventory) {
                if (item && item.type === ammoType) total += item.count;
            }
            this.elements.ammoText.setText(`Ammo: ${total}`);
        } else {
            this.elements.ammoText.setText('');
        }

        // Panic indicator
        if (panicState && panicState.active) {
            this.elements.panicText.setVisible(true);
            this.elements.panicText.setText(
                `!! PANIC !! Wave ${panicState.currentWave}/${panicState.totalWaves}`
            );
        } else {
            this.elements.panicText.setVisible(false);
        }

        // Update minimap
        this._updateMinimap(dungeon, player);
    }

    _updateMinimap(dungeon, player) {
        const g = this.minimap.graphics;
        g.clear();

        // Background
        g.fillStyle(0x000000, 0.7);
        g.fillRect(this.minimap.x, this.minimap.y, this.minimap.width, this.minimap.height);

        const scaleX = this.minimap.width / dungeon.width;
        const scaleY = this.minimap.height / dungeon.height;

        // Draw explored rooms
        for (const room of dungeon.rooms) {
            if (!room.explored) continue;
            let color = 0x333333;
            if (room.type === 'event') color = 0x553333;
            else if (room.type === 'locked') color = 0x555533;
            else if (room.type === 'boss') color = 0x552222;
            else if (room.type === 'start') color = 0x335533;

            g.fillStyle(color, 0.8);
            g.fillRect(
                this.minimap.x + room.x * scaleX,
                this.minimap.y + room.y * scaleY,
                room.width * scaleX,
                room.height * scaleY
            );
        }

        // Player dot
        const px = player.sprite.x / CONFIG.TILE_SIZE;
        const py = player.sprite.y / CONFIG.TILE_SIZE;
        g.fillStyle(0xffffff, 1);
        g.fillRect(
            this.minimap.x + px * scaleX - 1,
            this.minimap.y + py * scaleY - 1,
            3, 3
        );
    }
}
