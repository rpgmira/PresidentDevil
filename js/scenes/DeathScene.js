// ============================================
// President Devil — Death Scene
// ============================================

class DeathScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DeathScene' });
    }

    init(data) {
        this.stats = data.stats || {};
    }

    create() {
        const cx = CONFIG.GAME_WIDTH / 2;
        const cy = CONFIG.GAME_HEIGHT / 2;

        this.cameras.main.setBackgroundColor('#0a0000');

        // Death title
        this.add.text(cx, cy - 120, 'YOU DIED', {
            fontSize: '48px',
            fill: '#aa0000',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Flavor text
        const flavorTexts = [
            'The Devil always wins.',
            'Your screams echo through the halls.',
            'Another soul claimed by the President.',
            'The compound grows hungrier.',
            'No one escapes the Devil\'s office.'
        ];
        const flavor = flavorTexts[Phaser.Math.Between(0, flavorTexts.length - 1)];
        this.add.text(cx, cy - 70, flavor, {
            fontSize: '12px',
            fill: '#664444',
            fontFamily: 'monospace',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // Stats
        const stats = this.stats;
        const statsText = [
            `Time Survived:    ${this._formatTime(stats.timeAlive || 0)}`,
            `Rooms Explored:   ${stats.roomsExplored || 0}`,
            `Enemies Killed:   ${stats.enemiesKilled || 0}`,
            `Damage Dealt:     ${stats.damageDealt || 0}`,
            `Damage Taken:     ${stats.damageTaken || 0}`,
            `Items Collected:  ${stats.itemsCollected || 0}`,
            `Panics Survived:  ${stats.panicsSurvived || 0}`
        ].join('\n');

        this.add.text(cx, cy + 10, statsText, {
            fontSize: '12px',
            fill: '#888',
            fontFamily: 'monospace',
            lineSpacing: 6
        }).setOrigin(0.5);

        // Retry prompt
        const retryText = this.add.text(cx, cy + 130, '[ PRESS ANY KEY TO TRY AGAIN ]', {
            fontSize: '14px',
            fill: '#cc4444',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: retryText,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Delay input to prevent accidental restart
        this.time.delayedCall(1000, () => {
            this.input.keyboard.once('keydown', () => {
                this.scene.start('TitleScene');
            });
            this.input.once('pointerdown', () => {
                this.scene.start('TitleScene');
            });
        });
    }

    _formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}
