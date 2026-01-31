import Phaser from 'phaser';
import Player from '../entities/Player.js';
import WeaponSystem from '../systems/WeaponSystem.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    // Create ground at the bottom of the screen
    // Ground is 32px tall, positioned so its top edge is at y=568 (600-32)
    this.ground = this.physics.add.staticImage(400, 584, 'ground');

    // Create a platform above the ground
    // Positioned in the upper-middle area of the screen
    this.platform = this.physics.add.staticImage(400, 400, 'platform');

    // Create player standing on the ground
    // Player is 48px tall, so to stand on ground (top at y=568),
    // player center should be at y = 568 - 24 = 544
    this.player = new Player(this, 100, 500);

    // Set up collisions
    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.player, this.platform);

    // Create weapon system
    this.weaponSystem = new WeaponSystem(this, this.player);
  }

  update() {
    // Update player each frame to handle input
    this.player.update();

    // Update weapon system for input handling
    this.weaponSystem.update();
  }
}
