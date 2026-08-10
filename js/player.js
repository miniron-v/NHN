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
    this.facing = 0; // 부리 방향(rad)
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

    if (speed > 20) this.facing = Math.atan2(this.vy, this.vx);
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
      ctx.strokeStyle = 'rgba(140, 185, 210, 0.5)';
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
    ctx.rotate(this.facing);
    // 몸통
    ctx.fillStyle = '#1b2a4a';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    // 배
    ctx.fillStyle = '#f5f9fc';
    ctx.beginPath(); ctx.arc(r * 0.25, 0, r * 0.55, 0, Math.PI * 2); ctx.fill();
    // 부리 (진행 방향)
    ctx.fillStyle = '#f2a33c';
    ctx.beginPath();
    ctx.moveTo(r + r * 0.5, 0);
    ctx.lineTo(r * 0.55, -r * 0.3);
    ctx.lineTo(r * 0.55, r * 0.3);
    ctx.closePath(); ctx.fill();
    // 눈
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(r * 0.45, -r * 0.45, r * 0.14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.45, r * 0.45, r * 0.14, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}
