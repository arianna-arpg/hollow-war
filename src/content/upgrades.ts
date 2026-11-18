import type { ConversionRule, ExtraDamageRule, Modifier, ProcSpec, SkillTag } from '../sdk/types.ts';

export type UpgradeRarity = 'common' | 'rare' | 'mythic' | 'keystone';
export type UpgradeCategory = 'skill' | 'support' | 'passive' | 'keystone';

export interface UpgradeCardDef {
  id: string;
  name: string;
  category: UpgradeCategory;
  rarity: UpgradeRarity;
  description: string;
  tags: readonly SkillTag[];
  maxStacks?: number;
  /** For category === 'skill' */
  skillId?: string;
  /** For category === 'support' */
  supportId?: string;
  /** Modifiers applied to the player StatSheet */
  mods?: Modifier[];
  conversions?: ConversionRule[];
  extras?: ExtraDamageRule[];
  procs?: ProcSpec[];
  /** Optional trade-off note shown on keystones */
  tradeoff?: string;
}

export const UPGRADE_POOL: UpgradeCardDef[] = [
  // === SKILLS (Acquire or Level Up +20% More Damage) ===
  {
    id: 'skill_firebolt',
    name: 'Firebolt Volley',
    category: 'skill',
    rarity: 'rare',
    skillId: 'firebolt',
    description: 'Equip Firebolt Volley (or rank it up for +22% More Skill Damage).',
    tags: ['spell', 'projectile', 'fire'],
  },
  {
    id: 'skill_arc_lash',
    name: 'Arc Lash',
    category: 'skill',
    rarity: 'rare',
    skillId: 'arc_lash',
    description: 'Equip Arc Lash (or rank it up for +22% More Skill Damage & +1 Chain).',
    tags: ['spell', 'chain', 'lightning'],
  },
  {
    id: 'skill_void_glaive',
    name: 'Void Glaive',
    category: 'skill',
    rarity: 'rare',
    skillId: 'void_glaive',
    description: 'Equip Void Glaive (or rank it up for +1 Orbiting Blade & +20% More Damage).',
    tags: ['attack', 'orbit', 'physical', 'chaos'],
  },
  {
    id: 'skill_ruin_nova',
    name: 'Ruin Nova',
    category: 'skill',
    rarity: 'rare',
    skillId: 'ruin_nova',
    description: 'Equip Ruin Nova (or rank it up for +24% More Damage & +12% Area).',
    tags: ['spell', 'aoe', 'nova', 'fire', 'physical'],
  },
  {
    id: 'skill_frost_shard',
    name: 'Frost Shard',
    category: 'skill',
    rarity: 'rare',
    skillId: 'frost_shard',
    description: 'Equip Frost Shard (or rank it up for +22% More Damage & +1 Shard).',
    tags: ['spell', 'projectile', 'cold'],
  },

  // === SUPPORT SOCKETS (Attach to a specific equipped skill!) ===
  {
    id: 'sup_multishot',
    name: 'Support: Split Volley',
    category: 'support',
    rarity: 'rare',
    supportId: 'multishot',
    description: 'Socket into a Projectile skill: +2 Projectiles, -15% Projectile Damage.',
    tags: ['projectile'],
  },
  {
    id: 'sup_combustion',
    name: 'Support: Combustion',
    category: 'support',
    rarity: 'rare',
    supportId: 'combustion',
    description: 'Socket into any skill: +45% Ignite Chance, +25% More Fire Damage, +10% Fire Pen.',
    tags: ['fire', 'dot'],
  },
  {
    id: 'sup_chain_arc',
    name: 'Support: Forking Arc',
    category: 'support',
    rarity: 'rare',
    supportId: 'chain_arc',
    description: 'Socket into a Chain skill: +2 Chain Count, +15% Lightning Penetration.',
    tags: ['chain', 'lightning'],
  },
  {
    id: 'sup_chaos_infusion',
    name: 'Support: Void Infusion',
    category: 'support',
    rarity: 'mythic',
    supportId: 'chaos_infusion',
    description: 'Socket into any skill: Gain 25% of Physical & Elemental Damage as Extra Chaos.',
    tags: ['chaos'],
  },
  {
    id: 'sup_concentrated',
    name: 'Support: Concentrated Core',
    category: 'support',
    rarity: 'rare',
    supportId: 'concentrated_blast',
    description: 'Socket into an Area skill: +35% More Area Damage, -15% Area.',
    tags: ['aoe'],
  },
  {
    id: 'sup_echo',
    name: 'Support: Spell Echo',
    category: 'support',
    rarity: 'mythic',
    supportId: 'echo_chamber',
    description: 'Socket into a Spell: 40% chance to Echo cast immediately, +12% Cast Speed.',
    tags: ['spell'],
  },
  {
    id: 'sup_vampiric',
    name: 'Support: Crimson Leech',
    category: 'support',
    rarity: 'rare',
    supportId: 'vampiric_edge',
    description: 'Socket into any skill: +4% Life Leech, +20% Bleed Chance, +18% More Damage on Full Life.',
    tags: ['physical'],
  },
  {
    id: 'sup_crit_strikes',
    name: 'Support: Ruthless Precision',
    category: 'support',
    rarity: 'rare',
    supportId: 'crit_strikes',
    description: 'Socket into any skill: +12% Base Crit Chance, +35% Crit Multiplier.',
    tags: ['attack', 'spell'],
  },

  // === PASSIVES & HOLLOW WAKE CONDUITS ===
  {
    id: 'pas_ember_forged',
    name: 'Ember-Forged Core',
    category: 'passive',
    rarity: 'common',
    maxStacks: 3,
    description: '+25% Increased Fire Damage, +12 Added Fire Damage to all skills.',
    tags: ['fire'],
    mods: [
      { stat: 'fireDamage', kind: 'inc', value: 0.25 },
      { stat: 'addedFire', kind: 'flat', value: 12 },
    ],
  },
  {
    id: 'pas_arcane_velocity',
    name: 'Arcane Velocity',
    category: 'passive',
    rarity: 'common',
    maxStacks: 3,
    description: '+18% Cast Speed, +15% Attack Speed, +8% Move Speed.',
    tags: ['spell', 'attack'],
    mods: [
      { stat: 'castSpeed', kind: 'inc', value: 0.18 },
      { stat: 'attackSpeed', kind: 'inc', value: 0.15 },
      { stat: 'moveSpeed', kind: 'inc', value: 0.08 },
    ],
  },
  {
    id: 'pas_ward_reservoir',
    name: 'Glacial Reservoir',
    category: 'passive',
    rarity: 'common',
    maxStacks: 3,
    description: '+45 Maximum Ward, +5 Ward Regen/s, +15% Cold Damage.',
    tags: ['cold'],
    mods: [
      { stat: 'ward', kind: 'flat', value: 45 },
      { stat: 'wardRegen', kind: 'flat', value: 5 },
      { stat: 'coldDamage', kind: 'inc', value: 0.15 },
    ],
  },
  {
    id: 'pas_vital_bastion',
    name: 'Vital Bastion',
    category: 'passive',
    rarity: 'common',
    maxStacks: 3,
    description: '+35 Maximum Life, +1.5 Life Regen/s, +15 Armor.',
    tags: [],
    mods: [
      { stat: 'life', kind: 'flat', value: 35 },
      { stat: 'lifeRegen', kind: 'flat', value: 1.5 },
      { stat: 'armor', kind: 'flat', value: 15 },
    ],
  },
  {
    id: 'pas_piercing_salvo',
    name: 'Piercing Salvo',
    category: 'passive',
    rarity: 'rare',
    maxStacks: 2,
    description: '+1 Pierce Count, +1 Extra Projectile, +15% Projectile Damage.',
    tags: ['projectile'],
    mods: [
      { stat: 'pierceCount', kind: 'flat', value: 1 },
      { stat: 'projectileCount', kind: 'flat', value: 1 },
      { stat: 'damage', kind: 'inc', value: 0.15, tags: ['projectile'] },
    ],
  },
  {
    id: 'pas_pyromancer_conv',
    name: 'Avatar of Ash',
    category: 'passive',
    rarity: 'mythic',
    maxStacks: 1,
    description: 'Convert 50% of Physical & Cold Damage to Fire. Gain 15% of Fire as Extra Chaos.',
    tags: ['fire', 'chaos'],
    conversions: [
      { from: 'physical', to: 'fire', ratio: 0.5 },
      { from: 'cold', to: 'fire', ratio: 0.5 },
    ],
    extras: [{ from: 'fire', to: 'chaos', ratio: 0.15 }],
  },
  {
    id: 'pas_cast_on_crit',
    name: 'Conduit: Cast on Crit',
    category: 'passive',
    rarity: 'mythic',
    maxStacks: 1,
    description: 'On Crit: 55% chance to trigger a blazing Firebolt at the target (0.2s ICD).',
    tags: ['proc', 'fire', 'spell'],
    procs: [
      {
        id: 'proc_coc_firebolt',
        name: 'Cast on Crit: Firebolt',
        description: 'Fires a bonus Firebolt on Critical Strike.',
        trigger: 'onCrit',
        chance: 0.55,
        icd: 0.2,
        effectId: 'coc_firebolt',
        power: 30,
      },
    ],
  },
  {
    id: 'pas_kinetic_dynamo',
    name: 'Kinetic Dynamo',
    category: 'passive',
    rarity: 'rare',
    maxStacks: 1,
    description: 'While Moving: +25% More Damage and +15% Crit Chance. While Stationary: +30 Armor.',
    tags: [],
    mods: [
      { stat: 'damage', kind: 'more', value: 0.25, when: 'moving' },
      { stat: 'critChance', kind: 'flat', value: 0.15, when: 'moving' },
      { stat: 'armor', kind: 'flat', value: 30, when: 'stationary' },
    ],
  },
  {
    id: 'pas_toxic_catalyst',
    name: 'Toxic Catalyst',
    category: 'passive',
    rarity: 'rare',
    maxStacks: 2,
    description: '+35% Ailment/DoT Damage, +25% Poison & Bleed Chance, +10% Chaos Pen.',
    tags: ['dot', 'chaos', 'physical'],
    mods: [
      { stat: 'dotDamage', kind: 'inc', value: 0.35 },
      { stat: 'poisonChance', kind: 'flat', value: 0.25 },
      { stat: 'bleedChance', kind: 'flat', value: 0.25 },
      { stat: 'chaosPen', kind: 'flat', value: 0.1 },
    ],
  },
  {
    id: 'pas_siphon_kill',
    name: 'Soul Siphon',
    category: 'passive',
    rarity: 'common',
    maxStacks: 2,
    description: '+2 Life on Kill, +4 Ward on Kill, +25 Pickup Radius.',
    tags: [],
    mods: [
      { stat: 'lifeOnKill', kind: 'flat', value: 2 },
      { stat: 'wardOnKill', kind: 'flat', value: 4 },
      { stat: 'pickupRadius', kind: 'flat', value: 25 },
    ],
  },

  // === KEYSTONES (Nova Drift-style build-defining mutators) ===
  {
    id: 'key_glass_cannon',
    name: 'Keystone: Glass Cannon',
    category: 'keystone',
    rarity: 'keystone',
    maxStacks: 1,
    description: '+60% More Global Damage, +15% Crit Chance.',
    tradeoff: '-40% Maximum Life & -20 Armor.',
    tags: [],
    mods: [
      { stat: 'damage', kind: 'more', value: 0.6 },
      { stat: 'critChance', kind: 'flat', value: 0.15 },
      { stat: 'life', kind: 'more', value: -0.4 },
      { stat: 'armor', kind: 'flat', value: -20 },
    ],
  },
  {
    id: 'key_crimson_pact',
    name: 'Keystone: Crimson Pact',
    category: 'keystone',
    rarity: 'keystone',
    maxStacks: 1,
    description: '+45% More Spell Damage & +8% Life Leech; triggers Low-Life bonuses more easily.',
    tradeoff: 'Maximum Ward becomes 0.',
    tags: ['spell'],
    mods: [
      { stat: 'damage', kind: 'more', value: 0.45, tags: ['spell'] },
      { stat: 'lifeLeech', kind: 'flat', value: 0.08 },
      { stat: 'ward', kind: 'override', value: 0 },
    ],
  },
  {
    id: 'key_pyromania',
    name: 'Keystone: Pyromania',
    category: 'keystone',
    rarity: 'keystone',
    maxStacks: 1,
    description: '+100% Ignite Chance, +55% More Ailment/DoT Damage, +30% Area.',
    tradeoff: '-25% Direct Hit Damage.',
    tags: ['fire', 'dot'],
    mods: [
      { stat: 'igniteChance', kind: 'flat', value: 1.0 },
      { stat: 'dotDamage', kind: 'more', value: 0.55 },
      { stat: 'area', kind: 'inc', value: 0.3 },
      { stat: 'damage', kind: 'more', value: -0.25 },
    ],
  },
  {
    id: 'key_static_overload',
    name: 'Keystone: Static Overload',
    category: 'keystone',
    rarity: 'keystone',
    maxStacks: 1,
    description: '+35% More Lightning Damage, +2 Chain Count, +40% Shock Chance.',
    tradeoff: '-35% Projectile & Area Size.',
    tags: ['lightning', 'chain'],
    mods: [
      { stat: 'lightningDamage', kind: 'more', value: 0.35 },
      { stat: 'chainCount', kind: 'flat', value: 2 },
      { stat: 'shockChance', kind: 'flat', value: 0.4 },
      { stat: 'area', kind: 'more', value: -0.35 },
    ],
  },
  {
    id: 'key_singularity',
    name: 'Keystone: Singularity',
    category: 'keystone',
    rarity: 'keystone',
    maxStacks: 1,
    description: '+50% More Orbit & Area Damage, +45% Area of Effect.',
    tradeoff: '-25% Move Speed & -20% Projectile Damage.',
    tags: ['orbit', 'aoe'],
    mods: [
      { stat: 'damage', kind: 'more', value: 0.5, tags: ['orbit'] },
      { stat: 'damage', kind: 'more', value: 0.5, tags: ['aoe'] },
      { stat: 'area', kind: 'inc', value: 0.45 },
      { stat: 'moveSpeed', kind: 'inc', value: -0.25 },
      { stat: 'damage', kind: 'more', value: -0.2, tags: ['projectile'] },
    ],
  },
];
