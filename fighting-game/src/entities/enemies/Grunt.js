import Enemy from '../Enemy.js';

/**
 * Grunt enemy type - basic walking enemy
 * Walks toward the player at a slow pace
 * Uses 'enemy-grunt' texture (red rectangle 32x48)
 */
export default class Grunt extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'enemy-grunt');

    // Grunt-specific stats
    this.health = 30;
    this.maxHealth = 30;
    this.speed = 50;
    this.damage = 10;

    // Configure physics body
    this.setCollideWorldBounds(true);

    // Set body size LARGER than visual for generous hitbox (40x52 vs 32x48)
    // This makes it easier to hit enemies
    this.body.setSize(40, 52);
    // Center the larger hitbox on the sprite
    this.body.setOffset(-4, -2);
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
