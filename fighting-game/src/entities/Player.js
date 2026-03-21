import Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player');

    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Configure physics body
    this.setCollideWorldBounds(true);

    // Movement configuration
    this.moveSpeed = 200;
    this.jumpVelocity = -400;

    // Scale sprite 2x (display: 64x64, physics body scales with it)
    this.setScale(2);

    // Track facing direction (1 = right, -1 = left)
    this.facingDirection = 1;

    // Set up animations
    this.createAnimations();

    // Health system
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.isInvincible = false;
    this.invincibilityDuration = 1000; // 1 second of invincibility after taking damage

    // Set up input keys
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });
  }

  /**
   * Returns true when the player is in the air (jumping or falling)
   * Critical for the crit system - jump shots deal 2x damage
   * Uses blocked.down instead of velocity.y !== 0 to correctly detect
   * airborne state at jump apex when velocity briefly equals 0
   */
  isAirborne() {
    return !this.body.blocked.down;
  }

  /**
   * Get player position for weapon system
   */
  getPosition() {
    return { x: this.x, y: this.y };
  }

  /**
   * Get facing direction for weapon system (-1 = left, 1 = right)
   */
  getFacing() {
    return this.facingDirection;
  }

  /**
   * Register idle and jump animations from the 7-frame sprite sheet.
   * All 7 frames form the jump arc — frame 0 is used for idle/walk.
   */
  createAnimations() {
    const anims = this.scene.anims;

    if (!anims.exists('player-idle')) {
      anims.create({
        key: 'player-idle',
        frames: [{ key: 'player', frame: 0 }],
        frameRate: 1,
        repeat: -1,
      });
    }

    if (!anims.exists('player-jump')) {
      anims.create({
        key: 'player-jump',
        frames: anims.generateFrameNumbers('player', { start: 0, end: 6 }),
        frameRate: 12,
        repeat: 0, // play once, hold last frame
      });
    }
  }

  /**
   * Update method called each frame to handle player input
   */
  update() {
    this.handleMovement();
    this.handleJump();
    this.updateAnimation();
  }

  /**
   * Play jump animation when airborne, idle frame when grounded.
   */
  updateAnimation() {
    if (this.isAirborne()) {
      this.play('player-jump', true);
    } else {
      this.play('player-idle', true);
    }
  }

  /**
   * Handle horizontal movement input
   */
  handleMovement() {
    const leftPressed = this.cursors.left.isDown || this.wasd.left.isDown;
    const rightPressed = this.cursors.right.isDown || this.wasd.right.isDown;

    if (leftPressed) {
      this.setVelocityX(-this.moveSpeed);
      this.facingDirection = -1;
      this.setFlipX(true);
    } else if (rightPressed) {
      this.setVelocityX(this.moveSpeed);
      this.facingDirection = 1;
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }
  }

  /**
   * Handle jump input - only allows jumping when on the ground
   */
  handleJump() {
    const jumpPressed =
      this.cursors.up.isDown || this.wasd.up.isDown || this.wasd.space.isDown;

    // Only allow jump when on the ground (prevents double jump)
    if (jumpPressed && this.body.blocked.down) {
      this.setVelocityY(this.jumpVelocity);
    }
  }

  /**
   * Take damage and handle invincibility
   * @param {number} amount - Amount of damage to take
   * @returns {boolean} True if damage was taken, false if invincible
   */
  takeDamage(amount) {
    // Skip if invincible
    if (this.isInvincible) {
      return false;
    }

    // Apply damage
    this.health = Math.max(0, this.health - amount);

    // Emit damage event for UI and game over handling
    this.scene.events.emit('playerDamaged', this.health, this.maxHealth);

    // Check for death
    if (this.health <= 0) {
      this.scene.events.emit('playerDied');
      return true;
    }

    // Start invincibility period
    this.startInvincibility();

    return true;
  }

  /**
   * Start invincibility period with flashing effect
   */
  startInvincibility() {
    this.isInvincible = true;

    // Create flashing/blinking effect
    this.flashTween = this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: Math.floor(this.invincibilityDuration / 200) - 1,
      onComplete: () => {
        this.setAlpha(1);
        this.isInvincible = false;
      },
    });
  }

  /**
   * Get current health
   * @returns {number} Current health
   */
  getHealth() {
    return this.health;
  }

  /**
   * Get max health
   * @returns {number} Max health
   */
  getMaxHealth() {
    return this.maxHealth;
  }

  /**
   * Reset player health to full
   */
  resetHealth() {
    this.health = this.maxHealth;
    this.isInvincible = false;
    if (this.flashTween) {
      this.flashTween.stop();
    }
    this.setAlpha(1);
  }
}
