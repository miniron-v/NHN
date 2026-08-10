// Glacier Survivors - Feel/연출 엔진 (화면 흔들림, 히트스톱, 파티클, 플래시)
// API: FX.shake(px), FX.hitstop(sec), FX.burst(x, y, color, count),
//      FX.flash(cssColor, alpha), FX.hurt()
const FX = {
  parts: [],
  shakeMag: 0,
  hitstopT: 0,
  flashA: 0,
  flashColor: '#ffffff',
  hurtA: 0,

  reset() {
    this.parts = [];
    this.shakeMag = 0;
    this.hitstopT = 0;
    this.flashA = 0;
    this.hurtA = 0;
  },

  shake(m) { this.shakeMag = Math.max(this.shakeMag, m); },
  hitstop(t) { this.hitstopT = Math.max(this.hitstopT, t); },
  flash(color, a) { this.flashColor = color; this.flashA = Math.max(this.flashA, a); },
  hurt() { this.hurtA = 0.4; },

  burst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 180;
      this.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 2 + Math.random() * 3, t: 0.5 + Math.random() * 0.3, max: 0.8, color });
    }
    if (this.parts.length > 600) this.parts.splice(0, this.parts.length - 600); // 상한
  },

  update(dt) {
    if (this.hitstopT > 0) this.hitstopT -= dt;
    this.shakeMag *= Math.pow(0.002, dt); // 빠른 감쇠
    if (this.shakeMag < 0.3) this.shakeMag = 0;
    this.flashA = Math.max(0, this.flashA - dt * 2.5);
    this.hurtA = Math.max(0, this.hurtA - dt * 1.6);
    for (const p of this.parts) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.92; p.vy *= 0.92;
      p.t -= dt;
    }
    this.parts = this.parts.filter((p) => p.t > 0);
  },

  offset() {
    const m = this.shakeMag;
    return m ? { x: (Math.random() - 0.5) * m * 2, y: (Math.random() - 0.5) * m * 2 } : { x: 0, y: 0 };
  },

  drawWorld(ctx) { // 카메라 변환 안에서 호출
    for (const p of this.parts) {
      ctx.globalAlpha = Math.max(0, p.t / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  drawScreen(ctx, canvas) { // 화면 좌표계, HUD보다 먼저
    if (this.flashA > 0) {
      ctx.globalAlpha = this.flashA;
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (this.hurtA > 0) {
      ctx.globalAlpha = this.hurtA;
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.globalAlpha = 1;
  },
};
