import Phaser from 'phaser';

export default class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'bullet');

    // Bullet properties
    this.speed = 400;
    this.baseDamage = 10;
    this.damage = this.baseDamage;
    this.isCrit = false;
  }

  /**
   * Fire the bullet in a direction
   * @param {number} x - Starting X position
   * @param {number} y - Starting Y position
   * @param {number} direction - 1 for right, -1 for left
   * @param {boolean} isCrit - Whether this is a critical hit (2x damage)
   */
  fire(x, y, direction, isCrit = false) {
    this.isCrit = isCrit;

    // Set damage based on crit status
    this.damage = isCrit ? this.baseDamage * 2 : this.baseDamage;

    // Set texture based on crit status
    this.setTexture(isCrit ? 'bullet-crit' : 'bullet');

    // Position and activate the bullet
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);

    // Enable physics body
    this.body.enable = true;

    // Set velocity based on direction
    this.setVelocityX(direction * this.speed);
    this.setVelocityY(0);
  }

  /**
   * Deactivate the bullet and return it to the pool
   */
  deactivate() {
    this.setActive(false);
    this.setVisible(false);
    this.body.enable = false;
    this.setVelocity(0, 0);
  }

  /**
   * Check if bullet is off-screen and deactivate if so
   * Called each frame by the WeaponSystem
   */
  update() {
    // Check if bullet is off-screen (with some buffer)
    if (this.x < -50 || this.x > 850 || this.y < -50 || this.y > 650) {
      this.deactivate();
    }
  }
}
