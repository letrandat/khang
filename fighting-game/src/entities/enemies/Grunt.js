import Enemy from '../Enemy.js';

/**
 * Grunt enemy type - basic walking enemy
 * Walks toward the player at a slow pace
 * Uses 'grunt' sprite sheet (32x64, 2 frames of 32x32)
 */
export default class Grunt extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'grunt');

    // Grunt-specific stats
    this.health = 30;
    this.maxHealth = 30;
    this.speed = 50;
    this.damage = 10;

    // Scale sprite 2x (display: 64x64)
    this.setScale(2);

    // Configure physics body
    this.setCollideWorldBounds(true);

    // Hitbox in local (pre-scale) pixels
    this.body.setSize(20, 26);
    this.body.setOffset(6, 4);

    // Register and play walk animation
    if (!scene.anims.exists('grunt-walk')) {
      scene.anims.create({
        key: 'grunt-walk',
        frames: scene.anims.generateFrameNumbers('grunt', { start: 0, end: 1 }),
        frameRate: 6,
        repeat: -1,
      });
    }
    this.play('grunt-walk');
  }

  /**
   * Update AI - walk toward player
   * @param {Player} player - Reference to the player
   */
  updateAI(player) {
    if (this.isDying || !player || !player.active) return;

    // Determine direction to player
    const direction = player.x < this.x ? -1 : 1;

    // Move toward player
    this.setVelocityX(direction * this.speed);

    // Flip sprite to face movement direction
    this.setFlipX(direction < 0);
  }
}
