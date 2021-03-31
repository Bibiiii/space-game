export interface PlayerData {
  playerId: string;
  rotation: number;
  team: string;
  x: number;
  y: number;
  velocity: {
    x: number;
    y: number;
  };
  speed: number;
  acceleration: {
    x: number;
    y: number;
  };
  AOI: {
    zone: number;
  };
}

export interface Player extends PlayerData {}

export interface Players {
  [key: string]: Player;
}
