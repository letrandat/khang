import Enemy from '../Enemy.js';

/**
 * Flyer enemy type - floating enemy with sine wave movement
 * Floats/bobs in the air and slowly moves toward the player
 * Uses 'enemy-flyer' texture (purple rectangle 32x32)
 */
export default class Flyer extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'bat');

    // Flyer-specific stats
    this.health = 20;
    this.maxHealth = 20;
    this.speed = 30; // Slower than Grunt
    this.damage = 8;
    this.points = 15; // More points due to difficulty targeting

    // Scale sprite 2x (display: 64x64)
    this.setScale(2);

    // Configure physics body
    this.setCollideWorldBounds(true);

    // Disable gravity for flying
    this.body.setAllowGravity(false);

    // Hitbox in local (pre-scale) pixels; offset in world pixels (doubled for 2x scale)
    this.body.setSize(20, 14);
    this.body.setOffset(12, 20);

    // Register and play wing-flap animation
    if (!scene.anims.exists('bat-fly')) {
      scene.anims.create({
        key: 'bat-fly',
        frames: scene.anims.generateFrameNumbers('bat', { start: 0, end: 1 }),
        frameRate: 4,
        repeat: -1,
      });
    }
    this.play('bat-fly');

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

    // Flip sprite to face movement direction (bat faces left by default)
    this.setFlipX(directionX > 0);
  }
}
