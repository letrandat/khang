import Phaser from 'phaser';
import Grunt from '../entities/enemies/Grunt.js';

/**
 * WaveSystem - Brotato-style wave survival system
 * Manages wave progression, enemy spawning, and wave transitions
 */
export default class WaveSystem {
  constructor(scene, enemiesGroup) {
    this.scene = scene;
    this.enemiesGroup = enemiesGroup;

    // Wave state
    this.currentWave = 0;
    this.enemiesRemaining = 0;
    this.enemiesToSpawn = 0;
    this.isWaveActive = false;
    this.isCountingDown = false;

    // Spawn timing
    this.spawnTimer = null;
    this.spawnInterval = 1500; // 1.5 seconds between spawns

    // Countdown timing
    this.countdownTimer = null;
    this.countdownSeconds = 3;

    // Ground Y position for spawning
    this.groundY = 544;

    // Spawn boundaries (horizontal)
    this.spawnMinX = 100;
    this.spawnMaxX = 700;
    this.playerSafeZone = 150; // Don't spawn within 150px of player

    // Create UI elements
    this.createUI();

    // Listen for enemy kills
    this.scene.events.on('enemyKilled', this.onEnemyKilled, this);

    // Start first wave after a brief delay
    this.scene.time.delayedCall(1000, () => {
      this.startNextWave();
    });
  }

  /**
   * Create UI elements for wave display
   */
  createUI() {
    // Wave number display (top-left)
    this.waveText = this.scene.add.text(20, 30, 'Wave 1', {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold',
    });
    this.waveText.setOrigin(0, 0.5);
    this.waveText.setDepth(200);
    this.waveText.setScrollFactor(0); // Fixed to camera

    // Enemies remaining display (top right)
    this.enemiesText = this.scene.add.text(750, 30, 'Enemies: 0', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ff6b6b',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.enemiesText.setOrigin(1, 0.5);
    this.enemiesText.setDepth(200);
    this.enemiesText.setScrollFactor(0);

    // Countdown display (center screen, hidden initially)
    this.countdownText = this.scene.add.text(400, 300, '', {
      fontSize: '72px',
      fontFamily: 'Arial',
      color: '#fbbf24',
      stroke: '#000000',
      strokeThickness: 6,
      fontStyle: 'bold',
    });
    this.countdownText.setOrigin(0.5);
    this.countdownText.setDepth(200);
    this.countdownText.setScrollFactor(0);
    this.countdownText.setVisible(false);
  }

  /**
   * Calculate enemy count for a given wave
   * Formula: wave * 3 + 2
   * @param {number} wave - Wave number
   * @returns {number} Number of enemies
   */
  getEnemyCount(wave) {
    return wave * 3 + 2;
  }

  /**
   * Start the next wave
   */
  startNextWave() {
    this.currentWave++;
    this.isWaveActive = true;
    this.isCountingDown = false;

    // Calculate enemies for this wave
    const enemyCount = this.getEnemyCount(this.currentWave);
    this.enemiesRemaining = enemyCount;
    this.enemiesToSpawn = enemyCount;

    // Update UI
    this.waveText.setText(`Wave ${this.currentWave}`);
    this.updateEnemiesUI();
    this.countdownText.setVisible(false);

    // Show wave start announcement
    this.showWaveAnnouncement();

    // Start spawning enemies
    this.startSpawning();
  }

  /**
   * Show wave start announcement
   */
  showWaveAnnouncement() {
    const announcement = this.scene.add.text(400, 200, `WAVE ${this.currentWave}`, {
      fontSize: '48px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5,
      fontStyle: 'bold',
    });
    announcement.setOrigin(0.5);
    announcement.setDepth(200);
    announcement.setAlpha(0);

    // Fade in, hold, fade out
    this.scene.tweens.add({
      targets: announcement,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.scene.time.delayedCall(800, () => {
          this.scene.tweens.add({
            targets: announcement,
            alpha: 0,
            y: announcement.y - 30,
            duration: 400,
            ease: 'Power2',
            onComplete: () => {
              announcement.destroy();
            },
          });
        });
      },
    });
  }

  /**
   * Start the enemy spawn timer
   */
  startSpawning() {
    // Spawn first enemy immediately
    this.spawnEnemy();

    // Continue spawning at intervals
    if (this.enemiesToSpawn > 0) {
      this.spawnTimer = this.scene.time.addEvent({
        delay: this.spawnInterval,
        callback: this.spawnEnemy,
        callbackScope: this,
        repeat: this.enemiesToSpawn - 1, // -1 because we already spawned one
      });
    }
  }

  /**
   * Spawn a single enemy at a random valid position
   */
  spawnEnemy() {
    if (this.enemiesToSpawn <= 0) return;

    // Get player position for safe zone
    const playerX = this.scene.player ? this.scene.player.x : 400;

    // Generate spawn position avoiding player
    let spawnX = this.getSpawnX(playerX);

    // Create grunt
    const grunt = new Grunt(this.scene, spawnX, this.groundY);
    this.enemiesGroup.add(grunt);

    // Add spawn effect (fade in from above)
    grunt.setAlpha(0);
    grunt.y -= 30;
    this.scene.tweens.add({
      targets: grunt,
      alpha: 1,
      y: grunt.y + 30,
      duration: 300,
      ease: 'Power2',
    });

    this.enemiesToSpawn--;
  }

  /**
   * Get a valid spawn X position avoiding the player
   * @param {number} playerX - Player's X position
   * @returns {number} Valid spawn X position
   */
  getSpawnX(playerX) {
    // Try to spawn on the opposite side of the screen from player
    const leftSide = Phaser.Math.Between(this.spawnMinX, 250);
    const rightSide = Phaser.Math.Between(550, this.spawnMaxX);

    // Prefer side farther from player
    if (playerX < 400) {
      // Player on left, prefer right spawn
      if (Math.abs(rightSide - playerX) > this.playerSafeZone) {
        return rightSide;
      }
    } else {
      // Player on right, prefer left spawn
      if (Math.abs(leftSide - playerX) > this.playerSafeZone) {
        return leftSide;
      }
    }

    // Fallback: random position checking safe zone
    let attempts = 10;
    while (attempts > 0) {
      const x = Phaser.Math.Between(this.spawnMinX, this.spawnMaxX);
      if (Math.abs(x - playerX) > this.playerSafeZone) {
        return x;
      }
      attempts--;
    }

    // Ultimate fallback
    return playerX < 400 ? this.spawnMaxX : this.spawnMinX;
  }

  /**
   * Handle enemy killed event
   * @param {number} points - Points awarded for the kill
   */
  onEnemyKilled(points) {
    if (!this.isWaveActive) return;

    this.enemiesRemaining--;
    this.updateEnemiesUI();

    // Check if wave is complete
    if (this.enemiesRemaining <= 0 && this.enemiesToSpawn <= 0) {
      this.onWaveComplete();
    }
  }

  /**
   * Update the enemies remaining UI
   */
  updateEnemiesUI() {
    this.enemiesText.setText(`Enemies: ${this.enemiesRemaining}`);
  }

  /**
   * Called when all enemies in a wave are defeated
   */
  onWaveComplete() {
    this.isWaveActive = false;

    // Emit wave complete event for other systems (e.g., weapon rotation)
    this.scene.events.emit('waveComplete', this.currentWave);

    // Show wave complete message
    this.showWaveCompleteMessage();

    // Start countdown to next wave
    this.startCountdown();
  }

  /**
   * Show wave complete message
   */
  showWaveCompleteMessage() {
    const message = this.scene.add.text(400, 200, 'WAVE COMPLETE!', {
      fontSize: '36px',
      fontFamily: 'Arial',
      color: '#4ade80',
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold',
    });
    message.setOrigin(0.5);
    message.setDepth(200);

    // Animate and destroy
    this.scene.tweens.add({
      targets: message,
      alpha: 0,
      y: message.y - 50,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        message.destroy();
      },
    });
  }

  /**
   * Start countdown to next wave
   */
  startCountdown() {
    this.isCountingDown = true;
    let secondsLeft = this.countdownSeconds;

    this.countdownText.setText(secondsLeft.toString());
    this.countdownText.setVisible(true);

    // Animate countdown text
    this.animateCountdownNumber();

    this.countdownTimer = this.scene.time.addEvent({
      delay: 1000,
      callback: () => {
        secondsLeft--;

        if (secondsLeft > 0) {
          this.countdownText.setText(secondsLeft.toString());
          this.animateCountdownNumber();
        } else {
          this.countdownText.setVisible(false);
          this.startNextWave();
        }
      },
      callbackScope: this,
      repeat: this.countdownSeconds - 1,
    });
  }

  /**
   * Animate countdown number (scale pop effect)
   */
  animateCountdownNumber() {
    this.countdownText.setScale(1.5);
    this.scene.tweens.add({
      targets: this.countdownText,
      scale: 1,
      duration: 200,
      ease: 'Power2',
    });
  }

  /**
   * Get current wave number
   * @returns {number} Current wave number
   */
  getCurrentWave() {
    return this.currentWave;
  }

  /**
   * Get enemies remaining count
   * @returns {number} Enemies remaining
   */
  getEnemiesRemaining() {
    return this.enemiesRemaining;
  }

  /**
   * Clean up timers and events
   */
  destroy() {
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
    }
    if (this.countdownTimer) {
      this.countdownTimer.destroy();
    }
    this.scene.events.off('enemyKilled', this.onEnemyKilled, this);
  }
}
