// Glacier Survivors - 자석 제단 (밟고 3초 유지하면 필드의 젬을 끌어당김)
// 계약: class AltarManager
//   .reset()                    // 라운드 시작 시 초기화
//   .update(dt, player) -> boolean // 발동 순간 true (main이 젬 흡인 처리)
//   .draw(ctx, player)          // 월드 좌표계(카메라 translate 안)에서 호출
// holes.js와 같은 청크 해시 절차 생성 (솔트가 달라 구멍과 다른 배치).

class AltarManager {
  constructor() {
    this.chunk = CONFIG.altar.chunk;
    this.safeRadius = 200; // 원점 주변 제단 금지 반경
    this.reset();
  }

  reset() {
    this.used = new Set();   // 발동한 제단의 "cx,cy" 키
    this.progress = 0;       // 현재 제단 위 체류 시간(초)
    this.active = null;      // 현재 밟고 있는 제단
  }

  // (cx, cy, k) -> [0, 1) 결정적 의사난수 (holes와 다른 솔트: k+7, 계수 변경)
  hash(cx, cy, k) {
    const s = Math.sin(cx * 269.5 + cy * 183.3 + (k + 7) * 419.2) * 43758.5453;
    return s - Math.floor(s);
  }

  // 청크 하나의 제단 (없으면 null)
  altarAt(cx, cy) {
    if (this.hash(cx, cy, 0) >= CONFIG.altar.prob) return null;
    const x = (cx + 0.2 + this.hash(cx, cy, 1) * 0.6) * this.chunk; // 청크 내 20~80%
    const y = (cy + 0.2 + this.hash(cx, cy, 2) * 0.6) * this.chunk;
    if (x * x + y * y < this.safeRadius * this.safeRadius) return null;
    // 구멍과 겹침 방지: 후보 위치 주변 구멍 청크(±1)를 조회
    if (typeof holeMgr !== 'undefined' && holeMgr) {
      const hcx = Math.floor(x / holeMgr.chunk), hcy = Math.floor(y / holeMgr.chunk);
      for (let oy = -1; oy <= 1; oy++)
        for (let ox = -1; ox <= 1; ox++) {
          const h = holeMgr.holeAt(hcx + ox, hcy + oy);
          if (h && Math.hypot(x - h.x, y - h.y) < h.rx + CONFIG.altar.radius + 30) return null;
        }
    }
    return { x, y, key: cx + ',' + cy };
  }

  // 플레이어 주변 화면+여유 범위의 제단 목록
  altarsInView(px, py) {
    const rw = innerWidth / 2 / CONFIG.camera.zoom + 100, rh = innerHeight / 2 / CONFIG.camera.zoom + 100;
    const c0x = Math.floor((px - rw) / this.chunk), c1x = Math.floor((px + rw) / this.chunk);
    const c0y = Math.floor((py - rh) / this.chunk), c1y = Math.floor((py + rh) / this.chunk);
    const altars = [];
    for (let cy = c0y; cy <= c1y; cy++)
      for (let cx = c0x; cx <= c1x; cx++) {
        const a = this.altarAt(cx, cy);
        if (a) altars.push(a);
      }
    return altars;
  }

  // 미사용 제단 위 체류 시간 누적, holdTime 도달 시 발동(true)
  update(dt, player) {
    this.active = null;
    for (const a of this.altarsInView(player.x, player.y)) {
      if (this.used.has(a.key)) continue;
      if (Math.hypot(player.x - a.x, player.y - a.y) <= CONFIG.altar.radius) { this.active = a; break; }
    }
    if (!this.active) { this.progress = 0; return false; }
    this.progress += dt;
    if (this.progress >= CONFIG.altar.holdTime) {
      this.used.add(this.active.key);
      this.progress = 0;
      FX.flash('#ffe9a0', 0.3);
      FX.burst(this.active.x, this.active.y, '#ffe9a0', 20);
      this.active = null;
      return true;
    }
    return false;
  }

  draw(ctx, player) {
    const R = CONFIG.altar.radius;
    for (const a of this.altarsInView(player.x, player.y)) {
      const used = this.used.has(a.key);
      ctx.fillStyle = used ? 'rgba(120, 130, 140, 0.35)' : 'rgba(210, 240, 255, 0.45)'; // 원 플랫폼
      ctx.strokeStyle = used ? '#5a6570' : '#2e5a78';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(a.x, a.y, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = used ? 'rgba(90, 101, 112, 0.6)' : 'rgba(46, 90, 120, 0.6)'; // 안쪽 동심원
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(a.x, a.y, R * 0.6, 0, Math.PI * 2); ctx.stroke();
      if (!used) { // 중앙 크리스탈 (마름모) + 은은한 빛
        ctx.fillStyle = 'rgba(255, 233, 160, 0.25)';
        ctx.beginPath(); ctx.arc(a.x, a.y, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffe9a0';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y - 12); ctx.lineTo(a.x + 8, a.y); ctx.lineTo(a.x, a.y + 12); ctx.lineTo(a.x - 8, a.y);
        ctx.closePath(); ctx.fill();
      }
      if (this.active === a && this.progress > 0) { // 3초 진행 호
        ctx.strokeStyle = '#ffe9a0';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(a.x, a.y, R + 5, -Math.PI / 2, -Math.PI / 2 + (this.progress / CONFIG.altar.holdTime) * Math.PI * 2);
        ctx.stroke();
      }
    }
  }
}
