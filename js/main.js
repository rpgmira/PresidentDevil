// ============================================
// President Devil — Main Entry Point
// ============================================

const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: CONFIG.GAME_WIDTH,
    height: CONFIG.GAME_HEIGHT,
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [TitleScene, GameScene, HUDScene, DeathScene, VictoryScene],
    pixelArt: true,
    roundPixels: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: document.body
    }
});
