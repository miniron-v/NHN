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
//     drawLevelUp(ctx, choices, canvas),      // 세로 카드 가로 나열, 1/2/3 키 또는 클릭
//     levelUpCardRects(choices, canvas) -> [{x, y, w, h}],  // 클릭 히트테스트용 (main이 사용)
//     drawGameOver(ctx, elapsed, player, canvas),  // R 키로 재시작
//   }
//   choices의 각 항목: {id, name, desc, apply} - id는 아이콘 식별자
//   (icicle | frostRing | orbital | heal)
//   holes.js  -> class HoleManager()
//     .check(player) -> boolean (구멍 추락 여부), .draw(ctx, player)
//     구멍은 청크 해시 기반 절차 생성 (상태 저장 없음, reset 불필요)

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
addEventListener('resize', resize);
resize();

const keys = {};
let state, player, enemyMgr, weaponMgr, holeMgr, elapsed, levelUpChoices;

function init() {
  player = new Player(0, 0);
  enemyMgr = new EnemyManager();
  weaponMgr = new WeaponManager();
  holeMgr = new HoleManager();
  enemyMgr.onDeath = (x, y, xp) => {
    for (let i = 0; i < CONFIG.gem.dropCount; i++) {
      const s = CONFIG.gem.scatter;
      weaponMgr.spawnGem(x + (Math.random() - 0.5) * s, y + (Math.random() - 0.5) * s, xp);
    }
  };
  elapsed = 0;
  levelUpChoices = null;
  state = 'playing';
}

function chooseUpgrade(i) {
  if (!levelUpChoices || !levelUpChoices[i]) return;
  levelUpChoices[i].apply();
  player.pendingLevels--;
  levelUpChoices = player.pendingLevels > 0 ? weaponMgr.getUpgradeChoices() : null;
  if (!levelUpChoices) state = 'playing';
}

addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (state === 'playing') state = 'paused';
    else if (state === 'paused') state = 'playing';
  }
  if (state === 'levelup') {
    chooseUpgrade(['Digit1', 'Digit2', 'Digit3'].indexOf(e.code));
  } else if (state === 'gameover' && e.code === 'KeyR') {
    init();
  }
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
canvas.addEventListener('click', (e) => {
  if (state !== 'levelup' || !levelUpChoices) return;
  const i = UI.levelUpCardRects(levelUpChoices, canvas)
    .findIndex((r) => e.clientX >= r.x && e.clientX <= r.x + r.w && e.clientY >= r.y && e.clientY <= r.y + r.h);
  if (i >= 0) chooseUpgrade(i);
});

function update(dt) {
  elapsed += dt;
  player.update(dt, keys);
  enemyMgr.update(dt, player, elapsed);
  weaponMgr.update(dt, player, enemyMgr.enemies);
  if (holeMgr.check(player)) { player.hp = 0; state = 'gameover'; } // 구멍 추락 즉사
  else if (player.hp <= 0) state = 'gameover';
  else if (player.pendingLevels > 0) {
    levelUpChoices = weaponMgr.getUpgradeChoices();
    state = 'levelup';
  }
}

// 설원 바닥 (카메라 변환 안에서 호출)
function drawBackground() {
  const vw = canvas.width / CONFIG.camera.zoom, vh = canvas.height / CONFIG.camera.zoom;
  ctx.fillStyle = '#dceef5';
  ctx.fillRect(player.x - vw / 2, player.y - vh / 2, vw, vh);
}

function draw() {
  ctx.save();
  // 카메라: 줌아웃 + 플레이어 화면 중앙 고정
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(CONFIG.camera.zoom, CONFIG.camera.zoom);
  ctx.translate(-player.x, -player.y);
  drawBackground();
  holeMgr.draw(ctx, player);
  weaponMgr.draw(ctx);
  enemyMgr.draw(ctx);
  player.draw(ctx);
  weaponMgr.drawPopups(ctx); // 데미지 숫자는 최상위 레이어
  ctx.restore();
  UI.drawHUD(ctx, player, elapsed, canvas);
  if (state === 'levelup') UI.drawLevelUp(ctx, levelUpChoices, canvas);
  if (state === 'paused') UI.drawPause(ctx, canvas);
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
