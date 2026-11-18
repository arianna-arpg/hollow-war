import type { ConversionRule, ExtraDamageRule, Modifier, ProcSpec } from '../sdk/types.ts';

export interface ClassUltimateSpec {
  id: string;
  name: string;
  cooldown: number;
  description: string;
}

export interface VesselDefinition {
  id: string;
  name: string;
  title: string;
  lookId: string;
  description: string;
  color: string;
  glowColor: string;
  startingArtId: string;
  ultimate: ClassUltimateSpec;
  mods: Modifier[];
  conversions?: ConversionRule[];
  extras?: ExtraDamageRule[];
  procs?: ProcSpec[];
  synergyHints: string[];
}

export const VESSELS: VesselDefinition[] = [
  {
    id: 'magician',
    name: 'Magician',
    title: 'Arcane Elementalist',
    lookId: 'class_magician',
    description:
      'A disciplined scholar of the three storms—fire, frost, and lightning. Wears an innate Ward and commands elemental convergence.',
    color: '#7a9aff',
    glowColor: 'rgba(122, 154, 255, 0.45)',
    startingArtId: 'firebolt',
    ultimate: {
      id: 'tempest_convergence',
      name: 'Tempest Convergence',
      cooldown: 11,
      description: 'Unleash a ring of hoarfrost and 8 seeking arcane bolts across the warfront.',
    },
    mods: [
      { stat: 'life', kind: 'flat', value: -10 },
      { stat: 'ward', kind: 'flat', value: 45 },
      { stat: 'castSpeed', kind: 'inc', value: 0.22 },
      { stat: 'chainCount', kind: 'flat', value: 1 },
      { stat: 'damage', kind: 'more', value: 0.15, when: 'warded' },
    ],
    synergyHints: ['Warded More Damage', 'Cast Speed & Chain', 'Tempest Convergence'],
  },
  {
    id: 'warrior',
    name: 'Warrior',
    title: 'Vanguard Blade',
    lookId: 'class_warrior',
    description:
      'A seasoned front-line fighter clad in iron plate. Carves wide sweeping arcs and turns every shattered Ward into a punishing shockwave.',
    color: '#d8b06a',
    glowColor: 'rgba(216, 176, 106, 0.45)',
    startingArtId: 'cleave',
    ultimate: {
      id: 'red_hour',
      name: 'Red Hour',
      cooldown: 12,
      description: 'Erupt in an iron shockwave and enter 4s of Bloodlust (+45% Attack Speed, +25% Move Speed, +15% Life Leech).',
    },
    mods: [
      { stat: 'life', kind: 'flat', value: 35 },
      { stat: 'ward', kind: 'flat', value: 40 },
      { stat: 'armor', kind: 'flat', value: 25 },
      { stat: 'area', kind: 'inc', value: 0.2 },
      { stat: 'bleedChance', kind: 'flat', value: 0.25 },
    ],
    procs: [
      {
        id: 'warrior_break_nova',
        name: 'Iron Reprisal',
        description: 'On Ward Break: Erupt in a heavy steel shockwave.',
        trigger: 'onWardBreak',
        chance: 1.0,
        icd: 1.0,
        effectId: 'ward_shockwave',
        power: 62,
      },
    ],
    synergyHints: ['Sweeping Cleave', 'Armor & Ward-Break', 'Red Hour Bloodlust'],
  },
  {
    id: 'rogue',
    name: 'Rogue',
    title: 'Shadow Striker',
    lookId: 'class_rogue',
    description:
      'An elusive killer who slips behind the mark and finishes fights before an alarm is raised. Thrives on critical strikes, velocity, and Low-Life adrenaline.',
    color: '#8fa189',
    glowColor: 'rgba(143, 161, 137, 0.45)',
    startingArtId: 'fan_of_blades',
    ultimate: {
      id: 'shadow_step',
      name: 'Shadow Step',
      cooldown: 9,
      description: 'Blink swiftly with brief invulnerability, leaving a 7-blade fan of lethal daggers in your wake.',
    },
    mods: [
      { stat: 'moveSpeed', kind: 'inc', value: 0.16 },
      { stat: 'critChance', kind: 'flat', value: 0.08 },
      { stat: 'critMulti', kind: 'flat', value: 0.35 },
      { stat: 'pierceCount', kind: 'flat', value: 1 },
      { stat: 'attackSpeed', kind: 'inc', value: 0.28, when: 'lowLife' },
    ],
    extras: [{ from: 'physical', to: 'chaos', ratio: 0.15, source: 'Rogue Venom' }],
    procs: [
      {
        id: 'rogue_crit_dart',
        name: 'Shadow Volley',
        description: 'On Crit: 35% chance to fling a homing Void Dart.',
        trigger: 'onCrit',
        chance: 0.35,
        icd: 0.18,
        effectId: 'void_dart',
        power: 24,
      },
    ],
    synergyHints: ['Crit-Proc Chains', 'Piercing Volleys', 'Shadow Step Blink'],
  },
  {
    id: 'necromancer',
    name: 'Necromancer',
    title: 'Marrow Sovereign',
    lookId: 'class_necromancer',
    description:
      'A pale student of the Barrow who turns rot and ruin into a rising tide. Stacks unending Poison and siphons vitality from the fallen.',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    startingArtId: 'poison_nova',
    ultimate: {
      id: 'grave_reckoning',
      name: 'Grave Reckoning',
      cooldown: 12,
      description: 'Detonate a massive ring of blight that inflicts heavy Poison and drains Life from every foe struck.',
    },
    mods: [
      { stat: 'poisonChance', kind: 'flat', value: 0.4 },
      { stat: 'dotDamage', kind: 'inc', value: 0.3 },
      { stat: 'area', kind: 'inc', value: 0.15 },
      { stat: 'lifeOnKill', kind: 'flat', value: 2 },
    ],
    extras: [{ from: 'physical', to: 'chaos', ratio: 0.2, source: 'Grave Taint' }],
    procs: [
      {
        id: 'necro_kill_dart',
        name: 'Soul Splinter',
        description: 'On Kill: 40% chance to loose a homing Chaos dart.',
        trigger: 'onKill',
        chance: 0.4,
        icd: 0.14,
        effectId: 'void_dart',
        power: 26,
      },
    ],
    synergyHints: ['Stacking Poison', 'Chaos Conversion', 'Grave Reckoning'],
  },
  {
    id: 'pyromancer',
    name: 'Pyromancer',
    title: 'Ashbound Herald',
    lookId: 'class_pyromancer',
    description:
      'Carries the furnace in their ribs. Converts Physical force into searing Fire and detonates the slain in blooming cinder.',
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.45)',
    startingArtId: 'flame_arrow',
    ultimate: {
      id: 'pillar_of_flame',
      name: 'Pillar of Flame',
      cooldown: 11,
      description: 'Call down a colossal inferno around your vessel, scorching and igniting every foe in range.',
    },
    mods: [
      { stat: 'fireDamage', kind: 'inc', value: 0.28 },
      { stat: 'igniteChance', kind: 'flat', value: 0.3 },
      { stat: 'dotDamage', kind: 'inc', value: 0.2 },
    ],
    conversions: [{ from: 'physical', to: 'fire', ratio: 0.4, source: 'Furnace Heart' }],
    procs: [
      {
        id: 'pyro_cinder_det',
        name: 'Cinder Detonation',
        description: 'On Kill: 45% chance to erupt in a fiery blast.',
        trigger: 'onKill',
        chance: 0.45,
        icd: 0.12,
        effectId: 'fire_eruption',
        power: 30,
      },
    ],
    synergyHints: ['Physical → Fire', 'Ignite Scaling', 'Pillar of Flame'],
  },
  {
    id: 'guardian',
    name: 'Guardian',
    title: 'Aegis Sentinel',
    lookId: 'class_guardian',
    description:
      'An unyielding bastion of hammered bronze and consecrated light. Surrounds themselves with orbiting war-hammers and towering Ward.',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    startingArtId: 'hammer_of_judgment',
    ultimate: {
      id: 'aegis_sanctum',
      name: 'Aegis Sanctum',
      cooldown: 13,
      description: 'Restore 100% of Maximum Ward instantly and slam down a consecrated shockwave.',
    },
    mods: [
      { stat: 'life', kind: 'flat', value: 30 },
      { stat: 'ward', kind: 'flat', value: 70 },
      { stat: 'armor', kind: 'flat', value: 28 },
      { stat: 'area', kind: 'inc', value: 0.22 },
      { stat: 'moveSpeed', kind: 'inc', value: -0.06 },
    ],
    procs: [
      {
        id: 'guardian_aegis_shatter',
        name: 'Aegis Shatter',
        description: 'On Ward Break: Unleash a consecrated shockwave.',
        trigger: 'onWardBreak',
        chance: 1.0,
        icd: 1.0,
        effectId: 'ward_shockwave',
        power: 70,
      },
    ],
    synergyHints: ['Orbiting Hammers', 'Massive Ward', 'Aegis Sanctum'],
  },
];
