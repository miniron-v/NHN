// Glacier Survivors - 추가 스킬 D: 눈사태 / 혹한

registerWeapon({
  id: 'avalanche', name: '눈사태',
  descUp: () => '눈사태 강화 (크기/데미지 증가)',
  stats(l) {
    const c = CONFIG.weapons.avalanche;
    return {
      damage: c.damage + 6 * (l - 1),
      count: Math.ceil(l / 2),
      radius: c.radius,
      growth: c.growth + 5 * (l - 1),
      speed: c.speed,
      cooldown: c.cooldown,
      dist: c.dist,
    };
  },
  update(mgr, dt, player, enemies, s, st) {
    st.cd = (st.cd || 0) - dt;
    st.balls = st.balls || [];
    if (st.cd <= 0) {
      let base;
      if (enemies.length) {
        const best = mgr.nearest(player.x, player.y, enemies);
        base = Math.atan2(best.y - player.y, best.x - player.x);
      } else base = Math.random() * Math.PI * 2;
      for (let i = 0; i < s.count; i++) {
        const a = base + (i - (s.count - 1) / 2) * 0.35; // 각도 분산
        st.balls.push({ x: player.x, y: player.y, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed, d: 0, hit: new Set() });
      }
      st.cd = s.cooldown;
    }
    for (const b of st.balls) {
      b.x += b.vx * dt; b.y += b.vy * dt;
      b.d += s.speed * dt; // 이동 거리 누적
      b.r = s.radius + s.growth * (b.d / 100); // 굴러갈수록 커진다
      for (const e of enemies) {
        if (b.hit.has(e)) continue;
        const dx = e.x - b.x, dy = e.y - b.y, r = e.radius + b.r;
        if (dx * dx + dy * dy < r * r) { mgr.hitEnemy(e, s.damage); b.hit.add(e); } // 관통
      }
      if (b.d >= s.dist) FX.burst(b.x, b.y, '#ffffff', 10); // 소멸 연출 1회
    }
    st.balls = st.balls.filter((b) => b.d < s.dist);
  },
  draw(mgr, ctx, s, st) {
    ctx.lineWidth = 2;
    for (const b of st.balls || []) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#1e3a4a';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // 구르는 느낌: 이동 거리 기반으로 회전하는 안쪽 호 2개
      const rot = b.d / Math.max(b.r, 1);
      ctx.strokeStyle = 'rgba(120, 160, 185, 0.6)';
      for (let i = 0; i < 2; i++) {
        const a0 = rot + i * Math.PI;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * 0.55, a0, a0 + 1.6);
        ctx.stroke();
      }
    }
  },
});

registerWeapon({
  id: 'freeze', name: '혹한',
  descUp: () => '지속/감속 강화',
  stats(l) {
    const c = CONFIG.weapons.freeze;
    return {
      cooldown: c.cooldown,
      duration: c.duration + 0.4 * (l - 1),
      factor: Math.max(0.15, c.factor - 0.03 * (l - 1)), // 낮을수록 더 느려짐
    };
  },
  update(mgr, dt, player, enemies, s, st) {
    st.cd = (st.cd || 0) - dt;
    st.fxT = (st.fxT || 0) - dt;
    if (st.cd <= 0) {
      for (const e of enemies) { e._slowT = s.duration; e._slowF = s.factor; } // 전장 전체 감속
      FX.flash('#a8dcff', 0.35);
      st.fxT = 0.5; // 확장 링 연출 시간
      st.cd = s.cooldown;
    }
  },
  draw(mgr, ctx, s, st) {
    if (!st.fxT || st.fxT <= 0) return;
    const p = 1 - st.fxT / 0.5; // 0 -> 1 진행도
    const r = 40 + p * 320;    // 플레이어 중심에서 확장
    const { x, y } = mgr.player;
    ctx.strokeStyle = `rgba(168, 220, 255, ${0.8 * (1 - p)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    // 얼음 결정: 원 둘레 6방향 짧은 침
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI * 2) / 6;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      ctx.lineTo(x + Math.cos(a) * (r + 14), y + Math.sin(a) * (r + 14));
      ctx.stroke();
    }
  },
});
