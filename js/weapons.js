// Glacier Survivors - 무기 / XP 젬 관리
class WeaponManager {
  constructor() { this.reset(); }

  reset() {
    this.levels = { icicle: 1, frostRing: 0, orbital: 0 };
    this.projectiles = [];
    this.gems = [];
    this.popups = [];
    this.icicleCd = 0;
    this.frostCd = 0;
    this.orbitAngle = 0;
    this.time = 0;
    this.player = null;
  }

  // 레벨 반영 스탯
  icicleStats() {
    const c = CONFIG.weapons.icicle, l = this.levels.icicle;
    return { damage: c.damage + 2 * (l - 1), pierce: c.pierce + Math.floor(l / 3), count: l, speed: c.speed, cooldown: c.cooldown, radius: c.radius };
  }
  frostStats() {
    const c = CONFIG.weapons.frostRing, l = this.levels.frostRing;
    return { damage: c.damage + 3 * (l - 1), range: c.range + 20 * (l - 1), tick: c.tick };
  }
  orbitalStats() {
    const c = CONFIG.weapons.orbital, l = this.levels.orbital;
    return { damage: c.damage + 4 * Math.floor(l / 2), count: l, radius: c.radius, dist: c.dist, rotSpeed: c.rotSpeed };
  }

  // 피격 처리 공통: 데미지 + 플래시(enemies.js가 렌더링) + 데미지 팝업
  hitEnemy(e, dmg) {
    e.hp -= dmg;
    e.flashT = 0.12;
    this.popups.push({ x: e.x, y: e.y - e.radius - 6, t: 0.7, text: String(Math.round(dmg)) });
  }

  spawnGem(x, y, xp) { this.gems.push({ x, y, xp }); }

  update(dt, player, enemies) {
    this.player = player;
    this.time += dt;

    // 고드름: 가장 가까운 적에게 발사
    this.icicleCd -= dt;
    if (this.icicleCd <= 0 && enemies.length > 0) {
      const s = this.icicleStats();
      let best = null, bestD = Infinity;
      for (const e of enemies) {
        const d = (e.x - player.x) ** 2 + (e.y - player.y) ** 2;
        if (d < bestD) { bestD = d; best = e; }
      }
      const base = Math.atan2(best.y - player.y, best.x - player.x);
      for (let i = 0; i < s.count; i++) {
        const a = base + (i - (s.count - 1) / 2) * 0.14; // 부채꼴 확산
        this.projectiles.push({ x: player.x, y: player.y, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed, damage: s.damage, pierce: s.pierce, radius: s.radius, hit: new Set() });
      }
      this.icicleCd = s.cooldown;
    }
    for (const p of this.projectiles) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      for (const e of enemies) {
        if (p.pierce <= 0) break;
        if (p.hit.has(e)) continue;
        const dx = e.x - p.x, dy = e.y - p.y, r = e.radius + p.radius;
        if (dx * dx + dy * dy < r * r) { this.hitEnemy(e, p.damage); p.hit.add(e); p.pierce--; }
      }
    }
    this.projectiles = this.projectiles.filter((p) =>
      p.pierce > 0 && Math.hypot(p.x - player.x, p.y - player.y) < 1200);

    // 서리 고리: 범위 내 전체 틱 데미지
    if (this.levels.frostRing > 0) {
      this.frostCd -= dt;
      if (this.frostCd <= 0) {
        const s = this.frostStats();
        for (const e of enemies) {
          if (Math.hypot(e.x - player.x, e.y - player.y) < s.range + e.radius) this.hitEnemy(e, s.damage);
        }
        this.frostCd = s.tick;
      }
    }

    // 회전 눈덩이: 공전 + 히트 쿨다운 0.5초
    if (this.levels.orbital > 0) {
      const s = this.orbitalStats();
      this.orbitAngle += s.rotSpeed * dt;
      for (let i = 0; i < s.count; i++) {
        const a = this.orbitAngle + (i * Math.PI * 2) / s.count;
        const ox = player.x + Math.cos(a) * s.dist, oy = player.y + Math.sin(a) * s.dist;
        for (const e of enemies) {
          if (this.time - (e._orbHitT || -1) < 0.5) continue;
          const dx = e.x - ox, dy = e.y - oy, r = e.radius + s.radius;
          if (dx * dx + dy * dy < r * r) { this.hitEnemy(e, s.damage); e._orbHitT = this.time; }
        }
      }
    }

    // 젬: 흡수 범위 내면 자석 이동, 닿으면 획득
    this.gems = this.gems.filter((g) => {
      const dx = player.x - g.x, dy = player.y - g.y, d = Math.hypot(dx, dy);
      if (d < player.radius + CONFIG.gem.radius) { player.gainXP(g.xp); return false; }
      if (d < CONFIG.player.pickupRange) {
        g.x += (dx / d) * CONFIG.gem.magnetSpeed * dt;
        g.y += (dy / d) * CONFIG.gem.magnetSpeed * dt;
      }
      return true;
    });

    // 데미지 팝업: 위로 부유하며 소멸
    this.popups = this.popups.filter((pp) => {
      pp.t -= dt;
      pp.y -= 45 * dt;
      return pp.t > 0;
    });
  }

  getUpgradeChoices() {
    const names = { icicle: '고드름', frostRing: '서리 고리', orbital: '회전 눈덩이' };
    const descs = {
      icicle: (l) => `고드름 +1개 (총 ${l + 1}개)`,
      frostRing: () => '범위 +20',
      orbital: (l) => `눈덩이 +1개 (총 ${l + 1}개)`,
    };
    const pool = [];
    for (const k of Object.keys(this.levels)) {
      if (this.levels[k] === 0) pool.push({ id: k, name: names[k], desc: '새 무기 획득', apply: () => { this.levels[k] = 1; } });
      else pool.push({ id: k, name: names[k], desc: descs[k](this.levels[k]), apply: () => { this.levels[k]++; } });
    }
    pool.push({ id: 'heal', name: '응급 처치', desc: '체력 +20 회복', apply: () => { const p = this.player; p.hp = Math.min(p.maxHp, p.hp + 20); } });
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 3);
  }

  draw(ctx) {
    const p = this.player;
    if (!p) return;
    if (this.levels.frostRing > 0) {
      ctx.strokeStyle = 'rgba(140, 200, 255, 0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, this.frostStats().range, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#aee2ff';
    for (const pr of this.projectiles) {
      const a = Math.atan2(pr.vy, pr.vx);
      ctx.save();
      ctx.translate(pr.x, pr.y);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(pr.radius * 2.2, 0);
      ctx.lineTo(-pr.radius, -pr.radius);
      ctx.lineTo(-pr.radius, pr.radius);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    if (this.levels.orbital > 0) {
      const s = this.orbitalStats();
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < s.count; i++) {
        const a = this.orbitAngle + (i * Math.PI * 2) / s.count;
        ctx.beginPath();
        ctx.arc(p.x + Math.cos(a) * s.dist, p.y + Math.sin(a) * s.dist, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = '#5bc8f5';
    for (const g of this.gems) {
      const r = CONFIG.gem.radius;
      ctx.beginPath();
      ctx.moveTo(g.x, g.y - r);
      ctx.lineTo(g.x + r, g.y);
      ctx.lineTo(g.x, g.y + r);
      ctx.lineTo(g.x - r, g.y);
      ctx.closePath();
      ctx.fill();
    }
  }

  // 데미지 팝업: 적/플레이어 위에 그려지도록 main이 별도 호출 (월드 좌표계)
  drawPopups(ctx) {
    if (this.popups.length === 0) return;
    ctx.save();
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    for (const pp of this.popups) {
      ctx.globalAlpha = Math.max(0, pp.t / 0.7);
      ctx.fillText(pp.text, pp.x, pp.y);
    }
    ctx.restore();
  }
}
