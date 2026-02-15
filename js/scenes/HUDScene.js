// ============================================
// President Devil — HUD Scene (overlay, no zoom)
// ============================================

class HUDScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HUDScene' });
    }

    create() {
        this.gameScene = this.scene.get('GameScene');

        const W = CONFIG.GAME_WIDTH;
        const H = CONFIG.GAME_HEIGHT;
        const depth = 0;

        // === BOTTOM BAR BACKGROUND ===
        this.bgBar = this.add.rectangle(W / 2, H - 35, W, 70, CONFIG.COLORS.HUD_BG);
        this.bgBar.setAlpha(0.88);

        // === HEALTH ===
        this.add.text(12, H - 62, 'HP', {
            fontSize: '13px', fill: '#cc4444', fontFamily: 'monospace', fontStyle: 'bold'
        });
        this.healthBarBg = this.add.rectangle(38, H - 55, 100, 14, 0x333333).setOrigin(0, 0.5);
        this.healthBar = this.add.rectangle(38, H - 55, 100, 14, 0xff4444).setOrigin(0, 0.5);
        this.healthText = this.add.text(142, H - 62, '100', {
            fontSize: '12px', fill: '#ff6666', fontFamily: 'monospace'
        });

        // === CORRUPTION ===
        this.add.text(12, H - 40, 'COR', {
            fontSize: '11px', fill: '#aa3355', fontFamily: 'monospace'
        });
        this.corruptBarBg = this.add.rectangle(38, H - 34, 100, 10, 0x222222).setOrigin(0, 0.5);
        this.corruptBar = this.add.rectangle(38, H - 34, 0, 10, CONFIG.COLORS.CORRUPTION).setOrigin(0, 0.5);
        this.corruptText = this.add.text(142, H - 40, '0%', {
            fontSize: '11px', fill: '#aa3355', fontFamily: 'monospace'
        });

        // === INVENTORY SLOTS ===
        this.invSlots = [];
        const slotSize = 36;
        const slotGap = 5;
        const totalSlotsWidth = (1 + CONFIG.INVENTORY_SLOTS) * (slotSize + slotGap);
        const slotStartX = (W - totalSlotsWidth) / 2;
        const slotY = H - 35;

        // Fists slot (0)
        const fistX = slotStartX;
        this.fistSlotBg = this.add.rectangle(fistX, slotY, slotSize, slotSize, 0x333333).setStrokeStyle(2, 0x888888);
        this.add.text(fistX, slotY - slotSize / 2 - 10, '0', {
            fontSize: '10px', fill: '#aaa', fontFamily: 'monospace'
        }).setOrigin(0.5);
        this.add.text(fistX, slotY, '👊', {
            fontSize: '16px'
        }).setOrigin(0.5);

        // Slots 1-6
        for (let i = 0; i < CONFIG.INVENTORY_SLOTS; i++) {
            const sx = slotStartX + (i + 1) * (slotSize + slotGap);
            const bg = this.add.rectangle(sx, slotY, slotSize, slotSize, 0x222222).setStrokeStyle(1, 0x555555);
            const label = this.add.text(sx, slotY - slotSize / 2 - 10, `${i + 1}`, {
                fontSize: '10px', fill: '#aaa', fontFamily: 'monospace'
            }).setOrigin(0.5);
            const icon = this.add.sprite(sx, slotY, '__DEFAULT').setDisplaySize(slotSize - 10, slotSize - 10).setVisible(false);
            const itemText = this.add.text(sx, slotY + 8, '', {
                fontSize: '7px', fill: '#ccc', fontFamily: 'monospace'
            }).setOrigin(0.5);

            this.invSlots.push({ bg, label, icon, itemText, x: sx });
        }

        // === ACTIVE WEAPONS ===
        this.meleeText = this.add.text(W - 220, H - 62, 'Melee: Fists', {
            fontSize: '12px', fill: '#88cc88', fontFamily: 'monospace'
        });
        this.rangedText = this.add.text(W - 220, H - 44, 'Ranged: None', {
            fontSize: '12px', fill: '#cc8844', fontFamily: 'monospace'
        });
        this.durText = this.add.text(W - 220, H - 26, '', {
            fontSize: '11px', fill: '#88aaff', fontFamily: 'monospace'
        });
        this.ammoText = this.add.text(W - 80, H - 26, '', {
            fontSize: '11px', fill: '#ffaa66', fontFamily: 'monospace'
        });

        // === KEYS ===
        this.keysText = this.add.text(12, H - 20, '', {
            fontSize: '11px', fill: '#ffff44', fontFamily: 'monospace'
        });

        // === PASSIVE ITEMS (below corruption bar) ===
        this.passiveText = this.add.text(12, 50, '', {
            fontSize: '9px', fill: '#ff88ff', fontFamily: 'monospace'
        });

        // === PANIC INDICATOR (top center) ===
        this.panicText = this.add.text(W / 2, 40, '', {
            fontSize: '24px', fill: '#ff2222', fontFamily: 'monospace',
            fontStyle: 'bold', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setVisible(false);

        // === MINIMAP ===
        this.minimapX = W - 120;
        this.minimapY = 10;
        this.minimapW = 110;
        this.minimapH = 110;

        this.add.rectangle(
            this.minimapX + this.minimapW / 2,
            this.minimapY + this.minimapH / 2,
            this.minimapW, this.minimapH,
            0x000000
        ).setAlpha(0.75);

        this.minimapGfx = this.add.graphics();

        // === CORRUPTION OVERLAY (fullscreen, behind HUD) ===
        this.corruptOverlay = this.add.rectangle(W / 2, H / 2, W, H, CONFIG.COLORS.CORRUPTION);
        this.corruptOverlay.setAlpha(0);
        this.corruptOverlay.setDepth(-1);

        // === VIGNETTE (dark edges for atmosphere) ===
        this.vignetteGfx = this.add.graphics();
        this.vignetteGfx.setDepth(-2);
        this._drawVignette();
    }

    _drawVignette() {
        const g = this.vignetteGfx;
        const W = CONFIG.GAME_WIDTH;
        const H = CONFIG.GAME_HEIGHT;
        const cx = W / 2;
        const cy = H / 2;

        g.clear();

        // Gradient vignette using concentric rectangles
        const steps = 20;
        const maxAlpha = 0.6;
        for (let i = 0; i < steps; i++) {
            const t = i / steps;
            const alpha = t * t * maxAlpha;
            const thickness = 30 + i * 12;

            g.lineStyle(thickness, 0x000000, alpha);
            const inset = thickness / 2;
            g.strokeRect(
                -inset + thickness * 0.3,
                -inset + thickness * 0.3,
                W + inset * 2 - thickness * 0.6,
                H + inset * 2 - thickness * 0.6
            );
        }
    }

    update() {
        const gs = this.gameScene;
        if (!gs || !gs.player) return;

        const player = gs.player;
        const corruption = gs.corruption;
        const dungeon = gs.dungeon;
        const panicState = gs.panicState;

        // Health
        const hpPct = player.hp / player.maxHp;
        this.healthBar.setSize(100 * hpPct, 14);
        this.healthText.setText(`${Math.ceil(player.hp)}`);
        if (hpPct < 0.3) this.healthBar.setFillStyle(0xff0000);
        else if (hpPct < 0.6) this.healthBar.setFillStyle(0xffaa00);
        else this.healthBar.setFillStyle(0xff4444);

        // Corruption
        const corPct = corruption.value / CONFIG.CORRUPTION_MAX;
        this.corruptBar.setSize(100 * corPct, 10);
        this.corruptText.setText(`${Math.floor(corruption.value)}%`);

        // Corruption overlay
        this.corruptOverlay.setAlpha(corPct * 0.15);

        // Vignette intensifies with corruption
        if (this.vignetteGfx) {
            this.vignetteGfx.setAlpha(1 + corPct * 0.5);
        }

        // Low HP red pulse
        if (hpPct < 0.3 && player.alive) {
            const pulse = Math.sin(Date.now() * 0.004) * 0.5 + 0.5;
            this.corruptOverlay.setFillStyle(0xff0000);
            this.corruptOverlay.setAlpha(0.05 + pulse * 0.08);
        } else {
            this.corruptOverlay.setFillStyle(CONFIG.COLORS.CORRUPTION);
        }

        // Keys
        if (player.keys > 0) {
            this.keysText.setText(`🔑 x${player.keys}`);
        } else {
            this.keysText.setText('');
        }

        // Passive items display
        if (player.passiveItems && player.passiveItems.length > 0) {
            this.passiveText.setText(player.passiveItems.map(p => `♦ ${p.name}`).join('  '));
        } else {
            this.passiveText.setText('');
        }

        // Inventory slots
        for (let i = 0; i < CONFIG.INVENTORY_SLOTS; i++) {
            const slot = this.invSlots[i];
            const item = player.inventory[i];

            if (item) {
                const itemTexKey = ITEM_SPRITE_GEN.getTextureKeyForItem(item);
                if (itemTexKey && this.textures.exists(itemTexKey)) {
                    slot.icon.setTexture(itemTexKey);
                    slot.icon.clearTint();
                }
                slot.icon.setVisible(true);

                // Short name
                const shortName = (item.name || '').substring(0, 5);
                slot.itemText.setText(shortName);
            } else {
                slot.icon.setVisible(false);
                slot.itemText.setText('');
            }

            // Highlight active slots
            if (i === player.activeMeleeSlot) {
                slot.bg.setStrokeStyle(2, 0x44ff44);
            } else if (i === player.activeRangedSlot) {
                slot.bg.setStrokeStyle(2, 0xff8844);
            } else {
                slot.bg.setStrokeStyle(1, 0x555555);
            }
        }

        // Fist slot highlight
        this.fistSlotBg.setStrokeStyle(
            player.activeMeleeSlot === -1 ? 2 : 1,
            player.activeMeleeSlot === -1 ? 0x44ff44 : 0x888888
        );

        // Active weapons
        this.meleeText.setText(`Melee: ${player.meleeWeapon.name}`);
        this.rangedText.setText(`Ranged: ${player.rangedWeapon ? player.rangedWeapon.name : 'None'}`);

        // Durability
        if (player.activeMeleeSlot >= 0) {
            const item = player.inventory[player.activeMeleeSlot];
            if (item && item.durability !== undefined) {
                this.durText.setText(`Dur: ${item.durability}`);
            } else {
                this.durText.setText('');
            }
        } else {
            this.durText.setText('');
        }

        // Ammo
        if (player.rangedWeapon) {
            const ammoMap = { 'Handgun': 'ammo_pistol', 'Shotgun': 'ammo_shotgun', 'Crossbow': 'ammo_crossbow' };
            const ammoType = ammoMap[player.rangedWeapon.name];
            let total = 0;
            if (ammoType) {
                for (const item of player.inventory) {
                    if (item && item.type === ammoType) total += item.count;
                }
            }
            this.ammoText.setText(`Ammo: ${total}`);
        } else {
            this.ammoText.setText('');
        }

        // Panic
        if (panicState && panicState.active) {
            this.panicText.setVisible(true);
            let panicMsg = `⚠ PANIC ⚠  Wave ${panicState.currentWave}/${panicState.totalWaves}`;
            if (panicState.evolutionName) {
                panicMsg += `\n⚡ ${panicState.evolutionName} ⚡`;
            }
            this.panicText.setText(panicMsg);
        } else {
            this.panicText.setVisible(false);
        }

        // Minimap
        this._drawMinimap(dungeon, player);

    }

    _drawMinimap(dungeon, player) {
        const g = this.minimapGfx;
        g.clear();

        const scaleX = this.minimapW / dungeon.width;
        const scaleY = this.minimapH / dungeon.height;

        // Draw explored rooms
        for (const room of dungeon.rooms) {
            if (!room.explored) continue;

            let color = 0x444444;
            if (room.type === 'event') color = 0x664433;
            else if (room.type === 'locked') color = 0x666633;
            else if (room.type === 'boss') color = 0x662222;
            else if (room.type === 'start') color = 0x336633;

            g.fillStyle(color, 1);
            g.fillRect(
                this.minimapX + room.x * scaleX,
                this.minimapY + room.y * scaleY,
                room.width * scaleX,
                room.height * scaleY
            );

            // Room border
            g.lineStyle(1, 0x666666, 0.5);
            g.strokeRect(
                this.minimapX + room.x * scaleX,
                this.minimapY + room.y * scaleY,
                room.width * scaleX,
                room.height * scaleY
            );
        }

        // Player dot (blinking)
        const px = player.sprite.x / CONFIG.TILE_SIZE;
        const py = player.sprite.y / CONFIG.TILE_SIZE;
        const blink = Math.sin(Date.now() * 0.005) > 0;
        if (blink) {
            g.fillStyle(0xffffff, 1);
            g.fillCircle(
                this.minimapX + px * scaleX,
                this.minimapY + py * scaleY,
                3
            );
        }
    }
}
