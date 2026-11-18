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
  | 'zombie'
  | 'ghoul'
  | 'skeleton_warrior'
  | 'skeleton_archer'
  | 'skeleton_mage'
  | 'barrow_watchman'
  | 'skeletal_mortarman'
  | 'void_acolyte'
  | 'wraith'
  | 'blade_wraith'
  | 'gravemaw'
  | 'revenant_knight'
  | 'imp'
  | 'ash_whelp'
  | 'hellhound'
  | 'demon_brute'
  | 'abyssal_foldwright'
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
  /** Used for sweeping Wraith walls that travel in a fixed line across the arena */
  fixedVelocity?: { vx: number; vy: number; life: number };
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
  explodeRadius?: number;
  explodeScale?: number;
  splitOnHit?: number;
  boomerang?: {
    maxLife: number;
    returned: boolean;
  };
  spiral?: {
    originX: number;
    originY: number;
    angle: number;
    angularSpeed: number;
    radius: number;
    radialSpeed: number;
  };
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
  isThrust?: boolean;
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

export interface MinionEntity {
  id: number;
  artId: string;
  kind: 'skeleton' | 'flame_sprite' | 'bone_golem' | 'zombie';
  x: number;
  y: number;
  facing: number;
  attackTimer: number;
  temporary?: boolean;
  life?: number;
}

export interface TotemEntity {
  id: number;
  artId: string;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  fireTimer: number;
}

export interface TrapEntity {
  id: number;
  artId: string;
  x: number;
  y: number;
  life: number;
  triggerRadius: number;
  blastRadius: number;
}

export interface IncursionPortal {
  id: number;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  spawnTimer: number;
  wavesLeft: number;
  isMajor: boolean;
}

export interface GroundZone {
  id: number;
  artId: string;
  x: number;
  y: number;
  radius: number;
  initialRadius?: number;
  expandToRadius?: number;
  life: number;
  maxLife: number;
  tickTimer: number;
  color: string;
}

export interface PendingEcho {
  artId: string;
  delay: number;
}

export interface PendingProjectile {
  delay: number;
  proj: Omit<Projectile, 'id'>;
}

export interface ActiveUltEffect {
  id: number;
  kind: 'pillar_of_flame' | 'stormcrown';
  x: number;
  y: number;
  startRadius: number;
  endRadius: number;
  radius: number;
  life: number;
  maxLife: number;
  tickTimer: number;
}

export interface EnemyHazardZone {
  id: number;
  x: number;
  y: number;
  radius: number;
  timer: number;
  maxTimer: number;
  damage: number;
}
