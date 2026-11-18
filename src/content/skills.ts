import type { SkillDamageSpec } from '../sdk/combat-resolver.ts';
import type { ConversionRule, ExtraDamageRule, Modifier, SkillTag } from '../sdk/types.ts';

export type SkillBehavior = 'projectile' | 'chain' | 'orbit' | 'nova';

export interface SkillDefinition extends SkillDamageSpec {
  id: string;
  name: string;
  description: string;
  color: string;
  behavior: SkillBehavior;
  baseProjectiles: number;
  baseRadius: number;
  projectileSpeed?: number;
  baseChain?: number;
  tags: readonly SkillTag[];
}

export interface SupportSocketDef {
  id: string;
  name: string;
  description: string;
  color: string;
  requiredTags?: readonly SkillTag[];
  mods: Modifier[];
  conversions?: ConversionRule[];
  extras?: ExtraDamageRule[];
  echoChance?: number; // e.g., 0.35 chance to cast twice
}

export const SKILLS: Record<string, SkillDefinition> = {
  firebolt: {
    id: 'firebolt',
    name: 'Firebolt Volley',
    description: 'Launches searing bolts of fire that pierce or ignite foes.',
    color: '#f97316',
    behavior: 'projectile',
    baseDamage: { fire: 22, physical: 6 },
    damageEffectiveness: 1.0,
    baseCooldown: 0.62,
    baseCritChance: 0.02,
    baseProjectiles: 1,
    baseRadius: 7,
    projectileSpeed: 540,
    tags: ['spell', 'projectile', 'fire'],
  },
  arc_lash: {
    id: 'arc_lash',
    name: 'Arc Lash',
    description: 'Discharges lightning that chains between nearby enemies and shocks them.',
    color: '#38bdf8',
    behavior: 'chain',
    baseDamage: { lightning: 24 },
    damageEffectiveness: 0.9,
    baseCooldown: 0.78,
    baseCritChance: 0.04,
    baseProjectiles: 1,
    baseRadius: 210,
    baseChain: 2,
    tags: ['spell', 'chain', 'lightning'],
  },
  void_glaive: {
    id: 'void_glaive',
    name: 'Void Glaive',
    description: 'Summons orbiting spectral blades that carve enemies with physical & chaos damage.',
    color: '#a855f7',
    behavior: 'orbit',
    baseDamage: { physical: 15, chaos: 11 },
    damageEffectiveness: 0.85,
    baseCooldown: 0.48, // hit interval per blade
    baseCritChance: 0.06,
    baseProjectiles: 2,
    baseRadius: 78,
    tags: ['attack', 'orbit', 'physical', 'chaos'],
  },
  ruin_nova: {
    id: 'ruin_nova',
    name: 'Ruin Nova',
    description: 'Unleashes an expanding shockwave of molten iron around your Vessel.',
    color: '#ef4444',
    behavior: 'nova',
    baseDamage: { fire: 20, physical: 16 },
    damageEffectiveness: 1.25,
    baseCooldown: 1.55,
    baseCritChance: 0.0,
    baseProjectiles: 1,
    baseRadius: 145,
    tags: ['spell', 'aoe', 'nova', 'fire', 'physical'],
  },
  frost_shard: {
    id: 'frost_shard',
    name: 'Frost Shard',
    description: 'Fires crystalline shards that chill enemies and shatter on critical strikes.',
    color: '#67e8f9',
    behavior: 'projectile',
    baseDamage: { cold: 21 },
    damageEffectiveness: 1.0,
    baseCooldown: 0.56,
    baseCritChance: 0.05,
    baseProjectiles: 2,
    baseRadius: 6,
    projectileSpeed: 600,
    tags: ['spell', 'projectile', 'cold'],
  },
};

export const SUPPORT_SOCKETS: Record<string, SupportSocketDef> = {
  multishot: {
    id: 'multishot',
    name: 'Split Volley Support',
    description: '+2 Projectiles, but 15% Less Projectile Damage.',
    color: '#fbbf24',
    requiredTags: ['projectile'],
    mods: [
      { stat: 'projectileCount', kind: 'flat', value: 2 },
      { stat: 'damage', kind: 'more', value: -0.15, tags: ['projectile'] },
    ],
  },
  combustion: {
    id: 'combustion',
    name: 'Combustion Support',
    description: '+45% Ignite Chance, +25% More Fire Damage, +10% Fire Penetration.',
    color: '#f97316',
    mods: [
      { stat: 'igniteChance', kind: 'flat', value: 0.45 },
      { stat: 'fireDamage', kind: 'more', value: 0.25 },
      { stat: 'firePen', kind: 'flat', value: 0.1 },
    ],
  },
  chain_arc: {
    id: 'chain_arc',
    name: 'Forking Arc Support',
    description: '+2 Chain Count, +15% Lightning Penetration.',
    color: '#38bdf8',
    requiredTags: ['chain'],
    mods: [
      { stat: 'chainCount', kind: 'flat', value: 2 },
      { stat: 'lightningPen', kind: 'flat', value: 0.15 },
    ],
  },
  chaos_infusion: {
    id: 'chaos_infusion',
    name: 'Void Infusion Support',
    description: 'Gain 25% of Physical & Elemental Damage as Extra Chaos. +25% Poison Chance.',
    color: '#c084fc',
    mods: [{ stat: 'poisonChance', kind: 'flat', value: 0.25 }],
    extras: [
      { from: 'physical', to: 'chaos', ratio: 0.25 },
      { from: 'fire', to: 'chaos', ratio: 0.25 },
      { from: 'cold', to: 'chaos', ratio: 0.25 },
      { from: 'lightning', to: 'chaos', ratio: 0.25 },
    ],
  },
  concentrated_blast: {
    id: 'concentrated_blast',
    name: 'Concentrated Core Support',
    description: '+35% More Area Damage, -15% Area of Effect.',
    color: '#f43f5e',
    requiredTags: ['aoe'],
    mods: [
      { stat: 'damage', kind: 'more', value: 0.35, tags: ['aoe'] },
      { stat: 'area', kind: 'inc', value: -0.15 },
    ],
  },
  echo_chamber: {
    id: 'echo_chamber',
    name: 'Spell Echo Support',
    description: '40% chance to trigger an immediate Echo cast. +12% Cast Speed.',
    color: '#818cf8',
    requiredTags: ['spell'],
    mods: [{ stat: 'castSpeed', kind: 'inc', value: 0.12 }],
    echoChance: 0.4,
  },
  vampiric_edge: {
    id: 'vampiric_edge',
    name: 'Crimson Leech Support',
    description: '+4% Life Leech, +20% Bleed Chance, +18% More Damage on Full Life.',
    color: '#ef4444',
    mods: [
      { stat: 'lifeLeech', kind: 'flat', value: 0.04 },
      { stat: 'bleedChance', kind: 'flat', value: 0.2 },
      { stat: 'damage', kind: 'more', value: 0.18, when: 'fullLife' },
    ],
  },
  crit_strikes: {
    id: 'crit_strikes',
    name: 'Ruthless Precision Support',
    description: '+12% Base Crit Chance, +35% Crit Multiplier.',
    color: '#fde047',
    mods: [
      { stat: 'critChance', kind: 'flat', value: 0.12 },
      { stat: 'critMulti', kind: 'flat', value: 0.35 },
    ],
  },
};
