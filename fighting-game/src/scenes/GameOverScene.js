import Phaser from 'phaser';

/**
 * GameOverScene - Displayed when the player dies
 * Shows game over message, waves survived, and restart prompt
 */
export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  /**
   * Initialize scene with data from GameScene
   * @param {Object} data - Data passed from GameScene
   * @param {number} data.wavesSurvived - Number of waves the player survived
   */
  init(data) {
    this.wavesSurvived = data.wavesSurvived || 0;
  }

  create() {
    // Dark semi-transparent background
    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);

    // GAME OVER text
    const gameOverText = this.add.text(400, 180, 'GAME OVER', {
      fontSize: '72px',
      fontFamily: 'Arial',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 8,
      fontStyle: 'bold',
    });
    gameOverText.setOrigin(0.5);

    // Animate game over text
    this.tweens.add({
      targets: gameOverText,
      scale: { from: 0.5, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Back.easeOut',
    });

    // Waves survived text
    const wavesText = this.add.text(400, 280, `Waves Survived: ${this.wavesSurvived}`, {
      fontSize: '36px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    });
    wavesText.setOrigin(0.5);
    wavesText.setAlpha(0);

    // Fade in waves text after game over animation
    this.tweens.add({
      targets: wavesText,
      alpha: 1,
      delay: 500,
      duration: 300,
    });

    // Restart prompt
    const restartText = this.add.text(400, 400, 'Press SPACE to restart', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#fbbf24',
      stroke: '#000000',
      strokeThickness: 3,
    });
    restartText.setOrigin(0.5);
    restartText.setAlpha(0);

    // Fade in and pulse the restart text
    this.tweens.add({
      targets: restartText,
      alpha: 1,
      delay: 1000,
      duration: 300,
      onComplete: () => {
        // Pulsing animation
        this.tweens.add({
          targets: restartText,
          alpha: 0.5,
          duration: 500,
          yoyo: true,
          repeat: -1,
        });
      },
    });

    // Set up restart input (with delay to prevent accidental trigger)
    this.canRestart = false;
    this.time.delayedCall(1000, () => {
      this.canRestart = true;
    });

    // Listen for SPACE key
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.spaceKey.on('down', this.restartGame, this);

    // Also allow click/tap to restart
    this.input.on('pointerdown', () => {
      if (this.canRestart) {
        this.restartGame();
      }
    });
  }

  /**
   * Restart the game - return to GameScene with fresh state
   */
  restartGame() {
    if (!this.canRestart) return;

    // Prevent multiple triggers
    this.canRestart = false;

    // Start GameScene (it will reset everything)
    this.scene.start('GameScene');
  }
}
