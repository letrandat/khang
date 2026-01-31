import Phaser from 'phaser';
import Bullet from '../entities/Bullet.js';

export default class WeaponSystem {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    // Fire rate limiting (200ms between shots)
    this.fireRate = 200;
    this.lastFiredTime = 0;

    // Create bullet pool using Phaser group
    this.bullets = scene.physics.add.group({
      classType: Bullet,
      maxSize: 20,
      runChildUpdate: true, // Automatically call update() on active bullets
    });

    // Set up input handlers
    this.setupInput();
  }

  /**
   * Set up input handlers for shooting
   */
  setupInput() {
    // X key for shooting
    this.shootKey = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.X
    );

    // Mouse click for shooting
    this.scene.input.on('pointerdown', (pointer) => {
      if (pointer.leftButtonDown()) {
        this.fire();
      }
    });
  }

  /**
   * Fire a bullet from the player's position
   * Respects fire rate limiting
   */
  fire() {
    const currentTime = this.scene.time.now;

    // Check fire rate limiting
    if (currentTime - this.lastFiredTime < this.fireRate) {
      return;
    }

    // Get bullet from pool
    const bullet = this.bullets.get();

    if (bullet) {
      // Get player position and facing direction
      const pos = this.player.getPosition();
      const facing = this.player.getFacing();

      // Check if player is airborne for crit
      const isCrit = this.player.isAirborne();

      // Offset bullet spawn position slightly in front of player
      const spawnX = pos.x + facing * 20;
      const spawnY = pos.y;

      // Fire the bullet
      bullet.fire(spawnX, spawnY, facing, isCrit);

      // Update last fired time
      this.lastFiredTime = currentTime;
    }
  }

  /**
   * Update method called each frame
   * Handles X key input for shooting
   */
  update() {
    // Check for X key press (using justDown for single shot per press)
    if (Phaser.Input.Keyboard.JustDown(this.shootKey)) {
      this.fire();
    }
  }

  /**
   * Get the bullets group for collision detection
   */
  getBullets() {
    return this.bullets;
  }
}
