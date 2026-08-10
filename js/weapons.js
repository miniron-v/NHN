// Glacier Survivors - 무기 레지스트리 / XP 젬 관리
//
// 무기 추가 계약: registerWeapon({...})으로 등록하면 매니저가 자동 구동한다.
//   { id, name,
//     descUp(l),                                  // 레벨업 카드 설명 (l = 현재 레벨)
//     stats(l) -> s,                              // 레벨 반영 스탯
//     update(mgr, dt, player, enemies, s, st),    // st = 무기별 상태 객체 (쿨다운/투사체 등 자유 사용)
//     draw(mgr, ctx, s, st) }                     // 월드 좌표계 (선택)
// 적 타격은 반드시 mgr.hitEnemy(e, dmg) 사용 (플래시+데미지 팝업 일원화).
const WEAPONS = {};
function registerWeapon(def) { WEAPONS[def.id] = def; }

registerWeapon({
  id: 'icicle', name: '고드름',
  descUp: (l) => `고드름 +1개 (총 ${l + 1}개)`,
  stats(l) {
    const c = CONFIG.weapons.icicle;
    return { damage: c.damage + 2 * (l - 1), pierce: c.pierce + Math.floor(l / 3), count: l, speed: c.speed, cooldown: c.cooldown, radius: c.radius + 0.4 * (l - 1) };
  },
  update(mgr, dt, player, enemies, s, st) {
    st.cd = (st.cd || 0) - dt;
    st.projs = st.projs || [];
    if (st.cd <= 0 && enemies.length) {
      const best = mgr.nearest(player.x, player.y, enemies);
      const base = Math.atan2(best.y - player.y, best.x - player.x);
      for (let i = 0; i < s.count; i++) {
        const a = base + (i - (s.count - 1) / 2) * 0.14; // 부채꼴 확산
        st.projs.push({ x: player.x, y: player.y, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed, pierce: s.pierce, hit: new Set() });
      }
      st.cd = s.cooldown;
    }
    for (const p of st.projs) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      for (const e of enemies) {
        if (p.pierce <= 0) break;
        if (p.hit.has(e)) continue;
        const dx = e.x - p.x, dy = e.y - p.y, r = e.radius + s.radius;
        if (dx * dx + dy * dy < r * r) { mgr.hitEnemy(e, s.damage); p.hit.add(e); p.pierce--; }
      }
    }
    st.projs = st.projs.filter((p) => p.pierce > 0 && Math.hypot(p.x - player.x, p.y - player.y) < 1400);
  },
  draw(mgr, ctx, s, st) {
    ctx.fillStyle = '#4fb0e4';
    for (const p of st.projs || []) {
      const a = Math.atan2(p.vy, p.vx);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(s.radius * 2.2, 0);
      ctx.lineTo(-s.radius, -s.radius);
      ctx.lineTo(-s.radius, s.radius);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  },
});

registerWeapon({
  id: 'frostRing', name: '서리 고리',
  descUp: () => '범위 +50',
  stats(l) {
    const c = CONFIG.weapons.frostRing;
    return { damage: c.damage + 3 * (l - 1), range: c.range + 50 * (l - 1), tick: c.tick, width: 3 + 0.8 * (l - 1) };
  },
  update(mgr, dt, player, enemies, s, st) {
    st.cd = (st.cd || 0) - dt;
    if (st.cd <= 0) {
      for (const e of enemies) {
        if (Math.hypot(e.x - player.x, e.y - player.y) < s.range + e.radius) mgr.hitEnemy(e, s.damage);
      }
      st.cd = s.tick;
    }
  },
  draw(mgr, ctx, s) {
    ctx.strokeStyle = 'rgba(50, 135, 195, 0.7)';
    ctx.lineWidth = s.width; // 레벨업할수록 굵어진다
    ctx.beginPath();
    ctx.arc(mgr.player.x, mgr.player.y, s.range, 0, Math.PI * 2);
    ctx.stroke();
  },
});

registerWeapon({
  id: 'orbital', name: '회전 눈덩이',
  descUp: (l) => `눈덩이 +1개 (총 ${l + 1}개)`,
  stats(l) {
    const c = CONFIG.weapons.orbital;
    return { damage: c.damage + 4 * Math.floor(l / 2), count: l, radius: c.radius + 0.7 * (l - 1), dist: c.dist, rotSpeed: c.rotSpeed };
  },
  update(mgr, dt, player, enemies, s, st) {
    st.angle = (st.angle || 0) + s.rotSpeed * dt;
    for (let i = 0; i < s.count; i++) {
      const a = st.angle + (i * Math.PI * 2) / s.count;
      const ox = player.x + Math.cos(a) * s.dist, oy = player.y + Math.sin(a) * s.dist;
      for (const e of enemies) {
        if (mgr.time - (e._orbHitT || -1) < 0.5) continue; // 히트 쿨다운
        const dx = e.x - ox, dy = e.y - oy, r = e.radius + s.radius;
        if (dx * dx + dy * dy < r * r) { mgr.hitEnemy(e, s.damage); e._orbHitT = mgr.time; }
      }
    }
  },
  draw(mgr, ctx, s, st) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e3a4a';
    ctx.lineWidth = 2;
    for (let i = 0; i < s.count; i++) {
      const a = (st.angle || 0) + (i * Math.PI * 2) / s.count;
      ctx.beginPath();
      ctx.arc(mgr.player.x + Math.cos(a) * s.dist, mgr.player.y + Math.sin(a) * s.dist, s.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  },
});

class WeaponManager {
  constructor() { this.reset(); }

  reset() {
    this.levels = { icicle: 1 }; // 시작 무기
    this.state = {};             // 무기별 상태 (id -> {})
    this.gems = [];
    this.popups = [];
    this.time = 0;
    this.player = null;
  }

  st(id) { return this.state[id] || (this.state[id] = {}); }

  nearest(x, y, enemies) {
    let best = null, bd = Infinity;
    for (const e of enemies) {
      const d = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (d < bd) { bd = d; best = e; }
    }
    return best;
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

    for (const id in this.levels) {
      const def = WEAPONS[id];
      def.update(this, dt, player, enemies, def.stats(this.levels[id]), this.st(id));
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
    const pool = [];
    for (const id in WEAPONS) {
      const l = this.levels[id] || 0;
      if (l === 0) pool.push({ id, name: WEAPONS[id].name, desc: '새 무기 획득', apply: () => { this.levels[id] = 1; } });
      else pool.push({ id, name: WEAPONS[id].name, desc: WEAPONS[id].descUp(l), apply: () => { this.levels[id]++; } });
    }
    pool.push({ id: 'heal', name: '응급 처치', desc: '체력 +20 회복', apply: () => { const p = this.player; p.hp = Math.min(p.maxHp, p.hp + 20); } });
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 3);
  }

  draw(ctx) {
    if (!this.player) return;
    for (const id in this.levels) {
      const def = WEAPONS[id];
      if (def.draw) def.draw(this, ctx, def.stats(this.levels[id]), this.st(id));
    }
    ctx.fillStyle = '#5bc8f5';
    ctx.strokeStyle = '#1e3a4a';
    ctx.lineWidth = 1.5;
    for (const g of this.gems) {
      const r = CONFIG.gem.radius;
      ctx.beginPath();
      ctx.moveTo(g.x, g.y - r);
      ctx.lineTo(g.x + r, g.y);
      ctx.lineTo(g.x, g.y + r);
      ctx.lineTo(g.x - r, g.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  // 데미지 팝업: 적/플레이어 위에 그려지도록 main이 별도 호출 (월드 좌표계)
  drawPopups(ctx) {
    if (this.popups.length === 0) return;
    ctx.save();
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f5a8a8';
    ctx.strokeStyle = 'rgba(25, 45, 60, 0.9)'; // 어두운 테두리로 가독성 확보
    ctx.lineWidth = 3;
    for (const pp of this.popups) {
      ctx.globalAlpha = Math.max(0, pp.t / 0.7);
      ctx.strokeText(pp.text, pp.x, pp.y);
      ctx.fillText(pp.text, pp.x, pp.y);
    }
    ctx.restore();
  }
}
