import Phaser from 'phaser';

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
    this.player = this.physics.add.sprite(100, 500, 'player');
    this.player.setCollideWorldBounds(true);

    // Set up collisions
    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.player, this.platform);
  }
}
