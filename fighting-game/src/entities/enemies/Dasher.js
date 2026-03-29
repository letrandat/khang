import Enemy from '../Enemy.js';

/**
 * Dasher enemy type - fast charging enemy
 * Charges at player quickly with brief pauses between charges
 * Uses 'dasher' spritesheet (128x128, 16 frames of 32x32)
 * Row 0 (frames 0-3): walk/idle
 * Row 1 (frames 4-7): preparing charge
 * Row 2 (frames 8-11): charging
 * Row 3 (frames 12-15): recovering
 */
export default class Dasher extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'dasher');

    // Dasher-specific stats
    this.health = 35;
    this.maxHealth = 35;
    this.speed = 150; // Fast when charging
    this.walkSpeed = 40; // Slow when not charging
    this.damage = 15;
    this.points = 25;

    // Scale sprite 4x (display: 128x128)
    this.setScale(4);

    // Configure physics body (unscaled coords; world size = 2x these values)
    this.setCollideWorldBounds(true);
    this.body.setSize(20, 26);
    this.body.setOffset(6, 3);

    // Register animations (guarded so multiple instances don't re-register)
    if (!scene.anims.exists('dasher-walk')) {
      scene.anims.create({
        key: 'dasher-walk',
        frames: scene.anims.generateFrameNumbers('dasher', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1,
      });
    }
    if (!scene.anims.exists('dasher-prepare')) {
      scene.anims.create({
        key: 'dasher-prepare',
        frames: scene.anims.generateFrameNumbers('dasher', { start: 4, end: 7 }),
        frameRate: 12,
        repeat: -1,
      });
    }
    if (!scene.anims.exists('dasher-charge')) {
      scene.anims.create({
        key: 'dasher-charge',
        frames: scene.anims.generateFrameNumbers('dasher', { start: 8, end: 11 }),
        frameRate: 16,
        repeat: -1,
      });
    }
    if (!scene.anims.exists('dasher-recover')) {
      scene.anims.create({
        key: 'dasher-recover',
        frames: scene.anims.generateFrameNumbers('dasher', { start: 12, end: 15 }),
        frameRate: 6,
        repeat: -1,
      });
    }
    this.play('dasher-walk');

    // Charging state
    this.state = 'idle'; // 'idle', 'preparing', 'charging', 'recovering'
    this.chargeDirection = 1;
    this.prepareDuration = 500; // 0.5s warning before charge
    this.chargeDuration = 800; // 0.8s charge time
    this.recoverDuration = 1000; // 1s pause between charges

    // Timers
    this.stateTimer = null;
    this.flashTween = null;

    // Original tint for restoring after flash
    this.originalTint = null;
  }

  /**
   * Update AI - charge at player with pauses
   * @param {Player} player - Reference to the player
   */
  updateAI(player) {
    if (this.isDying || !player || !player.active) return;

    const directionX = player.x < this.x ? -1 : 1;

    switch (this.state) {
      case 'idle':
        // Walk slowly toward player, then start preparing to charge
        this.setVelocityX(directionX * this.walkSpeed);
        this.setFlipX(directionX < 0);
        if (this.anims.currentAnim?.key !== 'dasher-walk') this.play('dasher-walk');

        // Start charge preparation
        this.startPrepare(directionX);
        break;

      case 'preparing':
        // Stop and flash warning
        this.setVelocityX(0);
        // Direction is locked in startPrepare
        break;

      case 'charging':
        // Move fast in locked direction
        this.setVelocityX(this.chargeDirection * this.speed);
        break;

      case 'recovering':
        // Stand still during recovery
        this.setVelocityX(0);
        break;
    }
  }

  /**
   * Start preparing to charge (flash warning)
   * @param {number} direction - Direction to charge (-1 or 1)
   */
  startPrepare(direction) {
    this.state = 'preparing';
    this.chargeDirection = direction;
    this.play('dasher-prepare');

    // Store original tint
    this.originalTint = this.tintTopLeft;

    // Flash red/white to indicate incoming charge
    this.flashTween = this.scene.tweens.add({
      targets: this,
      duration: 100,
      repeat: 4,
      yoyo: true,
      onStart: () => {
        this.setTint(0xff0000);
      },
      onYoyo: () => {
        this.clearTint();
      },
      onRepeat: () => {
        this.setTint(0xff0000);
      },
      onComplete: () => {
        this.clearTint();
      },
    });

    // After prepare time, start charging
    this.stateTimer = this.scene.time.delayedCall(this.prepareDuration, () => {
      this.startCharge();
    });
  }

  /**
   * Start the charge
   */
  startCharge() {
    this.state = 'charging';
    this.play('dasher-charge');

    // Clear any flash tween
    if (this.flashTween) {
      this.flashTween.destroy();
      this.flashTween = null;
    }
    this.clearTint();

    // Charge for fixed duration then recover
    this.stateTimer = this.scene.time.delayedCall(this.chargeDuration, () => {
      this.startRecover();
    });
  }

  /**
   * Start recovery period after charge
   */
  startRecover() {
    this.state = 'recovering';
    this.setVelocityX(0);
    this.play('dasher-recover');

    // After recovery, return to idle
    this.stateTimer = this.scene.time.delayedCall(this.recoverDuration, () => {
      this.state = 'idle';
    });
  }

  /**
   * Override die to clean up timers
   */
  die() {
    // Cancel timers
    if (this.stateTimer) {
      this.stateTimer.destroy();
      this.stateTimer = null;
    }
    if (this.flashTween) {
      this.flashTween.destroy();
      this.flashTween = null;
    }

    super.die();
  }
}
