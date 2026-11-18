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
}

export const VESSELS: VesselDefinition[] = [
  {
    id: 'magician',
    name: 'Magician',
    title: 'Arcane Elementalist',
    lookId: 'class_magician',
    description:
      'A disciplined scholar of the three storms—fire, frost, and lightning—who opens with rapid Firebolts and calls down elemental convergence.',
    color: '#7a9aff',
    glowColor: 'rgba(122, 154, 255, 0.45)',
    startingArtId: 'firebolt',
    ultimate: {
      id: 'tempest_convergence',
      name: 'Tempest Convergence',
      cooldown: 11,
      description: 'Unleash a ring of hoarfrost and 8 seeking arcane bolts across the warfront.',
    },
  },
  {
    id: 'warrior',
    name: 'Warrior',
    title: 'Vanguard Blade',
    lookId: 'class_warrior',
    description:
      'A seasoned front-line fighter clad in iron plate who carves wide sweeping arcs and turns the tide with the Red Hour.',
    color: '#d8b06a',
    glowColor: 'rgba(216, 176, 106, 0.45)',
    startingArtId: 'cleave',
    ultimate: {
      id: 'red_hour',
      name: 'Red Hour',
      cooldown: 12,
      description: 'Erupt in an iron shockwave and enter 4s of Bloodlust (+45% Attack Speed, +25% Move Speed, +15% Life Leech).',
    },
  },
  {
    id: 'rogue',
    name: 'Rogue',
    title: 'Shadow Striker',
    lookId: 'class_rogue',
    description:
      'An elusive killer who slips behind the mark with crescents of tempered daggers and vanishes in a Shadow Step.',
    color: '#8fa189',
    glowColor: 'rgba(143, 161, 137, 0.45)',
    startingArtId: 'fan_of_blades',
    ultimate: {
      id: 'shadow_step',
      name: 'Shadow Step',
      cooldown: 9,
      description: 'Blink swiftly with brief invulnerability, leaving a 7-blade fan of lethal daggers in your wake.',
    },
  },
  {
    id: 'necromancer',
    name: 'Necromancer',
    title: 'Marrow Sovereign',
    lookId: 'class_necromancer',
    description:
      'A pale student of the Barrow who turns rot and grave-miasma into a rising tide of ruin.',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    startingArtId: 'poison_nova',
    ultimate: {
      id: 'grave_reckoning',
      name: 'Grave Reckoning',
      cooldown: 12,
      description: 'Detonate a massive ring of blight that inflicts heavy Poison and drains Life from every foe struck.',
    },
  },
  {
    id: 'pyromancer',
    name: 'Pyromancer',
    title: 'Ashbound Herald',
    lookId: 'class_pyromancer',
    description:
      'Carries the furnace in their ribs, hurling explosive Fireballs and calling down Pillars of Flame.',
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.45)',
    startingArtId: 'fireball',
    ultimate: {
      id: 'pillar_of_flame',
      name: 'Pillar of Flame',
      cooldown: 11,
      description: 'Call down a colossal inferno around your vessel, scorching and igniting every foe in range.',
    },
  },
  {
    id: 'guardian',
    name: 'Guardian',
    title: 'Aegis Sentinel',
    lookId: 'class_guardian',
    description:
      'An unyielding bastion of hammered bronze who commands orbiting war-hammers and an unbreakable Aegis Sanctum.',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    startingArtId: 'hammer_of_judgment',
    ultimate: {
      id: 'aegis_sanctum',
      name: 'Aegis Sanctum',
      cooldown: 13,
      description: 'Restore 100% of Maximum Ward instantly and slam down a consecrated shockwave.',
    },
  },
];
