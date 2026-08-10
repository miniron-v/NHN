// Glacier Survivors - 전역 튜닝 상수. 모든 밸런스 수치는 여기서만 조정한다.
const CONFIG = {
  player: {
    radius: 13,
    accel: 1000,       // 입력 시 가속도 (px/s^2) - 빙판이라 즉발이 아님
    friction: 0.45,    // 초당 속도 잔존율 (낮을수록 잘 안 미끄러짐)
    maxSpeed: 470,     // 속도 상한 (px/s)
    maxHp: 100,
    pickupRange: 70,   // XP 젬 흡수 반경
    xpBase: 5,         // 레벨업 필요 XP = xpBase + xpGrowth * (level - 1)
    xpGrowth: 4,
    invulnTime: 0.5,   // 피격 후 무적 시간(초)
  },
  enemies: {
    // 종류: 눈송이 정령(약함/빠름), 눈사람(중간), 얼음 골렘(느림/강함)
    types: {
      wisp:  { radius: 10, hp: 12,  speed: 95,  damage: 8,  xp: 1,  color: '#9fd8ef' },
      snowman:{ radius: 14, hp: 35,  speed: 60,  damage: 14, xp: 4,  color: '#e8f4f8' },
      golem: { radius: 20, hp: 110, speed: 40,  damage: 25, xp: 12, color: '#5b8ca8' },
    },
    // 보스: 주기적으로 등장하는 거대 개체. xp는 스폰 시점 경과 시간 기준
    // (xpBase + xpPerSec * elapsed) - 젬 2개 드롭 포함 약 3레벨 분량
    boss: { radius: 55, hp: 1800, speed: 38, damage: 40, color: '#3d6e8e', interval: 90, xpBase: 100, xpPerSec: 0.65 },
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
    // 눈보라: 주변 랜덤 지점에 폭풍 AoE 다발
    blizzard: { damage: 15, cooldown: 2.4, bursts: 2, radius: 85, spawnRange: 320, life: 0.5 },
    // 냉기 사슬: 적에서 적으로 튀는 서리 번개
    chain: { damage: 14, cooldown: 1.3, chains: 3, range: 280, jump: 190 },
    // 파편 노바: 전방위 파편 방사
    nova: { damage: 8, cooldown: 1.7, shards: 8, speed: 400, radius: 4 },
    // 빙결 궤적: 고속 이동 시 지나간 자리에 데미지 얼음길
    trail: { damage: 5, tick: 0.35, patchR: 26, life: 2.2, minSpeed: 180, dropGap: 30 },
    // 우박: 그림자 예고 후 낙하 충격 AoE
    hail: { damage: 22, cooldown: 2.2, stones: 2, radius: 70, delay: 0.6, spawnRange: 380 },
    // 유도 눈송이: 적을 쫓는 유도탄
    flakes: { damage: 9, cooldown: 1.5, count: 2, speed: 250, turnRate: 4, radius: 7, life: 4 },
  },
  gem: { radius: 5, magnetSpeed: 380, dropCount: 2, scatter: 48 },
  camera: { zoom: 1.2 }, // 1.2배 확대(줌인)

};
