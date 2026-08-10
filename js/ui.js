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
    ctx.fillStyle = '#234';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Lv ${player.level}`, 248, 52);
    // 생존 시간
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(UI.fmtTime(elapsed), canvas.width / 2, 34);
  },

  drawLevelUp(ctx, choices, canvas) {
    ctx.fillStyle = 'rgba(10, 20, 30, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const w = 420, h = 70, cx = canvas.width / 2, top = canvas.height / 2 - 140;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('LEVEL UP!', cx, top - 24);
    choices.forEach((c, i) => {
      const y = top + i * (h + 14);
      ctx.strokeStyle = '#9fd8ef';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - w / 2, y, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = '18px sans-serif';
      ctx.fillText(`${i + 1}. ${c.name} - ${c.desc}`, cx, y + h / 2 + 6);
    });
    ctx.fillStyle = '#9fd8ef';
    ctx.font = '15px sans-serif';
    ctx.fillText('1/2/3 키로 선택', cx, top + 3 * (h + 14) + 16);
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
