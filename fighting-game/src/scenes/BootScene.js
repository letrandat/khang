import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Load player sprite sheet (96x96, 7 frames of 32x32 — full jump animation)
    this.load.spritesheet('player', 'assets/player.png', {
      frameWidth: 32,
      frameHeight: 32,
    });

    // Load bat sprite sheet (32x64, 2 frames of 32x32 — wing flap animation)
    this.load.spritesheet('bat', 'assets/bat.png', {
      frameWidth: 32,
      frameHeight: 32,
    });

    // Load dyno sprite sheet (96x128, 9 frames of 32x32 — walk cycle)
    this.load.spritesheet('dyno', 'assets/dyno.png', {
      frameWidth: 32,
      frameHeight: 32,
    });

    // Load grunt sprite sheet (32x64, 2 frames of 32x32 — walk cycle)
    this.load.spritesheet('grunt', 'assets/grunt.png', {
      frameWidth: 32,
      frameHeight: 32,
    });

    // Load dasher sprite sheet (128x128, 16 frames of 32x32 — 4 states x 4 frames)
    this.load.spritesheet('dasher', 'assets/dasher.png', {
      frameWidth: 32,
      frameHeight: 32,
    });

    // Create remaining placeholder textures programmatically
    this.createPlaceholderTextures();
  }

  createPlaceholderTextures() {

    // Ground placeholder - brown rectangle full-width x 32
    const groundGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    groundGraphics.fillStyle(0x8b4513, 1);
    groundGraphics.fillRect(0, 0, 800, 32);
    groundGraphics.generateTexture('ground', 800, 32);
    groundGraphics.destroy();

    // Platform placeholder - gray rectangle 200x20
    const platformGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    platformGraphics.fillStyle(0x666666, 1);
    platformGraphics.fillRect(0, 0, 200, 20);
    platformGraphics.generateTexture('platform', 200, 20);
    platformGraphics.destroy();

    // Enemy bullet placeholder - red circle 6x6 (for Shooter enemy)
    const enemyBulletGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    enemyBulletGraphics.fillStyle(0xff0000, 1);
    enemyBulletGraphics.fillCircle(3, 3, 3);
    enemyBulletGraphics.generateTexture('enemy-bullet', 6, 6);
    enemyBulletGraphics.destroy();

    // Create all weapon projectile textures
    this.createProjectileTextures();
  }

  /**
   * Create projectile textures for all weapons
   */
  createProjectileTextures() {
    // Energy Blaster - white rectangle 8x4 (base bullet)
    this.createBulletTexture('bullet', 0xffffff, 8, 4);
    this.createBulletTexture('bullet-crit', 0xffff00, 10, 5);

    // Bow & Arrow - brown elongated 12x3
    this.createBulletTexture('bullet-arrow', 0x8b4513, 12, 3);
    this.createBulletTexture('bullet-arrow-crit', 0xffd700, 14, 4);

    // Magic Staff - purple circle 8x8
    this.createCircleBulletTexture('bullet-magic', 0x9b59b6, 4);
    this.createCircleBulletTexture('bullet-magic-crit', 0xe056fd, 5);

    // Launcher - orange larger rectangle 10x8
    this.createBulletTexture('bullet-launcher', 0xff6600, 10, 8);
    this.createBulletTexture('bullet-launcher-crit', 0xff9933, 12, 10);

    // Shotgun - gray small pellet 5x5
    this.createCircleBulletTexture('bullet-shotgun', 0xaaaaaa, 3);
    this.createCircleBulletTexture('bullet-shotgun-crit', 0xffff00, 4);

    // SMG - yellow small rectangle 6x3
    this.createBulletTexture('bullet-smg', 0xffcc00, 6, 3);
    this.createBulletTexture('bullet-smg-crit', 0xffff66, 7, 4);

    // Sniper - green long thin rectangle 16x2
    this.createBulletTexture('bullet-sniper', 0x00ff00, 16, 2);
    this.createBulletTexture('bullet-sniper-crit', 0x66ff66, 18, 3);

    // Flamethrower - orange/red small particles 6x6
    this.createCircleBulletTexture('bullet-flame', 0xff4400, 4);
    this.createCircleBulletTexture('bullet-flame-crit', 0xffcc00, 5);

    // Ice Gun - cyan rectangle 8x4
    this.createBulletTexture('bullet-ice', 0x00ccff, 8, 4);
    this.createBulletTexture('bullet-ice-crit', 0x99ffff, 10, 5);

    // Lightning - yellow zigzag-ish rectangle 10x3
    this.createBulletTexture('bullet-lightning', 0xffff00, 10, 3);
    this.createBulletTexture('bullet-lightning-crit', 0xffffaa, 12, 4);

    // Laser Beam - red thin rectangle 12x2
    this.createBulletTexture('bullet-laser', 0xff0000, 12, 2);
    this.createBulletTexture('bullet-laser-crit', 0xff6666, 14, 3);

    // Boomerang - green curved-ish shape 10x10
    this.createBoomerangTexture('bullet-boomerang', 0x00ff88);
    this.createBoomerangTexture('bullet-boomerang-crit', 0xaaffcc);
  }

  /**
   * Create a rectangular bullet texture
   */
  createBulletTexture(name, color, width, height) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(color, 1);
    graphics.fillRect(0, 0, width, height);
    graphics.generateTexture(name, width, height);
    graphics.destroy();
  }

  /**
   * Create a circular bullet texture
   */
  createCircleBulletTexture(name, color, radius) {
    const size = radius * 2;
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(color, 1);
    graphics.fillCircle(radius, radius, radius);
    graphics.generateTexture(name, size, size);
    graphics.destroy();
  }

  /**
   * Create a boomerang-shaped texture
   */
  createBoomerangTexture(name, color) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(color, 1);
    // Create a curved boomerang shape
    graphics.fillRect(0, 4, 10, 2);
    graphics.fillRect(8, 0, 2, 6);
    graphics.generateTexture(name, 10, 10);
    graphics.destroy();
  }

  create() {
    // Transition to the main game scene
    this.scene.start('GameScene');
  }
}
