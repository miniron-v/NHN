// Glacier Survivors - 플레이어 (빙판 관성 이동)
class Player {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.radius = CONFIG.player.radius;
    this.maxHp = CONFIG.player.maxHp;
    this.hp = this.maxHp;
    this.level = 1;
    this.xp = 0;
    this.xpNeeded = CONFIG.player.xpBase;
    this.pendingLevels = 0;
    this.invuln = 0;
    this.facing = 1; // 바라보는 좌우 방향 (1=오른쪽, -1=왼쪽)
  }

  update(dt, keys) {
    let dx = (keys['KeyD'] || keys['ArrowRight'] ? 1 : 0) - (keys['KeyA'] || keys['ArrowLeft'] ? 1 : 0);
    let dy = (keys['KeyS'] || keys['ArrowDown'] ? 1 : 0) - (keys['KeyW'] || keys['ArrowUp'] ? 1 : 0);
    if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
    this.vx += dx * CONFIG.player.accel * dt;
    this.vy += dy * CONFIG.player.accel * dt;

    // 프레임레이트 독립 지수 감쇠 마찰
    const f = Math.pow(CONFIG.player.friction, dt);
    this.vx *= f; this.vy *= f;

    const speed = Math.hypot(this.vx, this.vy);
    if (speed > CONFIG.player.maxSpeed) {
      const s = CONFIG.player.maxSpeed / speed;
      this.vx *= s; this.vy *= s;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (Math.abs(this.vx) > 20) this.facing = Math.sign(this.vx);
    if (this.invuln > 0) this.invuln -= dt;
  }

  takeDamage(n) {
    if (this.invuln > 0) return;
    this.hp -= n;
    this.invuln = CONFIG.player.invulnTime;
  }

  gainXP(n) {
    this.xp += n;
    while (this.xp >= this.xpNeeded) {
      this.xp -= this.xpNeeded;
      this.level++;
      this.xpNeeded = CONFIG.player.xpBase + CONFIG.player.xpGrowth * (this.level - 1);
      this.pendingLevels++;
    }
  }

  draw(ctx) {
    const r = this.radius;
    const speed = Math.hypot(this.vx, this.vy);

    // 미끄럼 자국: 속도 방향 반대로 짧은 선
    if (speed > 120) {
      const ux = this.vx / speed, uy = this.vy / speed;
      ctx.strokeStyle = 'rgba(240, 252, 255, 0.65)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (const side of [-1, 1]) {
        const ox = -uy * side * r * 0.5, oy = ux * side * r * 0.5;
        ctx.moveTo(this.x + ox - ux * r, this.y + oy - uy * r);
        ctx.lineTo(this.x + ox - ux * (r + speed * 0.12), this.y + oy - uy * (r + speed * 0.12));
      }
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.invuln > 0 && Math.floor(this.invuln * 10) % 2 === 0) ctx.globalAlpha = 0.35;
    ctx.rotate(this.vx * 0.0005); // 이동 방향으로 살짝 기울기
    ctx.scale(this.facing, 1);    // 좌우 반전 (기본: 오른쪽)
    // 발 (주황)
    ctx.fillStyle = '#f2a33c';
    ctx.beginPath(); ctx.ellipse(-r * 0.35, r * 1.05, r * 0.38, r * 0.16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(r * 0.4, r * 1.05, r * 0.38, r * 0.16, 0, 0, Math.PI * 2); ctx.fill();
    // 몸통 (세로로 통통한 타원, 진남색)
    ctx.fillStyle = '#1b2a4a';
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.85, r * 1.1, 0, 0, Math.PI * 2); ctx.fill();
    // 흰 배 (앞쪽으로 치우친 타원)
    ctx.fillStyle = '#f5f9fc';
    ctx.beginPath(); ctx.ellipse(r * 0.2, r * 0.25, r * 0.5, r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
    // 날개(플리퍼): 몸 옆에 늘어진 타원
    ctx.fillStyle = '#142038';
    ctx.beginPath(); ctx.ellipse(-r * 0.55, r * 0.15, r * 0.28, r * 0.6, -0.25, 0, Math.PI * 2); ctx.fill();
    // 부리: 옆으로 뾰족 (주황)
    ctx.fillStyle = '#f2a33c';
    ctx.beginPath();
    ctx.moveTo(r * 1.35, -r * 0.45);
    ctx.lineTo(r * 0.55, -r * 0.65);
    ctx.lineTo(r * 0.55, -r * 0.25);
    ctx.closePath(); ctx.fill();
    // 눈
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(r * 0.4, -r * 0.65, r * 0.13, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}
