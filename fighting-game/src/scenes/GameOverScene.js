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
    // Full-screen overlay (85% opacity — matches HUD panel alpha)
    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.85);

    // Corner brackets (same as HUD)
    this.createCornerBrackets();

    // === PANEL 1: GAME OVER ===
    this.add.rectangle(400, 190, 380, 68, 0x000000, 0.85)
      .setStrokeStyle(2, 0xffffff);

    const gameOverText = this.add.text(400, 190, 'GAME OVER', {
      fontFamily: '"Press Start 2P"',
      fontSize: '28px',
      color: '#FF0000',
    });
    gameOverText.setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: gameOverText,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
    });

    // === PANEL 2: STATS ===
    const panel2 = this.add.rectangle(400, 315, 420, 100, 0x000000, 0.85);
    panel2.setStrokeStyle(2, 0xffffff).setAlpha(0);

    const wavesLabel = this.add.text(400, 292, 'WAVES SURVIVED', {
      fontFamily: '"VT323"',
      fontSize: '24px',
      color: 'rgba(255,255,255,0.7)',
    });
    wavesLabel.setOrigin(0.5).setAlpha(0);

    const wavesNum = this.add.text(400, 333, this.wavesSurvived.toString(), {
      fontFamily: '"Press Start 2P"',
      fontSize: '28px',
      color: '#FF8C00',
    });
    wavesNum.setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: [panel2, wavesLabel, wavesNum],
      alpha: 1,
      delay: 400,
      duration: 300,
      ease: 'Power2',
    });

    // === PANEL 3: RESTART PROMPT (pixel blink) ===
    const restartText = this.add.text(400, 430, 'PRESS SPACE TO RESTART', {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: '#FF8C00',
    });
    restartText.setOrigin(0.5).setVisible(false);

    this.time.delayedCall(900, () => {
      restartText.setVisible(true);
      // Hard on/off blink matching CSS steps(1) — more pixel-authentic than a tween
      this.time.addEvent({
        delay: 500,
        loop: true,
        callback: () => restartText.setVisible(!restartText.visible),
      });
    });

    // === SCANLINES ===
    this.createScanlines();

    // === INPUT ===
    this.canRestart = false;
    this.time.delayedCall(1000, () => {
      this.canRestart = true;
    });

    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.spaceKey.on('down', this.restartGame, this);

    this.input.on('pointerdown', () => {
      if (this.canRestart) this.restartGame();
    });
  }

  /**
   * L-shaped corner brackets — identical to HUD
   */
  createCornerBrackets() {
    const gfx = this.add.graphics();
    gfx.lineStyle(4, 0xffffff, 0.4);
    const m = 8, s = 24;
    [
      [m, m, 1, 1],
      [800 - m, m, -1, 1],
      [m, 600 - m, 1, -1],
      [800 - m, 600 - m, -1, -1],
    ].forEach(([x, y, dx, dy]) => {
      gfx.beginPath();
      gfx.moveTo(x + dx * s, y);
      gfx.lineTo(x, y);
      gfx.lineTo(x, y + dy * s);
      gfx.strokePath();
    });
    gfx.setDepth(10);
  }

  /**
   * Horizontal scanline overlay — 2px black strips every 4px at 12% opacity
   */
  createScanlines() {
    const gfx = this.add.graphics();
    gfx.fillStyle(0x000000, 0.12);
    for (let y = 0; y < 600; y += 4) {
      gfx.fillRect(0, y, 800, 2);
    }
    gfx.setDepth(20);
  }

  /**
   * Restart the game — return to GameScene with fresh state
   */
  restartGame() {
    if (!this.canRestart) return;
    this.canRestart = false;
    this.scene.start('GameScene');
  }
}
