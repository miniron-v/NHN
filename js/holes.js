// Glacier Survivors - 빙하 구멍 (추락 위험 지형)
// 계약: class HoleManager
//   .check(player) -> boolean  // 타원 깊숙이 들어가면 true (main이 게임오버 처리)
//   .draw(ctx, player)         // 월드 좌표계(카메라 translate 안)에서 호출
// 저장 없는 결정적 절차 생성: 청크 좌표 해시로 항상 같은 자리에 같은 구멍.

class HoleManager {
  constructor() {
    this.chunk = 400;      // 청크 한 변(px)
    this.safeRadius = 300; // 원점 주변 구멍 금지 반경
  }

  // (cx, cy, k) -> [0, 1) 결정적 의사난수
  hash(cx, cy, k) {
    const s = Math.sin(cx * 127.1 + cy * 311.7 + k * 74.7) * 43758.5453;
    return s - Math.floor(s);
  }

  // 청크 하나의 구멍 (없으면 null)
  holeAt(cx, cy) {
    if (this.hash(cx, cy, 0) >= 0.4) return null;
    const rx = 40 + this.hash(cx, cy, 3) * 35;
    const x = (cx + 0.15 + this.hash(cx, cy, 1) * 0.7) * this.chunk;
    const y = (cy + 0.15 + this.hash(cx, cy, 2) * 0.7) * this.chunk;
    if (x * x + y * y < this.safeRadius * this.safeRadius) return null;
    return { x, y, rx, ry: rx * 0.7 };
  }

  // 플레이어 주변 화면+여유 범위의 구멍 목록 (매 프레임 재계산해도 청크 수 적음)
  holesInView(px, py) {
    const rw = innerWidth / 2 + 100, rh = innerHeight / 2 + 100;
    const c0x = Math.floor((px - rw) / this.chunk), c1x = Math.floor((px + rw) / this.chunk);
    const c0y = Math.floor((py - rh) / this.chunk), c1y = Math.floor((py + rh) / this.chunk);
    const holes = [];
    for (let cy = c0y; cy <= c1y; cy++)
      for (let cx = c0x; cx <= c1x; cx++) {
        const h = this.holeAt(cx, cy);
        if (h) holes.push(h);
      }
    return holes;
  }

  // 플레이어 중심이 타원 깊숙이(0.55) 들어가면 추락
  check(player) {
    return this.holesInView(player.x, player.y).some((h) => {
      const dx = (player.x - h.x) / h.rx, dy = (player.y - h.y) / h.ry;
      return dx * dx + dy * dy < 0.55;
    });
  }

  ellipse(ctx, x, y, rx, ry) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  }

  // "살짝 아래서 본 탑뷰": 위쪽 안쪽 벽이 보이는 레이어 3장 + 물 반사
  draw(ctx, player) {
    for (const h of this.holesInView(player.x, player.y)) {
      ctx.fillStyle = '#4a7590'; // 1. 얼음 벽
      this.ellipse(ctx, h.x, h.y, h.rx, h.ry);
      ctx.fill();
      ctx.fillStyle = '#0a1d30'; // 2. 짙은 물 (아래로 내려 위쪽 벽 띠 노출, 0.15+0.85=림 안쪽 정확히)
      this.ellipse(ctx, h.x, h.y + h.ry * 0.15, h.rx * 0.85, h.ry * 0.85);
      ctx.fill();
      ctx.fillStyle = 'rgba(140, 190, 220, 0.35)'; // 물 반사
      this.ellipse(ctx, h.x, h.y - h.ry * 0.1, h.rx * 0.55, h.ry * 0.16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; // 3. 밝은 얼음 림
      ctx.lineWidth = 2;
      this.ellipse(ctx, h.x, h.y, h.rx, h.ry);
      ctx.stroke();
    }
  }
}
