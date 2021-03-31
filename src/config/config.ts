import "phaser";
import MoveToPlugin from "phaser3-rex-plugins/plugins/moveto-plugin.js";

const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // Specify the underlying browser rendering engine (AUTO, CANVAS, WEBGL)
  // AUTO will attempt to use WEBGL, but if not available it'll default to CANVAS
  render: {
    pixelArt: true,
  },
  width: 900, // Game width in pixels
  height: 600,
  // width: window.innerWidth, // Game width in pixels
  // height: window.innerHeight, // Game height in pixels

  //  We will be expanding physics later
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 }, // Game objects will be pulled down along the y-axis
      // The number 1500 is arbitrary. The higher, the stronger the pull.
      // A negative value will pull game objects up along the y-axis
      debug: false, // Whether physics engine should run in debug mode
      debugShowVelocity: true,
    },
  },
  dom: {
    createContainer: true,
  },
  scene: [],
  parent: "spaceGame",
  plugins: {
    global: [
      {
        key: "rexMoveTo",
        plugin: MoveToPlugin,
        start: true,
      },
    ],
  },
};

export default gameConfig;
