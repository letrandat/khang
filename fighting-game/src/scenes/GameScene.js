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

    // Create weapon system
    this.weaponSystem = new WeaponSystem(this, this.player);

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

    // Listen for weapon changes
    this.events.on('weaponChanged', this.updateWeaponUI, this);
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
