import Phaser from 'phaser';

export default class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'bullet');

    // Bullet properties
    this.speed = 400;
    this.baseDamage = 10;
    this.damage = this.baseDamage;
    this.isCrit = false;

    // Weapon config reference
    this.weaponConfig = null;

    // Special behavior flags
    this.piercing = false;
    this.pierceCount = 0;
    this.piercedEnemies = new Set();

    this.homing = false;
    this.homingStrength = 0.05;
    this.homingTarget = null;

    this.explosive = false;
    this.explosionRadius = 60;

    this.chain = false;
    this.maxChains = 2;
    this.chainRange = 100;
    this.chainedEnemies = new Set();

    this.flame = false;
    this.lifetime = 0;
    this.spawnTime = 0;

    this.slow = false;
    this.slowAmount = 0.5;
    this.slowDuration = 2000;

    this.beam = false;

    this.boomerang = false;
    this.returnDistance = 300;
    this.returning = false;
    this.startX = 0;
    this.playerRef = null;
  }

  /**
   * Fire the bullet in a direction (legacy method for backwards compatibility)
   */
  fire(x, y, direction, isCrit = false) {
    this.fireWithConfig(x, y, direction, 0, isCrit, {
      damage: this.baseDamage,
      speed: this.speed,
      projectileTexture: 'bullet',
      critTexture: 'bullet-crit',
    });
  }

  /**
   * Fire with full weapon configuration
   * @param {number} x - Starting X position
   * @param {number} y - Starting Y position
   * @param {number} direction - 1 for right, -1 for left
   * @param {number} angle - Angle offset in degrees (for spread shots)
   * @param {boolean} isCrit - Whether this is a critical hit
   * @param {Object} weaponConfig - Weapon configuration
   * @param {Object} extras - Extra behavior options
   */
  fireWithConfig(x, y, direction, angle, isCrit, weaponConfig, extras = {}) {
    this.weaponConfig = weaponConfig;
    this.isCrit = isCrit;

    // Reset special behavior flags
    this.resetBehaviors();

    // Apply extras
    if (extras.piercing) {
      this.piercing = true;
      this.pierceCount = extras.pierceCount || 2;
    }
    if (extras.homing) {
      this.homing = true;
      this.homingStrength = extras.homingStrength || 0.05;
    }
    if (extras.explosive) {
      this.explosive = true;
      this.explosionRadius = extras.explosionRadius || 60;
    }
    if (extras.chain) {
      this.chain = true;
      this.maxChains = extras.maxChains || 2;
      this.chainRange = extras.chainRange || 100;
    }
    if (extras.flame) {
      this.flame = true;
      this.lifetime = extras.lifetime || 300;
      this.spawnTime = this.scene.time.now;
    }
    if (extras.slow) {
      this.slow = true;
      this.slowAmount = extras.slowAmount || 0.5;
      this.slowDuration = extras.slowDuration || 2000;
    }
    if (extras.beam) {
      this.beam = true;
    }
    if (extras.boomerang) {
      this.boomerang = true;
      this.returnDistance = extras.returnDistance || 300;
      this.returning = false;
      this.startX = x;
      this.playerRef = extras.playerRef;
    }

    // Calculate damage with crit
    const baseDmg = weaponConfig.damage || this.baseDamage;
    this.damage = isCrit ? baseDmg * 2 : baseDmg;

    // Set texture based on weapon and crit status
    const texture = isCrit
      ? (weaponConfig.critTexture || 'bullet-crit')
      : (weaponConfig.projectileTexture || 'bullet');
    this.setTexture(texture);

    // Store direction for behaviors that need it
    this.direction = direction;

    // Position and activate
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);

    // Enable physics body
    this.body.enable = true;
    this.body.setAllowGravity(false);

    // Calculate velocity with angle
    const speed = weaponConfig.speed || this.speed;
    const angleRad = Phaser.Math.DegToRad(angle);
    const vx = Math.cos(angleRad) * speed * direction;
    const vy = Math.sin(angleRad) * speed;

    this.setVelocity(vx, vy);
  }

  /**
   * Reset all special behavior flags
   */
  resetBehaviors() {
    this.piercing = false;
    this.pierceCount = 0;
    this.piercedEnemies.clear();

    this.homing = false;
    this.homingTarget = null;

    this.explosive = false;

    this.chain = false;
    this.chainedEnemies.clear();

    this.flame = false;
    this.lifetime = 0;

    this.slow = false;

    this.beam = false;

    this.boomerang = false;
    this.returning = false;
    this.playerRef = null;
  }

  /**
   * Deactivate the bullet and return it to the pool
   */
  deactivate() {
    this.setActive(false);
    this.setVisible(false);
    this.body.enable = false;
    this.setVelocity(0, 0);
    this.resetBehaviors();
  }

  /**
   * Handle hit on enemy - may not deactivate for piercing bullets
   * @param {Enemy} enemy - The enemy that was hit
   * @returns {boolean} - Whether the bullet should be deactivated
   */
  onHitEnemy(enemy) {
    // Handle piercing
    if (this.piercing) {
      if (this.piercedEnemies.has(enemy)) {
        return false; // Already hit this enemy
      }
      this.piercedEnemies.add(enemy);
      this.pierceCount--;

      if (this.pierceCount <= 0) {
        return true; // Deactivate after last pierce
      }
      return false; // Keep going
    }

    // Handle chain lightning
    if (this.chain && this.chainedEnemies.size < this.maxChains) {
      this.chainedEnemies.add(enemy);
      this.findAndChainToNextEnemy(enemy);
    }

    // Handle explosive
    if (this.explosive) {
      this.explode();
    }

    // Handle boomerang (don't deactivate on first hit if not returning)
    if (this.boomerang && !this.returning) {
      // Continue to return point
      return false;
    }

    return true; // Normal deactivation
  }

  /**
   * Find next enemy for chain lightning
   */
  findAndChainToNextEnemy(currentEnemy) {
    const enemies = this.scene.enemies?.getChildren() || [];
    let nearestEnemy = null;
    let nearestDist = this.chainRange;

    for (const enemy of enemies) {
      if (!enemy.active || enemy.isDying || this.chainedEnemies.has(enemy)) {
        continue;
      }

      const dist = Phaser.Math.Distance.Between(
        currentEnemy.x,
        currentEnemy.y,
        enemy.x,
        enemy.y
      );

      if (dist < nearestDist) {
        nearestDist = dist;
        nearestEnemy = enemy;
      }
    }

    if (nearestEnemy) {
      // Create chain effect
      this.createChainEffect(currentEnemy, nearestEnemy);

      // Deal damage to chained enemy
      nearestEnemy.takeDamage({ damage: this.damage * 0.7, isCrit: this.isCrit });
      this.chainedEnemies.add(nearestEnemy);
    }
  }

  /**
   * Create visual chain effect between two points
   */
  createChainEffect(from, to) {
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(2, 0xffff00, 1);
    graphics.lineBetween(from.x, from.y, to.x, to.y);
    graphics.setDepth(100);

    // Fade out and destroy
    this.scene.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: 200,
      onComplete: () => graphics.destroy(),
    });
  }

  /**
   * Create explosion effect
   */
  explode() {
    const enemies = this.scene.enemies?.getChildren() || [];

    // Create explosion visual
    const explosion = this.scene.add.circle(
      this.x,
      this.y,
      this.explosionRadius,
      0xff6600,
      0.5
    );
    explosion.setDepth(100);

    // Animate explosion
    this.scene.tweens.add({
      targets: explosion,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 300,
      onComplete: () => explosion.destroy(),
    });

    // Damage enemies in radius
    for (const enemy of enemies) {
      if (!enemy.active || enemy.isDying) continue;

      const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      if (dist <= this.explosionRadius) {
        // Damage falls off with distance
        const falloff = 1 - (dist / this.explosionRadius) * 0.5;
        enemy.takeDamage({ damage: Math.round(this.damage * falloff), isCrit: false });
      }
    }
  }

  /**
   * Update method called each frame
   */
  update() {
    if (!this.active) return;

    // Handle flame lifetime
    if (this.flame) {
      if (this.scene.time.now - this.spawnTime > this.lifetime) {
        this.deactivate();
        return;
      }
      // Flames fade out
      this.setAlpha(1 - (this.scene.time.now - this.spawnTime) / this.lifetime);
    }

    // Handle homing
    if (this.homing) {
      this.updateHoming();
    }

    // Handle boomerang
    if (this.boomerang) {
      this.updateBoomerang();
    }

    // Check if bullet is off-screen
    if (this.x < -50 || this.x > 850 || this.y < -50 || this.y > 650) {
      this.deactivate();
    }
  }

  /**
   * Update homing behavior
   */
  updateHoming() {
    // Find nearest enemy if no target or target is dead
    if (!this.homingTarget || !this.homingTarget.active || this.homingTarget.isDying) {
      this.homingTarget = this.findNearestEnemy();
    }

    if (this.homingTarget) {
      // Calculate angle to target
      const targetAngle = Phaser.Math.Angle.Between(
        this.x,
        this.y,
        this.homingTarget.x,
        this.homingTarget.y
      );

      // Current velocity angle
      const currentAngle = Math.atan2(this.body.velocity.y, this.body.velocity.x);

      // Interpolate towards target angle
      let newAngle = Phaser.Math.Angle.RotateTo(
        currentAngle,
        targetAngle,
        this.homingStrength
      );

      // Apply new velocity
      const speed = this.weaponConfig?.speed || this.speed;
      this.setVelocity(
        Math.cos(newAngle) * speed,
        Math.sin(newAngle) * speed
      );
    }
  }

  /**
   * Update boomerang behavior
   */
  updateBoomerang() {
    const distFromStart = Math.abs(this.x - this.startX);

    if (!this.returning && distFromStart >= this.returnDistance) {
      // Start returning
      this.returning = true;
    }

    if (this.returning && this.playerRef) {
      // Move towards player
      const playerPos = this.playerRef.getPosition();
      const angle = Phaser.Math.Angle.Between(this.x, this.y, playerPos.x, playerPos.y);
      const speed = (this.weaponConfig?.speed || this.speed) * 1.2;

      this.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );

      // Deactivate when close to player
      const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, playerPos.x, playerPos.y);
      if (distToPlayer < 30) {
        this.deactivate();
      }
    }
  }

  /**
   * Find nearest enemy for homing
   */
  findNearestEnemy() {
    const enemies = this.scene.enemies?.getChildren() || [];
    let nearest = null;
    let nearestDist = Infinity;

    for (const enemy of enemies) {
      if (!enemy.active || enemy.isDying) continue;

      const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = enemy;
      }
    }

    return nearest;
  }

  /**
   * Get slow effect info for enemies
   */
  getSlowEffect() {
    if (this.slow) {
      return {
        amount: this.slowAmount,
        duration: this.slowDuration,
      };
    }
    return null;
  }
}
