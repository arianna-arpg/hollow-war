import type { InscriptionDef } from '../content/skills.ts';
import type { AilmentType, DamageType, Modifier } from '../sdk/types.ts';

export interface EquippedArt {
  artId: string;
  level: number;
  cooldownTimer: number;
  inscriptions: InscriptionDef[];
  getArtMods(): Modifier[];
}

export interface AilmentStack {
  type: AilmentType;
  dps: number;
  remaining: number;
  maxDuration: number;
}

export type EnemyFaction = 'undead' | 'demon';

export type EnemyArchetype =
  | 'ghoul'
  | 'skeleton_warrior'
  | 'skeleton_archer'
  | 'wraith'
  | 'imp'
  | 'hellhound'
  | 'demon_brute'
  | 'lich'
  | 'demon_lord';

export interface Enemy {
  id: number;
  archetype: EnemyArchetype;
  faction: EnemyFaction;
  isBoss: boolean;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: number;
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
  abilityTimer: number;
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
  artId: string;
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

export interface SweepArc {
  x: number;
  y: number;
  angle: number;
  radius: number;
  arcSpread: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface Pickup {
  id: number;
  kind: 'essence' | 'life' | 'ward' | 'magnet';
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
