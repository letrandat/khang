import Phaser from 'phaser';
import Player from '../entities/Player.js';
import WeaponSystem from '../systems/WeaponSystem.js';
import WaveSystem from '../systems/WaveSystem.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    // Create ground at the bottom of the screen
    // Ground is 32px tall, positioned so its top edge is at y=568 (600-32)
    this.ground = this.physics.add.staticImage(400, 584, 'ground');

    // Create a platform above the ground
    // Positioned in the upper-middle area of the screen
    this.platform = this.physics.add.staticImage(400, 400, 'platform');

    // Create player standing on the ground
    // Player is 48px tall, so to stand on ground (top at y=568),
    // player center should be at y = 568 - 24 = 544
    this.player = new Player(this, 100, 500);

    // Set up collisions
    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.player, this.platform);

    // Create weapon system with random T1 weapon
    this.weaponSystem = new WeaponSystem(this, this.player, true);

    // Create enemy group (physics group for collision detection)
    this.enemies = this.physics.add.group();

    // Create wave system (handles spawning enemies)
    this.waveSystem = new WaveSystem(this, this.enemies);

    // Set up enemy collisions with ground and platforms
    this.physics.add.collider(this.enemies, this.ground);
    this.physics.add.collider(this.enemies, this.platform);

    // Set up bullet-enemy collision
    this.physics.add.overlap(
      this.weaponSystem.getBullets(),
      this.enemies,
      this.handleBulletEnemyCollision,
      null,
      this
    );

    // Create weapon UI
    this.createWeaponUI();

    // Create health bar UI
    this.createHealthUI();

    // Listen for weapon changes
    this.events.on('weaponChanged', this.updateWeaponUI, this);

    // Listen for player damage and death
    this.events.on('playerDamaged', this.updateHealthUI, this);
    this.events.on('playerDied', this.onPlayerDied, this);

    // Set up player-enemy collision for contact damage
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.handlePlayerEnemyCollision,
      null,
      this
    );
  }

  /**
   * Create weapon name and tier UI display
   */
  createWeaponUI() {
    // Weapon display background
    this.weaponUIBg = this.add.rectangle(400, 570, 200, 30, 0x000000, 0.6);
    this.weaponUIBg.setDepth(199);
    this.weaponUIBg.setScrollFactor(0);

    // Weapon name and tier text
    const currentWeapon = this.weaponSystem.getCurrentWeapon();
    this.weaponText = this.add.text(400, 570, currentWeapon.displayName, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.weaponText.setOrigin(0.5);
    this.weaponText.setDepth(200);
    this.weaponText.setScrollFactor(0);

    // Tier indicators (visual pips)
    this.tierIndicators = [];
    for (let i = 0; i < 3; i++) {
      const pip = this.add.circle(350 + i * 15, 585, 4, 0x666666);
      pip.setDepth(200);
      pip.setScrollFactor(0);
      this.tierIndicators.push(pip);
    }

    // Update tier indicators for initial weapon
    this.updateTierIndicators(currentWeapon.tier);
  }

  /**
   * Update weapon UI when weapon changes
   * @param {Object} weapon - New weapon config
   */
  updateWeaponUI(weapon) {
    if (this.weaponText) {
      this.weaponText.setText(weapon.displayName);

      // Set text color based on tier
      const colors = {
        1: '#ffffff', // White for T1
        2: '#60a5fa', // Blue for T2
        3: '#fbbf24', // Gold for T3
      };
      this.weaponText.setColor(colors[weapon.tier] || '#ffffff');
    }

    this.updateTierIndicators(weapon.tier);
  }

  /**
   * Update tier indicator pips
   * @param {number} tier - Current tier (1-3)
   */
  updateTierIndicators(tier) {
    const colors = {
      active: 0x4ade80, // Green for active
      inactive: 0x666666, // Gray for inactive
    };

    this.tierIndicators.forEach((pip, index) => {
      pip.setFillStyle(index < tier ? colors.active : colors.inactive);
    });
  }

  /**
   * Create health bar UI at top of screen
   */
  createHealthUI() {
    const barX = 400;
    const barY = 60;
    const barWidth = 200;
    const barHeight = 20;

    // Health bar background (dark gray)
    this.healthBarBg = this.add.rectangle(barX, barY, barWidth, barHeight, 0x333333);
    this.healthBarBg.setDepth(199);
    this.healthBarBg.setScrollFactor(0);

    // Health bar fill (green at full health)
    this.healthBarFill = this.add.rectangle(
      barX - barWidth / 2,
      barY,
      barWidth,
      barHeight - 4,
      0x44ff44
    );
    this.healthBarFill.setOrigin(0, 0.5);
    this.healthBarFill.setDepth(200);
    this.healthBarFill.setScrollFactor(0);

    // Health bar border
    this.healthBarBorder = this.add.rectangle(barX, barY, barWidth + 4, barHeight + 4);
    this.healthBarBorder.setStrokeStyle(2, 0xffffff);
    this.healthBarBorder.setDepth(201);
    this.healthBarBorder.setScrollFactor(0);

    // Health text
    this.healthText = this.add.text(barX, barY, '100 / 100', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.healthText.setOrigin(0.5);
    this.healthText.setDepth(202);
    this.healthText.setScrollFactor(0);
  }

  /**
   * Update health bar UI
   * @param {number} currentHealth - Current health
   * @param {number} maxHealth - Max health
   */
  updateHealthUI(currentHealth, maxHealth) {
    const healthPercent = currentHealth / maxHealth;
    const barWidth = 200;

    // Update fill width
    this.healthBarFill.setDisplaySize(barWidth * healthPercent, 16);

    // Update color based on health percentage
    if (healthPercent > 0.6) {
      this.healthBarFill.setFillStyle(0x44ff44); // Green when healthy
    } else if (healthPercent > 0.3) {
      this.healthBarFill.setFillStyle(0xffaa00); // Orange when damaged
    } else {
      this.healthBarFill.setFillStyle(0xff4444); // Red when critical
    }

    // Update text
    this.healthText.setText(`${currentHealth} / ${maxHealth}`);
  }

  /**
   * Handle collision between player and enemy (contact damage)
   * @param {Player} player - The player
   * @param {Enemy} enemy - The enemy
   */
  handlePlayerEnemyCollision(player, enemy) {
    if (!player.active || !enemy.active || enemy.isDying) return;

    // Deal damage to player using enemy's damage value
    player.takeDamage(enemy.damage);
  }

  /**
   * Handle player death
   */
  onPlayerDied() {
    // Get waves survived (current wave - 1 since they died during current wave)
    const wavesSurvived = this.waveSystem.getCurrentWave();

    // Clean up wave system
    this.waveSystem.destroy();

    // Transition to game over scene
    this.scene.start('GameOverScene', { wavesSurvived });
  }

  /**
   * Handle collision between bullet and enemy
   * Note: Phaser may pass objects in either order, so we detect which is which
   * @param {Bullet|Enemy} obj1 - First colliding object
   * @param {Bullet|Enemy} obj2 - Second colliding object
   */
  handleBulletEnemyCollision(obj1, obj2) {
    // Determine which object is the bullet and which is the enemy
    // Bullets have a 'deactivate' method, enemies have 'takeDamage'
    let bullet, enemy;
    if (typeof obj1.deactivate === 'function') {
      bullet = obj1;
      enemy = obj2;
    } else {
      bullet = obj2;
      enemy = obj1;
    }

    // Skip if bullet or enemy is already inactive
    if (!bullet.active || !enemy.active || enemy.isDying) return;

    // For piercing bullets, check if already hit this enemy
    if (bullet.piercing && bullet.piercedEnemies.has(enemy)) {
      return;
    }

    // Deal damage to enemy
    enemy.takeDamage(bullet);

    // Apply slow effect if bullet has it
    const slowEffect = bullet.getSlowEffect?.();
    if (slowEffect && enemy.applySlow) {
      enemy.applySlow(slowEffect.amount, slowEffect.duration);
    }

    // Check if bullet should be deactivated (handles piercing, boomerang, etc.)
    const shouldDeactivate = bullet.onHitEnemy?.(enemy) ?? true;

    if (shouldDeactivate) {
      bullet.deactivate();
    }
  }

  update() {
    // Update player each frame to handle input
    this.player.update();

    // Update weapon system for input handling
    this.weaponSystem.update();

    // Update enemy AI
    this.enemies.getChildren().forEach((enemy) => {
      if (enemy.active && !enemy.isDying) {
        enemy.updateAI(this.player);
      }
    });
  }
}
