import "phaser";
import constants from "../config/constants";
import { InitData, WaitingRoomClass } from "./types/game";

export default class WaitingRoom extends WaitingRoomClass {
  constructor() {
    super("WaitingRoom");
    this.state = {};
  }

  /* initialise game data */
  init(data: InitData) {
    this.socket = data.socket;
  }

  /* preload assets for game */
  preload() {
    this.load.html("codeform", "assets/text/codeform.html"); // room code form
    this.load.image("newGame", "assets/gui/new_game.png"); // new game button
    this.load.image("background", "assets/backgrounds/3b.png"); // background
    this.load.spritesheet("loadingGem", "assets/spritesheets/Gem1.png", {
      frameWidth: 16,
      frameHeight: 20,
    }); // loading animation
  }

  /* set up game screen */
  create() {
    const scene = this;

    // add static elements, images, text and form
    this.add
      .tileSprite(0, 0, 900, 600, "background")
      .setOrigin(0)
      .setScale(1.2); // background
    scene.requestButton = scene.add.image(130, 230, "newGame").setOrigin(0); // new game button
    scene.roomCodeInput = scene.add.dom(565, 250).createFromCache("codeform"); // room code form

    scene.notValidText = scene.add.text(500, 100, "", {
      color: "#EEA01F",
      fontSize: "15px",
    }); // invalid room code text
    scene.roomKeyText = scene.add.text(210, 250, "", {
      backgroundColor: "#00ff00",
      fontSize: "20px",
    }); // room code text

    // ANIMATIONS
    this.anims.create({
      key: "loadingGemSparkle",
      frames: this.anims.generateFrameNumbers("loadingGem", {
        frames: [0, 1, 2, 3, 0],
      }),
      frameRate: 16,
      repeat: -1,
      repeatDelay: 2000,
    });


    // EVENTS
    scene.roomCodeInput.addListener("click"); // listen for clicks on code input form

    scene.roomCodeInput.on("click", function (event) {
      if (event.target.name === "enterRoom") {
        const input = scene.roomCodeInput.getChildByName("code-form");

        scene.socket.emit("isKeyValid", input.value);
      }
    }); // if user submits a room code, check if it is valid

    scene.requestButton.setInteractive();
    scene.requestButton.on("pointerdown", () => {
      scene.socket.emit("getRoomCode");
    }); // if user clicks 'new game' button, trigger a new room code

    /* triggered when a new room is created by a user clicking 'new game' 
        puts user in waiting room until another player joins */
    scene.socket.on("roomCreated", function (roomKey) {
      scene.roomKey = roomKey;
      scene.socket.emit("joinRoom", roomKey);
      scene.waitForPlayers();
    });

    /* triggered when a user enters an invalid key
      can be due to too many players (max 2) or wrong code
    */
    scene.socket.on("keyNotValid", function (code) {
      switch (code) {
        case constants.TOO_MANY_PLAYERS:
          scene.notValidText.setText("Too many players");
          break;
        case constants.INVALID_CODE:
        default:
          scene.notValidText.setText("Invalid Room Key");
      }
    });

    /* triggered when waiting room contains 2 players
        starts the game
    */
    scene.socket.on("gameReady", function (data) {
      scene.socket.emit("startGame", scene.roomKey);
      scene.scene.stop("WaitingRoom");
    });

    /* triggered when user enters a valid key - they will enter waiting room
     */
    scene.socket.on("keyIsValid", function (roomKey) {
      scene.roomKey = roomKey;
      scene.notValidText.setText("");
      scene.socket.emit("joinRoom", roomKey);
      scene.waitForPlayers();
    });
  }

  /* 'Waiting Room' - players are put here while they wait for another player to join */
  waitForPlayers() {
    // hide all buttons and text
    this.roomCodeInput.destroy(); 
    this.requestButton.destroy();
    this.notValidText.setText("");

    this.add
      .text(230, -120, "ROOM KEY: " + this.roomKey, {
        fontSize: "65px",
        fontStyle: "bold",
        color: "#eaa1ea",
        fontFamily: "SpaceMadness",
      })
      .setOrigin(0); // show room key on screen

    this.add.text(280, 220, "Waiting for another player...", {
      fontSize: "20px",
      fontStyle: "bold",
      color: "#ffffff",
    });

    this.loadingGem = this.physics.add
      .sprite(450, 180, "loadingGem")
      .setScale(5);
    this.loadingGem.play(`loadingGemSparkle`); // loading animation :)
  }
  update() {}
}
