import Phaser from 'phaser';
import Bullet from '../entities/Bullet.js';
import { WEAPONS, getWeaponWithTier, rotateWeapon } from '../config/weapons.js';

export default class WeaponSystem {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    // Current weapon state
    this.currentWeaponId = 'energyBlaster';
    this.currentTier = 1;
    this.currentWeapon = getWeaponWithTier(this.currentWeaponId, this.currentTier);

    // Fire rate limiting
    this.fireRate = this.currentWeapon.fireRate;
    this.lastFiredTime = 0;

    // Create bullet pool using Phaser group
    this.bullets = scene.physics.add.group({
      classType: Bullet,
      maxSize: 50, // Increased for spread weapons
      runChildUpdate: true,
    });

    // Set up input handlers
    this.setupInput();

    // Listen for wave complete event to rotate weapons
    this.scene.events.on('waveComplete', this.onWaveComplete, this);
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
   * Handle wave complete - rotate weapon
   * @param {number} waveNumber - The completed wave number
   */
  onWaveComplete(waveNumber) {
    const oldWeapon = this.currentWeapon;
    const result = rotateWeapon(this.currentWeaponId, this.currentTier);

    this.currentWeaponId = result.weaponId;
    this.currentTier = result.tier;
    this.currentWeapon = getWeaponWithTier(this.currentWeaponId, this.currentTier);
    this.fireRate = this.currentWeapon.fireRate;

    // Show weapon change notification
    this.showWeaponChangeNotification(oldWeapon, this.currentWeapon, result.upgraded);

    // Emit event for UI update
    this.scene.events.emit('weaponChanged', this.currentWeapon);
  }

  /**
   * Show weapon change notification
   */
  showWeaponChangeNotification(oldWeapon, newWeapon, upgraded) {
    const message = upgraded
      ? `UPGRADED! ${newWeapon.displayName}`
      : `NEW WEAPON: ${newWeapon.displayName}`;

    const color = upgraded ? '#fbbf24' : '#60a5fa';

    const text = this.scene.add.text(400, 250, message, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: color,
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);
    text.setDepth(200);

    // Animate and destroy
    this.scene.tweens.add({
      targets: text,
      alpha: 0,
      y: text.y - 40,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        text.destroy();
      },
    });
  }

  /**
   * Fire weapon based on current weapon type
   */
  fire() {
    const currentTime = this.scene.time.now;

    // Check fire rate limiting
    if (currentTime - this.lastFiredTime < this.fireRate) {
      return;
    }

    const pos = this.player.getPosition();
    const facing = this.player.getFacing();
    const isCrit = this.player.isAirborne();

    // Fire based on weapon behavior
    switch (this.currentWeapon.behavior) {
      case 'spread':
        this.fireSpread(pos, facing, isCrit);
        break;
      case 'piercing':
        this.firePiercing(pos, facing, isCrit);
        break;
      case 'homing':
        this.fireHoming(pos, facing, isCrit);
        break;
      case 'explosive':
        this.fireExplosive(pos, facing, isCrit);
        break;
      case 'chain':
        this.fireChain(pos, facing, isCrit);
        break;
      case 'flame':
        this.fireFlame(pos, facing, isCrit);
        break;
      case 'slow':
        this.fireSlow(pos, facing, isCrit);
        break;
      case 'beam':
        this.fireBeam(pos, facing, isCrit);
        break;
      case 'boomerang':
        this.fireBoomerang(pos, facing, isCrit);
        break;
      case 'straight':
      default:
        this.fireStraight(pos, facing, isCrit);
        break;
    }

    this.lastFiredTime = currentTime;
  }

  /**
   * Fire a straight bullet (Energy Blaster, SMG, Bow)
   */
  fireStraight(pos, facing, isCrit) {
    const bullet = this.bullets.get();
    if (bullet) {
      const spawnX = pos.x + facing * 20;
      const spawnY = pos.y;

      bullet.fireWithConfig(spawnX, spawnY, facing, 0, isCrit, this.currentWeapon);
    }
  }

  /**
   * Fire spread shot (Shotgun)
   */
  fireSpread(pos, facing, isCrit) {
    const count = this.currentWeapon.projectileCount;
    const spreadAngle = this.currentWeapon.spreadAngle || 15;
    const totalSpread = spreadAngle * (count - 1);
    const startAngle = -totalSpread / 2;

    for (let i = 0; i < count; i++) {
      const bullet = this.bullets.get();
      if (bullet) {
        const angle = startAngle + i * spreadAngle;
        const spawnX = pos.x + facing * 20;
        const spawnY = pos.y;

        bullet.fireWithConfig(spawnX, spawnY, facing, angle, isCrit, this.currentWeapon);
      }
    }
  }

  /**
   * Fire piercing shot (Sniper)
   */
  firePiercing(pos, facing, isCrit) {
    const bullet = this.bullets.get();
    if (bullet) {
      const spawnX = pos.x + facing * 20;
      const spawnY = pos.y;

      // Piercing bullets have extra config
      const pierceCount = this.currentWeapon.hasSpecial
        ? (this.currentWeapon.maxPierceCount || 2) + 2
        : this.currentWeapon.maxPierceCount || 2;

      bullet.fireWithConfig(spawnX, spawnY, facing, 0, isCrit, this.currentWeapon, {
        piercing: true,
        pierceCount: pierceCount,
      });
    }
  }

  /**
   * Fire homing orb (Magic Staff)
   */
  fireHoming(pos, facing, isCrit) {
    const bullet = this.bullets.get();
    if (bullet) {
      const spawnX = pos.x + facing * 20;
      const spawnY = pos.y;

      bullet.fireWithConfig(spawnX, spawnY, facing, 0, isCrit, this.currentWeapon, {
        homing: true,
        homingStrength: this.currentWeapon.hasSpecial ? 0.08 : 0.05,
      });
    }
  }

  /**
   * Fire explosive projectile (Launcher)
   */
  fireExplosive(pos, facing, isCrit) {
    const bullet = this.bullets.get();
    if (bullet) {
      const spawnX = pos.x + facing * 20;
      const spawnY = pos.y;

      const explosionRadius = this.currentWeapon.hasSpecial
        ? (this.currentWeapon.explosionRadius || 60) * 1.5
        : this.currentWeapon.explosionRadius || 60;

      bullet.fireWithConfig(spawnX, spawnY, facing, 0, isCrit, this.currentWeapon, {
        explosive: true,
        explosionRadius: explosionRadius,
      });
    }
  }

  /**
   * Fire chain lightning (Lightning)
   */
  fireChain(pos, facing, isCrit) {
    const bullet = this.bullets.get();
    if (bullet) {
      const spawnX = pos.x + facing * 20;
      const spawnY = pos.y;

      const maxChains = this.currentWeapon.hasSpecial
        ? (this.currentWeapon.maxChains || 2) + 2
        : this.currentWeapon.maxChains || 2;

      bullet.fireWithConfig(spawnX, spawnY, facing, 0, isCrit, this.currentWeapon, {
        chain: true,
        maxChains: maxChains,
        chainRange: this.currentWeapon.chainRange || 100,
      });
    }
  }

  /**
   * Fire flame particles (Flamethrower)
   */
  fireFlame(pos, facing, isCrit) {
    const bullet = this.bullets.get();
    if (bullet) {
      const spawnX = pos.x + facing * 20;
      const spawnY = pos.y + Phaser.Math.Between(-5, 5); // Slight vertical variance

      bullet.fireWithConfig(spawnX, spawnY, facing, Phaser.Math.Between(-5, 5), isCrit, this.currentWeapon, {
        flame: true,
        lifetime: this.currentWeapon.projectileLifetime || 300,
      });
    }
  }

  /**
   * Fire slow projectile (Ice Gun)
   */
  fireSlow(pos, facing, isCrit) {
    const bullet = this.bullets.get();
    if (bullet) {
      const spawnX = pos.x + facing * 20;
      const spawnY = pos.y;

      bullet.fireWithConfig(spawnX, spawnY, facing, 0, isCrit, this.currentWeapon, {
        slow: true,
        slowAmount: this.currentWeapon.slowAmount || 0.5,
        slowDuration: this.currentWeapon.slowDuration || 2000,
      });
    }
  }

  /**
   * Fire beam (Laser Beam)
   */
  fireBeam(pos, facing, isCrit) {
    const bullet = this.bullets.get();
    if (bullet) {
      const spawnX = pos.x + facing * 20;
      const spawnY = pos.y;

      bullet.fireWithConfig(spawnX, spawnY, facing, 0, isCrit, this.currentWeapon, {
        beam: true,
      });
    }
  }

  /**
   * Fire boomerang (Boomerang)
   */
  fireBoomerang(pos, facing, isCrit) {
    const bullet = this.bullets.get();
    if (bullet) {
      const spawnX = pos.x + facing * 20;
      const spawnY = pos.y;

      bullet.fireWithConfig(spawnX, spawnY, facing, 0, isCrit, this.currentWeapon, {
        boomerang: true,
        returnDistance: this.currentWeapon.returnDistance || 300,
        playerRef: this.player,
      });
    }
  }

  /**
   * Update method called each frame
   */
  update() {
    // Check for X key held down (continuous fire with rate limiting)
    if (this.shootKey.isDown) {
      this.fire();
    }
  }

  /**
   * Get the bullets group for collision detection
   */
  getBullets() {
    return this.bullets;
  }

  /**
   * Get current weapon info
   */
  getCurrentWeapon() {
    return this.currentWeapon;
  }

  /**
   * Set weapon directly (for testing/debug)
   */
  setWeapon(weaponId, tier = 1) {
    this.currentWeaponId = weaponId;
    this.currentTier = tier;
    this.currentWeapon = getWeaponWithTier(weaponId, tier);
    this.fireRate = this.currentWeapon.fireRate;
    this.scene.events.emit('weaponChanged', this.currentWeapon);
  }

  /**
   * Clean up
   */
  destroy() {
    this.scene.events.off('waveComplete', this.onWaveComplete, this);
  }
}
