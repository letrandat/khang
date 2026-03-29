import Phaser from 'phaser';
import Grunt from '../entities/enemies/Grunt.js';
import Flyer from '../entities/enemies/Flyer.js';
import Shooter from '../entities/enemies/Shooter.js';
import Dasher from '../entities/enemies/Dasher.js';

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

    // Enemy bullets group (for Shooter enemies)
    this.enemyBullets = null;

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
   * Create pixel-art badge UI for wave and enemy counts (top-center cluster)
   */
  createUI() {
    const BG = 0x000000;
    const BORDER = 0xffffff;
    const BADGE_Y = 22;
    const BADGE_H = 28;
    const BADGE_W = 178;

    // === Wave badge (left: x 220–398, center 309) ===
    this.scene.add.rectangle(309, BADGE_Y, BADGE_W, BADGE_H, BG, 0.85)
      .setStrokeStyle(2, BORDER).setDepth(199).setScrollFactor(0);
    this.scene.add.text(226, BADGE_Y, 'WAVE>>', {
      fontFamily: '"VT323"', fontSize: '16px', color: 'rgba(255,255,255,0.7)',
    }).setOrigin(0, 0.5).setDepth(201).setScrollFactor(0);
    this.waveText = this.scene.add.text(292, BADGE_Y, '1', {
      fontFamily: '"Press Start 2P"', fontSize: '11px', color: '#FF8C00',
    }).setOrigin(0, 0.5).setDepth(201).setScrollFactor(0);

    // === Enemy badge (right: x 402–580, center 491) ===
    this.scene.add.rectangle(491, BADGE_Y, BADGE_W, BADGE_H, BG, 0.85)
      .setStrokeStyle(2, BORDER).setDepth(199).setScrollFactor(0);
    this.scene.add.text(408, BADGE_Y, 'ENEMIES:', {
      fontFamily: '"VT323"', fontSize: '16px', color: 'rgba(255,255,255,0.7)',
    }).setOrigin(0, 0.5).setDepth(201).setScrollFactor(0);
    this.enemiesText = this.scene.add.text(487, BADGE_Y, '0', {
      fontFamily: '"Press Start 2P"', fontSize: '11px', color: '#FF8C00',
    }).setOrigin(0, 0.5).setDepth(201).setScrollFactor(0);

    // === Countdown (center screen, hidden initially) ===
    this.countdownText = this.scene.add.text(400, 300, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '48px',
      color: '#FF8C00',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.countdownText.setOrigin(0.5).setDepth(200).setScrollFactor(0);
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
    this.waveText.setText(this.currentWave.toString());
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
    const announcement = this.scene.add.text(400, 220, `WAVE ${this.currentWave}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '32px',
      color: '#FF8C00',
      stroke: '#000000',
      strokeThickness: 4,
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

    // Create enemy based on wave number and random selection
    const enemy = this.createEnemy(spawnX);
    this.enemiesGroup.add(enemy);

    // Add spawn effect (fade in from above)
    enemy.setAlpha(0);
    enemy.y -= 30;
    this.scene.tweens.add({
      targets: enemy,
      alpha: 1,
      y: enemy.y + 30,
      duration: 300,
      ease: 'Power2',
    });

    this.enemiesToSpawn--;
  }

  /**
   * Create an enemy based on current wave and random selection
   * Wave 1-2: Grunts only
   * Wave 3-4: Add Flyers
   * Wave 5-6: Add Shooters
   * Wave 7+: Add Dashers
   * @param {number} spawnX - X position to spawn at
   * @returns {Enemy} The created enemy
   */
  createEnemy(spawnX) {
    // Build available enemy types based on wave
    const availableTypes = ['grunt'];

    if (this.currentWave >= 3) {
      availableTypes.push('flyer');
    }
    if (this.currentWave >= 5) {
      availableTypes.push('shooter');
    }
    if (this.currentWave >= 7) {
      availableTypes.push('dasher');
    }

    // Weighted random selection (higher waves have more variety)
    // Grunts are always most common, newer types appear less frequently
    const weights = this.getEnemyWeights(availableTypes);
    const selectedType = this.weightedRandomSelect(availableTypes, weights);

    // Create the enemy
    let enemy;
    switch (selectedType) {
      case 'flyer':
        // Flyers spawn higher in the air
        enemy = new Flyer(this.scene, spawnX, this.groundY - 100);
        break;

      case 'shooter':
        enemy = new Shooter(this.scene, spawnX, this.groundY);
        // Set up enemy bullets group if needed
        if (!this.enemyBullets) {
          this.createEnemyBulletsGroup();
        }
        enemy.setBulletsGroup(this.enemyBullets);
        break;

      case 'dasher':
        enemy = new Dasher(this.scene, spawnX, this.groundY);
        break;

      case 'grunt':
      default:
        enemy = new Grunt(this.scene, spawnX, this.groundY);
        break;
    }

    return enemy;
  }

  /**
   * Get weights for enemy type selection
   * @param {string[]} types - Available enemy types
   * @returns {number[]} Weights for each type
   */
  getEnemyWeights(types) {
    const weights = [];
    for (const type of types) {
      switch (type) {
        case 'grunt':
          weights.push(40); // Most common
          break;
        case 'flyer':
          weights.push(25);
          break;
        case 'shooter':
          weights.push(20);
          break;
        case 'dasher':
          weights.push(30); // 2x spawn weight
          break;
        default:
          weights.push(10);
      }
    }
    return weights;
  }

  /**
   * Weighted random selection
   * @param {any[]} items - Items to select from
   * @param {number[]} weights - Weights for each item
   * @returns {any} Selected item
   */
  weightedRandomSelect(items, weights) {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }
    return items[items.length - 1];
  }

  /**
   * Create enemy bullets physics group for Shooter enemies
   */
  createEnemyBulletsGroup() {
    this.enemyBullets = this.scene.physics.add.group({
      defaultKey: 'enemy-bullet',
      maxSize: 50,
      createCallback: (bullet) => {
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.enable = false;
      },
    });

    // Set up collision with player
    if (this.scene.player) {
      this.scene.physics.add.overlap(
        this.scene.player,
        this.enemyBullets,
        this.handleEnemyBulletPlayerCollision,
        null,
        this
      );
    }
  }

  /**
   * Handle collision between enemy bullet and player
   * @param {Player} player - The player
   * @param {Phaser.Physics.Arcade.Sprite} bullet - Enemy bullet
   */
  handleEnemyBulletPlayerCollision(player, bullet) {
    if (!bullet.active || !player.active) return;

    // Deactivate bullet
    bullet.setActive(false);
    bullet.setVisible(false);
    bullet.body.enable = false;

    // Damage player if they have a takeDamage method
    if (player.takeDamage) {
      player.takeDamage(bullet.damage || 15);
    }
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
    this.enemiesText.setText(this.enemiesRemaining.toString());
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
    const message = this.scene.add.text(400, 220, 'WAVE COMPLETE!', {
      fontFamily: '"Press Start 2P"',
      fontSize: '24px',
      color: '#00ff88',
      stroke: '#000000',
      strokeThickness: 4,
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
   * Get enemy bullets group (for external access if needed)
   * @returns {Phaser.Physics.Arcade.Group} Enemy bullets group
   */
  getEnemyBullets() {
    return this.enemyBullets;
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
    if (this.enemyBullets) {
      this.enemyBullets.destroy(true);
    }
    this.scene.events.off('enemyKilled', this.onEnemyKilled, this);
  }
}
