import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Create placeholder textures programmatically
    this.createPlaceholderTextures();
  }

  createPlaceholderTextures() {
    // Player placeholder - blue rectangle 32x48
    const playerGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    playerGraphics.fillStyle(0x4488ff, 1);
    playerGraphics.fillRect(0, 0, 32, 48);
    playerGraphics.generateTexture('player', 32, 48);
    playerGraphics.destroy();

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

    // Bullet placeholder - white rectangle 8x4 (for Task 3)
    const bulletGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    bulletGraphics.fillStyle(0xffffff, 1);
    bulletGraphics.fillRect(0, 0, 8, 4);
    bulletGraphics.generateTexture('bullet', 8, 4);
    bulletGraphics.destroy();

    // Crit bullet placeholder - yellow rectangle 10x5 (for Task 3)
    const critBulletGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    critBulletGraphics.fillStyle(0xffff00, 1);
    critBulletGraphics.fillRect(0, 0, 10, 5);
    critBulletGraphics.generateTexture('bullet-crit', 10, 5);
    critBulletGraphics.destroy();

    // Enemy grunt placeholder - red rectangle 32x48 (for Task 4)
    const gruntGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    gruntGraphics.fillStyle(0xff4444, 1);
    gruntGraphics.fillRect(0, 0, 32, 48);
    gruntGraphics.generateTexture('enemy-grunt', 32, 48);
    gruntGraphics.destroy();
  }

  create() {
    // Transition to the main game scene
    this.scene.start('GameScene');
  }
}
