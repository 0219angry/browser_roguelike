import type { GameState, Vec2 } from './types';

const TILE_SIZE = 64;

export function render(canvas: HTMLCanvasElement, state: GameState): void {
  const ctx = canvas.getContext('2d')!;
  const rows = state.floor.length;
  const cols = state.floor[0].length;

  canvas.width = cols * TILE_SIZE;
  canvas.height = rows * TILE_SIZE;

  // タイル描画
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const tile = state.floor[y][x];
      ctx.fillStyle = tileColor(tile.kind);
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = '#333';
      ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }

  // 敵のintent範囲をハイライト
  for (const enemy of state.enemies) {
    const intent = enemy.intent;
    if (intent.kind === 'melee' && intent.targetPos) {
      ctx.fillStyle = 'rgba(255, 80, 80, 0.25)';
      ctx.fillRect(
        intent.targetPos.x * TILE_SIZE,
        intent.targetPos.y * TILE_SIZE,
        TILE_SIZE, TILE_SIZE
      );
    }
  }

  // 敵描画
  for (const enemy of state.enemies) {
    drawUnit(ctx, enemy.pos, '#e74c3c', enemy.hp, enemy.maxHp, enemy.intent.kind === 'melee' ? '⚔' : '○');
  }

  // プレイヤー描画
  drawUnit(ctx, state.player.pos, state.player.isDefending ? '#3498db' : '#2ecc71', state.player.hp, state.player.maxHp, '★');
}

function drawUnit(ctx: CanvasRenderingContext2D, pos: Vec2, color: string, hp: number, maxHp: number, icon: string): void {
  const cx = pos.x * TILE_SIZE + TILE_SIZE / 2;
  const cy = pos.y * TILE_SIZE + TILE_SIZE / 2;
  const r = TILE_SIZE * 0.35;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = `${TILE_SIZE * 0.3}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon, cx, cy);

  // HPバー
  const barW = TILE_SIZE - 8;
  const barH = 5;
  const barX = pos.x * TILE_SIZE + 4;
  const barY = pos.y * TILE_SIZE + TILE_SIZE - 10;
  ctx.fillStyle = '#555';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = '#2ecc71';
  ctx.fillRect(barX, barY, barW * (hp / maxHp), barH);
}

function tileColor(kind: string): string {
  switch (kind) {
    case 'wall': return '#555';
    case 'hazard': return '#c0392b';
    case 'stair': return '#f39c12';
    default: return '#1a1a2e';
  }
}
