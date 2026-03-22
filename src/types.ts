export type Vec2 = { x: number; y: number };

export type TileKind = 'floor' | 'wall' | 'hazard' | 'stair' | 'entrance';

export type Tile = {
  kind: TileKind;
};

export type EnemyKind = 'striker';

export type IntentKind = 'melee' | 'idle';

export type Intent = {
  kind: IntentKind;
  targetPos?: Vec2;
};

export type Enemy = {
  id: string;
  kind: EnemyKind;
  hp: number;
  maxHp: number;
  attack: number;
  pos: Vec2;
  intent: Intent;
};

export type Player = {
  hp: number;
  maxHp: number;
  ap: number;
  maxAp: number;
  attack: number;
  defense: number;
  pos: Vec2;
  isDefending: boolean;
};

export type Phase = 'player' | 'enemy' | 'gameover';

export type GameState = {
  floor: Tile[][];
  stairPos: Vec2;
  player: Player;
  enemies: Enemy[];
  phase: Phase;
  turn: number;
  log: string[];
};
