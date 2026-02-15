// ============================================
// President Devil — Victory Scene
// ============================================

class VictoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VictoryScene' });
    }

    init(data) {
        this.stats = data.stats || {};
    }

    create() {
        const cx = CONFIG.GAME_WIDTH / 2;
        const cy = CONFIG.GAME_HEIGHT / 2;

        // Process meta-progression
        const metaResult = META.processRunEnd(this.stats, true);

        this.cameras.main.setBackgroundColor('#050a05');

        // Victory title
        this.add.text(cx, cy - 130, 'ESCAPED', {
            fontSize: '48px',
            fill: '#44cc44',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Flavor text
        const flavorTexts = [
            'You glimpsed the Devil\'s true face — and lived.',
            'The compound burns behind you. But is it over?',
            'Freedom tastes like ash and adrenaline.',
            'You escaped. For now.',
            'The Devil watches from his throne. He\'ll wait.'
        ];
        const flavor = flavorTexts[Phaser.Math.Between(0, flavorTexts.length - 1)];
        this.add.text(cx, cy - 75, flavor, {
            fontSize: '12px',
            fill: '#448844',
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

        // Currency earned
        this.add.text(cx, cy + 95, `Red Ink earned: +${metaResult.earned}  (Total: ${metaResult.total})`, {
            fontSize: '11px',
            fill: '#44aa44',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Retry prompt
        const retryText = this.add.text(cx, cy + 130, '[ PRESS ANY KEY TO PLAY AGAIN ]', {
            fontSize: '14px',
            fill: '#44cc44',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: retryText,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Delay input
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
