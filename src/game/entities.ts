import type { SupportSocketDef } from '../content/skills.ts';
import type { AilmentType, DamageType, Modifier } from '../sdk/types.ts';

export interface EquippedSkill {
  skillId: string;
  level: number;
  cooldownTimer: number;
  supports: SupportSocketDef[];
  /** Accumulated skill-level more multiplier: (level - 1) * 0.22 */
  getSkillMods(): Modifier[];
}

export interface AilmentStack {
  type: AilmentType;
  dps: number;
  remaining: number;
  maxDuration: number;
}

export type EnemyArchetype = 'thrall' | 'stalker' | 'bulwark' | 'volatile' | 'weaver' | 'boss';

export interface Enemy {
  id: number;
  archetype: EnemyArchetype;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  maxLife: number;
  speed: number;
  damage: number;
  xpValue: number;
  armor: number;
  resistances: Partial<Record<DamageType, number>>;
  color: string;
  hitFlash: number;
  ailments: AilmentStack[];
  /** Cooldown for ranged/boss abilities */
  abilityTimer: number;
  /** Orbit blade hit immunity per skill/blade */
  orbitHitCooldown: number;
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  skillId: string;
  pierceLeft: number;
  life: number;
  hitIds: Set<number>;
  fromEnemy?: boolean;
  enemyDamage?: number;
  homing?: boolean;
  extraMods?: Modifier[];
}

export interface LightningArc {
  points: Array<{ x: number; y: number }>;
  color: string;
  life: number;
  maxLife: number;
}

export interface NovaRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface Pickup {
  id: number;
  kind: 'xp' | 'life' | 'ward';
  x: number;
  y: number;
  value: number;
  color: string;
  radius: number;
  magnetized: boolean;
}

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
}
