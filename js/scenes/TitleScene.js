// ============================================
// President Devil — Title Scene
// ============================================

class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    preload() {
        this.load.image('cover_art', 'sprites/cover_pixel_512.png');
    }

    create() {
        const cx = CONFIG.GAME_WIDTH / 2;
        const cy = CONFIG.GAME_HEIGHT / 2;

        // Dark background
        this.cameras.main.setBackgroundColor('#0a0a0a');

        // Cover art — subtle background, centered and faded
        const cover = this.add.image(cx, cy - 10, 'cover_art');
        cover.setAlpha(0.25);
        cover.setOrigin(0.5);
        // Scale to fit nicely without dominating (about 80% of game height)
        const targetHeight = CONFIG.GAME_HEIGHT * 0.8;
        cover.setScale(targetHeight / cover.height);
        cover.setDepth(0);
        // Red tint to match the theme and prevent washed-out colors
        cover.setTint(0xff4444);

        // Title
        this.add.text(cx, cy - 100, 'PRESIDENT\nDEVIL', {
            fontSize: '48px',
            fill: '#cc1111',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            align: 'center',
            lineSpacing: 8
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(cx, cy - 20, '"A survival horror where combat becomes uncontrollable."', {
            fontSize: '11px',
            fill: '#666',
            fontFamily: 'monospace',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // Flavor text
        this.add.text(cx, cy + 30, 'The President is the Devil.\nYou are his secretary.\nSurvive.', {
            fontSize: '14px',
            fill: '#888',
            fontFamily: 'monospace',
            align: 'center',
            lineSpacing: 6
        }).setOrigin(0.5);

        // Controls
        this.add.text(cx, cy + 100, 'WASD — Move    |    Mouse — Aim & Shoot\n0-6 — Select Weapons    |    Q — Drop Item', {
            fontSize: '10px',
            fill: '#555',
            fontFamily: 'monospace',
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5);

        // Start prompt
        const startText = this.add.text(cx, cy + 150, '[ PRESS ANY KEY TO BEGIN ]', {
            fontSize: '14px',
            fill: '#cc4444',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Meta-progression currency display
        const metaData = META.load();
        this.add.text(cx, cy + 185, `Red Ink: ${metaData.currency}  |  Runs: ${metaData.totalRuns}  |  Wins: ${metaData.totalWins}`, {
            fontSize: '10px',
            fill: '#885544',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Upgrades button
        const upgradeBtn = this.add.text(cx, cy + 215, '[ U — UPGRADES ]', {
            fontSize: '12px',
            fill: '#cc8844',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        upgradeBtn.on('pointerdown', () => this._showUpgradeShop());

        // Blink effect
        this.tweens.add({
            targets: startText,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        const startGame = () => {
            if (this._startingGame) return;
            this._startingGame = true;

            // Initialise audio on first user interaction
            AUDIO.init();
            AUDIO.resume();

            try {
                this.scene.start('GameScene');
            } catch (error) {
                this._startingGame = false;
                this.add.text(cx, cy + 210, `Start failed: ${error.message}`, {
                    fontSize: '11px',
                    fill: '#ff6666',
                    fontFamily: 'monospace',
                    align: 'center',
                    wordWrap: { width: CONFIG.GAME_WIDTH - 40 }
                }).setOrigin(0.5);
            }
        };

        // Start on any key (except U) or click
        this.input.keyboard.on('keydown', (event) => {
            if (event.key === 'u' || event.key === 'U') {
                this._showUpgradeShop();
            } else {
                startGame();
            }
        });
        this.input.once('pointerdown', startGame);
    }

    _showUpgradeShop() {
        if (this._shopOpen) return;
        this._shopOpen = true;

        const cx = CONFIG.GAME_WIDTH / 2;
        const uiGroup = [];

        // Overlay
        const overlay = this.add.rectangle(cx, CONFIG.GAME_HEIGHT / 2, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT, 0x000000, 0.85)
            .setDepth(100);
        uiGroup.push(overlay);

        const title = this.add.text(cx, 30, 'UPGRADES', {
            fontSize: '24px', fill: '#cc8844', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(101);
        uiGroup.push(title);

        const metaData = META.load();
        const currencyText = this.add.text(cx, 60, `Red Ink: ${metaData.currency}`, {
            fontSize: '14px', fill: '#ffaa44', fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(101);
        uiGroup.push(currencyText);

        let yOff = 95;

        // Upgrades
        const upgradeKeys = Object.keys(META.UPGRADE_DEFS);
        for (const key of upgradeKeys) {
            const def = META.UPGRADE_DEFS[key];
            const level = metaData.upgrades[key] || 0;
            const maxed = level >= def.maxLevel;
            const cost = maxed ? '--' : def.cost[level];
            const canBuy = !maxed && metaData.currency >= def.cost[level];

            const label = `${def.name} [Lv${level}/${def.maxLevel}]  ${def.desc}  Cost: ${cost}`;
            const color = maxed ? '#448844' : (canBuy ? '#cccccc' : '#666666');

            const btn = this.add.text(cx, yOff, label, {
                fontSize: '11px', fill: color, fontFamily: 'monospace'
            }).setOrigin(0.5).setDepth(101);

            if (canBuy) {
                btn.setInteractive({ useHandCursor: true });
                btn.on('pointerdown', () => {
                    if (META.buyUpgrade(key)) {
                        // Refresh shop
                        uiGroup.forEach(el => el.destroy());
                        this._shopOpen = false;
                        this._showUpgradeShop();
                    }
                });
                btn.on('pointerover', () => btn.setFill('#ffffff'));
                btn.on('pointerout', () => btn.setFill(color));
            }
            uiGroup.push(btn);
            yOff += 28;
        }

        yOff += 15;
        const unlockTitle = this.add.text(cx, yOff, '— UNLOCKS —', {
            fontSize: '12px', fill: '#cc8844', fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(101);
        uiGroup.push(unlockTitle);
        yOff += 25;

        const unlockKeys = Object.keys(META.UNLOCK_DEFS);
        for (const key of unlockKeys) {
            const def = META.UNLOCK_DEFS[key];
            const owned = metaData.unlocks[key];
            const canBuy = !owned && metaData.currency >= def.cost;

            const label = owned
                ? `✓ ${def.name} — ${def.desc}`
                : `${def.name} — ${def.desc}  Cost: ${def.cost}`;
            const color = owned ? '#448844' : (canBuy ? '#cccccc' : '#666666');

            const btn = this.add.text(cx, yOff, label, {
                fontSize: '11px', fill: color, fontFamily: 'monospace'
            }).setOrigin(0.5).setDepth(101);

            if (canBuy) {
                btn.setInteractive({ useHandCursor: true });
                btn.on('pointerdown', () => {
                    if (META.buyUnlock(key)) {
                        uiGroup.forEach(el => el.destroy());
                        this._shopOpen = false;
                        this._showUpgradeShop();
                    }
                });
                btn.on('pointerover', () => btn.setFill('#ffffff'));
                btn.on('pointerout', () => btn.setFill(color));
            }
            uiGroup.push(btn);
            yOff += 28;
        }

        // Close button
        const closeBtn = this.add.text(cx, CONFIG.GAME_HEIGHT - 40, '[ ESC / CLICK TO CLOSE ]', {
            fontSize: '12px', fill: '#cc4444', fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(101).setInteractive({ useHandCursor: true });
        uiGroup.push(closeBtn);

        const closeShop = () => {
            uiGroup.forEach(el => el.destroy());
            this._shopOpen = false;
        };
        closeBtn.on('pointerdown', closeShop);
        overlay.setInteractive();
        overlay.on('pointerdown', closeShop);
        this.input.keyboard.once('keydown-ESC', closeShop);
    }
}
