// Glacier Survivors - 추가 스킬 B: 빙결 궤적 / 우박 / 유도 눈송이
// weapons.js의 registerWeapon 계약을 따른다. (weapons.js 이후, main.js 이전 로드)

// 빙결 궤적: 빙판 미끄러짐(핵심 이동)과 시너지 - 고속 이동 경로가 데미지 얼음길로 남는다
registerWeapon({
  id: 'trail', name: '빙결 궤적',
  descUp: () => '얼음길 강화 (범위/지속 증가)',
  stats(l) {
    const c = CONFIG.weapons.trail;
    return { damage: c.damage + 2 * (l - 1), patchR: c.patchR + 9 * (l - 1), life: c.life + 0.3 * (l - 1), tick: c.tick, minSpeed: c.minSpeed, dropGap: c.dropGap };
  },
  update(mgr, dt, player, enemies, s, st) {
    st.patches = st.patches || [];
    const speed = Math.hypot(player.vx, player.vy);
    if (speed >= s.minSpeed && (st.lastX === undefined || Math.hypot(player.x - st.lastX, player.y - st.lastY) >= s.dropGap)) {
      st.patches.push({ x: player.x, y: player.y, t: s.life });
      st.lastX = player.x; st.lastY = player.y;
    }
    st.cd = (st.cd || 0) - dt; // 무기 전역 tick 타이머
    if (st.cd <= 0) {
      for (const e of enemies) {
        for (const p of st.patches) {
          if (Math.hypot(e.x - p.x, e.y - p.y) < s.patchR + e.radius) { mgr.hitEnemy(e, s.damage); break; }
        }
      }
      st.cd = s.tick;
    }
    for (const p of st.patches) p.t -= dt;
    st.patches = st.patches.filter((p) => p.t > 0);
  },
  draw(mgr, ctx, s, st) {
    ctx.save();
    for (const p of st.patches || []) {
      const a = Math.max(0, p.t / s.life);
      ctx.globalAlpha = 0.4 * a;
      ctx.fillStyle = '#3fb4e4';
      ctx.beginPath();
      ctx.arc(p.x, p.y, s.patchR, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.5 * a; // 중심 하이라이트로 빛나는 얼음길 느낌
      ctx.fillStyle = '#e6f8ff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, s.patchR * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  },
});

// 우박: 그림자 예고 후 낙하 충격 AoE - 고레벨에서 화면 곳곳에 우박 폭격
registerWeapon({
  id: 'hail', name: '우박',
  descUp: (l) => `우박 +1개 (총 ${CONFIG.weapons.hail.stones + l}개)`,
  stats(l) {
    const c = CONFIG.weapons.hail;
    return { damage: c.damage + 5 * (l - 1), stones: c.stones + (l - 1), radius: c.radius + 6 * (l - 1), delay: c.delay, cooldown: c.cooldown, spawnRange: c.spawnRange };
  },
  update(mgr, dt, player, enemies, s, st) {
    st.cd = (st.cd || 0) - dt;
    st.stones = st.stones || [];
    st.rings = st.rings || [];
    if (st.cd <= 0) {
      for (let i = 0; i < s.stones; i++) {
        const a = Math.random() * Math.PI * 2, d = Math.random() * s.spawnRange;
        st.stones.push({ x: player.x + Math.cos(a) * d, y: player.y + Math.sin(a) * d, t: 0 });
      }
      st.cd = s.cooldown;
    }
    for (const h of st.stones) {
      h.t += dt;
      if (h.t >= s.delay) { // 낙하 충격
        for (const e of enemies) {
          if (Math.hypot(e.x - h.x, e.y - h.y) < s.radius + e.radius) mgr.hitEnemy(e, s.damage);
        }
        st.rings.push({ x: h.x, y: h.y, t: 0.25 });
        FX.shake(3);
      }
    }
    st.stones = st.stones.filter((h) => h.t < s.delay);
    for (const r of st.rings) r.t -= dt;
    st.rings = st.rings.filter((r) => r.t > 0);
  },
  draw(mgr, ctx, s, st) {
    ctx.save();
    for (const h of st.stones || []) { // 예고: 점점 진해지고 커지는 그림자 타원
      const k = Math.min(1, h.t / s.delay);
      ctx.globalAlpha = 0.15 + 0.35 * k;
      ctx.fillStyle = '#1a2733';
      ctx.beginPath();
      ctx.ellipse(h.x, h.y, s.radius * (0.35 + 0.65 * k), s.radius * (0.18 + 0.32 * k), 0, 0, Math.PI * 2);
      ctx.fill();
      const fall = s.delay - h.t; // 마지막 0.15초: 회청색 돌덩이가 위에서 낙하
      if (fall < 0.15) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#7fa8c9';
        ctx.beginPath();
        ctx.arc(h.x, h.y - (fall / 0.15) * 340, s.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    for (const r of st.rings || []) { // 충격: 흰 원 + 퍼지는 링
      const k = 1 - r.t / 0.25;
      ctx.globalAlpha = 0.7 * (1 - k);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(r.x, r.y, s.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.8 * (1 - k);
      ctx.strokeStyle = '#cfeeff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(r.x, r.y, s.radius * (0.4 + 0.8 * k), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  },
});

// 유도 눈송이: 랜덤 방향 발사 후 가장 가까운 적을 향해 선회 - 고레벨에서 눈송이 떼가 적을 추격
registerWeapon({
  id: 'flakes', name: '유도 눈송이',
  descUp: (l) => `눈송이 +1개 (총 ${CONFIG.weapons.flakes.count + l}개)`,
  stats(l) {
    const c = CONFIG.weapons.flakes;
    return { damage: c.damage + 2 * (l - 1), count: c.count + (l - 1), speed: c.speed, turnRate: c.turnRate, radius: c.radius + 0.6 * (l - 1), life: c.life, cooldown: c.cooldown };
  },
  update(mgr, dt, player, enemies, s, st) {
    st.cd = (st.cd || 0) - dt;
    st.flakes = st.flakes || [];
    if (st.cd <= 0) {
      for (let i = 0; i < s.count; i++) {
        st.flakes.push({ x: player.x, y: player.y, a: Math.random() * Math.PI * 2, t: s.life });
      }
      st.cd = s.cooldown;
    }
    for (const f of st.flakes) {
      f.t -= dt;
      const tgt = mgr.nearest(f.x, f.y, enemies);
      if (tgt) { // 목표 각도로 turnRate 만큼 서서히 선회
        let da = Math.atan2(tgt.y - f.y, tgt.x - f.x) - f.a;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        f.a += Math.max(-s.turnRate * dt, Math.min(s.turnRate * dt, da));
      }
      f.x += Math.cos(f.a) * s.speed * dt;
      f.y += Math.sin(f.a) * s.speed * dt;
      for (const e of enemies) {
        if (Math.hypot(e.x - f.x, e.y - f.y) < s.radius + e.radius) { mgr.hitEnemy(e, s.damage); f.t = 0; break; }
      }
    }
    st.flakes = st.flakes.filter((f) => f.t > 0);
  },
  draw(mgr, ctx, s, st) {
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    for (const f of st.flakes || []) {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate((mgr.time + f.t) * 3); // 자체 회전 (개체별 위상차)
      ctx.beginPath();
      for (let i = 0; i < 6; i++) { // 6방향 침 눈꽃
        const a = (i * Math.PI) / 3;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * s.radius, Math.sin(a) * s.radius);
      }
      ctx.strokeStyle = '#2b586e'; // 어두운 밑선 + 흰 윗선으로 밝은 배경에서도 보이게
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, s.radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  },
});
