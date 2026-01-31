import Enemy from '../Enemy.js';

/**
 * Flyer enemy type - floating enemy with sine wave movement
 * Floats/bobs in the air and slowly moves toward the player
 * Uses 'enemy-flyer' texture (purple rectangle 32x32)
 */
export default class Flyer extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'enemy-flyer');

    // Flyer-specific stats
    this.health = 20;
    this.maxHealth = 20;
    this.speed = 30; // Slower than Grunt
    this.damage = 8;
    this.points = 15; // More points due to difficulty targeting

    // Configure physics body
    this.setCollideWorldBounds(true);

    // Disable gravity for flying
    this.body.setAllowGravity(false);

    // Set body size LARGER than visual for generous hitbox (40x40 vs 32x32)
    this.body.setSize(40, 40);
    // Center the larger hitbox on the sprite
    this.body.setOffset(-4, -4);

    // Sine wave movement parameters
    this.bobAmplitude = 30; // How far up/down to bob
    this.bobFrequency = 2; // How fast to bob (oscillations per second)
    this.baseY = y; // Starting Y position for sine wave
    this.bobTime = 0; // Time accumulator for sine wave
  }

  /**
   * Update AI - float toward player with bobbing motion
   * @param {Player} player - Reference to the player
   */
  updateAI(player) {
    if (this.isDying || !player || !player.active) return;

    // Update bob time
    this.bobTime += 0.016; // Approximately 1/60 second per frame

    // Calculate sine wave offset for bobbing
    const bobOffset = Math.sin(this.bobTime * this.bobFrequency * Math.PI * 2) * this.bobAmplitude;

    // Determine horizontal direction to player
    const directionX = player.x < this.x ? -1 : 1;

    // Move toward player horizontally
    this.setVelocityX(directionX * this.speed);

    // Move toward player's general Y position with bobbing
    const targetY = player.y - 50; // Float slightly above player
    const diffY = targetY - this.baseY;

    // Slowly adjust base Y toward player height
    if (Math.abs(diffY) > 10) {
      this.baseY += Math.sign(diffY) * this.speed * 0.5 * 0.016;
    }

    // Set Y position based on base + bob offset
    this.y = this.baseY + bobOffset;

    // Flip sprite to face movement direction
    this.setFlipX(directionX < 0);
  }
}
