import type { GameState, Vec2, Enemy, Intent } from './types';

const COLS = 8;
const ROWS = 8;

// ゲーム初期状態を生成
export function createInitialState(): GameState {
  const floor: import('./types').Tile[][] = Array.from({ length: ROWS }, (_, y) =>
    Array.from({ length: COLS }, (_, x) => {
      const isWall =
        x === 0 || x === COLS - 1 || y === 0 || y === ROWS - 1 ||
        (x === 3 && y === 2) || (x === 4 && y === 2) ||
        (x === 2 && y === 4) || (x === 5 && y === 5);
      return { kind: (isWall ? 'wall' : 'floor') as import('./types').TileKind };
    })
  );

  const stairPos: Vec2 = { x: 6, y: 6 };
  floor[stairPos.y][stairPos.x] = { kind: 'stair' as const };

  const enemies: Enemy[] = [
    makeEnemy('e1', { x: 2, y: 2 }),
    makeEnemy('e2', { x: 5, y: 2 }),
    makeEnemy('e3', { x: 3, y: 5 }),
    makeEnemy('e4', { x: 6, y: 3 }),
  ];

  return {
    floor,
    stairPos,
    player: {
      hp: 24,
      maxHp: 24,
      ap: 2,
      maxAp: 2,
      attack: 3,
      defense: 2,
      pos: { x: 1, y: 1 },
      isDefending: false,
    },
    enemies,
    phase: 'player',
    turn: 1,
    log: ['フロア1開始'],
  };
}

function makeEnemy(id: string, pos: Vec2): Enemy {
  return {
    id,
    kind: 'striker',
    hp: 6,
    maxHp: 6,
    attack: 2,
    pos,
    intent: calcIntent({ id, kind: 'striker', hp: 6, maxHp: 6, attack: 2, pos, intent: { kind: 'idle' } }, { x: 1, y: 1 }),
  };
}

// 敵のintentを計算（プレイヤー位置を参照）
function calcIntent(enemy: Enemy, playerPos: Vec2): Intent {
  const dx = playerPos.x - enemy.pos.x;
  const dy = playerPos.y - enemy.pos.y;
  const dist = Math.abs(dx) + Math.abs(dy);

  if (dist === 1) {
    return { kind: 'melee', targetPos: playerPos };
  }
  // 隣接していない場合は近づく（4方向移動: 距離が大きい軸を優先）
  const movePos: Vec2 = Math.abs(dx) >= Math.abs(dy)
    ? { x: enemy.pos.x + Math.sign(dx), y: enemy.pos.y }
    : { x: enemy.pos.x, y: enemy.pos.y + Math.sign(dy) };
  return { kind: 'melee', targetPos: movePos };
}

// 移動アクション
export function movePlayer(state: GameState, dx: number, dy: number): GameState {
  if (state.phase !== 'player' || state.player.ap <= 0) return state;

  const nx = state.player.pos.x + dx;
  const ny = state.player.pos.y + dy;

  if (!inBounds(nx, ny) || state.floor[ny][nx].kind === 'wall') return state;
  if (state.enemies.some(e => e.pos.x === nx && e.pos.y === ny)) return state;

  const newState: GameState = {
    ...state,
    player: {
      ...state.player,
      pos: { x: nx, y: ny },
      ap: state.player.ap - 1,
    },
    log: [...state.log, `プレイヤーが (${nx}, ${ny}) へ移動`],
  };

  return checkApExhausted(newState);
}

// 攻撃アクション（隣接した敵を指定して攻撃）
export function attackEnemy(state: GameState, enemyId: string): GameState {
  if (state.phase !== 'player' || state.player.ap <= 0) return state;

  const enemy = state.enemies.find(e => e.id === enemyId);
  if (!enemy) return state;

  const dist = Math.abs(enemy.pos.x - state.player.pos.x) + Math.abs(enemy.pos.y - state.player.pos.y);
  if (dist > 1) return state;

  const damage = state.player.attack;
  const newHp = enemy.hp - damage;
  const alive = newHp > 0;

  const newEnemies = alive
    ? state.enemies.map(e => e.id === enemyId ? { ...e, hp: newHp } : e)
    : state.enemies.filter(e => e.id !== enemyId);

  const logMsg = alive
    ? `${enemy.id} に ${damage} ダメージ（残HP: ${newHp}）`
    : `${enemy.id} を撃破！`;

  const newState: GameState = {
    ...state,
    enemies: newEnemies,
    player: { ...state.player, ap: state.player.ap - 1 },
    log: [...state.log, logMsg],
  };

  return checkApExhausted(newState);
}

// 防御アクション
export function defend(state: GameState): GameState {
  if (state.phase !== 'player' || state.player.ap <= 0) return state;

  const newState: GameState = {
    ...state,
    player: { ...state.player, ap: state.player.ap - 1, isDefending: true },
    log: [...state.log, '防御態勢を取った'],
  };

  return checkApExhausted(newState);
}

// ターン終了
export function endPlayerTurn(state: GameState): GameState {
  if (state.phase !== 'player') return state;
  return runEnemyPhase({ ...state, phase: 'enemy' });
}

// AP切れ時に自動で敵フェーズへ
function checkApExhausted(state: GameState): GameState {
  if (state.player.ap <= 0) return runEnemyPhase({ ...state, phase: 'enemy' });
  return state;
}

// 敵フェーズ処理
function runEnemyPhase(state: GameState): GameState {
  let s = state;

  for (const enemy of s.enemies) {
    s = processEnemyTurn(s, enemy.id);
    if (s.phase === 'gameover') return s;
  }

  // プレイヤーターンに戻す、intent更新、AP回復
  const newEnemies = s.enemies.map(e => ({
    ...e,
    intent: calcIntent(e, s.player.pos),
  }));

  return {
    ...s,
    enemies: newEnemies,
    player: { ...s.player, ap: s.player.maxAp, isDefending: false },
    phase: 'player',
    turn: s.turn + 1,
    log: [...s.log, `--- ターン ${s.turn + 1} ---`],
  };
}

function processEnemyTurn(state: GameState, enemyId: string): GameState {
  const enemy = state.enemies.find(e => e.id === enemyId);
  if (!enemy) return state;

  const intent = enemy.intent;

  if (intent.kind === 'melee' && intent.targetPos) {
    const target = intent.targetPos;
    // 攻撃対象がプレイヤーか確認
    if (target.x === state.player.pos.x && target.y === state.player.pos.y) {
      const reduction = state.player.isDefending ? state.player.defense : 0;
      const damage = Math.max(0, enemy.attack - reduction);
      const newHp = state.player.hp - damage;
      const logMsg = damage > 0
        ? `${enemy.id} の攻撃！ ${damage} ダメージ（残HP: ${Math.max(0, newHp)}）`
        : `${enemy.id} の攻撃！ 防御で防いだ`;

      if (newHp <= 0) {
        return { ...state, player: { ...state.player, hp: 0 }, phase: 'gameover', log: [...state.log, logMsg, 'ゲームオーバー'] };
      }
      return { ...state, player: { ...state.player, hp: newHp }, log: [...state.log, logMsg] };
    }

    // 移動先が空いていれば移動
    const isPlayerPos = target.x === state.player.pos.x && target.y === state.player.pos.y;
    const occupied = state.enemies.some(e => e.id !== enemyId && e.pos.x === target.x && e.pos.y === target.y);
    if (
      !isPlayerPos &&
      inBounds(target.x, target.y) &&
      state.floor[target.y][target.x].kind !== 'wall' &&
      !occupied
    ) {
      const newEnemies = state.enemies.map(e =>
        e.id === enemyId ? { ...e, pos: target } : e
      );
      return { ...state, enemies: newEnemies };
    }
  }

  return state;
}

function inBounds(x: number, y: number): boolean {
  return x >= 0 && x < COLS && y >= 0 && y < ROWS;
}
