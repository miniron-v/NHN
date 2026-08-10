// Glacier Survivors - 전역 튜닝 상수. 모든 밸런스 수치는 여기서만 조정한다.
const CONFIG = {
  player: {
    radius: 13,
    accel: 850,        // 입력 시 가속도 (px/s^2) - 빙판이라 즉발이 아님
    friction: 0.45,    // 초당 속도 잔존율 (낮을수록 잘 안 미끄러짐). 0.45 = 1초 후 45% 유지
    maxSpeed: 370,     // 속도 상한 (px/s)
    maxHp: 100,
    pickupRange: 70,   // XP 젬 흡수 반경
    xpBase: 10,        // 레벨업 필요 XP = xpBase + xpGrowth * (level - 1)
    xpGrowth: 8,
    invulnTime: 0.5,   // 피격 후 무적 시간(초)
  },
  enemies: {
    // 종류: 눈송이 정령(약함/빠름), 눈사람(중간), 얼음 골렘(느림/강함)
    types: {
      wisp:  { radius: 10, hp: 12,  speed: 95,  damage: 8,  xp: 1,  color: '#9fd8ef' },
      snowman:{ radius: 14, hp: 35,  speed: 60,  damage: 14, xp: 4,  color: '#e8f4f8' },
      golem: { radius: 20, hp: 110, speed: 40,  damage: 25, xp: 12, color: '#5b8ca8' },
    },
    spawnInterval: 1.2,     // 기본 스폰 간격(초), 시간이 지나며 감소
    spawnIntervalMin: 0.25,
    spawnRampTime: 240,     // 이 시간(초)에 걸쳐 간격이 최소까지 감소
    spawnDist: 60,          // 화면 밖 여유 거리
    hpRampRate: 0.012,      // 초당 체력 증가 비율 (elapsed * rate 만큼 배율 증가)
    maxCount: 250,
  },
  weapons: {
    // 고드름 발사: 가장 가까운 적에게 자동 발사
    icicle: { damage: 10, speed: 420, cooldown: 0.9, radius: 5, pierce: 1 },
    // 서리 고리: 주변 지속 데미지 오라
    frostRing: { damage: 6, tick: 0.5, range: 80 },
    // 회전 눈덩이: 플레이어 주위 공전
    orbital: { damage: 12, radius: 9, dist: 70, rotSpeed: 2.5, count: 1 },
  },
  gem: { radius: 5, magnetSpeed: 380, dropCount: 2, scatter: 48 },
};
