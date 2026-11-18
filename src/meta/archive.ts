import type { Modifier } from '../sdk/types.ts';

export interface ArchiveNodeDef {
  id: string;
  name: string;
  description: string;
  maxRank: number;
  baseCost: number;
  costStep: number;
}

export const ARCHIVE_NODES: ArchiveNodeDef[] = [
  {
    id: 'tome_of_rerolls',
    name: 'Tome of Rerolls',
    description: 'Begin every run with +1 additional Draft Reroll per rank.',
    maxRank: 3,
    baseCost: 15,
    costStep: 15,
  },
  {
    id: 'seal_of_banishment',
    name: 'Seal of Banishment',
    description: 'Gain +1 Banish per run per rank, letting you permanently remove unwanted cards from that run’s pool.',
    maxRank: 3,
    baseCost: 20,
    costStep: 20,
  },
  {
    id: 'sigil_of_affinity',
    name: 'Sigil of Affinity',
    description: 'Strongly weights level-up drafts toward Arts, Inscriptions, and Doctrines matching your active build tags.',
    maxRank: 2,
    baseCost: 25,
    costStep: 30,
  },
  {
    id: 'starting_reserve',
    name: 'Vessel Tempering',
    description: 'Start every run with +15 Maximum Life and +15 Maximum Ward per rank.',
    maxRank: 3,
    baseCost: 18,
    costStep: 18,
  },
  {
    id: 'essence_magnetics',
    name: 'Lodestone Attunement',
    description: 'Start every run with +25 Pickup Radius and +10% Mortal Essence Gain per rank.',
    maxRank: 2,
    baseCost: 20,
    costStep: 25,
  },
  {
    id: 'inscribers_mastery',
    name: 'Inscriber’s Mastery',
    description: 'Capstone: Increases the maximum Inscriptions etched onto each Art from 2 to 3.',
    maxRank: 1,
    baseCost: 80,
    costStep: 0,
  },
];

export interface ArchiveState {
  shards: number;
  totalRuns: number;
  ranks: Record<string, number>;
}

const STORAGE_KEY = 'hollow_war_archive_v1';

export function loadArchive(): ArchiveState {
  try {
    if (typeof localStorage === 'undefined') {
      return { shards: 0, totalRuns: 0, ranks: {} };
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { shards: 0, totalRuns: 0, ranks: {} };
    const parsed = JSON.parse(raw) as Partial<ArchiveState>;
    return {
      shards: typeof parsed.shards === 'number' ? parsed.shards : 0,
      totalRuns: typeof parsed.totalRuns === 'number' ? parsed.totalRuns : 0,
      ranks: parsed.ranks && typeof parsed.ranks === 'object' ? parsed.ranks : {},
    };
  } catch {
    return { shards: 0, totalRuns: 0, ranks: {} };
  }
}

export function saveArchive(state: ArchiveState): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // Ignore storage quota errors in restricted environments
  }
}

export function getNodeCost(node: ArchiveNodeDef, currentRank: number): number {
  return node.baseCost + currentRank * node.costStep;
}

export function buyArchiveNode(state: ArchiveState, nodeId: string): boolean {
  const node = ARCHIVE_NODES.find((n) => n.id === nodeId);
  if (!node) return false;
  const rank = state.ranks[nodeId] ?? 0;
  if (rank >= node.maxRank) return false;
  const cost = getNodeCost(node, rank);
  if (state.shards < cost) return false;

  state.shards -= cost;
  state.ranks[nodeId] = rank + 1;
  saveArchive(state);
  return true;
}

export function calculateRunShards(elapsedSeconds: number, kills: number, level: number): number {
  return Math.max(5, Math.floor(elapsedSeconds / 8 + kills / 12 + level * 2));
}

export interface ArchiveBonuses {
  extraRerolls: number;
  banishes: number;
  affinityLevel: number;
  maxInscriptionsPerArt: number;
  mods: Modifier[];
}

export function getArchiveBonuses(state: ArchiveState): ArchiveBonuses {
  const rerollRank = state.ranks.tome_of_rerolls ?? 0;
  const banishRank = state.ranks.seal_of_banishment ?? 0;
  const affinityRank = state.ranks.sigil_of_affinity ?? 0;
  const reserveRank = state.ranks.starting_reserve ?? 0;
  const magnetRank = state.ranks.essence_magnetics ?? 0;
  const masteryRank = state.ranks.inscribers_mastery ?? 0;

  const mods: Modifier[] = [];
  if (reserveRank > 0) {
    mods.push({ stat: 'life', kind: 'flat', value: reserveRank * 15, source: 'Archive Tempering' });
    mods.push({ stat: 'ward', kind: 'flat', value: reserveRank * 15, source: 'Archive Tempering' });
  }
  if (magnetRank > 0) {
    mods.push({ stat: 'pickupRadius', kind: 'flat', value: magnetRank * 25, source: 'Archive Lodestone' });
    mods.push({ stat: 'essenceGain', kind: 'inc', value: magnetRank * 0.1, source: 'Archive Lodestone' });
  }

  return {
    extraRerolls: rerollRank,
    banishes: banishRank,
    affinityLevel: affinityRank,
    maxInscriptionsPerArt: 2 + (masteryRank > 0 ? 1 : 0),
    mods,
  };
}
