import type { Enemy, EnemyArchetype } from './entities.ts';

let nextEnemyId = 1;

export function resetEnemyIds(): void {
  nextEnemyId = 1;
}

export function createEnemy(
  archetype: EnemyArchetype,
  x: number,
  y: number,
  elapsedSeconds: number,
): Enemy {
  const minuteScale = 1 + elapsedSeconds / 55;
  const hpScale = Math.pow(minuteScale, 1.32);

  switch (archetype) {
    case 'thrall':
      return {
        id: nextEnemyId++,
        archetype,
        name: 'Hollowed Thrall',
        x,
        y,
        vx: 0,
        vy: 0,
        radius: 13,
        life: 32 * hpScale,
        maxLife: 32 * hpScale,
        speed: 88 + Math.min(40, elapsedSeconds * 0.15),
        damage: 10 * (1 + elapsedSeconds / 150),
        xpValue: 10,
        armor: 4,
        resistances: {},
        color: '#94a3b8',
        hitFlash: 0,
        ailments: [],
        abilityTimer: 0,
        orbitHitCooldown: 0,
      };
    case 'stalker':
      return {
        id: nextEnemyId++,
        archetype,
        name: 'Ash Stalker',
        x,
        y,
        vx: 0,
        vy: 0,
        radius: 11,
        life: 22 * hpScale,
        maxLife: 22 * hpScale,
        speed: 148 + Math.min(50, elapsedSeconds * 0.2),
        damage: 12 * (1 + elapsedSeconds / 140),
        xpValue: 14,
        armor: 2,
        resistances: { fire: 0.15 },
        color: '#fb923c',
        hitFlash: 0,
        ailments: [],
        abilityTimer: 0,
        orbitHitCooldown: 0,
      };
    case 'bulwark':
      return {
        id: nextEnemyId++,
        archetype,
        name: 'Iron Bulwark',
        x,
        y,
        vx: 0,
        vy: 0,
        radius: 20,
        life: 95 * hpScale,
        maxLife: 95 * hpScale,
        speed: 58,
        damage: 18 * (1 + elapsedSeconds / 130),
        xpValue: 26,
        armor: 28,
        resistances: { fire: 0.2, cold: 0.2, lightning: 0.2 },
        color: '#f59e0b',
        hitFlash: 0,
        ailments: [],
        abilityTimer: 0,
        orbitHitCooldown: 0,
      };
    case 'volatile':
      return {
        id: nextEnemyId++,
        archetype,
        name: 'Volatile Husk',
        x,
        y,
        vx: 0,
        vy: 0,
        radius: 14,
        life: 36 * hpScale,
        maxLife: 36 * hpScale,
        speed: 112,
        damage: 24 * (1 + elapsedSeconds / 120),
        xpValue: 20,
        armor: 0,
        resistances: { chaos: 0.25 },
        color: '#f43f5e',
        hitFlash: 0,
        ailments: [],
        abilityTimer: 0,
        orbitHitCooldown: 0,
      };
    case 'weaver':
      return {
        id: nextEnemyId++,
        archetype,
        name: 'Void Weaver',
        x,
        y,
        vx: 0,
        vy: 0,
        radius: 15,
        life: 48 * hpScale,
        maxLife: 48 * hpScale,
        speed: 75,
        damage: 14 * (1 + elapsedSeconds / 130),
        xpValue: 24,
        armor: 6,
        resistances: { chaos: 0.35, lightning: 0.2 },
        color: '#c084fc',
        hitFlash: 0,
        ailments: [],
        abilityTimer: 2.2,
        orbitHitCooldown: 0,
      };
    case 'boss':
      return {
        id: nextEnemyId++,
        archetype,
        name: elapsedSeconds > 110 ? 'Rift Colossus' : 'Ashen Warden',
        x,
        y,
        vx: 0,
        vy: 0,
        radius: 34,
        life: 720 * hpScale,
        maxLife: 720 * hpScale,
        speed: 82,
        damage: 28 * (1 + elapsedSeconds / 120),
        xpValue: 180,
        armor: 32,
        resistances: { fire: 0.25, cold: 0.25, lightning: 0.25, chaos: 0.2 },
        color: '#ef4444',
        hitFlash: 0,
        ailments: [],
        abilityTimer: 2.6,
        orbitHitCooldown: 0,
      };
  }
}

export function pickArchetypeForTime(elapsed: number, rng: () => number): EnemyArchetype {
  const r = rng();
  if (elapsed < 25) {
    return r < 0.8 ? 'thrall' : 'stalker';
  }
  if (elapsed < 55) {
    if (r < 0.52) return 'thrall';
    if (r < 0.82) return 'stalker';
    return 'bulwark';
  }
  if (elapsed < 95) {
    if (r < 0.35) return 'thrall';
    if (r < 0.62) return 'stalker';
    if (r < 0.8) return 'bulwark';
    if (r < 0.92) return 'volatile';
    return 'weaver';
  }
  if (r < 0.25) return 'thrall';
  if (r < 0.5) return 'stalker';
  if (r < 0.68) return 'bulwark';
  if (r < 0.84) return 'volatile';
  return 'weaver';
}
