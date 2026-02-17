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
        this._restarting = false;

        // Process meta-progression
        const metaResult = META.processRunEnd(this.stats, false);

        this.cameras.main.setBackgroundColor('#0a0000');

        // Death title
        this.add.text(cx, cy - 120, 'YOU DIED', {
            fontSize: '48px',
            fill: '#ff3333',
            stroke: '#000000',
            strokeThickness: 3,
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
            fill: '#cc8888',
            stroke: '#000000',
            strokeThickness: 1,
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
            fill: '#dddddd',
            stroke: '#000000',
            strokeThickness: 1,
            fontFamily: 'monospace',
            lineSpacing: 6
        }).setOrigin(0.5);

        // Currency earned
        this.add.text(cx, cy + 95, `Red Ink earned: +${metaResult.earned}  (Total: ${metaResult.total})`, {
            fontSize: '11px',
            fill: '#ffaa77',
            stroke: '#000000',
            strokeThickness: 1,
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Retry prompt
        const retryText = this.add.text(cx, cy + 130, '[ PRESS ANY KEY TO RESTART ]', {
            fontSize: '14px',
            fill: '#ffff44',
            stroke: '#000000',
            strokeThickness: 2,
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
        let canRetry = false;
        const restartGame = () => {
            if (!canRetry || this._restarting) return;
            this._restarting = true;
            this.scene.start('GameScene');
        };

        this.input.keyboard.on('keydown', restartGame);
        this.input.on('pointerdown', restartGame);

        const enableRetryTimer = this.time.delayedCall(1000, () => {
            canRetry = true;
        });

        this.events.once('shutdown', () => {
            if (enableRetryTimer && !enableRetryTimer.hasDispatched) {
                enableRetryTimer.remove(false);
            }
            this.input.keyboard.off('keydown', restartGame);
            this.input.off('pointerdown', restartGame);
        });
    }

    _formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}
