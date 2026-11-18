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
      'A disciplined scholar of the three storms—fire, frost, and lightning—who opens with Firebolt and calls down the Stormcrown.',
    color: '#7a9aff',
    glowColor: 'rgba(122, 154, 255, 0.45)',
    startingArtId: 'firebolt',
    ultimate: {
      id: 'stormcrown',
      name: 'Stormcrown',
      cooldown: 12,
      description: 'Calls down a tempest of 12 lightning strikes across nearby foes, dealing heavy Lightning damage and Shocking them.',
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
      description: 'Erupt in an iron shockwave and enter 4s of Red Hour (+45% Attack Speed, +25% Move Speed, +15% Life Leech).',
    },
  },
  {
    id: 'rogue',
    name: 'Rogue',
    title: 'Shadow Striker',
    lookId: 'class_rogue',
    description:
      'An elusive killer who slips behind the mark with Fan of Blades and severs time with The Hundred Partings.',
    color: '#8fa189',
    glowColor: 'rgba(143, 161, 137, 0.45)',
    startingArtId: 'fan_of_blades',
    ultimate: {
      id: 'hundred_partings',
      name: 'The Hundred Partings',
      cooldown: 11,
      description: 'Briefly stills nearby foes in time while unleashing a 9-blade crescent of piercing shadow daggers.',
    },
  },
  {
    id: 'necromancer',
    name: 'Necromancer',
    title: 'Marrow Sovereign',
    lookId: 'class_necromancer',
    description:
      'A pale student of the Barrow who turns rot and grave-miasma into a rising tide of the unburied.',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    startingArtId: 'poison_nova',
    ultimate: {
      id: 'grave_tide',
      name: 'Grave Tide',
      cooldown: 13,
      description: 'Calls forth a surge of 6 Risen Skeletons around you for 10 seconds to swarm and tear apart the warfront.',
    },
  },
  {
    id: 'pyromancer',
    name: 'Pyromancer',
    title: 'Ashbound Herald',
    lookId: 'class_pyromancer',
    description:
      'Carries the furnace in their ribs, hurling explosive Fireballs and raising a searing Pillar of Flame.',
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.45)',
    startingArtId: 'fireball',
    ultimate: {
      id: 'pillar_of_flame',
      name: 'Pillar of Flame',
      cooldown: 11,
      description: 'Raises a burning ring around your vessel that sears and ignites every foe caught within.',
    },
  },
  {
    id: 'guardian',
    name: 'Guardian',
    title: 'Aegis Sentinel',
    lookId: 'class_guardian',
    description:
      'An unyielding bastion of hammered bronze who commands orbiting war-hammers and tolls the Doom Bell.',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    startingArtId: 'hammer_of_judgment',
    ultimate: {
      id: 'doom_bell',
      name: 'Doom Bell',
      cooldown: 13,
      description: 'Tolls a wide physical shockwave that knocks back nearby foes and restores 60% of Maximum Ward.',
    },
  },
];
