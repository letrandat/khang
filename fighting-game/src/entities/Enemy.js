import Phaser from 'phaser';

/**
 * Base Enemy class for all enemy types
 * Handles health, damage, headshot detection, and death animations
 */
export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture) {
    super(scene, x, y, texture);

    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Base enemy properties
    this.health = 30;
    this.maxHealth = 30;
    this.speed = 50;
    this.damage = 10;

    // Reference to scene for spawning effects
    this.scene = scene;

    // Track if enemy is dying (prevents multiple death triggers)
    this.isDying = false;
  }

  /**
   * Check if a hit is a headshot based on bullet Y position
   * Headshot = hit in top 25% of enemy body
   * @param {number} bulletY - Y position of the bullet
   * @returns {boolean} Whether this is a headshot
   */
  isHeadshot(bulletY) {
    // Get the top of the enemy's body
    const bodyTop = this.body.y;
    const bodyHeight = this.body.height;
    const headshotZone = bodyTop + bodyHeight * 0.25;

    return bulletY < headshotZone;
  }

  /**
   * Take damage from a bullet
   * Applies headshot multiplier if hit in top 25% of body
   * @param {object} bullet - The bullet that hit this enemy
   * @returns {object} Damage info for UI display
   */
  takeDamage(bullet) {
    if (this.isDying) return null;

    // Get base damage from bullet
    let damage = bullet.damage;
    let isHeadshot = false;
    let displayText = damage.toString();

    // Check for headshot
    if (this.isHeadshot(bullet.y)) {
      isHeadshot = true;
      damage = Math.floor(damage * 1.5);

      // Display text based on whether it was also a crit (jump shot)
      if (bullet.isCrit) {
        displayText = `${damage} AERIAL HEADSHOT!`;
      } else {
        displayText = `${damage} HEADSHOT!`;
      }
    } else if (bullet.isCrit) {
      displayText = `${damage} CRIT!`;
    }

    // Apply damage
    this.health -= damage;

    // Show floating damage number
    this.showDamageNumber(displayText, isHeadshot || bullet.isCrit);

    // Check for death
    if (this.health <= 0) {
      this.die();
    }

    return {
      damage,
      isHeadshot,
      isCrit: bullet.isCrit,
    };
  }

  /**
   * Display floating damage number above enemy
   * @param {string} text - Text to display
   * @param {boolean} isCrit - Whether to use crit styling
   */
  showDamageNumber(text, isCrit) {
    const damageText = this.scene.add.text(this.x, this.y - 30, text, {
      fontSize: isCrit ? '18px' : '14px',
      fontFamily: 'Arial',
      color: isCrit ? '#ff4444' : '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: isCrit ? 'bold' : 'normal',
    });
    damageText.setOrigin(0.5);
    damageText.setDepth(100);

    // Animate floating up and fading out
    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        damageText.destroy();
      },
    });
  }

  /**
   * Death animation: flash white, fade out, destroy
   */
  die() {
    if (this.isDying) return;
    this.isDying = true;

    // Stop movement
    this.setVelocity(0, 0);
    this.body.enable = false;

    // Flash white effect
    this.setTint(0xffffff);

    // Fade out and destroy
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.destroy();
      },
    });
  }

  /**
   * Override in subclasses for enemy-specific movement
   * @param {Player} player - Reference to the player for AI targeting
   */
  updateAI(player) {
    // Base class does nothing - override in subclasses
  }
}
