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
    case 'zombie':
      return {
        id: nextEnemyId++,
        archetype,
        faction: 'undead',
        isBoss: false,
        name: 'Risen Zombie',
        x,
        y,
        vx: 0,
        vy: 0,
        facing: 0,
        radius: 14,
        life: 38 * hpScale,
        maxLife: 38 * hpScale,
        speed: 56 + Math.min(20, elapsedSeconds * 0.08),
        damage: 11 * (1 + elapsedSeconds / 150),
        xpValue: 10,
        armor: 4,
        resistances: { chaos: 0.2 },
        color: '#7f8c72',
        hitFlash: 0,
        ailments: [],
        abilityTimer: 0,
        orbitHitCooldown: 0,
      };
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
        radius: 12,
        life: 24 * hpScale,
        maxLife: 24 * hpScale,
        speed: 126 + Math.min(40, elapsedSeconds * 0.16),
        damage: 10 * (1 + elapsedSeconds / 145),
        xpValue: 12,
        armor: 2,
        resistances: { chaos: 0.15 },
        color: '#a3a895',
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
    case 'gravemaw':
      return {
        id: nextEnemyId++,
        archetype,
        faction: 'undead',
        isBoss: false,
        name: 'Gravemaw',
        x,
        y,
        vx: 0,
        vy: 0,
        facing: 0,
        radius: 20,
        life: 98 * hpScale,
        maxLife: 98 * hpScale,
        speed: 64,
        damage: 19 * (1 + elapsedSeconds / 135),
        xpValue: 26,
        armor: 22,
        resistances: { chaos: 0.25 },
        color: '#6b7280',
        hitFlash: 0,
        ailments: [],
        abilityTimer: 0,
        orbitHitCooldown: 0,
      };
    case 'revenant_knight':
      return {
        id: nextEnemyId++,
        archetype,
        faction: 'undead',
        isBoss: false,
        name: 'Revenant Knight',
        x,
        y,
        vx: 0,
        vy: 0,
        facing: 0,
        radius: 16,
        life: 72 * hpScale,
        maxLife: 72 * hpScale,
        speed: 112 + Math.min(35, elapsedSeconds * 0.14),
        damage: 17 * (1 + elapsedSeconds / 130),
        xpValue: 24,
        armor: 26,
        resistances: { cold: 0.2, physical: 0.15 },
        color: '#94a3b8',
        hitFlash: 0,
        ailments: [],
        abilityTimer: 0,
        orbitHitCooldown: 0,
      };
    case 'skeleton_mage':
      return {
        id: nextEnemyId++,
        archetype,
        faction: 'undead',
        isBoss: false,
        name: 'Skeleton Mage',
        x,
        y,
        vx: 0,
        vy: 0,
        facing: 0,
        radius: 15,
        life: 58 * hpScale,
        maxLife: 58 * hpScale,
        speed: 78,
        damage: 16 * (1 + elapsedSeconds / 120),
        xpValue: 28,
        armor: 8,
        resistances: { cold: 0.3, lightning: 0.25 },
        color: '#818cf8',
        hitFlash: 0,
        ailments: [],
        abilityTimer: 1.9,
        orbitHitCooldown: 0,
      };
    case 'barrow_watchman':
      return {
        id: nextEnemyId++,
        archetype,
        faction: 'undead',
        isBoss: false,
        name: 'Barrow Watchman',
        x,
        y,
        vx: 0,
        vy: 0,
        facing: 0,
        radius: 15,
        life: 64 * hpScale,
        maxLife: 64 * hpScale,
        speed: 86,
        damage: 16 * (1 + elapsedSeconds / 120),
        xpValue: 26,
        armor: 12,
        resistances: { chaos: 0.3 },
        color: '#8fd8a8',
        hitFlash: 0,
        ailments: [],
        abilityTimer: 2.1,
        orbitHitCooldown: 0,
      };
    case 'skeletal_mortarman':
      return {
        id: nextEnemyId++,
        archetype,
        faction: 'undead',
        isBoss: false,
        name: 'Skeletal Mortarman',
        x,
        y,
        vx: 0,
        vy: 0,
        facing: 0,
        radius: 17,
        life: 84 * hpScale,
        maxLife: 84 * hpScale,
        speed: 64,
        damage: 21 * (1 + elapsedSeconds / 115),
        xpValue: 34,
        armor: 18,
        resistances: { fire: 0.25 },
        color: '#d6d3d1',
        hitFlash: 0,
        ailments: [],
        abilityTimer: 2.4,
        orbitHitCooldown: 0,
      };
    case 'void_acolyte':
      return {
        id: nextEnemyId++,
        archetype,
        faction: 'undead',
        isBoss: false,
        name: 'Umbral Acolyte',
        x,
        y,
        vx: 0,
        vy: 0,
        facing: 0,
        radius: 15,
        life: 76 * hpScale,
        maxLife: 76 * hpScale,
        speed: 86,
        damage: 19 * (1 + elapsedSeconds / 115),
        xpValue: 36,
        armor: 10,
        resistances: { chaos: 0.35, cold: 0.25 },
        color: '#a855f7',
        hitFlash: 0,
        ailments: [],
        abilityTimer: 2.0,
        orbitHitCooldown: 0,
      };
    case 'blade_wraith':
      return {
        id: nextEnemyId++,
        archetype,
        faction: 'undead',
        isBoss: false,
        name: 'Blade Wraith',
        x,
        y,
        vx: 0,
        vy: 0,
        facing: 0,
        radius: 14,
        life: 52 * hpScale,
        maxLife: 52 * hpScale,
        speed: 165 + Math.min(45, elapsedSeconds * 0.15),
        damage: 18 * (1 + elapsedSeconds / 120),
        xpValue: 28,
        armor: 4,
        resistances: { physical: 0.25, cold: 0.3 },
        color: '#38bdf8',
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
    case 'ash_whelp':
      return {
        id: nextEnemyId++,
        archetype,
        faction: 'demon',
        isBoss: false,
        name: 'Ash Whelp',
        x,
        y,
        vx: 0,
        vy: 0,
        facing: 0,
        radius: 11,
        life: 28 * hpScale,
        maxLife: 28 * hpScale,
        speed: 138 + Math.min(40, elapsedSeconds * 0.16),
        damage: 15 * (1 + elapsedSeconds / 130),
        xpValue: 16,
        armor: 2,
        resistances: { fire: 0.4 },
        color: '#fb923c',
        hitFlash: 0,
        ailments: [],
        abilityTimer: 2.0,
        orbitHitCooldown: 0,
      };
    case 'abyssal_foldwright':
      return {
        id: nextEnemyId++,
        archetype,
        faction: 'demon',
        isBoss: false,
        name: 'Abyssal Foldwright',
        x,
        y,
        vx: 0,
        vy: 0,
        facing: 0,
        radius: 15,
        life: 68 * hpScale,
        maxLife: 68 * hpScale,
        speed: 88,
        damage: 18 * (1 + elapsedSeconds / 120),
        xpValue: 30,
        armor: 10,
        resistances: { cold: 0.35, chaos: 0.3 },
        color: '#7795c3',
        hitFlash: 0,
        ailments: [],
        abilityTimer: 2.0,
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

/**
 * Core wave spawning draws from the Undead host with time-gated escalation:
 * 0:00+ Ghouls & Skeleton Warriors
 * 1:30+ Wraiths & Gravemaws
 * 3:00+ Skeletal Clerics & Revenant Knights
 * 4:00+ Skeleton Mages & Barrow Watchmen (ranged spreads)
 * 6:30+ Skeletal Mortarmen & Blade Wraiths
 * 9:00+ Dense bullet-hell caster & elite mix
 */
export function pickArchetypeForTime(elapsed: number, rng: () => number): EnemyArchetype {
  const r = rng();
  if (elapsed < 90) {
    if (r < 0.48) return 'zombie';
    if (r < 0.78) return 'ghoul';
    return 'skeleton_warrior';
  }
  if (elapsed < 180) {
    if (r < 0.24) return 'zombie';
    if (r < 0.48) return 'ghoul';
    if (r < 0.72) return 'skeleton_warrior';
    if (r < 0.88) return 'wraith';
    return 'gravemaw';
  }
  if (elapsed < 240) {
    if (r < 0.2) return 'ghoul';
    if (r < 0.44) return 'skeleton_warrior';
    if (r < 0.62) return 'wraith';
    if (r < 0.78) return 'gravemaw';
    if (r < 0.9) return 'skeleton_archer';
    return 'revenant_knight';
  }
  if (elapsed < 390) {
    // 4:00+ Skeleton Mages & Barrow Watchmen enter the fray
    if (r < 0.16) return 'skeleton_warrior';
    if (r < 0.32) return 'wraith';
    if (r < 0.48) return 'gravemaw';
    if (r < 0.64) return 'revenant_knight';
    if (r < 0.78) return 'skeleton_archer';
    if (r < 0.9) return 'skeleton_mage';
    return 'barrow_watchman';
  }
  if (elapsed < 540) {
    // 6:30+ Skeletal Mortarmen & Blade Wraiths; 7:30+ Umbral Acolytes
    if (elapsed >= 450 && r < 0.14) return 'void_acolyte';
    if (r < 0.15) return 'revenant_knight';
    if (r < 0.3) return 'gravemaw';
    if (r < 0.46) return 'blade_wraith';
    if (r < 0.62) return 'skeleton_mage';
    if (r < 0.76) return 'barrow_watchman';
    if (r < 0.9) return 'skeletal_mortarman';
    return 'skeleton_archer';
  }
  // 9:00+ Bullet-hell escalation
  if (r < 0.18) return 'void_acolyte';
  if (r < 0.36) return 'skeleton_mage';
  if (r < 0.54) return 'skeletal_mortarman';
  if (r < 0.68) return 'barrow_watchman';
  if (r < 0.82) return 'blade_wraith';
  if (r < 0.92) return 'revenant_knight';
  return 'gravemaw';
}
