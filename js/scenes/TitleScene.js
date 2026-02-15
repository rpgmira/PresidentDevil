// ============================================
// President Devil — Title Scene
// ============================================

class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        const cx = CONFIG.GAME_WIDTH / 2;
        const cy = CONFIG.GAME_HEIGHT / 2;

        // Dark background
        this.cameras.main.setBackgroundColor('#0a0a0a');

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
        const startText = this.add.text(cx, cy + 160, '[ PRESS ANY KEY TO BEGIN ]', {
            fontSize: '14px',
            fill: '#cc4444',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

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

        // Start on any key or click
        this.input.keyboard.once('keydown', startGame);
        this.input.once('pointerdown', startGame);
    }
}
