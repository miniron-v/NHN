// Glacier Survivors - HUD / 레벨업 / 게임오버 화면 (화면 좌표계)
const UI = {
  fmtTime(t) {
    const m = Math.floor(t / 60), s = Math.floor(t % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },

  drawHUD(ctx, player, elapsed, canvas) {
    // HP 바
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(20, 20, 220, 16);
    ctx.fillStyle = '#e05050';
    ctx.fillRect(20, 20, 220 * Math.max(0, player.hp / player.maxHp), 16);
    // XP 바 + 레벨
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(20, 42, 220, 10);
    ctx.fillStyle = '#5bc8f5';
    ctx.fillRect(20, 42, 220 * Math.min(1, player.xp / player.xpNeeded), 10);
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Lv ${player.level}`, 248, 52);
    // 생존 시간
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(UI.fmtTime(elapsed), canvas.width / 2, 34);
  },

  levelUpCardRects(choices, canvas) {
    const w = 180, h = 260, gap = 24;
    const total = choices.length * w + (choices.length - 1) * gap;
    const x0 = (canvas.width - total) / 2, y = (canvas.height - h) / 2;
    return choices.map((_, i) => ({ x: x0 + i * (w + gap), y, w, h }));
  },

  drawIcon(ctx, id, cx, cy, size) {
    // 원형 배지 배경
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.arc(cx, cy, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    if (id === 'icicle') {
      ctx.fillStyle = '#bfe8ff';
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.4, cy - size * 0.55);
      ctx.lineTo(cx + size * 0.4, cy - size * 0.55);
      ctx.lineTo(cx, cy + size * 0.65);
      ctx.closePath();
      ctx.fill();
    } else if (id === 'frostRing') {
      ctx.strokeStyle = '#8cd0ff';
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2);
      ctx.stroke();
    } else if (id === 'orbital') {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + size * 0.6, cy - size * 0.4, size * 0.18, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === 'heal') {
      ctx.fillStyle = '#e05050';
      ctx.fillRect(cx - size * 0.15, cy - size * 0.55, size * 0.3, size * 1.1);
      ctx.fillRect(cx - size * 0.55, cy - size * 0.15, size * 1.1, size * 0.3);
      ctx.fillStyle = '#fff';
      ctx.fillRect(cx - size * 0.07, cy - size * 0.45, size * 0.14, size * 0.9);
      ctx.fillRect(cx - size * 0.45, cy - size * 0.07, size * 0.9, size * 0.14);
    } else if (id === 'blizzard') {
      ctx.strokeStyle = '#8cd0ff';
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * size * 0.25, cy + Math.sin(a) * size * 0.25, size * 0.4, a, a + Math.PI * 0.9);
        ctx.stroke();
      }
    } else if (id === 'chain') {
      ctx.strokeStyle = '#7fe8ff';
      ctx.fillStyle = '#7fe8ff';
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.55, cy - size * 0.35);
      ctx.lineTo(cx - size * 0.15, cy + size * 0.15);
      ctx.lineTo(cx + size * 0.15, cy - size * 0.15);
      ctx.lineTo(cx + size * 0.55, cy + size * 0.35);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx - size * 0.55, cy - size * 0.35, size * 0.14, 0, Math.PI * 2);
      ctx.arc(cx + size * 0.55, cy + size * 0.35, size * 0.14, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === 'nova') {
      ctx.strokeStyle = '#a8d8ff';
      ctx.fillStyle = '#a8d8ff';
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.22, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * size * 0.32, cy + Math.sin(a) * size * 0.32);
        ctx.lineTo(cx + Math.cos(a) * size * 0.65, cy + Math.sin(a) * size * 0.65);
        ctx.stroke();
      }
    } else if (id === 'trail') {
      ctx.strokeStyle = '#8cd0ff';
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.6, cy + size * 0.4);
      ctx.bezierCurveTo(cx - size * 0.1, cy + size * 0.7, cx + size * 0.1, cy - size * 0.7, cx + size * 0.6, cy - size * 0.4);
      ctx.stroke();
      ctx.fillStyle = 'rgba(140, 208, 255, 0.5)';
      [[-0.45, 0.42], [0, 0], [0.45, -0.42]].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.arc(cx + dx * size, cy + dy * size, size * 0.16, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (id === 'hail') {
      ctx.fillStyle = 'rgba(140, 170, 200, 0.4)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + size * 0.55, size * 0.5, size * 0.13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#9ab8d0';
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.3, cy - size * 0.05);
      ctx.lineTo(cx - size * 0.3, cy + size * 0.3);
      ctx.moveTo(cx + size * 0.25, cy + size * 0.05);
      ctx.lineTo(cx + size * 0.25, cy + size * 0.35);
      ctx.stroke();
      ctx.fillStyle = '#8ca8c8';
      ctx.beginPath();
      ctx.arc(cx - size * 0.3, cy - size * 0.3, size * 0.22, 0, Math.PI * 2);
      ctx.arc(cx + size * 0.25, cy - size * 0.15, size * 0.16, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === 'flakes') {
      ctx.strokeStyle = '#cfeaff';
      ctx.fillStyle = '#cfeaff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.12, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const ex = cx + Math.cos(a) * size * 0.6, ey = cy + Math.sin(a) * size * 0.6;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex + Math.cos(a + Math.PI * 0.75) * size * 0.18, ey + Math.sin(a + Math.PI * 0.75) * size * 0.18);
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex + Math.cos(a - Math.PI * 0.75) * size * 0.18, ey + Math.sin(a - Math.PI * 0.75) * size * 0.18);
        ctx.stroke();
      }
    } else {
      // 알 수 없는 id 폴백: 기본 흰 원
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  // 설명을 카드 폭에 맞춰 최대 2줄로 줄바꿈
  wrap2(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return [text];
    const words = text.split(' ');
    let line1 = '';
    while (words.length && ctx.measureText(line1 + words[0]).width <= maxW) {
      line1 += (line1 ? ' ' : '') + words.shift();
    }
    return [line1 || words.shift(), words.join(' ')];
  },

  drawLevelUp(ctx, choices, canvas) {
    ctx.fillStyle = 'rgba(10, 20, 30, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const rects = UI.levelUpCardRects(choices, canvas);
    const cx = canvas.width / 2;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('LEVEL UP!', cx, rects[0].y - 36);
    choices.forEach((c, i) => {
      const r = rects[i];
      ctx.fillStyle = '#1a2540';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = '#9fd8ef';
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      // 좌상단 키 표시
      ctx.fillStyle = '#9fd8ef';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(String(i + 1), r.x + 10, r.y + 22);
      // 아이콘 / 이름 / 설명
      UI.drawIcon(ctx, c.id, r.x + r.w / 2, r.y + 84, 38);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(c.name, r.x + r.w / 2, r.y + 160);
      ctx.fillStyle = '#b8c8d8';
      ctx.font = '13px sans-serif';
      UI.wrap2(ctx, c.desc, r.w - 24).forEach((line, li) => {
        ctx.fillText(line, r.x + r.w / 2, r.y + 190 + li * 18);
      });
    });
    ctx.fillStyle = '#9fd8ef';
    ctx.font = '15px sans-serif';
    ctx.fillText('클릭 또는 1/2/3 키로 선택', cx, rects[0].y + rects[0].h + 32);
  },

  drawGameOver(ctx, elapsed, player, canvas) {
    ctx.fillStyle = 'rgba(10, 20, 30, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2, cy = canvas.height / 2;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('GAME OVER', cx, cy - 40);
    ctx.font = '20px sans-serif';
    ctx.fillText(`생존 시간 ${UI.fmtTime(elapsed)}  ·  레벨 ${player.level}`, cx, cy + 8);
    ctx.fillStyle = '#9fd8ef';
    ctx.fillText('R 키로 재시작', cx, cy + 44);
  },
};
