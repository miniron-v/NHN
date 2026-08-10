// Glacier Survivors - 게임 루프 / 상태 머신 / 모듈 배선 (팀장 소유)
//
// 모듈 계약 (각 파일이 전역으로 제공해야 하는 것):
//   player.js  -> class Player(x, y)
//     .update(dt, keys), .draw(ctx)
//     .x .y .vx .vy .radius .hp .maxHp .level .xp .xpNeeded .pendingLevels
//     .takeDamage(n), .gainXP(n)
//   enemies.js -> class EnemyManager()
//     .update(dt, player, elapsed), .draw(ctx)
//     .enemies: [{x, y, radius, hp, damage, xp, ...}]
//     .onDeath = (x, y, xp) => {}   // 사망 시 콜백 (main이 배선)
//     .reset()
//   weapons.js -> class WeaponManager()
//     .update(dt, player, enemies), .draw(ctx)
//     .spawnGem(x, y, xp)
//     .getUpgradeChoices() -> [{name, desc, apply}] 3개
//     .reset()
//   ui.js      -> const UI = {
//     drawHUD(ctx, player, elapsed, canvas),
//     drawLevelUp(ctx, choices, canvas),      // 1/2/3 키로 선택
//     drawGameOver(ctx, elapsed, player, canvas),  // R 키로 재시작
//   }

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
addEventListener('resize', resize);
resize();

const keys = {};
let state, player, enemyMgr, weaponMgr, elapsed, levelUpChoices;

function init() {
  player = new Player(0, 0);
  enemyMgr = new EnemyManager();
  weaponMgr = new WeaponManager();
  enemyMgr.onDeath = (x, y, xp) => weaponMgr.spawnGem(x, y, xp);
  elapsed = 0;
  levelUpChoices = null;
  state = 'playing';
}

addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (state === 'levelup' && levelUpChoices) {
    const i = ['Digit1', 'Digit2', 'Digit3'].indexOf(e.code);
    if (i >= 0 && levelUpChoices[i]) {
      levelUpChoices[i].apply();
      player.pendingLevels--;
      levelUpChoices = player.pendingLevels > 0 ? weaponMgr.getUpgradeChoices() : null;
      if (!levelUpChoices) state = 'playing';
    }
  } else if (state === 'gameover' && e.code === 'KeyR') {
    init();
  }
});
addEventListener('keyup', (e) => { keys[e.code] = false; });

function update(dt) {
  elapsed += dt;
  player.update(dt, keys);
  enemyMgr.update(dt, player, elapsed);
  weaponMgr.update(dt, player, enemyMgr.enemies);
  if (player.hp <= 0) state = 'gameover';
  else if (player.pendingLevels > 0) {
    levelUpChoices = weaponMgr.getUpgradeChoices();
    state = 'levelup';
  }
}

// 설원 바닥: 은은한 격자 + 반점으로 이동감 제공
function drawBackground() {
  ctx.fillStyle = '#dceef5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const grid = 90;
  const ox = -player.x % grid, oy = -player.y % grid;
  ctx.strokeStyle = 'rgba(160, 200, 220, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = ox; x < canvas.width + grid; x += grid) {
    ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
  }
  for (let y = oy; y < canvas.height + grid; y += grid) {
    ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
  }
  ctx.stroke();
}

function draw() {
  drawBackground();
  ctx.save();
  // 카메라: 플레이어를 화면 중앙에 고정
  ctx.translate(canvas.width / 2 - player.x, canvas.height / 2 - player.y);
  weaponMgr.draw(ctx);
  enemyMgr.draw(ctx);
  player.draw(ctx);
  ctx.restore();
  UI.drawHUD(ctx, player, elapsed, canvas);
  if (state === 'levelup') UI.drawLevelUp(ctx, levelUpChoices, canvas);
  if (state === 'gameover') UI.drawGameOver(ctx, elapsed, player, canvas);
}

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (state === 'playing') update(dt);
  draw();
  requestAnimationFrame(loop);
}
init();
requestAnimationFrame(loop);
