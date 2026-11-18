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
    // === UNDEAD FACTION ===
    case 'ghoul':
      return {
        id: nextEnemyId++,
        archetype,
        faction: 'undead',
        isBoss: false,
        name: 'Risen Ghoul',
        x,
        y,
        vx: 0,
        vy: 0,
        facing: 0,
        radius: 13,
        life: 30 * hpScale,
        maxLife: 30 * hpScale,
        speed: 92 + Math.min(35, elapsedSeconds * 0.14),
        damage: 10 * (1 + elapsedSeconds / 150),
        xpValue: 10,
        armor: 3,
        resistances: { chaos: 0.2 },
        color: '#8f9887',
        hitFlash: 0,
        ailments: [],
        abilityTimer: 0,
        orbitHitCooldown: 0,
      };
    case 'skeleton_warrior':
      return {
        id: nextEnemyId++,
        archetype,
        faction: 'undead',
        isBoss: false,
        name: 'Skeleton Warrior',
        x,
        y,
        vx: 0,
        vy: 0,
        facing: 0,
        radius: 14,
        life: 52 * hpScale,
        maxLife: 52 * hpScale,
        speed: 84 + Math.min(30, elapsedSeconds * 0.12),
        damage: 13 * (1 + elapsedSeconds / 145),
        xpValue: 15,
        armor: 14,
        resistances: { cold: 0.15 },
        color: '#c9bfa8',
        hitFlash: 0,
        ailments: [],
        abilityTimer: 0,
        orbitHitCooldown: 0,
      };
    case 'skeleton_archer':
      return {
        id: nextEnemyId++,
        archetype,
        faction: 'undead',
        isBoss: false,
        name: 'Skeletal Cleric',
        x,
        y,
        vx: 0,
        vy: 0,
        facing: 0,
        radius: 14,
        life: 44 * hpScale,
        maxLife: 44 * hpScale,
        speed: 74,
        damage: 14 * (1 + elapsedSeconds / 130),
        xpValue: 22,
        armor: 6,
        resistances: { chaos: 0.25 },
        color: '#b8ae96',
        hitFlash: 0,
        ailments: [],
        abilityTimer: 2.3,
        orbitHitCooldown: 0,
      };
    case 'wraith':
      return {
        id: nextEnemyId++,
        archetype,
        faction: 'undead',
        isBoss: false,
        name: 'Grave Wraith',
        x,
        y,
        vx: 0,
        vy: 0,
        facing: 0,
        radius: 13,
        life: 36 * hpScale,
        maxLife: 36 * hpScale,
        speed: 140 + Math.min(45, elapsedSeconds * 0.18),
        damage: 14 * (1 + elapsedSeconds / 140),
        xpValue: 18,
        armor: 0,
        resistances: { physical: 0.2, cold: 0.3 },
        color: '#7dd3fc',
        hitFlash: 0,
        ailments: [],
        abilityTimer: 0,
        orbitHitCooldown: 0,
      };
    case 'lich':
      return {
        id: nextEnemyId++,
        archetype,
        faction: 'undead',
        isBoss: true,
        name: 'Marrow Lich',
        x,
        y,
        vx: 0,
        vy: 0,
        facing: 0,
        radius: 32,
        life: 700 * hpScale,
        maxLife: 700 * hpScale,
        speed: 78,
        damage: 26 * (1 + elapsedSeconds / 120),
        xpValue: 180,
        armor: 26,
        resistances: { cold: 0.3, chaos: 0.35 },
        color: '#a855f7',
        hitFlash: 0,
        ailments: [],
        abilityTimer: 2.2,
        orbitHitCooldown: 0,
      };

    // === DEMON FACTION ===
    case 'imp':
      return {
        id: nextEnemyId++,
        archetype,
        faction: 'demon',
        isBoss: false,
        name: 'Ash Imp',
        x,
        y,
        vx: 0,
        vy: 0,
        facing: 0,
        radius: 11,
        life: 24 * hpScale,
        maxLife: 24 * hpScale,
        speed: 148 + Math.min(48, elapsedSeconds * 0.2),
        damage: 12 * (1 + elapsedSeconds / 140),
        xpValue: 14,
        armor: 2,
        resistances: { fire: 0.25 },
        color: '#fb7185',
        hitFlash: 0,
        ailments: [],
        abilityTimer: 0,
        orbitHitCooldown: 0,
      };
    case 'hellhound':
      return {
        id: nextEnemyId++,
        archetype,
        faction: 'demon',
        isBoss: false,
        name: 'Cinder Hound',
        x,
        y,
        vx: 0,
        vy: 0,
        facing: 0,
        radius: 14,
        life: 38 * hpScale,
        maxLife: 38 * hpScale,
        speed: 136 + Math.min(40, elapsedSeconds * 0.16),
        damage: 16 * (1 + elapsedSeconds / 135),
        xpValue: 18,
        armor: 6,
        resistances: { fire: 0.35 },
        color: '#f97316',
        hitFlash: 0,
        ailments: [],
        abilityTimer: 0,
        orbitHitCooldown: 0,
      };
    case 'demon_brute':
      return {
        id: nextEnemyId++,
        archetype,
        faction: 'demon',
        isBoss: false,
        name: 'Demon Brute',
        x,
        y,
        vx: 0,
        vy: 0,
        facing: 0,
        radius: 21,
        life: 105 * hpScale,
        maxLife: 105 * hpScale,
        speed: 62,
        damage: 20 * (1 + elapsedSeconds / 130),
        xpValue: 28,
        armor: 28,
        resistances: { fire: 0.3, physical: 0.15 },
        color: '#dc2626',
        hitFlash: 0,
        ailments: [],
        abilityTimer: 0,
        orbitHitCooldown: 0,
      };
    case 'demon_lord':
      return {
        id: nextEnemyId++,
        archetype,
        faction: 'demon',
        isBoss: true,
        name: 'Abyssal Demon Lord',
        x,
        y,
        vx: 0,
        vy: 0,
        facing: 0,
        radius: 36,
        life: 820 * hpScale,
        maxLife: 820 * hpScale,
        speed: 84,
        damage: 30 * (1 + elapsedSeconds / 120),
        xpValue: 210,
        armor: 34,
        resistances: { fire: 0.35, chaos: 0.25 },
        color: '#b91c1c',
        hitFlash: 0,
        ailments: [],
        abilityTimer: 2.3,
        orbitHitCooldown: 0,
      };
  }
}

export function pickArchetypeForTime(elapsed: number, rng: () => number): EnemyArchetype {
  const r = rng();
  if (elapsed < 25) {
    if (r < 0.55) return 'ghoul';
    if (r < 0.85) return 'skeleton_warrior';
    return 'imp';
  }
  if (elapsed < 55) {
    if (r < 0.28) return 'ghoul';
    if (r < 0.54) return 'skeleton_warrior';
    if (r < 0.74) return 'imp';
    if (r < 0.9) return 'hellhound';
    return 'demon_brute';
  }
  if (elapsed < 95) {
    if (r < 0.2) return 'skeleton_warrior';
    if (r < 0.38) return 'imp';
    if (r < 0.55) return 'hellhound';
    if (r < 0.72) return 'wraith';
    if (r < 0.86) return 'demon_brute';
    return 'skeleton_archer';
  }
  if (r < 0.18) return 'skeleton_warrior';
  if (r < 0.34) return 'hellhound';
  if (r < 0.52) return 'wraith';
  if (r < 0.7) return 'demon_brute';
  if (r < 0.85) return 'skeleton_archer';
  return 'imp';
}
