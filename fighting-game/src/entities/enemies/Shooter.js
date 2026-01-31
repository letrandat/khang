import Enemy from '../Enemy.js';

/**
 * Shooter enemy type - ranged enemy that fires projectiles
 * Stays at distance from player and fires every 2 seconds
 * Uses 'enemy-shooter' texture (orange rectangle 32x48)
 */
export default class Shooter extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'enemy-shooter');

    // Shooter-specific stats
    this.health = 25;
    this.maxHealth = 25;
    this.speed = 40;
    this.damage = 15; // Bullet damage
    this.points = 20;

    // Configure physics body
    this.setCollideWorldBounds(true);

    // Set body size LARGER than visual for generous hitbox (40x52 vs 32x48)
    this.body.setSize(40, 52);
    // Center the larger hitbox on the sprite
    this.body.setOffset(-4, -2);

    // Shooting parameters
    this.fireRate = 2000; // Fire every 2 seconds
    this.lastFireTime = 0;
    this.bulletSpeed = 200;
    this.preferredDistance = 250; // Distance to maintain from player

    // Get reference to enemy bullets group (created in GameScene)
    this.bulletsGroup = null;
  }

  /**
   * Set the bullets group for this shooter
   * @param {Phaser.Physics.Arcade.Group} group - Bullets group
   */
  setBulletsGroup(group) {
    this.bulletsGroup = group;
  }

  /**
   * Update AI - maintain distance and shoot at player
   * @param {Player} player - Reference to the player
   */
  updateAI(player) {
    if (this.isDying || !player || !player.active) return;

    const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const directionX = player.x < this.x ? -1 : 1;

    // Maintain preferred distance from player
    if (distanceToPlayer < this.preferredDistance - 50) {
      // Too close - back away
      this.setVelocityX(-directionX * this.speed);
    } else if (distanceToPlayer > this.preferredDistance + 50) {
      // Too far - move closer
      this.setVelocityX(directionX * this.speed);
    } else {
      // In sweet spot - stop moving
      this.setVelocityX(0);
    }

    // Flip sprite to face player
    this.setFlipX(directionX < 0);

    // Check if can fire
    const currentTime = this.scene.time.now;
    if (currentTime - this.lastFireTime >= this.fireRate) {
      this.fireAtPlayer(player);
      this.lastFireTime = currentTime;
    }
  }

  /**
   * Fire a projectile at the player
   * @param {Player} player - Target player
   */
  fireAtPlayer(player) {
    if (!this.bulletsGroup) return;

    // Get a bullet from the pool
    const bullet = this.bulletsGroup.get(this.x, this.y);
    if (!bullet) return;

    // Activate and configure bullet
    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.body.enable = true;

    // Calculate direction to player
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);

    // Set velocity toward player
    this.scene.physics.velocityFromRotation(angle, this.bulletSpeed, bullet.body.velocity);

    // Set bullet rotation to face direction
    bullet.setRotation(angle);

    // Store damage on bullet
    bullet.damage = this.damage;

    // Bullet cleanup timer (destroy after 5 seconds)
    this.scene.time.delayedCall(5000, () => {
      if (bullet.active) {
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.enable = false;
      }
    });
  }

  /**
   * Override die to clean up any pending bullets
   */
  die() {
    super.die();
  }
}
