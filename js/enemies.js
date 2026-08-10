// Glacier Survivors - 적 스폰/이동/접촉 데미지/사망 처리
class EnemyManager {
  constructor() { this.reset(); }

  reset() {
    this.enemies = [];
    this.spawnTimer = 0;
    this.bossTimer = 0;
    this.onDeath = null;
  }

  // 경과 시간에 따른 적 종류 선택 (가중치: 약한 쪽이 더 자주)
  pickType(elapsed) {
    let pool;
    if (elapsed < 60) pool = [['wisp', 1]];
    else if (elapsed < 150) pool = [['wisp', 3], ['snowman', 2]];
    else pool = [['wisp', 5], ['snowman', 3], ['golem', 2]];
    let r = Math.random() * pool.reduce((s, p) => s + p[1], 0);
    for (const [name, w] of pool) if ((r -= w) < 0) return name;
    return pool[0][0];
  }

  spawn(player, elapsed) {
    const C = CONFIG.enemies;
    const name = this.pickType(elapsed);
    const t = C.types[name];
    const dist = Math.hypot(innerWidth, innerHeight) / 2 / CONFIG.camera.zoom + C.spawnDist;
    const a = Math.random() * Math.PI * 2;
    this.enemies.push({
      x: player.x + Math.cos(a) * dist,
      y: player.y + Math.sin(a) * dist,
      radius: t.radius,
      hp: t.hp * (1 + elapsed * C.hpRampRate),
      speed: t.speed,
      damage: t.damage,
      xp: t.xp,
      color: t.color,
      type: name,
    });
  }

  // 보스 스폰: 일반 적과 같은 화면 밖 랜덤 각도 위치, maxCount 무시
  spawnBoss(player, elapsed) {
    const C = CONFIG.enemies;
    const b = C.boss;
    const dist = Math.hypot(innerWidth, innerHeight) / 2 / CONFIG.camera.zoom + C.spawnDist;
    const a = Math.random() * Math.PI * 2;
    this.enemies.push({
      x: player.x + Math.cos(a) * dist,
      y: player.y + Math.sin(a) * dist,
      radius: b.radius,
      hp: b.hp * (1 + elapsed * C.hpRampRate),
      speed: b.speed,
      damage: b.damage,
      xp: b.xpBase + b.xpPerSec * elapsed, // 스폰 시점 고정
      color: b.color,
      type: 'boss',
    });
  }

  update(dt, player, elapsed) {
    const C = CONFIG.enemies;
    // 스폰: 간격이 spawnRampTime에 걸쳐 선형 감소
    const interval = C.spawnInterval -
      (C.spawnInterval - C.spawnIntervalMin) * Math.min(elapsed / C.spawnRampTime, 1);
    this.spawnTimer += dt;
    while (this.spawnTimer >= interval) {
      this.spawnTimer -= interval;
      if (this.enemies.length < C.maxCount) this.spawn(player, elapsed);
    }
    // 보스: interval마다 1기 스폰 (maxCount 제한 무시)
    this.bossTimer += dt;
    while (this.bossTimer >= C.boss.interval) {
      this.bossTimer -= C.boss.interval;
      this.spawnBoss(player, elapsed);
    }
    // 이동 + 접촉 데미지
    for (const e of this.enemies) {
      const dx = player.x - e.x, dy = player.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      const slow = e._slowT > 0 ? e._slowF : 1; // 혹한(freeze) 감속
      e.x += (dx / d) * e.speed * slow * dt;
      e.y += (dy / d) * e.speed * slow * dt;
      if (e._slowT > 0) e._slowT -= dt;
      if (e.flashT > 0) e.flashT -= dt;
      if (d < e.radius + player.radius) player.takeDamage(e.damage);
    }
    // 사망 처리
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.hp <= 0) {
        this.enemies.splice(i, 1);
        if (this.onDeath) this.onDeath(e);
      }
    }
  }

  draw(ctx) {
    for (const e of this.enemies) {
      ctx.lineWidth = 2;
      ctx.fillStyle = e.color;
      ctx.strokeStyle = '#1e3a4a'; // 어두운 외곽선으로 배경과 분리
      if (e.type === 'boss') { // 거대 북극곰: 몸통 + 앞발 + 머리 + 귀 + 주둥이
        const r = e.radius, hx = e.x, hy = e.y - r * 0.45; // 머리 중심
        ctx.lineWidth = 4;
        ctx.fillStyle = '#e8eef2';
        ctx.beginPath(); // 몸통(아래 큰 타원) 먼저
        ctx.ellipse(e.x, e.y + r * 0.35, r * 0.95, r * 0.72, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        for (const side of [-1, 1]) { // 앞발 2개
          ctx.beginPath();
          ctx.arc(e.x + side * r * 0.6, e.y + r * 0.88, r * 0.22, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
        }
        for (const side of [-1, 1]) { // 귀 2개
          ctx.beginPath();
          ctx.arc(hx + side * r * 0.45, hy - r * 0.5, r * 0.2, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
        }
        ctx.beginPath(); // 머리(귀/몸통 윤곽선을 덮음)
        ctx.arc(hx, hy, r * 0.62, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.lineWidth = 2;
        ctx.fillStyle = '#f6fafc'; // 주둥이
        ctx.beginPath();
        ctx.ellipse(hx, hy + r * 0.22, r * 0.28, r * 0.19, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#1e3a4a'; // 코 + 눈 2개
        ctx.beginPath();
        ctx.ellipse(hx, hy + r * 0.16, r * 0.1, r * 0.07, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hx - r * 0.22, hy - r * 0.08, r * 0.06, 0, Math.PI * 2);
        ctx.arc(hx + r * 0.22, hy - r * 0.08, r * 0.06, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'snowman') { // 하프 물범: 통통한 타원 몸통 + 둥근 머리 + 꼬리
        const hx = e.x + e.radius * 0.8, hy = e.y - e.radius * 0.2;
        ctx.beginPath(); // 꼬리 지느러미(몸통 뒤쪽) 먼저
        ctx.moveTo(e.x - e.radius * 0.9, e.y + e.radius * 0.1);
        ctx.lineTo(e.x - e.radius * 1.5, e.y - e.radius * 0.35);
        ctx.lineTo(e.x - e.radius * 1.5, e.y + e.radius * 0.55);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); // 가로로 긴 타원 몸통이 꼬리 밑동을 덮음
        ctx.ellipse(e.x, e.y + e.radius * 0.1, e.radius * 1.1, e.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.beginPath(); // 머리가 몸통 윤곽선을 덮음
        ctx.arc(hx, hy, e.radius * 0.55, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#1e3a4a'; // 점 눈 2개 + 작은 코
        ctx.beginPath();
        ctx.arc(hx - e.radius * 0.2, hy - e.radius * 0.1, e.radius * 0.08, 0, Math.PI * 2);
        ctx.arc(hx + e.radius * 0.2, hy - e.radius * 0.1, e.radius * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hx, hy + e.radius * 0.12, e.radius * 0.06, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'golem') {
        ctx.fillRect(e.x - e.radius, e.y - e.radius * 0.8, e.radius * 2, e.radius * 1.6);
        ctx.strokeRect(e.x - e.radius, e.y - e.radius * 0.8, e.radius * 2, e.radius * 1.6);
        ctx.beginPath();
        ctx.arc(e.x, e.y - e.radius * 0.5, e.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else { // wisp: 원 + 6방향 짧은 침
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = k * Math.PI / 3;
          ctx.moveTo(e.x, e.y);
          ctx.lineTo(e.x + Math.cos(a) * e.radius * 1.5, e.y + Math.sin(a) * e.radius * 1.5);
        }
        ctx.lineWidth = 3; // 어두운 밑선 → 밝은 윗선 (flakes 스타일)
        ctx.stroke();
        ctx.strokeStyle = '#e8f8ff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      // 빙결 틴트: 혹한 감속 중 파랗게
      if (e._slowT > 0) {
        ctx.fillStyle = 'rgba(90, 180, 255, 0.35)';
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
      // 피격 플래시: 흰색 반투명 원으로 덮어 번쩍임 표현
      if (e.flashT > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * 1.15, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
