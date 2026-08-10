// Glacier Survivors - 추가 스킬 A: 눈보라 / 냉기 사슬 / 파편 노바
// weapons.js 다음, main.js 이전에 로드. registerWeapon 계약을 따른다.

registerWeapon({
  id: 'blizzard', name: '눈보라',
  descUp: (l) => `폭풍 +1개 (총 ${CONFIG.weapons.blizzard.bursts + l}개)`,
  stats(l) {
    const c = CONFIG.weapons.blizzard;
    return { damage: c.damage + 3 * (l - 1), bursts: c.bursts + (l - 1), radius: c.radius + 8 * (l - 1), spawnRange: c.spawnRange, life: c.life, cooldown: c.cooldown };
  },
  update(mgr, dt, player, enemies, s, st) {
    st.cd = (st.cd || 0) - dt;
    st.storms = st.storms || [];
    if (st.cd <= 0) {
      for (let i = 0; i < s.bursts; i++) {
        const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * s.spawnRange;
        st.storms.push({ x: player.x + Math.cos(a) * d, y: player.y + Math.sin(a) * d, t: 0, spin: Math.random() * Math.PI * 2, dir: Math.random() < 0.5 ? 1 : -1, hit: new Set() });
      }
      st.cd = s.cooldown;
    }
    for (const b of st.storms) {
      b.t += dt;
      const r = s.radius * Math.min(1, b.t / s.life); // 확장 중 반경
      for (const e of enemies) {
        if (b.hit.has(e)) continue;
        if (Math.hypot(e.x - b.x, e.y - b.y) < r + e.radius) { mgr.hitEnemy(e, s.damage); b.hit.add(e); }
      }
    }
    st.storms = st.storms.filter((b) => b.t < s.life);
  },
  draw(mgr, ctx, s, st) {
    for (const b of st.storms || []) {
      const p = Math.min(1, b.t / s.life), r = s.radius * p;
      ctx.save();
      ctx.globalAlpha = 0.85 * (1 - p * 0.55);
      ctx.fillStyle = 'rgba(90, 175, 220, 0.3)';
      ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#2f7fa8';
      ctx.lineWidth = 3;
      const rot = b.spin + b.dir * mgr.time * 7; // 소용돌이 호 3개 회전
      for (let i = 0; i < 3; i++) {
        const a0 = rot + (i * Math.PI * 2) / 3;
        ctx.beginPath(); ctx.arc(b.x, b.y, r * (0.45 + i * 0.22), a0, a0 + 1.9); ctx.stroke();
      }
      ctx.restore();
    }
  },
});

registerWeapon({
  id: 'chain', name: '냉기 사슬',
  descUp: (l) => `연쇄 +1회 (총 ${CONFIG.weapons.chain.chains + l}회)`,
  stats(l) {
    const c = CONFIG.weapons.chain;
    return { damage: c.damage + 3 * (l - 1), chains: c.chains + (l - 1), range: c.range, jump: c.jump, cooldown: c.cooldown, width: 2.5 + 5.5 * (l - 1) }; // 5레벨 ≈ 펭귄 굵기(24px)
  },
  update(mgr, dt, player, enemies, s, st) {
    st.cd = (st.cd || 0) - dt;
    st.bolts = st.bolts || [];
    if (st.cd <= 0 && enemies.length) {
      const first = mgr.nearest(player.x, player.y, enemies);
      if (first && Math.hypot(first.x - player.x, first.y - player.y) < s.range) {
        const linked = [first];
        let cur = first;
        for (let i = 1; i < s.chains; i++) {
          const next = mgr.nearest(cur.x, cur.y, enemies.filter((e) => !linked.includes(e)));
          if (!next || Math.hypot(next.x - cur.x, next.y - cur.y) > s.jump) break;
          linked.push(next); cur = next;
        }
        for (const e of linked) mgr.hitEnemy(e, s.damage);
        // 지그재그 경로 생성: 각 선분을 3조각으로 나눠 수직 랜덤 오프셋
        const nodes = [{ x: player.x, y: player.y }, ...linked.map((e) => ({ x: e.x, y: e.y }))];
        const pts = [nodes[0]];
        for (let i = 1; i < nodes.length; i++) {
          const a = nodes[i - 1], b = nodes[i], nx = -(b.y - a.y), ny = b.x - a.x, len = Math.hypot(nx, ny) || 1;
          for (const f of [0.33, 0.66]) {
            const off = (Math.random() - 0.5) * 26;
            pts.push({ x: a.x + (b.x - a.x) * f + (nx / len) * off, y: a.y + (b.y - a.y) * f + (ny / len) * off });
          }
          pts.push(b);
        }
        st.bolts.push({ pts, t: 0.25 });
        st.cd = s.cooldown;
      }
    }
    st.bolts = st.bolts.filter((b) => (b.t -= dt) > 0);
  },
  draw(mgr, ctx, s, st) {
    ctx.save();
    ctx.strokeStyle = '#1a9fd8';
    ctx.lineWidth = s.width; // 레벨업할수록 굵어진다
    for (const b of st.bolts || []) {
      ctx.globalAlpha = Math.max(0, b.t / 0.25);
      ctx.beginPath();
      ctx.moveTo(b.pts[0].x, b.pts[0].y);
      for (let i = 1; i < b.pts.length; i++) ctx.lineTo(b.pts[i].x, b.pts[i].y);
      ctx.stroke();
    }
    ctx.restore();
  },
});

registerWeapon({
  id: 'nova', name: '파편 노바',
  descUp: (l) => `파편 +2개 (총 ${CONFIG.weapons.nova.shards + 2 * l}개)`,
  stats(l) {
    const c = CONFIG.weapons.nova;
    return { damage: c.damage + 2 * (l - 1), shards: c.shards + 2 * (l - 1), speed: c.speed, radius: c.radius, cooldown: c.cooldown };
  },
  update(mgr, dt, player, enemies, s, st) {
    st.cd = (st.cd || 0) - dt;
    st.shards = st.shards || [];
    if (st.cd <= 0) {
      const base = Math.random() * Math.PI * 2; // 매번 랜덤 오프셋으로 단조로움 방지
      for (let i = 0; i < s.shards; i++) {
        const a = base + (i * Math.PI * 2) / s.shards;
        st.shards.push({ x: player.x, y: player.y, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed, dist: 0, dead: false });
      }
      st.cd = s.cooldown;
    }
    for (const p of st.shards) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.dist += s.speed * dt;
      for (const e of enemies) {
        const dx = e.x - p.x, dy = e.y - p.y, r = e.radius + s.radius;
        if (dx * dx + dy * dy < r * r) { mgr.hitEnemy(e, s.damage); p.dead = true; break; } // 첫 타격 시 소멸
      }
    }
    st.shards = st.shards.filter((p) => !p.dead && p.dist < 500);
  },
  draw(mgr, ctx, s, st) {
    ctx.save();
    ctx.fillStyle = '#e6f7ff';
    ctx.strokeStyle = '#2b586e';
    ctx.lineWidth = 1;
    for (const p of st.shards || []) {
      const r = s.radius + 1.5;
      ctx.globalAlpha = 0.9 - (p.dist / 500) * 0.5;
      ctx.beginPath(); // 진행 방향으로 길쭉한 마름모
      ctx.moveTo(p.x + (p.vx / s.speed) * r * 1.8, p.y + (p.vy / s.speed) * r * 1.8);
      ctx.lineTo(p.x - (p.vy / s.speed) * r, p.y + (p.vx / s.speed) * r);
      ctx.lineTo(p.x - (p.vx / s.speed) * r * 1.8, p.y - (p.vy / s.speed) * r * 1.8);
      ctx.lineTo(p.x + (p.vy / s.speed) * r, p.y - (p.vx / s.speed) * r);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  },
});
