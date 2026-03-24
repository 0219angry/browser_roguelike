import { createInitialState, movePlayer, attackEnemy, defend, endPlayerTurn } from './game';
import { render } from './renderer';
import type { GameState } from './types';

let state: GameState = createInitialState();

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const apDisplay = document.getElementById('ap') as HTMLElement;
const hpDisplay = document.getElementById('hp') as HTMLElement;
const turnDisplay = document.getElementById('turn') as HTMLElement;
const phaseDisplay = document.getElementById('phase') as HTMLElement;
const logEl = document.getElementById('log') as HTMLElement;
const endTurnBtn = document.getElementById('end-turn') as HTMLButtonElement;

function update(): void {
  render(canvas, state);

  apDisplay.textContent = `AP: ${state.player.ap} / ${state.player.maxAp}`;
  hpDisplay.textContent = `HP: ${state.player.hp} / ${state.player.maxHp}`;
  turnDisplay.textContent = `ターン: ${state.turn}`;
  phaseDisplay.textContent = state.phase === 'player' ? 'あなたのターン' : state.phase === 'gameover' ? 'ゲームオーバー' : '敵のターン';

  logEl.innerHTML = [...state.log].reverse().slice(0, 8).map(l => `<div>${l}</div>`).join('');

  endTurnBtn.disabled = state.phase !== 'player';

  // 隣接敵ボタンを更新
  updateAttackButtons();
}

function updateAttackButtons(): void {
  const container = document.getElementById('attack-buttons')!;
  container.innerHTML = '';

  if (state.phase !== 'player') return;

  for (const enemy of state.enemies) {
    const dist = Math.abs(enemy.pos.x - state.player.pos.x) + Math.abs(enemy.pos.y - state.player.pos.y);
    if (dist === 1) {
      const btn = document.createElement('button');
      btn.textContent = `攻撃: ${enemy.id} (HP:${enemy.hp})`;
      btn.onclick = () => {
        state = attackEnemy(state, enemy.id);
        update();
      };
      container.appendChild(btn);
    }
  }
}

// キーボード操作
window.addEventListener('keydown', (e) => {
  if (state.phase !== 'player') return;

  switch (e.key) {
    case 'ArrowUp':    case 'w': state = movePlayer(state, 0, -1); break;
    case 'ArrowDown':  case 's': state = movePlayer(state, 0, 1); break;
    case 'ArrowLeft':  case 'a': state = movePlayer(state, -1, 0); break;
    case 'ArrowRight': case 'd': state = movePlayer(state, 1, 0); break;
    case ' ': state = defend(state); break;
    case 'Enter': state = endPlayerTurn(state); break;
    default: return;
  }
  e.preventDefault();
  update();
});

// クリックで攻撃（隣接敵）
canvas.addEventListener('click', (e) => {
  if (state.phase !== 'player') return;

  const rect = canvas.getBoundingClientRect();
  const tileSize = canvas.width / state.floor[0].length;
  const gx = Math.floor((e.clientX - rect.left) / tileSize);
  const gy = Math.floor((e.clientY - rect.top) / tileSize);

  const enemy = state.enemies.find(en => en.pos.x === gx && en.pos.y === gy);
  if (enemy) {
    state = attackEnemy(state, enemy.id);
    update();
  }
});

endTurnBtn.addEventListener('click', () => {
  state = endPlayerTurn(state);
  update();
});

document.getElementById('defend-btn')!.addEventListener('click', () => {
  state = defend(state);
  update();
});

document.getElementById('restart-btn')!.addEventListener('click', () => {
  state = createInitialState();
  update();
});

// 初回描画
update();
