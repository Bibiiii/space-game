import { Vector } from "matter";

// Please note that Phaser's Typing has a lot of issues so some types are 'ignored' even though they are correct

export interface Avatar
  extends Phaser.Types.Physics.Arcade.ImageWithDynamicBody {
  playerId?: string;
}

export interface OtherPlayer
  extends Phaser.Types.Physics.Arcade.SpriteWithDynamicBody {
  playerId?: string;
  AOI?: {
    zone: number;
  };
}

export interface PlayerAvatar extends Avatar {
  oldPosition?: {
    x: number;
    y: number;
    rotation: number;
    velocity: Vector;
  };
  AOI?: {
    zone: number;
  };
  team?: string;
}

export class MainSceneClass extends Phaser.Scene {
  state: {
    roomKey?: string;
    players?: {};
    numPlayers?: number;
    latency?: number;
  };
  socket: any; // @ts-ignore
  ship: PlayerAvatar; // @ts-ignore
  otherPlayers: Phaser.Types.GameObjects.Group; // @ts-ignore
  gem: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  // @ts-ignore
  cursors: Phaser.Types.Input.Keyboard;

  moving: boolean; // @ts-ignore
  blueScoreText: Phaser.Types.GameObjects.Text; // @ts-ignore
  redScoreText: Phaser.Types.GameObjects.Text; // @ts-ignore
  roomKeyText: Phaser.Types.GameObjects.Text; // @ts-ignore
  warningText: Phaser.Types.GameObjects.Text;
  // gem: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  canvas: HTMLCanvasElement; // @ts-ignore
  starsBack: Phaser.Types.GameObjects.TileSprite; // @ts-ignore
  starsFront: Phaser.Types.GameObjects.TileSprite; // @ts-ignore
  gemSound: Phaser.Types.Sound; // @ts-ignore
  opTween: Phaser.Types.Tweens.Tween;
}
// @ts-ignore
export interface Sprite extends Phaser.Types.Physics.Arcade.Sprite {
  setTint: (number) => any;
  playerId?: string;
}

export class WaitingRoomClass extends Phaser.Scene {
  state: {};
  hasBeenSet: boolean;
  socket: any; // @ts-ignore
  popUp: Phaser.Types.GameObjects.Graphics; // @ts-ignore
  boxes: Phaser.Types.GameObjects.Graphics; // @ts-ignore
  title: Phaser.Types.GameObjects.Text; // @ts-ignore
  requestButton: Phaser.Types.GameObjects.Text; // @ts-ignore
  roomCodeInput: Phaser.Types.GameObjects.DOMElement; // @ts-ignore
  waitingText: Phaser.Types.GameObjects.Text; // @ts-ignore
  notValidText: Phaser.Types.GameObjects.Text;
  roomKey: string; // @ts-ignore
  roomKeyText: Phaser.Types.GameObjects.Text;
  loadingGem: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  canvas: HTMLCanvasElement;
}

export interface InitData {
  socket: string;
}
