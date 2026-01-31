import Phaser from 'phaser';
import Player from '../entities/Player.js';
import WeaponSystem from '../systems/WeaponSystem.js';
import Grunt from '../entities/enemies/Grunt.js';

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

    // Spawn test grunts at specified positions
    this.spawnGrunts();

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
  }

  /**
   * Spawn test grunts at positions 600, 650, 700
   */
  spawnGrunts() {
    const spawnPositions = [600, 650, 700];
    const groundY = 544; // Same Y as player spawn (standing on ground)

    spawnPositions.forEach((x) => {
      const grunt = new Grunt(this, x, groundY);
      this.enemies.add(grunt);
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

    // Deal damage to enemy
    enemy.takeDamage(bullet);

    // Deactivate bullet
    bullet.deactivate();
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
