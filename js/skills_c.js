// Glacier Survivors - 추가 스킬 C: 오로라 광선 / 서리 지뢰

// 선분(x1,y1)-(x2,y2)과 점(px,py) 사이 최단 거리
function segDist(x1, y1, x2, y2, px, py) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2)) : 0;
  return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
}

registerWeapon({
  id: 'aurora', name: '오로라 광선',
  descUp: (l) => (l % 2 === 1 ? '길이/데미지 증가' : `광선 +1개 (총 ${Math.ceil((l + 1) / 2)}개)`),
  stats(l) {
    const c = CONFIG.weapons.aurora;
    return {
      damage: c.damage + 3 * (l - 1),
      beams: c.beams + Math.ceil(l / 2) - 1,
      length: c.length + 25 * (l - 1),
      width: c.width,
      rotSpeed: c.rotSpeed,
      tick: c.tick,
    };
  },
  update(mgr, dt, player, enemies, s, st) {
    st.angle = (st.angle || 0) + s.rotSpeed * dt;
    st.cd = (st.cd || 0) - dt;
    if (st.cd > 0) return;
    st.cd = s.tick;
    for (let i = 0; i < s.beams; i++) {
      const a = st.angle + (i * Math.PI * 2) / s.beams;
      const ex = player.x + Math.cos(a) * s.length, ey = player.y + Math.sin(a) * s.length;
      for (const e of enemies) {
        if (segDist(player.x, player.y, ex, ey, e.x, e.y) < s.width / 2 + e.radius) mgr.hitEnemy(e, s.damage);
      }
    }
  },
  draw(mgr, ctx, s, st) {
    const p = mgr.player;
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < s.beams; i++) {
      const a = (st.angle || 0) + (i * Math.PI * 2) / s.beams;
      const ex = p.x + Math.cos(a) * s.length, ey = p.y + Math.sin(a) * s.length;
      ctx.strokeStyle = 'rgba(120,255,210,0.35)'; // 넓은 반투명 몸체
      ctx.lineWidth = s.width;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(200,255,240,0.8)'; // 밝은 중심선
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
    ctx.restore();
  },
});

registerWeapon({
  id: 'mines', name: '서리 지뢰',
  descUp: (l) => `지뢰 +1개 (총 ${CONFIG.weapons.mines.count + l}개)`,
  stats(l) {
    const c = CONFIG.weapons.mines;
    return {
      damage: c.damage + 6 * (l - 1),
      count: c.count + (l - 1),
      radius: c.radius + 8 * (l - 1),
      cooldown: c.cooldown,
      triggerR: c.triggerR,
      spawnRange: c.spawnRange,
      life: c.life,
    };
  },
  update(mgr, dt, player, enemies, s, st) {
    st.cd = (st.cd || 0) - dt;
    st.mines = st.mines || [];
    st.booms = st.booms || [];
    if (st.cd <= 0) {
      for (let i = 0; i < s.count; i++) {
        const a = Math.random() * Math.PI * 2, d = Math.random() * s.spawnRange;
        st.mines.push({ x: player.x + Math.cos(a) * d, y: player.y + Math.sin(a) * d, life: s.life });
      }
      st.cd = s.cooldown;
    }
    st.mines = st.mines.filter((m) => {
      m.life -= dt;
      if (m.life <= 0) return false;
      for (const e of enemies) {
        if (Math.hypot(e.x - m.x, e.y - m.y) < s.triggerR + e.radius) { // 폭발
          for (const t of enemies) {
            if (Math.hypot(t.x - m.x, t.y - m.y) < s.radius + t.radius) mgr.hitEnemy(t, s.damage);
          }
          FX.shake(3);
          FX.burst(m.x, m.y, '#9fe0ff', 12);
          st.booms.push({ x: m.x, y: m.y, t: 0.3 });
          return false;
        }
      }
      return true;
    });
    st.booms = st.booms.filter((b) => (b.t -= dt) > 0);
  },
  draw(mgr, ctx, s, st) {
    for (const m of st.mines || []) {
      ctx.fillStyle = '#1d4560'; // 어두운 청색 본체
      ctx.beginPath();
      ctx.arc(m.x, m.y, 6, 0, Math.PI * 2);
      ctx.fill();
      if (Math.sin(mgr.time * 9) > 0) { // 깜빡이는 경고등
        ctx.fillStyle = '#9fe0ff';
        ctx.beginPath();
        ctx.arc(m.x, m.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    for (const b of st.booms || []) { // 확장 폭발 링
      const k = 1 - b.t / 0.3;
      ctx.strokeStyle = `rgba(159, 224, 255, ${1 - k})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(b.x, b.y, s.radius * k, 0, Math.PI * 2);
      ctx.stroke();
    }
  },
});
