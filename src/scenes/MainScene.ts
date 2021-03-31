import "phaser";
import { MainSceneClass, OtherPlayer } from "./types/game";
import { Players, PlayerData } from "./types/player";

export default class MainScene extends MainSceneClass {
  constructor() {
    super("MainScene");
    this.state = {};
  }

  // Preload loads all the assets for the game
  preload() {
    // ships
    this.load.image("pinkShip", "assets/spritesheets/spaceship_pink.png");
    this.load.image("blueShip", "assets/spritesheets/spaceship_blue.png");

    // gems
    this.load.image("star", "assets/spritesheets/star_gold.png");
    this.load.spritesheet("gem1", "assets/spritesheets/Gem1.png", {
      frameWidth: 16,
      frameHeight: 20,
    });
    this.load.spritesheet("gem2", "assets/spritesheets/Gem2.png", {
      frameWidth: 21,
      frameHeight: 21,
    });
    this.load.spritesheet("gem3", "assets/spritesheets/Gem3.png", {
      frameWidth: 20,
      frameHeight: 20,
    });
    this.load.spritesheet("gem4", "assets/spritesheets/Gem4.png", {
      frameWidth: 15,
      frameHeight: 15,
    });

    // backgrounds
    this.load.image("starsBack", "assets/backgrounds/background_1.png");
    this.load.image("starsMid", "assets/backgrounds/background_2.png");
    this.load.image("starsFront", "assets/backgrounds/background_3.png");
    this.load.image("blueBackground", "assets/backgrounds/3b.png");

    // music and sounds
    this.load.audio("backgroundMusic", ["assets/music/loading.wav"]);
    this.load.audio("gemSound", ["assets/music/gem.wav"]);

    // gui
    this.load.image("scoreDashboard", "assets/gui/score_dashboard.png");

    this.canvas = this.sys.game.canvas;
  }

  /* set up the game, including displaying sprites,
  assets, music, and adding event listeners */
  create() {
    const scene = this;

    //CREATE SOCKET
    // @ts-ignore io created in html file
    this.socket = io();

    scene.scene.launch("WaitingRoom", { socket: scene.socket });

    //BACKGROUND
    this.cameras.main.setBackgroundColor("#20354f");
    this.add
      .tileSprite(
        0,
        0,
        scene.canvas.width,
        scene.canvas.height,
        "blueBackground"
      )
      .setOrigin(0)
      .setScale(1.2);

    // background stars that move
    this.starsBack = this.add
      .tileSprite(0, 0, scene.canvas.width, scene.canvas.height, "starsBack")
      .setOrigin(0);

    // SOUND
    const backgroundMusic = scene.sound.add("backgroundMusic", { loop: true });
    scene.gemSound = scene.sound.add("gemSound", { loop: false });

    backgroundMusic.play();

    // GUI
    scene.add
      .image(0, scene.canvas.height - 100, "scoreDashboard")
      .setOrigin(0);

    // ANIMATIONS
    this.anims.create({
      key: "gem1Sparkle",
      frames: this.anims.generateFrameNumbers("gem1", {
        frames: [0, 1, 2, 3, 0],
      }),
      frameRate: 16,
      repeat: -1,
      repeatDelay: 2000,
    });

    this.anims.create({
      key: "gem2Sparkle",
      frames: this.anims.generateFrameNumbers("gem2", {
        frames: [0, 1, 2, 3, 0],
      }),
      frameRate: 16,
      repeat: -1,
      repeatDelay: 2000,
    });

    this.anims.create({
      key: "gem3Sparkle",
      frames: this.anims.generateFrameNumbers("gem3", {
        frames: [0, 1, 2, 3, 0],
      }),
      frameRate: 16,
      repeat: -1,
      repeatDelay: 2000,
    });

    this.anims.create({
      key: "gem4Sparkle",
      frames: this.anims.generateFrameNumbers("gem4", {
        frames: [0, 1, 2, 3, 0],
      }),
      frameRate: 16,
      repeat: -1,
      repeatDelay: 2000,
    });

    // LOAD TEXT
    this.roomKeyText = this.add.text(370, scene.canvas.height - 245, "", {
      fontSize: "32px",
      color: "#EAA1EA",
      fontFamily: "SpaceMadness",
    }); // for displaying the room key at the bottom of the screen

    this.warningText = this.add
      .text(200, 0, "", {
        fontSize: "40px",
        color: "#FF0000",
        fontFamily: "SpaceMadness",
      })
      .setOrigin(0, 0); // warning text for cheating or other warnings

    // CREATE OTHER PLAYERS GROUP
    this.otherPlayers = this.physics.add.group();

    this.cursors = this.input.keyboard.createCursorKeys(); // create controls

    // Text
    this.blueScoreText = this.add.text(120, scene.canvas.height - 320, "", {
      fontSize: "40px",
      color: "#FFFFFF",
      fontFamily: "SpaceMadness",
    });
    this.redScoreText = this.add.text(650, scene.canvas.height - 320, "", {
      fontSize: "40px",
      color: "#FFFFFF",
      fontFamily: "SpaceMadness",
    });

    // JOINED ROOM - SET STATE
    this.socket.on("setState", function (state) {
      // once player joins room, set state
      const { roomKey, players, numPlayers } = state;
      scene.physics.resume();

      // STATE
      scene.state.roomKey = roomKey;
      scene.state.players = players;
      scene.state.numPlayers = numPlayers;

      scene.roomKeyText.setText("Room: " + roomKey); // set room key at bottom of screen
    });

    // PLAYERS
    /* triggered at start of game, for initialising player details and adding them to scene */
    this.socket.on("currentPlayers", function (players: Players) {
      Object.keys(players).forEach(function (id) {
        if (players[id].playerId === scene.socket.id) {
          // add current player
          scene.addPlayer(players[id]);
        } else {
          scene.addOtherPlayers(players[id]); // add enemies
        }
      });
    });

    /* triggered when a new player joins game
    (for larger than 2 player games - not set up yet) */
    this.socket.on("newPlayer", function (playerData: PlayerData) {
      console.log("new player connected");
      scene.addOtherPlayers(playerData);
    });

    /* triggered whenever a player disconnects
      stops any animations and destroys the disconnected player */
    this.socket.on("disconnected", function (playerId: string) {
      console.log("disconnected", playerId);
      scene.otherPlayers
        .getChildren()
        .forEach(function (otherPlayer: OtherPlayer) {
          if (playerId === otherPlayer.playerId) {
            console.log(playerId, otherPlayer.playerId);
            if (scene.opTween) {
              scene.opTween.stop();
              scene.opTween.remove();
            }
            otherPlayer.destroy();
          }
        });
    });

    /* triggered whenever another player moves
      handles animation, dead-reckoning and frame-rate matching */
    this.socket.on("playerMoved", function (playerData: PlayerData) {
      scene.otherPlayers
        .getChildren()
        .forEach(function (otherPlayer: OtherPlayer) {
          if (playerData.playerId === otherPlayer.playerId) {
            console.log(playerData, playerData.AOI?.zone, scene.ship.AOI?.zone);
            if (
              playerData.AOI?.zone &&
              playerData.AOI?.zone === scene.ship.AOI?.zone // if other player is in same area of interest as current player
            ) {
              // get absolute distances traveled
              otherPlayer.setVisible(true);
              const distanceX = Math.pow(
                Math.abs(playerData.x - otherPlayer.body.x),
                2
              );
              const distanceY = Math.pow(
                Math.abs(playerData.y - otherPlayer.body.y),
                2
              );
              const totDist = Math.sqrt(distanceX + distanceY); // total distance traveled

              // calculate animation duration based on distanced traveled, speed of travel and latency
              const duration = Math.ceil(
                Math.max(
                  200, // duration should be no quicker than 200ms to prevent skipping
                  totDist / (playerData.speed || 1) - scene.state.latency / 1000
                )
              );

              // add animation tween to compensate for network delay and smooth movement (should look like same FPS)
              scene.opTween = scene.tweens.add({
                targets: otherPlayer,
                x: playerData.x,
                y: playerData.y,
                rotation: playerData.rotation,
                duration: duration,
              });

              setTimeout(() => {
                // backup for when animation doesn't work
                if (!otherPlayer.x || !otherPlayer.y || !otherPlayer.rotation) {
                  otherPlayer.setRotation(playerData.rotation); // without smoothing
                  otherPlayer.setPosition(playerData.x, playerData.y); // without smoothing
                }
              }, duration);
            } else {
              // if player is in a different area of interest
              scene.opTween?.remove();
              otherPlayer.setVisible(false);
            }
          }
        });
    });

    /* triggered whenever a score changes
      sets the score text on GUI */
    this.socket.on("scoreUpdate", function (scores) {
      scene.blueScoreText.setText("Blue: " + scores.blue);
      scene.redScoreText.setText("Red: " + scores.red);
    });

    /* triggered at evenly spaced intervals (CLIENT_UPDATE_RATE)
      to get player latency */
    this.socket.on("update", function (data) {
      setTimeout(() => {
        scene.socket.emit("ponq", data.stamp); // send back a pong stamp to compute latency
      }, Math.floor(Math.random() * 6500)); // artificial network delay
      if (data.latency) scene.state.latency = data.latency;
    });

    /* if room doesn't exist for some reason, kick players to waiting room */
    this.socket.on("noRoom", function () {
      scene.scene.launch("WaitingRoom", { socket: scene.socket });
    });

    /* triggered when a new gem is spawned
      renders gem at given location */
    this.socket.on("gemLocation", function (gemLocation) {
      if (scene.gem) scene.gem.destroy(); // if there is already a gem on the scene, remove it

      const randomGem = `gem` + Math.floor(Math.random() * 4 + 1); // use one of the 4 gem sprites at random
      scene.gem = scene.physics.add
        .sprite(gemLocation.x, gemLocation.y, randomGem)
        .setScale(2);
      scene.gem.play(randomGem + `Sparkle`); // play gem animation

      if (scene.ship) {
        // collect gem when ship overlaps with it
        scene.physics.add.overlap(
          scene.ship,
          scene.gem,
          function () {
            this.socket.emit("gemCollected", { roomKey: scene.state.roomKey });
            scene.gemSound.play();
            if (scene.gem) scene.gem.destroy(); // gem location handled on server side, but hide for client to avoid delay
          },
          null,
          scene
        );
      }

      if (scene.otherPlayers?.getChildren()) {
        // if another player overlaps gem, hide it but do not send event
        scene.physics.add.overlap(
          scene.otherPlayers.getChildren(),
          scene.gem,
          function () {
            if (scene.gem) scene.gem.destroy(); // hide but do not emit collection message
          },
          null,
          scene
        );
      }
    });

    /* triggered when a warning is sent from server
      e.g. 'cheating' */
    this.socket.on("warning", function (message: string) {
      scene.warningText.setText(message);

      setTimeout(() => {
        scene.warningText.setText("");
      }, 2000); // remove message after 2 seconds
    });
  }

  /* add player to game (current player only) */
  addPlayer(playerData: PlayerData) {
    const scene = this;
    const isBlue = playerData.team === "blue";

    scene.ship = scene.physics.add
      .image(playerData.x, playerData.y, isBlue ? "blueShip" : "pinkShip")
      .setOrigin(0.5, 0.5)
      .setDisplaySize(53, 40);

    // set player physics
    scene.ship.setDrag(100);
    scene.ship.setAngularDrag(100);
    scene.ship.setMaxVelocity(200);
    scene.ship.AOI = {
      zone: playerData.AOI.zone,
    }; // area of interest (AOI)
    scene.ship.team = playerData.team;
  }

  /* add other player to game (enemy player only) */
  addOtherPlayers(playerData: PlayerData) {
    const scene = this;
    const isBlue = playerData.team === "blue";
    const otherPlayer: OtherPlayer = scene.physics.add
      .sprite(playerData.x, playerData.y, isBlue ? "blueShip" : "pinkShip")
      .setOrigin(0.5, 0.5)
      .setDisplaySize(53, 40);
    otherPlayer.playerId = playerData.playerId;
    otherPlayer.AOI = {
      zone: playerData.AOI.zone,
    };
    scene.otherPlayers.add(otherPlayer);
  }

  /* handles events that happen on game update. Update events are fired almost constantly,
    so only put functions here if necessary (to avoid performance issues) */
  update() {
    this.starsBack.setTilePosition(
      undefined,
      this.starsBack.tilePositionY - 0.2
    ); // background stars animation

    if (this.ship) {
      // listen for keyboard events to move ship
      const { team } = this.ship;
      if (this.cursors.left.isDown) {
        this.ship.setAngularVelocity(-150); // rotate left
      } else if (this.cursors.right.isDown) {
        this.ship.setAngularVelocity(150); // rotate right
      } else {
        this.ship.setAngularVelocity(0);
      }

      if (this.cursors.up.isDown) {
        this.physics.velocityFromRotation(
          this.ship.rotation + 1.5,
          team === "red" ? 200 : 100,
          this.ship.body.acceleration // move ship based on its rotation
        );
      } else {
        this.ship.setAcceleration(0);
      }

      // allow players to exit and enter at opposite side
      this.physics.world.wrap(this.ship, 5); 
      this.otherPlayers?.getChildren().forEach((player) => {
        this.physics.world.wrap(player, 5);
      });

      // emit player movement
      const x = this.ship.x;
      const y = this.ship.y;
      const r = this.ship.rotation;

      if (
        this.ship.oldPosition &&
        (x !== this.ship.oldPosition.x ||
          y !== this.ship.oldPosition.y ||
          r !== this.ship.oldPosition.rotation)
      ) {
        this.socket.emit("playerMovement", {
          x: this.ship.x,
          y: this.ship.y,
          rotation: this.ship.rotation,
          velocity: this.ship.body.velocity,
          acceleration: this.ship.body.acceleration,
          speed: this.ship.body.speed,
          roomKey: this.state.roomKey,
        }); // send all relevant data to server
        
      }
      // save old position data
      this.ship.oldPosition = {
        x: this.ship.x,
        y: this.ship.y,
        rotation: this.ship.rotation,
        velocity: this.ship.body.velocity,
      };
    }
  }
}
