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

    // Track facing direction (1 = right, -1 = left)
    this.facingDirection = 1;

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
   */
  get isAirborne() {
    return !this.body.blocked.down;
  }

  /**
   * Update method called each frame to handle player input
   */
  update() {
    this.handleMovement();
    this.handleJump();
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
}
