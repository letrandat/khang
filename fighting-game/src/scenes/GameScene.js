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

    // Corner bracket decorations
    this.createCornerBrackets();

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
   * Create pixel-art weapon panel (bottom-center cluster)
   */
  createWeaponUI() {
    const CX = 400;
    const W = 360;
    const LEFT = CX - W / 2; // 220
    const Y = 81;
    const RIGHT_W = 54;
    const RIGHT_CX = LEFT + W - RIGHT_W / 2; // 553

    // Panel background
    this.weaponUIBg = this.add.rectangle(CX, Y, W, 30, 0x000000, 0.85);
    this.weaponUIBg.setStrokeStyle(2, 0xffffff);
    this.weaponUIBg.setDepth(199).setScrollFactor(0);

    // Right section (tier) — blue-tinted bg
    this.add.rectangle(RIGHT_CX, Y, RIGHT_W, 30, 0x00f0ff, 0.07)
      .setDepth(199).setScrollFactor(0);

    // Divider line between left and right sections
    const divGfx = this.add.graphics();
    divGfx.lineStyle(2, 0xffffff, 1.0);
    divGfx.lineBetween(LEFT + W - RIGHT_W, Y - 15, LEFT + W - RIGHT_W, Y + 15);
    divGfx.setDepth(200).setScrollFactor(0);

    // Tier pips (3 pixel squares)
    this.tierIndicators = [];
    for (let i = 0; i < 3; i++) {
      const pip = this.add.rectangle(LEFT + 16 + i * 13, Y, 8, 8, 0x1a1a1a);
      pip.setStrokeStyle(1, 0xffffff, 0.6);
      pip.setDepth(200).setScrollFactor(0);
      this.tierIndicators.push(pip);
    }

    // Weapon name
    const currentWeapon = this.weaponSystem.getCurrentWeapon();
    this.weaponText = this.add.text(LEFT + 58, Y, currentWeapon.displayName, {
      fontFamily: '"Press Start 2P"',
      fontSize: '9px',
      color: '#00f0ff',
    });
    this.weaponText.setOrigin(0, 0.5).setDepth(201).setScrollFactor(0);

    // Tier label in right section
    this.tierNumText = this.add.text(RIGHT_CX, Y, `T${currentWeapon.tier}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '11px',
      color: '#00f0ff',
    });
    this.tierNumText.setOrigin(0.5).setDepth(201).setScrollFactor(0);

    this.updateTierIndicators(currentWeapon.tier);
  }

  /**
   * Update weapon UI when weapon changes
   */
  updateWeaponUI(weapon) {
    if (this.weaponText) {
      this.weaponText.setText(weapon.displayName);
    }
    if (this.tierNumText) {
      this.tierNumText.setText(`T${weapon.tier}`);
    }
    this.updateTierIndicators(weapon.tier);
  }

  /**
   * Update tier indicator pips (pixel squares)
   */
  updateTierIndicators(tier) {
    this.tierIndicators.forEach((pip, index) => {
      pip.setFillStyle(index < tier ? 0x00ff88 : 0x1a1a1a);
    });
  }

  /**
   * Create segmented pixel-art HP bar (top-center cluster)
   */
  createHealthUI() {
    const CX = 400;
    const W = 360;
    const LEFT = CX - W / 2; // 220
    const Y = 51;
    const NUM_SEGS = 10;

    // HP bar background
    this.healthBarBg = this.add.rectangle(CX, Y, W, 22, 0x000000, 0.85);
    this.healthBarBg.setStrokeStyle(2, 0xffffff);
    this.healthBarBg.setDepth(199).setScrollFactor(0);

    // "HP" label
    this.add.text(LEFT + 6, Y, 'HP', {
      fontFamily: '"Press Start 2P"',
      fontSize: '9px',
      color: '#FF0000',
    }).setOrigin(0, 0.5).setDepth(201).setScrollFactor(0);

    // Segmented HP blocks
    const SEG_START = LEFT + 38;
    const SEG_AREA_W = W - 46;
    const SEG_GAP = 2;
    const SEG_W = Math.floor((SEG_AREA_W - (NUM_SEGS - 1) * SEG_GAP) / NUM_SEGS);

    this.hpSegments = [];
    for (let i = 0; i < NUM_SEGS; i++) {
      const segCX = SEG_START + i * (SEG_W + SEG_GAP) + SEG_W / 2;
      const seg = this.add.rectangle(segCX, Y, SEG_W, 12, 0x00ff88);
      seg.setDepth(200).setScrollFactor(0);
      this.hpSegments.push(seg);
    }
  }

  /**
   * Update HP segments based on current health
   */
  updateHealthUI(currentHealth, maxHealth) {
    if (!this.hpSegments) return;
    const pct = currentHealth / maxHealth;
    const filled = Math.ceil(pct * this.hpSegments.length);
    const color = pct > 0.6 ? 0x00ff88 : pct > 0.3 ? 0xff8c00 : 0xff0000;
    this.hpSegments.forEach((seg, i) => {
      seg.setFillStyle(i < filled ? color : 0x220000);
    });
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

  /**
   * Draw L-shaped corner brackets at all 4 screen corners
   */
  createCornerBrackets() {
    const gfx = this.add.graphics();
    gfx.lineStyle(4, 0xffffff, 0.4);
    const m = 8;
    const s = 24;
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
    gfx.setDepth(205).setScrollFactor(0);
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
