import {
  ART_MORPH_TRIGGER_RANK,
  ARTS,
  getArtModsForRank,
  getArtMorphRoutes,
  getArtRankStep,
  INSCRIPTIONS,
  MAX_ACTIVE_ARTS,
  MAX_ART_RANK,
  type ArtDefinition,
  type ArtMorphDef,
  type InscriptionDef,
} from '../content/skills.ts';
import {
  calculateRunShards,
  getArchiveBonuses,
  loadArchive,
  saveArchive,
  type ArchiveState,
} from '../meta/archive.ts';
import { HOLLOW_WAR_STAT_RULES } from '../content/stats.ts';
import { UPGRADE_POOL, type PassiveDomain, type UpgradeCardDef } from '../content/upgrades.ts';
import { VESSELS, type VesselDefinition } from '../content/vessels.ts';
import { computeOutgoingByType, previewSkillDps, resolveHit, type SkillDamageSpec } from '../sdk/combat-resolver.ts';
import { ProcRuntime, type ProcEventContext } from '../sdk/proc-runtime.ts';
import { StatSheet } from '../sdk/stat-sheet.ts';
import type { ConditionId, DamageType, Modifier, ProcSpec, SkillDpsPreview, SkillTag } from '../sdk/types.ts';
import type {
  ActiveUltEffect,
  Enemy,
  EnemyArchetype,
  EnemyHazardZone,
  EquippedArt,
  FloatingText,
  GroundZone,
  IncursionPortal,
  LightningArc,
  MinionEntity,
  NovaRing,
  Particle,
  PendingEcho,
  PendingProjectile,
  Pickup,
  Projectile,
  SweepArc,
  TotemEntity,
  TrapEntity,
} from './entities.ts';
import { createEnemy, pickArchetypeForTime, resetEnemyIds } from './spawner.ts';

export type GamePhase =
  | 'vessel_select'
  | 'archive'
  | 'playing'
  | 'draft'
  | 'art_select'
  | 'passive_select'
  | 'inscribe'
  | 'art_morph'
  | 'paused'
  | 'game_over';

export interface InscribeChoiceState {
  artId: string;
  options: Array<{ ins: InscriptionDef; dpsDeltaPct: number }>;
}

export interface ArtSelectChoiceState {
  archetype: ArtArchetypeFilter;
  label: string;
  options: Array<{ artDef: ArtDefinition; isRankUp: boolean; nextRank: number; dpsDeltaPct: number }>;
}

export interface PassiveSelectChoiceState {
  domain: PassiveDomain;
  label: string;
  options: Array<{ card: UpgradeCardDef; stacks: number; dpsDeltaPct: number; summaryText: string }>;
}

export interface ArtMorphChoiceState {
  artId: string;
  routes: [
    { morph: ArtMorphDef; dpsDeltaPct: number },
    { morph: ArtMorphDef; dpsDeltaPct: number },
  ];
}

export interface DraftOption {
  card: UpgradeCardDef;
  dpsDeltaPct?: number;
  summaryText: string;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  mouseX: number;
  mouseY: number;
  mouseDown: boolean;
}

const DAMAGE_COLORS: Record<DamageType, string> = {
  physical: '#e2e8f0',
  fire: '#fb923c',
  cold: '#67e8f9',
  lightning: '#fde047',
  chaos: '#c084fc',
};

export type ArtArchetypeFilter =
  | 'all'
  | 'physical'
  | 'fire'
  | 'cold'
  | 'lightning'
  | 'chaos'
  | 'attack'
  | 'construct';

interface PendingAftershock {
  artId: string;
  x: number;
  y: number;
  radius: number;
  scale: number;
  color: string;
  delay: number;
}

interface PendingThrust {
  artId: string;
  angle: number;
  reach: number;
  halfWidth: number;
  reachOffset: number;
  doReverse: boolean;
  delay: number;
}

let nextEntityId = 1;

export class HollowWarEngine {
  phase: GamePhase = 'vessel_select';
  vessel: VesselDefinition = VESSELS[0];
  sheet: StatSheet = new StatSheet(HOLLOW_WAR_STAT_RULES);
  procs: ProcRuntime = new ProcRuntime();

  player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 14,
    life: 100,
    ward: 0,
    wardDelayTimer: 0,
    xp: 0,
    xpToNext: 50,
    level: 1,
    dashTimer: 0,
    dashCooldown: 0,
    ultimateCooldown: 0,
    bloodlustTimer: 0,
    dashDirX: 1,
    dashDirY: 0,
    invulnTimer: 0,
    aimAngle: 0,
    orbitAngle: 0,
    rerolls: 2,
    banishes: 0,
  };

  archive: ArchiveState = loadArchive();
  lastRunShards = 0;

  autoAim = true;
  elapsed = 0;
  kills = 0;
  totalDamageDealt = 0;
  screenShake = 0;

  arts: EquippedArt[] = [];
  acquiredCards: Map<string, number> = new Map();
  banishedCards: Set<string> = new Set();

  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  arcs: LightningArc[] = [];
  novas: NovaRing[] = [];
  sweeps: SweepArc[] = [];
  minions: MinionEntity[] = [];
  totems: TotemEntity[] = [];
  traps: TrapEntity[] = [];
  groundZones: GroundZone[] = [];
  incursionPortals: IncursionPortal[] = [];
  pendingEchoes: PendingEcho[] = [];
  pendingAftershocks: PendingAftershock[] = [];
  pendingThrusts: PendingThrust[] = [];
  pendingProjectiles: PendingProjectile[] = [];
  activeUltEffects: ActiveUltEffect[] = [];
  enemyHazards: EnemyHazardZone[] = [];
  pickups: Pickup[] = [];
  floatingTexts: FloatingText[] = [];
  particles: Particle[] = [];

  draftOptions: DraftOption[] = [];
  artSelectChoice: ArtSelectChoiceState | null = null;
  passiveSelectChoice: PassiveSelectChoiceState | null = null;
  inscribeChoice: InscribeChoiceState | null = null;
  artMorphChoice: ArtMorphChoiceState | null = null;
  private cachedArtOffers: Map<string, ArtSelectChoiceState> = new Map();
  private cachedPassiveOffers: Map<string, PassiveSelectChoiceState> = new Map();
  private cachedInscribeOffers: Map<string, InscribeChoiceState> = new Map();
  thronelord: { id: 'malakor' | 'vexarion' | 'karnath'; name: string; title: string } | null = null;

  private spawnTimer = 0;
  private nextBossAt = 90;
  private nextIncursionAt = 135;
  private nextWraithWallAt = 150;
  private nextSwarmSurgeAt = 210;
  private thronelordSpawnedAt600 = false;
  private incursionCount = 0;
  private dotAccumulator = 0;
  private viewportW = 1280;
  private viewportH = 720;

  input: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    mouseX: 640,
    mouseY: 360,
    mouseDown: false,
  };

  onPhaseChange?: (phase: GamePhase) => void;

  setViewport(w: number, h: number): void {
    this.viewportW = w;
    this.viewportH = h;
  }

  startRun(vesselId: string): void {
    const found = VESSELS.find((v) => v.id === vesselId) ?? VESSELS[0];
    this.vessel = found;
    this.sheet = new StatSheet(HOLLOW_WAR_STAT_RULES);
    this.procs = new ProcRuntime();

    const archiveBonuses = getArchiveBonuses(this.archive);
    if (archiveBonuses.mods.length > 0) {
      this.sheet.setSource('archive', archiveBonuses.mods);
    }

    this.arts = [];
    this.acquiredCards.clear();
    this.banishedCards.clear();
    this.lastRunShards = 0;
    this.addOrRankArt(found.startingArtId);

    this.updateConditions(false);
    const maxLife = this.sheet.get('life');
    const maxWard = this.sheet.get('ward');

    this.player = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 14,
      life: maxLife,
      ward: maxWard,
      wardDelayTimer: 0,
      xp: 0,
      xpToNext: 45,
      level: 1,
      dashTimer: 0,
      dashCooldown: 0,
      ultimateCooldown: 0,
      bloodlustTimer: 0,
      dashDirX: 1,
      dashDirY: 0,
      invulnTimer: 0,
      aimAngle: 0,
      orbitAngle: 0,
      rerolls: 2 + archiveBonuses.extraRerolls,
      banishes: archiveBonuses.banishes,
    };

    resetEnemyIds();
    this.enemies = [];
    this.projectiles = [];
    this.arcs = [];
    this.novas = [];
    this.sweeps = [];
    this.minions = [];
    this.totems = [];
    this.traps = [];
    this.groundZones = [];
    this.incursionPortals = [];
    this.pendingEchoes = [];
    this.pendingAftershocks = [];
    this.pendingThrusts = [];
    this.pendingProjectiles = [];
    this.activeUltEffects = [];
    this.enemyHazards = [];
    this.pickups = [];
    this.floatingTexts = [];
    this.particles = [];
    this.draftOptions = [];
    this.artSelectChoice = null;
    this.passiveSelectChoice = null;
    this.inscribeChoice = null;
    this.artMorphChoice = null;
    this.clearSubOfferCaches();
    this.thronelord = null;

    this.elapsed = 0;
    this.kills = 0;
    this.totalDamageDealt = 0;
    this.screenShake = 0;
    this.spawnTimer = 0.2;
    this.nextBossAt = 90;
    this.nextIncursionAt = 135;
    this.nextWraithWallAt = 150;
    this.nextSwarmSurgeAt = 210;
    this.thronelordSpawnedAt600 = false;
    this.incursionCount = 0;
    this.dotAccumulator = 0;

    // Opening pack of Undead (Risen Zombies & Skeleton Warriors)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const arch = i % 2 === 0 ? 'zombie' : 'skeleton_warrior';
      this.enemies.push(createEnemy(arch, Math.cos(angle) * 340, Math.sin(angle) * 340, 0));
    }

    this.setPhase('playing');
  }

  setPhase(next: GamePhase): void {
    this.phase = next;
    this.onPhaseChange?.(next);
  }

  triggerUltimate(): void {
    if (this.phase !== 'playing') return;
    if (this.player.ultimateCooldown > 0) return;

    const ult = this.vessel.ultimate;
    const cdr = Math.max(0.3, this.sheet.get('cooldownRecovery'));
    this.player.ultimateCooldown = ult.cooldown / cdr;
    this.screenShake = 10;

    this.floatingTexts.push({
      x: this.player.x,
      y: this.player.y - 30,
      vy: -24,
      text: ult.name.toUpperCase(),
      color: this.vessel.color,
      life: 1.0,
      maxLife: 1.0,
      scale: 1.15,
    });

    switch (ult.id) {
      case 'stormcrown': {
        // Calls down lightning strikes across the battlefield over 3.6 seconds
        const r = 300 * this.sheet.get('area', ['aoe', 'lightning']);
        this.activeUltEffects.push({
          id: nextEntityId++,
          kind: 'stormcrown',
          x: this.player.x,
          y: this.player.y,
          startRadius: r,
          endRadius: r,
          radius: r,
          life: 3.6,
          maxLife: 3.6,
          tickTimer: 0.05,
        });
        break;
      }
      case 'red_hour': {
        // Massive iron shockwave + 4s Red Hour Bloodlust
        const r = 190 * this.sheet.get('area', ['aoe', 'physical']);
        this.novas.push({ x: this.player.x, y: this.player.y, radius: 14, maxRadius: r, color: '#ef4444', life: 0.32, maxLife: 0.32 });
        const slamSpec: SkillDamageSpec = { baseDamage: { physical: 68 }, baseCooldown: 1, tags: ['attack', 'aoe', 'physical'] };
        for (const e of this.enemies) {
          if (e.life > 0 && Math.hypot(e.x - this.player.x, e.y - this.player.y) <= r + e.radius) {
            this.applyArtHit(e, slamSpec, []);
          }
        }
        this.player.bloodlustTimer = 4.0;
        this.sheet.setSource('ult_red_hour', [
          { stat: 'attackSpeed', kind: 'inc', value: 0.45 },
          { stat: 'moveSpeed', kind: 'inc', value: 0.25 },
          { stat: 'lifeLeech', kind: 'flat', value: 0.15 },
        ]);
        break;
      }
      case 'hundred_partings': {
        // Briefly chills/stills nearby foes + 9-blade piercing crescent
        const r = 210;
        this.novas.push({ x: this.player.x, y: this.player.y, radius: 12, maxRadius: r, color: '#a3b899', life: 0.25, maxLife: 0.25 });
        for (const e of this.enemies) {
          if (e.life > 0 && Math.hypot(e.x - this.player.x, e.y - this.player.y) <= r + e.radius) {
            e.ailments.push({ type: 'chill', dps: 0, remaining: 2.0, maxDuration: 2.0 });
          }
        }
        const baseA = this.player.aimAngle;
        for (let i = 0; i < 9; i++) {
          const a = baseA + (i - 4) * 0.14;
          this.projectiles.push({
            id: nextEntityId++,
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(a) * 680,
            vy: Math.sin(a) * 680,
            radius: 6,
            color: '#c084fc',
            artId: 'fan_of_blades',
            pierceLeft: 3,
            life: 1.3,
            hitIds: new Set(),
          });
        }
        break;
      }
      case 'grave_tide': {
        // Summons 6 temporary Risen Skeletons in a burst for 10 seconds
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          this.minions.push({
            id: nextEntityId++,
            artId: 'summon_skeleton',
            kind: 'skeleton',
            x: this.player.x + Math.cos(a) * 56,
            y: this.player.y + Math.sin(a) * 56,
            facing: a,
            attackTimer: 0.1,
            temporary: true,
            life: 10,
          });
          this.spawnParticles(this.player.x + Math.cos(a) * 56, this.player.y + Math.sin(a) * 56, '#a855f7', 5, 80);
        }
        break;
      }
      case 'pillar_of_flame': {
        // Hollow Wake Pillar of Flame: burning ring that contracts inward over 2.6s, searing enemies on its rim
        const startR = 235 * this.sheet.get('area', ['aoe', 'fire']);
        this.activeUltEffects.push({
          id: nextEntityId++,
          kind: 'pillar_of_flame',
          x: this.player.x,
          y: this.player.y,
          startRadius: startR,
          endRadius: 24,
          radius: startR,
          life: 2.6,
          maxLife: 2.6,
          tickTimer: 0.05,
        });
        break;
      }
      case 'doom_bell': {
        // Wide physical shockwave + knockback + restore 60% Maximum Ward
        const maxW = this.sheet.get('ward');
        this.player.ward = Math.min(maxW, this.player.ward + maxW * 0.6);
        const r = 220 * this.sheet.get('area', ['aoe', 'physical']);
        this.novas.push({ x: this.player.x, y: this.player.y, radius: 14, maxRadius: r, color: '#fbbf24', life: 0.34, maxLife: 0.34 });
        const bellSpec: SkillDamageSpec = { baseDamage: { physical: 72 }, baseCooldown: 1, tags: ['attack', 'aoe', 'physical'] };
        for (const e of this.enemies) {
          if (e.life > 0 && Math.hypot(e.x - this.player.x, e.y - this.player.y) <= r + e.radius) {
            this.applyArtHit(e, bellSpec, []);
            const dx = e.x - this.player.x;
            const dy = e.y - this.player.y;
            const d = Math.max(1, Math.hypot(dx, dy));
            e.x += (dx / d) * 65;
            e.y += (dy / d) * 65;
          }
        }
        break;
      }
    }
  }

  addOrRankArt(artId: string): EquippedArt {
    const existing = this.arts.find((a) => a.artId === artId);
    if (existing) {
      existing.level += 1;
      return existing;
    }
    const inst: EquippedArt = {
      artId,
      level: 1,
      cooldownTimer: 0.1,
      inscriptions: [],
      getArtMods() {
        const mods: Modifier[] = getArtModsForRank(this.artId, this.level);
        for (const ins of this.inscriptions) {
          mods.push(...ins.mods);
        }
        if (this.morph) {
          mods.push(...this.morph.mods);
        }
        return mods;
      },
    };
    this.arts.push(inst);
    return inst;
  }

  getEffectiveArtSpec(art: EquippedArt): ArtDefinition {
    const base = ARTS[art.artId];
    const m = art.morph;
    if (!m) return base;
    return {
      ...base,
      behavior: m.overrideBehavior ?? base.behavior,
      baseProjectiles: base.baseProjectiles + (m.extraProjectiles ?? 0),
      baseRadius: m.overrideRadius ?? base.baseRadius,
      baseCooldown: m.overrideCooldown ?? base.baseCooldown,
      explodeRadius: m.explodeRadius ?? base.explodeRadius,
      explodeScale: m.explodeScale ?? base.explodeScale,
      tags: m.addTags ? [...new Set([...base.tags, ...m.addTags])] : base.tags,
    };
  }

  getArtExtraMods(art: EquippedArt): Modifier[] {
    return art.getArtMods();
  }

  getArtPreview(art: EquippedArt): SkillDpsPreview {
    const def = this.getEffectiveArtSpec(art);
    const extraConvs = [...art.inscriptions.flatMap((i) => i.conversions ?? []), ...(art.morph?.conversions ?? [])];
    const extraExtras = [...art.inscriptions.flatMap((i) => i.extras ?? []), ...(art.morph?.extras ?? [])];
    const echoMult = 1 + art.inscriptions.reduce((s, i) => s + (i.echoChance ?? 0), 0);
    return previewSkillDps(
      this.sheet,
      def,
      this.getArtExtraMods(art),
      def.baseProjectiles,
      extraConvs,
      extraExtras,
      echoMult,
    );
  }

  getTotalEstimatedDps(): number {
    return this.arts.reduce((sum, a) => sum + this.getArtPreview(a).estimatedDps, 0);
  }

  update(rawDt: number): void {
    if (this.phase !== 'playing') return;
    const dt = Math.min(rawDt, 0.05);
    this.elapsed += dt;
    this.screenShake = Math.max(0, this.screenShake - dt * 28);

    this.updatePlayer(dt);
    this.updateConditions(Math.hypot(this.player.vx, this.player.vy) > 15);
    this.updateArts(dt);
    this.updateEchoes(dt);
    this.updateAftershocks(dt);
    this.updatePendingThrusts(dt);
    this.updatePendingProjectiles(dt);
    this.updateActiveUltEffects(dt);
    this.updateMinions(dt);
    this.updateTotems(dt);
    this.updateTraps(dt);
    this.updateGroundZones(dt);
    this.updateProjectiles(dt);
    this.updateEnemies(dt);
    this.updateAilments(dt);
    this.updatePickups(dt);
    this.updateSpawner(dt);
    this.updateIncursions(dt);
    this.updateWraithWalls();
    this.updateEnemyHazards(dt);
    this.updateVfx(dt);
  }

  private updateConditions(isMoving: boolean): void {
    const maxLife = this.sheet.get('life');
    const maxWard = this.sheet.get('ward');
    const conds: ConditionId[] = [];
    if (this.player.life <= maxLife * 0.4) conds.push('lowLife');
    if (this.player.life >= maxLife * 0.99) conds.push('fullLife');
    if (this.player.ward > 0.5) conds.push('warded');
    else if (maxWard > 0) conds.push('wardBroken');
    conds.push(isMoving ? 'moving' : 'stationary');
    this.sheet.setConditions(conds);
  }

  private updateArts(dt: number): void {
    for (const art of this.arts) {
      const def = this.getEffectiveArtSpec(art);
      if (!def) continue;

      if (def.behavior === 'orbit') {
        this.updateOrbitArt(art, def);
        continue;
      }

      if (def.behavior === 'minion' && !def.timedSummon) {
        this.syncMinionRoster(art, def);
        continue;
      }

      art.cooldownTimer -= dt;
      if (art.cooldownTimer <= 0) {
        const extraMods = this.getArtExtraMods(art);
        art.cooldownTimer = this.getArtEffectiveCooldown(art, extraMods);

        this.castArt(art, def, extraMods);

        const echoIns = art.inscriptions.find((s) => s.echoChance);
        if (echoIns?.echoChance && Math.random() < echoIns.echoChance) {
          this.pendingEchoes.push({ artId: art.artId, delay: 0.14 });
        }
      }
    }
  }

  getArtEffectiveCooldown(art: EquippedArt, precomputedMods?: Modifier[]): number {
    const def = this.getEffectiveArtSpec(art);
    if (!def) return 1;
    const extraMods = precomputedMods ?? this.getArtExtraMods(art);
    const speedStat = def.tags.includes('attack') ? 'attackSpeed' : 'castSpeed';
    const speed = Math.max(0.15, this.sheet.get(speedStat, def.tags, extraMods));
    const cdr = Math.max(0.25, this.sheet.get('cooldownRecovery', def.tags, extraMods));
    return Math.max(0.08, def.baseCooldown / (def.cooldownOnly ? cdr : speed * cdr));
  }

  private updateEchoes(dt: number): void {
    for (let i = this.pendingEchoes.length - 1; i >= 0; i--) {
      const echo = this.pendingEchoes[i];
      echo.delay -= dt;
      if (echo.delay <= 0) {
        this.pendingEchoes.splice(i, 1);
        const art = this.arts.find((a) => a.artId === echo.artId);
        if (art) {
          const def = this.getEffectiveArtSpec(art);
          this.castArt(art, def, this.getArtExtraMods(art));
        }
      }
    }
  }

  private updateAftershocks(dt: number): void {
    for (let i = this.pendingAftershocks.length - 1; i >= 0; i--) {
      const shock = this.pendingAftershocks[i];
      shock.delay -= dt;
      if (shock.delay <= 0) {
        this.pendingAftershocks.splice(i, 1);
        const art = this.arts.find((a) => a.artId === shock.artId);
        const def = art ? this.getEffectiveArtSpec(art) : ARTS[shock.artId];
        if (!art || !def) continue;
        const extraMods = this.getArtExtraMods(art);
        const scaledSpec: SkillDamageSpec = {
          ...def,
          damageEffectiveness: (def.damageEffectiveness ?? 1) * shock.scale,
          tags: [...def.tags, 'aoe'],
        };
        this.novas.push({
          x: shock.x,
          y: shock.y,
          radius: 14,
          maxRadius: shock.radius,
          color: shock.color,
          life: 0.26,
          maxLife: 0.26,
        });
        for (const e of this.enemies) {
          if (e.life <= 0) continue;
          if (Math.hypot(e.x - shock.x, e.y - shock.y) <= shock.radius + e.radius) {
            this.applyArtHit(e, scaledSpec, extraMods, art);
          }
        }
      }
    }
  }

  private updatePendingThrusts(dt: number): void {
    for (let i = this.pendingThrusts.length - 1; i >= 0; i--) {
      const th = this.pendingThrusts[i];
      th.delay -= dt;
      if (th.delay <= 0) {
        this.pendingThrusts.splice(i, 1);
        const art = this.arts.find((a) => a.artId === th.artId);
        if (art) {
          const def = this.getEffectiveArtSpec(art);
          this.executeThrust(art, def, this.getArtExtraMods(art), this.player.aimAngle, th.reach, th.halfWidth, th.reachOffset, th.doReverse);
        }
      }
    }
  }

  private executeThrust(
    art: EquippedArt,
    def: ArtDefinition,
    extraMods: Modifier[],
    baseAngle: number,
    reach: number,
    halfWidth: number,
    reachOffset: number,
    doReverse: boolean,
  ): void {
    const ox = this.player.x + Math.cos(baseAngle) * reachOffset;
    const oy = this.player.y + Math.sin(baseAngle) * reachOffset;
    const angles = doReverse ? [baseAngle, baseAngle + Math.PI] : [baseAngle];
    for (const thrustAngle of angles) {
      const dx = Math.cos(thrustAngle);
      const dy = Math.sin(thrustAngle);
      this.sweeps.push({
        x: ox,
        y: oy,
        angle: thrustAngle,
        radius: reach,
        arcSpread: 0.15,
        color: def.color,
        life: 0.2,
        maxLife: 0.2,
        isThrust: true,
      });
      for (const e of this.enemies) {
        if (e.life <= 0) continue;
        const ex = e.x - ox;
        const ey = e.y - oy;
        const proj = Math.max(0, Math.min(reach, ex * dx + ey * dy));
        const cx = ox + dx * proj;
        const cy = oy + dy * proj;
        if (Math.hypot(e.x - cx, e.y - cy) <= halfWidth + e.radius) {
          this.applyArtHit(e, def, extraMods, art);
        }
      }
    }
  }

  private updateOrbitArt(art: EquippedArt, def: ArtDefinition): void {
    const extraMods = this.getArtExtraMods(art);
    const count = def.baseProjectiles + Math.max(0, Math.round(this.sheet.get('projectileCount', def.tags, extraMods)));
    const orbitRadius = def.baseRadius * this.sheet.get('area', def.tags, extraMods);

    for (let i = 0; i < count; i++) {
      const angle = this.player.orbitAngle + (i / count) * Math.PI * 2;
      const bx = this.player.x + Math.cos(angle) * orbitRadius;
      const by = this.player.y + Math.sin(angle) * orbitRadius;

      for (const e of this.enemies) {
        if (e.life <= 0 || e.orbitHitCooldown > 0) continue;
        const dist = Math.hypot(e.x - bx, e.y - by);
        if (dist <= e.radius + 17) {
          e.orbitHitCooldown = def.baseCooldown / Math.max(0.3, this.sheet.get('attackSpeed', def.tags, extraMods));
          this.applyArtHit(e, def, extraMods, art);
        }
      }
    }
  }

  private updateActiveUltEffects(dt: number): void {
    for (let i = this.activeUltEffects.length - 1; i >= 0; i--) {
      const fx = this.activeUltEffects[i];
      fx.life -= dt;
      if (fx.life <= 0) {
        this.activeUltEffects.splice(i, 1);
        continue;
      }

      const progress = 1 - fx.life / fx.maxLife;
      fx.radius = fx.startRadius + (fx.endRadius - fx.startRadius) * progress;

      fx.tickTimer -= dt;
      if (fx.tickTimer <= 0) {
        if (fx.kind === 'pillar_of_flame') {
          fx.tickTimer = 0.32;
          const fireSpec: SkillDamageSpec = { baseDamage: { fire: 28 }, baseCooldown: 1, tags: ['spell', 'aoe', 'fire'] };
          for (const e of this.enemies) {
            if (e.life <= 0) continue;
            const d = Math.hypot(e.x - fx.x, e.y - fx.y);
            // Hits enemies along the contracting ring rim (with generous 55px band)
            if (Math.abs(d - fx.radius) <= 55 + e.radius) {
              this.applyArtHit(e, fireSpec, [{ stat: 'igniteChance', kind: 'flat', value: 0.35 }]);
            }
          }
        } else if (fx.kind === 'stormcrown') {
          fx.tickTimer = 0.22;
          fx.x = this.player.x;
          fx.y = this.player.y;
          const stormSpec: SkillDamageSpec = { baseDamage: { lightning: 34 }, baseCooldown: 1, tags: ['spell', 'lightning'] };
          const pool = this.enemies.filter((e) => e.life > 0 && Math.hypot(e.x - fx.x, e.y - fx.y) <= fx.radius);
          if (pool.length > 0) {
            const target = pool[Math.floor(Math.random() * pool.length)];
            this.arcs.push({
              points: [
                { x: target.x + (Math.random() - 0.5) * 28, y: target.y - 150 },
                { x: target.x, y: target.y },
              ],
              color: '#38bdf8',
              life: 0.2,
              maxLife: 0.2,
            });
            this.applyArtHit(target, stormSpec, [{ stat: 'shockChance', kind: 'flat', value: 0.5 }]);
          }
        }
      }
    }
  }

  private updatePendingProjectiles(dt: number): void {
    for (let i = this.pendingProjectiles.length - 1; i >= 0; i--) {
      const item = this.pendingProjectiles[i];
      item.delay -= dt;
      if (item.delay <= 0) {
        this.pendingProjectiles.splice(i, 1);
        const proj = { ...item.proj };
        if (proj.spiral) {
          proj.spiral = {
            ...proj.spiral,
            originX: this.player.x,
            originY: this.player.y,
          };
          proj.x = this.player.x + Math.cos(proj.spiral.angle) * proj.spiral.radius;
          proj.y = this.player.y + Math.sin(proj.spiral.angle) * proj.spiral.radius;
        } else if (!item.fixedOrigin) {
          const ang = Math.atan2(proj.vy, proj.vx);
          proj.x = this.player.x + Math.cos(ang) * 16;
          proj.y = this.player.y + Math.sin(ang) * 16;
        }
        this.projectiles.push({
          id: nextEntityId++,
          ...proj,
          hitIds: new Set(),
        });
      }
    }
  }

  private getProjTraits(art: EquippedArt | undefined, def: ArtDefinition, extraMods: Modifier[]) {
    const areaScale = this.sheet.get('area', def.tags, extraMods);
    const speedScale = this.sheet.get('projectileSpeed', def.tags, extraMods);
    const durScale = this.sheet.get('projectileDuration', def.tags, extraMods);
    const morph = art?.morph;
    const isBoomerang = Boolean(morph?.returnBoomerang || art?.inscriptions.some((i) => i.returnBoomerang));
    const isHoming = Boolean(def.homing || morph?.forceHoming || art?.inscriptions.some((i) => i.forceHoming));
    const splitOnHit =
      (morph?.splitOnHit ?? 0) + (art ? art.inscriptions.reduce((s, i) => s + (i.splitOnHit ?? 0), 0) : 0);
    const spreadScale = art ? art.inscriptions.reduce((s, i) => s * (i.spreadScale ?? 1), 1) : 1;
    const staggerOverride = art?.inscriptions.find((i) => i.staggerOverride !== undefined)?.staggerOverride;
    return { areaScale, speedScale, durScale, isBoomerang, isHoming, splitOnHit, spreadScale, staggerOverride };
  }

  private castArt(art: EquippedArt, def: ArtDefinition, extraMods: Modifier[]): void {
    if (def.behavior === 'projectile') {
      const count = def.baseProjectiles + Math.max(0, Math.round(this.sheet.get('projectileCount', def.tags, extraMods)));
      const pierce =
        (def.basePierce ?? 0) +
        Math.max(0, Math.round(this.sheet.get('pierceCount', def.tags, extraMods)));
      const { areaScale, speedScale, durScale, isBoomerang, isHoming, splitOnHit, spreadScale, staggerOverride } =
        this.getProjTraits(art, def, extraMods);
      const speed = (def.projectileSpeed ?? 520) * speedScale;
      const life = (def.baseDuration ?? 1.6) * durScale;

      const baseSpread = def.homing ? 0.34 : def.id === 'fan_of_blades' ? 0.22 : 0.14;
      const spreadStep = count > 1 ? baseSpread * spreadScale : 0;
      const startAngle = this.player.aimAngle - ((count - 1) * spreadStep) / 2;
      const stagger = staggerOverride ?? def.staggerDelay ?? 0;

      for (let i = 0; i < count; i++) {
        const a = startAngle + i * spreadStep;
        const projData = {
          x: this.player.x + Math.cos(a) * 16,
          y: this.player.y + Math.sin(a) * 16,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          radius: def.baseRadius * Math.sqrt(areaScale),
          color: def.color,
          artId: def.id,
          pierceLeft: pierce,
          life,
          hitIds: new Set<number>(),
          homing: isHoming,
          explodeRadius: def.explodeRadius ? def.explodeRadius * areaScale : undefined,
          explodeScale: def.explodeScale,
          splitOnHit: splitOnHit > 0 ? splitOnHit : undefined,
          boomerang: isBoomerang ? { maxLife: life, initialPierce: pierce, returned: false } : undefined,
          extraMods,
        };
        if (stagger > 0 && i > 0) {
          this.pendingProjectiles.push({ delay: i * stagger, proj: projData });
        } else {
          this.projectiles.push({ id: nextEntityId++, ...projData });
        }
      }
    } else if (def.behavior === 'spiral') {
      const count = def.baseProjectiles + Math.max(0, Math.round(this.sheet.get('projectileCount', def.tags, extraMods)));
      const pierce = (def.basePierce ?? 99) + Math.max(0, Math.round(this.sheet.get('pierceCount', def.tags, extraMods)));
      const { areaScale, speedScale, durScale, isBoomerang, isHoming, splitOnHit, staggerOverride } =
        this.getProjTraits(art, def, extraMods);
      const life = 2.6 * durScale;
      const stagger = staggerOverride ?? def.staggerDelay ?? 0;
      for (let i = 0; i < count; i++) {
        const a = this.player.aimAngle + (i / count) * Math.PI * 2;
        const projData = {
          x: this.player.x + Math.cos(a) * 18,
          y: this.player.y + Math.sin(a) * 18,
          vx: 0,
          vy: 0,
          radius: def.baseRadius * Math.sqrt(areaScale),
          color: def.color,
          artId: def.id,
          pierceLeft: pierce,
          life,
          hitIds: new Set<number>(),
          homing: isHoming,
          splitOnHit: splitOnHit > 0 ? splitOnHit : undefined,
          boomerang: isBoomerang ? { maxLife: life, initialPierce: pierce, returned: false } : undefined,
          spiral: {
            originX: this.player.x,
            originY: this.player.y,
            angle: a,
            angularSpeed: 5.2 * speedScale,
            radius: 18,
            radialSpeed: 105 * speedScale,
          },
          extraMods,
        };
        if (stagger > 0 && i > 0) {
          this.pendingProjectiles.push({ delay: i * stagger, proj: projData });
        } else {
          this.projectiles.push({ id: nextEntityId++, ...projData });
        }
      }
    } else if (def.behavior === 'projectile_nova') {
      const count = def.baseProjectiles + Math.max(0, Math.round(this.sheet.get('projectileCount', def.tags, extraMods)));
      const pierce =
        (def.basePierce ?? 0) +
        Math.max(0, Math.round(this.sheet.get('pierceCount', def.tags, extraMods)));
      const { areaScale, speedScale, durScale, isBoomerang, isHoming, splitOnHit, staggerOverride } = this.getProjTraits(art, def, extraMods);
      const speed = (def.projectileSpeed ?? 430) * speedScale;
      const life = (def.baseDuration ?? 1.5) * durScale;
      const stagger = staggerOverride ?? def.staggerDelay ?? 0;
      for (let i = 0; i < count; i++) {
        const a = this.player.aimAngle + (i / count) * Math.PI * 2;
        const projData = {
          x: this.player.x + Math.cos(a) * 14,
          y: this.player.y + Math.sin(a) * 14,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          radius: def.baseRadius * Math.sqrt(areaScale),
          color: def.color,
          artId: def.id,
          pierceLeft: pierce,
          life,
          hitIds: new Set<number>(),
          homing: isHoming,
          splitOnHit: splitOnHit > 0 ? splitOnHit : undefined,
          boomerang: isBoomerang ? { maxLife: life, initialPierce: pierce, returned: false } : undefined,
          extraMods,
        };
        if (stagger > 0 && i > 0) {
          this.pendingProjectiles.push({ delay: i * stagger, proj: projData });
        } else {
          this.projectiles.push({ id: nextEntityId++, ...projData });
        }
      }
    } else if (def.behavior === 'ground_zone') {
      if (this.groundZones.length >= 4) this.groundZones.shift();
      const maxRadius = def.baseRadius * this.sheet.get('area', def.tags, extraMods);
      const isBlight = def.id === 'blight_zone';
      const initialRadius = isBlight ? maxRadius * 0.36 : maxRadius;
      this.groundZones.push({
        id: nextEntityId++,
        artId: def.id,
        x: this.player.x,
        y: this.player.y,
        radius: initialRadius,
        initialRadius,
        expandToRadius: isBlight ? maxRadius * 1.35 : maxRadius,
        life: 4.5,
        maxLife: 4.5,
        tickTimer: 0.05,
        color: def.color,
      });
    } else if (def.behavior === 'chain') {
      const range = def.baseRadius * this.sheet.get('area', def.tags, extraMods);
      const chains = (def.baseChain ?? 2) + Math.max(0, Math.round(this.sheet.get('chainCount', def.tags, extraMods)));
      this.castChainLightning(this.player.x, this.player.y, range, chains, def, extraMods, art);
    } else if (def.behavior === 'nova') {
      const radius = def.baseRadius * this.sheet.get('area', def.tags, extraMods);
      this.novas.push({
        x: this.player.x,
        y: this.player.y,
        radius: 12,
        maxRadius: radius,
        color: def.color,
        life: 0.28,
        maxLife: 0.28,
      });
      for (const e of this.enemies) {
        if (e.life <= 0) continue;
        if (Math.hypot(e.x - this.player.x, e.y - this.player.y) <= radius + e.radius) {
          this.applyArtHit(e, def, extraMods, art);
        }
      }
      if (def.innateAftershock) {
        this.pendingAftershocks.push({
          artId: def.id,
          x: this.player.x,
          y: this.player.y,
          radius: radius * def.innateAftershock.radiusMult,
          scale: def.innateAftershock.scale,
          color: def.color,
          delay: def.innateAftershock.delay,
        });
      }
      const morph = art.morph;
      const shockSpec = morph?.aftershockDelay ? morph : art.inscriptions.find((i) => i.aftershockDelay);
      if (shockSpec?.aftershockDelay) {
        const count = shockSpec.aftershockCount ?? 1;
        for (let c = 0; c < count; c++) {
          this.pendingAftershocks.push({
            artId: def.id,
            x: this.player.x,
            y: this.player.y,
            radius: radius * 0.9,
            scale: shockSpec.aftershockScale ?? 0.65,
            color: shockSpec.color,
            delay: shockSpec.aftershockDelay * (c + 1),
          });
        }
      }
      const waveCount = art.inscriptions.reduce((s, i) => s + (i.strikeWaveCount ?? 0), 0);
      if (waveCount > 0) {
        for (let w = 0; w < waveCount; w++) {
          const a = this.player.aimAngle + (w - (waveCount - 1) / 2) * 0.26;
          this.projectiles.push({
            id: nextEntityId++,
            x: this.player.x + Math.cos(a) * 18,
            y: this.player.y + Math.sin(a) * 18,
            vx: Math.cos(a) * 480,
            vy: Math.sin(a) * 480,
            radius: 10,
            color: def.color,
            artId: def.id,
            pierceLeft: 2,
            life: 0.85,
            hitIds: new Set(),
            explodeScale: 0.55,
            extraMods,
          });
        }
      }
    } else if (def.behavior === 'sweep') {
      const radius = def.baseRadius * this.sheet.get('area', def.tags, extraMods);
      const baseArc = def.baseSweepArc ?? Math.PI * 0.78;
      const arcScale =
        (art.morph?.sweepArcScale ?? 1) * art.inscriptions.reduce((s, i) => s * (i.sweepArcScale ?? 1), 1);
      const arcSpread = Math.min(Math.PI * 1.95, baseArc * arcScale);
      const reachOffset = art.inscriptions.reduce((s, i) => s + (i.sweepReachOffset ?? 0), 0);
      const ox = this.player.x + Math.cos(this.player.aimAngle) * reachOffset;
      const oy = this.player.y + Math.sin(this.player.aimAngle) * reachOffset;
      const doReverse = art.inscriptions.some((i) => i.reverseSweep);
      const angles = doReverse ? [this.player.aimAngle, this.player.aimAngle + Math.PI] : [this.player.aimAngle];

      for (const swingAngle of angles) {
        this.sweeps.push({
          x: ox,
          y: oy,
          angle: swingAngle,
          radius,
          arcSpread,
          color: def.color,
          life: 0.2,
          maxLife: 0.2,
        });
        for (const e of this.enemies) {
          if (e.life <= 0) continue;
          const dx = e.x - ox;
          const dy = e.y - oy;
          const dist = Math.hypot(dx, dy);
          if (dist <= radius + e.radius) {
            let diff = Math.atan2(dy, dx) - swingAngle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            if (Math.abs(diff) <= arcSpread / 2 + 0.25) {
              this.applyArtHit(e, def, extraMods, art);
            }
          }
        }
      }

      if (def.sweepProjectiles) {
        const sp = def.sweepProjectiles;
        const projCount = sp.count + Math.max(0, Math.round(this.sheet.get('projectileCount', def.tags, extraMods)));
        const pierce = (sp.pierce ?? 0) + Math.max(0, Math.round(this.sheet.get('pierceCount', def.tags, extraMods)));
        const { areaScale, speedScale, durScale, isBoomerang, isHoming, splitOnHit, spreadScale, staggerOverride } =
          this.getProjTraits(art, def, extraMods);
        const spread = projCount > 1 ? 0.22 * spreadScale : 0;
        const life = sp.duration * durScale;
        const stagger = staggerOverride ?? 0;
        for (let k = 0; k < projCount; k++) {
          const a = this.player.aimAngle + (k - (projCount - 1) / 2) * spread;
          const projData = {
            x: ox + Math.cos(a) * 20,
            y: oy + Math.sin(a) * 20,
            vx: Math.cos(a) * sp.speed * speedScale,
            vy: Math.sin(a) * sp.speed * speedScale,
            radius: sp.radius * Math.sqrt(areaScale),
            color: def.color,
            artId: def.id,
            pierceLeft: pierce,
            life,
            hitIds: new Set<number>(),
            homing: isHoming,
            explodeRadius: sp.explodeRadius ? sp.explodeRadius * areaScale : undefined,
            explodeScale: sp.explodeScale ?? 0.65,
            splitOnHit: splitOnHit > 0 ? splitOnHit : undefined,
            boomerang: isBoomerang ? { maxLife: life, initialPierce: pierce, returned: false } : undefined,
            extraMods,
          };
          if (stagger > 0 && k > 0) {
            this.pendingProjectiles.push({ delay: k * stagger, proj: projData });
          } else {
            this.projectiles.push({ id: nextEntityId++, ...projData });
          }
        }
      }

      const waveCount = art.inscriptions.reduce((s, i) => s + (i.strikeWaveCount ?? 0), 0);
      if (waveCount > 0) {
        for (let w = 0; w < waveCount; w++) {
          const a = this.player.aimAngle + (w - (waveCount - 1) / 2) * 0.22;
          this.projectiles.push({
            id: nextEntityId++,
            x: ox + Math.cos(a) * 18,
            y: oy + Math.sin(a) * 18,
            vx: Math.cos(a) * 510,
            vy: Math.sin(a) * 510,
            radius: 10,
            color: def.color,
            artId: def.id,
            pierceLeft: 2,
            life: 0.85,
            hitIds: new Set(),
            explodeScale: 0.55,
            extraMods,
          });
        }
      }

      const aftershockSpec = art.morph?.aftershockDelay ? art.morph : art.inscriptions.find((i) => i.aftershockDelay);
      if (aftershockSpec?.aftershockDelay) {
        const count = aftershockSpec.aftershockCount ?? 1;
        for (let c = 0; c < count; c++) {
          this.pendingAftershocks.push({
            artId: def.id,
            x: ox + Math.cos(this.player.aimAngle) * (radius * 0.45),
            y: oy + Math.sin(this.player.aimAngle) * (radius * 0.45),
            radius: radius * 0.85,
            scale: aftershockSpec.aftershockScale ?? 0.65,
            color: aftershockSpec.color,
            delay: aftershockSpec.aftershockDelay * (c + 1),
          });
        }
      }
    } else if (def.behavior === 'thrust') {
      const areaScale = this.sheet.get('area', def.tags, extraMods);
      const reach = def.baseRadius * areaScale;
      const halfWidth = (def.thrustHalfWidth ?? 19) * Math.sqrt(areaScale);
      const reachOffset = art.inscriptions.reduce((s, i) => s + (i.sweepReachOffset ?? 0), 0);
      const doReverse = art.inscriptions.some((i) => i.reverseSweep);
      if (def.windupDelay && def.windupDelay > 0) {
        this.spawnParticles(this.player.x, this.player.y, def.color, 6, 80);
        this.pendingThrusts.push({
          artId: def.id,
          angle: this.player.aimAngle,
          reach,
          halfWidth,
          reachOffset,
          doReverse,
          delay: def.windupDelay,
        });
      } else {
        this.executeThrust(art, def, extraMods, this.player.aimAngle, reach, halfWidth, reachOffset, doReverse);
      }
    } else if (def.behavior === 'cascade_line') {
      const areaScale = this.sheet.get('area', def.tags, extraMods);
      const radius = def.baseRadius * areaScale;
      const steps = def.baseProjectiles + Math.max(0, Math.round(this.sheet.get('projectileCount', def.tags, extraMods)));
      const stepDist = radius * 1.15;
      for (let s = 0; s < steps; s++) {
        const cx = this.player.x + Math.cos(this.player.aimAngle) * (stepDist * (s + 0.7));
        const cy = this.player.y + Math.sin(this.player.aimAngle) * (stepDist * (s + 0.7));
        if (s === 0) {
          this.novas.push({
            x: cx,
            y: cy,
            radius: 12,
            maxRadius: radius,
            color: def.color,
            life: 0.28,
            maxLife: 0.28,
          });
          for (const e of this.enemies) {
            if (e.life <= 0) continue;
            if (Math.hypot(e.x - cx, e.y - cy) <= radius + e.radius) {
              this.applyArtHit(e, def, extraMods, art);
            }
          }
        } else {
          this.pendingAftershocks.push({
            artId: def.id,
            x: cx,
            y: cy,
            radius,
            scale: 1.0,
            color: def.color,
            delay: s * 0.11,
          });
        }
      }
    } else if (def.behavior === 'minion' && def.timedSummon) {
      const count = def.baseProjectiles + Math.max(0, Math.round(this.sheet.get('projectileCount', def.tags, extraMods)));
      const durScale = Math.max(0.25, this.sheet.get('projectileDuration', def.tags, extraMods));
      const life = (def.baseDuration ?? 11) * durScale;
      const maxCap = def.maxSummons ?? 24;
      const explodeScale = art.inscriptions.reduce((s, i) => s + (i.explodeOnExpire ?? 0), 0);

      for (let k = 0; k < count; k++) {
        const activeOwned = this.minions.filter((m) => m.artId === def.id);
        if (activeOwned.length >= maxCap) {
          const oldest = activeOwned[0];
          const idx = this.minions.indexOf(oldest);
          if (idx >= 0) {
            if (explodeScale > 0) this.detonateMinion(oldest, def, extraMods, art, explodeScale);
            this.minions.splice(idx, 1);
          }
        }
        const a = this.player.aimAngle + ((k - (count - 1) / 2) * 0.55) + (Math.random() - 0.5) * 0.25;
        this.minions.push({
          id: nextEntityId++,
          artId: def.id,
          kind: def.id === 'shambling_horde' ? 'zombie' : 'skeleton',
          x: this.player.x + Math.cos(a) * 44,
          y: this.player.y + Math.sin(a) * 44,
          facing: a,
          attackTimer: 0.18,
          temporary: true,
          life,
        });
      }
    } else if (def.behavior === 'totem') {
      if (this.totems.length >= 3) this.totems.shift();
      const durScale = Math.max(0.25, this.sheet.get('projectileDuration', def.tags, extraMods));
      const life = 8.5 * durScale;
      this.totems.push({
        id: nextEntityId++,
        artId: def.id,
        x: this.player.x + Math.cos(this.player.aimAngle) * 42,
        y: this.player.y + Math.sin(this.player.aimAngle) * 42,
        life,
        maxLife: life,
        fireTimer: 0.2,
      });
    } else if (def.behavior === 'trap') {
      const trapBonus = art.inscriptions.reduce((s, i) => s + (i.trapCountBonus ?? 0), 0);
      const throws = 1 + trapBonus;
      const maxTraps = 6 + trapBonus * 2;
      const areaScale = this.sheet.get('area', def.tags, extraMods);
      for (let t = 0; t < throws; t++) {
        if (this.traps.length >= maxTraps) this.traps.shift();
        this.traps.push({
          id: nextEntityId++,
          artId: def.id,
          x: this.player.x + (Math.random() - 0.5) * 64,
          y: this.player.y + (Math.random() - 0.5) * 64,
          life: 14,
          triggerRadius: 38 * Math.sqrt(areaScale),
          blastRadius: def.baseRadius * areaScale,
        });
      }
    }
  }

  private syncMinionRoster(art: EquippedArt, def: ArtDefinition): void {
    const extraMods = this.getArtExtraMods(art);
    const desired =
      def.baseProjectiles + Math.max(0, Math.round(this.sheet.get('projectileCount', def.tags, extraMods)));
    const current = this.minions.filter((m) => m.artId === art.artId && !m.temporary);
    if (current.length < desired) {
      const kind =
        art.artId === 'summon_flame_sprite'
          ? 'flame_sprite'
          : art.artId === 'summon_bone_golem'
            ? 'bone_golem'
            : 'skeleton';
      for (let i = current.length; i < desired; i++) {
        const a = (i / Math.max(1, desired)) * Math.PI * 2;
        this.minions.push({
          id: nextEntityId++,
          artId: art.artId,
          kind,
          x: this.player.x + Math.cos(a) * 48,
          y: this.player.y + Math.sin(a) * 48,
          facing: a,
          attackTimer: 0.2,
        });
      }
    }
  }

  private detonateMinion(
    m: MinionEntity,
    def: ArtDefinition,
    extraMods: Modifier[],
    art: EquippedArt | undefined,
    scale: number,
  ): void {
    const radius = 64 * this.sheet.get('area', def.tags, extraMods);
    this.novas.push({
      x: m.x,
      y: m.y,
      radius: 10,
      maxRadius: radius,
      color: '#fb923c',
      life: 0.24,
      maxLife: 0.24,
    });
    const blastSpec: SkillDamageSpec = {
      ...def,
      damageEffectiveness: (def.damageEffectiveness ?? 1) * scale,
      tags: [...def.tags, 'aoe'],
    };
    for (const e of this.enemies) {
      if (e.life <= 0) continue;
      if (Math.hypot(e.x - m.x, e.y - m.y) <= radius + e.radius) {
        this.applyArtHit(e, blastSpec, extraMods, art);
      }
    }
  }

  private updateMinions(dt: number): void {
    for (let i = this.minions.length - 1; i >= 0; i--) {
      const m = this.minions[i];
      const art = this.arts.find((a) => a.artId === m.artId);
      const def = art ? this.getEffectiveArtSpec(art) : ARTS[m.artId];
      const extraMods = art ? this.getArtExtraMods(art) : [];

      if (m.temporary && m.life !== undefined) {
        m.life -= dt;
        if (m.life <= 0) {
          const explodeScale = art ? art.inscriptions.reduce((s, ins) => s + (ins.explodeOnExpire ?? 0), 0) : 0;
          if (explodeScale > 0 && def) {
            this.detonateMinion(m, def, extraMods, art, explodeScale);
          }
          this.minions.splice(i, 1);
          continue;
        }
      }
      if (!def) continue;
      if (!art && !m.temporary) continue;

      if (m.attackTimer > 0) m.attackTimer -= dt;

      // Find nearest enemy within 360px
      let nearest: Enemy | null = null;
      let bestDist = 360;
      for (const e of this.enemies) {
        if (e.life <= 0) continue;
        const d = Math.hypot(e.x - m.x, e.y - m.y);
        if (d < bestDist) {
          bestDist = d;
          nearest = e;
        }
      }

      if (m.kind === 'skeleton' || m.kind === 'bone_golem' || m.kind === 'zombie') {
        const speedMult =
          (art?.morph?.minionSpeedScale ?? 1) *
          (art ? art.inscriptions.reduce((s, ins) => s * (ins.minionSpeedScale ?? 1), 1) : 1);
        const cleaveBase =
          (art?.morph?.minionCleaveRadius ?? 0) +
          (art ? art.inscriptions.reduce((s, ins) => s + (ins.minionCleaveRadius ?? 0), 0) : 0);
        if (nearest) {
          const dx = nearest.x - m.x;
          const dy = nearest.y - m.y;
          m.facing = Math.atan2(dy, dx);
          const moveSpd = (m.kind === 'bone_golem' ? 165 : m.kind === 'zombie' ? 165 : 205) * speedMult;
          const reach = m.kind === 'bone_golem' ? 28 : m.kind === 'zombie' ? 22 : 18;
          if (bestDist > nearest.radius + reach) {
            m.x += (dx / bestDist) * moveSpd * dt;
            m.y += (dy / bestDist) * moveSpd * dt;
          } else if (m.kind === 'zombie') {
            this.detonateMinion(m, def, extraMods, art, 1.0);
            this.minions.splice(i, 1);
            continue;
          } else if (m.attackTimer <= 0) {
            const spd = Math.max(0.2, this.sheet.get('attackSpeed', def.tags, extraMods));
            const baseSwingCd = def.timedSummon && m.kind === 'skeleton' ? 0.85 : def.baseCooldown;
            m.attackTimer = baseSwingCd / spd;
            if (m.kind === 'bone_golem') {
              const slamR = (def.baseRadius + cleaveBase * 0.5) * this.sheet.get('area', def.tags, extraMods);
              this.novas.push({ x: nearest.x, y: nearest.y, radius: 8, maxRadius: slamR, color: '#d6d3d1', life: 0.24, maxLife: 0.24 });
              for (const e of this.enemies) {
                if (e.life > 0 && Math.hypot(e.x - nearest.x, e.y - nearest.y) <= slamR + e.radius) {
                  this.applyArtHit(e, def, extraMods, art);
                }
              }
            } else if (cleaveBase > 0) {
              const cleaveR = cleaveBase * this.sheet.get('area', def.tags, extraMods);
              this.sweeps.push({
                x: m.x,
                y: m.y,
                angle: m.facing,
                radius: cleaveR,
                arcSpread: Math.PI * 0.75,
                color: '#fbbf24',
                life: 0.16,
                maxLife: 0.16,
              });
              for (const e of this.enemies) {
                if (e.life > 0 && Math.hypot(e.x - nearest.x, e.y - nearest.y) <= cleaveR + e.radius) {
                  this.applyArtHit(e, def, extraMods, art);
                }
              }
            } else {
              this.applyArtHit(nearest, def, extraMods, art);
            }
          }
        } else {
          // Aimless undead wandering around the necromancer when no foe is near
          const dx = this.player.x - m.x;
          const dy = this.player.y - m.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 155) {
            const toPlayer = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.45;
            m.facing = toPlayer;
            m.wanderAngle = toPlayer;
            m.wanderTimer = 0.6;
            m.x += Math.cos(toPlayer) * 165 * speedMult * dt;
            m.y += Math.sin(toPlayer) * 165 * speedMult * dt;
          } else {
            m.wanderTimer = (m.wanderTimer ?? 0) - dt;
            if (m.wanderTimer <= 0 || m.wanderAngle === undefined) {
              m.wanderAngle = Math.random() * Math.PI * 2;
              m.wanderTimer = 0.9 + Math.random() * 1.4;
            }
            // Gently curve wandering heading so they shamble like braindead undead
            m.wanderAngle += (Math.random() - 0.5) * 1.8 * dt;
            m.facing = m.wanderAngle;
            const shambleSpeed = (m.kind === 'bone_golem' ? 42 : 56) * speedMult;
            m.x += Math.cos(m.wanderAngle) * shambleSpeed * dt;
            m.y += Math.sin(m.wanderAngle) * shambleSpeed * dt;
          }
        }
      } else {
        // Flame Sprite hovers near player and spits firebolts
        const idx = this.minions.filter((x) => x.kind === 'flame_sprite').indexOf(m);
        const orbitA = this.player.orbitAngle * 0.9 + idx * 2.1;
        const tx = this.player.x + Math.cos(orbitA) * 52;
        const ty = this.player.y + Math.sin(orbitA) * 52;
        m.x += (tx - m.x) * Math.min(1, dt * 8);
        m.y += (ty - m.y) * Math.min(1, dt * 8);

        if (nearest && m.attackTimer <= 0) {
          const spd = Math.max(0.2, this.sheet.get('castSpeed', def.tags, extraMods));
          m.attackTimer = def.baseCooldown / spd;
          const a = Math.atan2(nearest.y - m.y, nearest.x - m.x);
          m.facing = a;
          const { areaScale, speedScale, durScale, isBoomerang, isHoming, splitOnHit } = this.getProjTraits(art, def, extraMods);
          const pierce = (def.basePierce ?? 0) + Math.max(0, Math.round(this.sheet.get('pierceCount', def.tags, extraMods)));
          const speed = (def.projectileSpeed ?? 480) * speedScale;
          const life = 1.4 * durScale;
          this.projectiles.push({
            id: nextEntityId++,
            x: m.x,
            y: m.y,
            vx: Math.cos(a) * speed,
            vy: Math.sin(a) * speed,
            radius: 5.5 * Math.sqrt(areaScale),
            color: def.color,
            artId: def.id,
            pierceLeft: pierce,
            life,
            hitIds: new Set(),
            homing: isHoming,
            splitOnHit: splitOnHit > 0 ? splitOnHit : undefined,
            boomerang: isBoomerang ? { maxLife: life, initialPierce: pierce, returned: false } : undefined,
            extraMods,
          });
        }
      }
    }

    // Soft collision between ground minions so swarms migrate side-by-side around targets instead of stacking
    const groundMinions = this.minions.filter((m) => m.kind !== 'flame_sprite');
    for (let i = 0; i < groundMinions.length; i++) {
      const a = groundMinions[i];
      const rA = a.kind === 'bone_golem' ? 16 : 11;
      for (let j = i + 1; j < groundMinions.length; j++) {
        const b = groundMinions[j];
        const rB = b.kind === 'bone_golem' ? 16 : 11;
        const minSep = rA + rB + 3;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.hypot(dx, dy);
        if (dist < minSep) {
          if (dist < 0.01) {
            const ang = (a.id * 1.618 + b.id) % 6.283;
            dx = Math.cos(ang);
            dy = Math.sin(ang);
            dist = 1;
          }
          const push = ((minSep - dist) / dist) * 0.45;
          a.x -= dx * push;
          a.y -= dy * push;
          b.x += dx * push;
          b.y += dy * push;
        }
      }
    }
  }

  private updateTotems(dt: number): void {
    for (let i = this.totems.length - 1; i >= 0; i--) {
      const t = this.totems[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.totems.splice(i, 1);
        continue;
      }
      t.fireTimer -= dt;
      if (t.fireTimer <= 0) {
        const art = this.arts.find((a) => a.artId === t.artId);
        const def = art ? this.getEffectiveArtSpec(art) : ARTS[t.artId];
        if (!art || !def) continue;
        const extraMods = this.getArtExtraMods(art);
        const speedStat = def.tags.includes('attack') ? 'attackSpeed' : 'castSpeed';
        const spd = Math.max(0.2, this.sheet.get(speedStat, def.tags, extraMods));
        t.fireTimer = 0.72 / spd;

        const range = def.baseRadius * this.sheet.get('area', def.tags, extraMods);
        let nearest: Enemy | null = null;
        let bestDist = range;
        for (const e of this.enemies) {
          if (e.life <= 0) continue;
          const d = Math.hypot(e.x - t.x, e.y - t.y);
          if (d <= bestDist) {
            bestDist = d;
            nearest = e;
          }
        }
        if (nearest) {
          if (def.id === 'voltaic_sentry') {
            const chains = (def.baseChain ?? 2) + Math.max(0, Math.round(this.sheet.get('chainCount', def.tags, extraMods)));
            this.castChainLightning(t.x, t.y, range, chains, def, extraMods, art);
          } else {
            const count = def.baseProjectiles + Math.max(0, Math.round(this.sheet.get('projectileCount', def.tags, extraMods)));
            const pierce = (def.basePierce ?? 0) + Math.max(0, Math.round(this.sheet.get('pierceCount', def.tags, extraMods)));
            const { areaScale, speedScale, durScale, isBoomerang, isHoming, splitOnHit, spreadScale, staggerOverride } =
              this.getProjTraits(art, def, extraMods);
            const baseA = Math.atan2(nearest.y - t.y, nearest.x - t.x);
            const projSpeed = (def.projectileSpeed ?? 540) * speedScale;
            const life = 1.4 * durScale;
            const spread = count > 1 ? 0.16 * spreadScale : 0;
            const stagger = staggerOverride ?? 0;
            for (let k = 0; k < count; k++) {
              const a = baseA + (k - (count - 1) / 2) * spread;
              const projData = {
                x: t.x,
                y: t.y,
                vx: Math.cos(a) * projSpeed,
                vy: Math.sin(a) * projSpeed,
                radius: 6 * Math.sqrt(areaScale),
                color: def.color,
                artId: def.id,
                pierceLeft: pierce,
                life,
                hitIds: new Set<number>(),
                homing: isHoming,
                splitOnHit: splitOnHit > 0 ? splitOnHit : undefined,
                boomerang: isBoomerang ? { maxLife: life, initialPierce: pierce, returned: false } : undefined,
                extraMods,
              };
              if (stagger > 0 && k > 0) {
                this.pendingProjectiles.push({ delay: k * stagger, fixedOrigin: true, proj: projData });
              } else {
                this.projectiles.push({ id: nextEntityId++, ...projData });
              }
            }
          }
        }
      }
    }
  }

  private updateTraps(dt: number): void {
    for (let i = this.traps.length - 1; i >= 0; i--) {
      const tr = this.traps[i];
      tr.life -= dt;
      if (tr.life <= 0) {
        this.traps.splice(i, 1);
        continue;
      }
      const triggered = this.enemies.some(
        (e) => e.life > 0 && Math.hypot(e.x - tr.x, e.y - tr.y) <= tr.triggerRadius + e.radius,
      );
      if (triggered) {
        const art = this.arts.find((a) => a.artId === tr.artId);
        const def = art ? this.getEffectiveArtSpec(art) : ARTS[tr.artId];
        if (art && def) {
          const extraMods = this.getArtExtraMods(art);
          this.novas.push({
            x: tr.x,
            y: tr.y,
            radius: 10,
            maxRadius: tr.blastRadius,
            color: def.color,
            life: 0.28,
            maxLife: 0.28,
          });
          for (const e of this.enemies) {
            if (e.life > 0 && Math.hypot(e.x - tr.x, e.y - tr.y) <= tr.blastRadius + e.radius) {
              this.applyArtHit(e, def, extraMods, art);
            }
          }
        }
        this.traps.splice(i, 1);
      }
    }
  }

  private updateGroundZones(dt: number): void {
    for (let i = this.groundZones.length - 1; i >= 0; i--) {
      const gz = this.groundZones[i];
      gz.life -= dt;
      if (gz.life <= 0) {
        this.groundZones.splice(i, 1);
        continue;
      }
      if (gz.initialRadius !== undefined && gz.expandToRadius !== undefined) {
        const progress = Math.min(1, Math.max(0, 1 - gz.life / gz.maxLife));
        gz.radius = gz.initialRadius + (gz.expandToRadius - gz.initialRadius) * progress;
      }
      gz.tickTimer -= dt;
      if (gz.tickTimer <= 0) {
        const art = this.arts.find((a) => a.artId === gz.artId);
        const def = art ? this.getEffectiveArtSpec(art) : ARTS[gz.artId];
        if (!art || !def) continue;
        const extraMods = this.getArtExtraMods(art);
        const spd = Math.max(0.2, this.sheet.get('castSpeed', def.tags, extraMods));
        gz.tickTimer = 0.55 / spd;

        for (const e of this.enemies) {
          if (e.life > 0 && Math.hypot(e.x - gz.x, e.y - gz.y) <= gz.radius + e.radius) {
            this.applyArtHit(e, def, extraMods, art);
          }
        }
        // Consecration also heals the player while standing on consecrated ground
        if (gz.artId === 'consecration' && Math.hypot(this.player.x - gz.x, this.player.y - gz.y) <= gz.radius + this.player.radius) {
          this.player.life = Math.min(this.sheet.get('life'), this.player.life + 3.5);
        }
      }
    }
  }

  private castChainLightning(
    startX: number,
    startY: number,
    range: number,
    maxTargets: number,
    def: SkillDamageSpec,
    extraMods: Modifier[],
    art?: EquippedArt,
  ): void {
    const hitSet = new Set<number>();
    const points: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
    let cx = startX;
    let cy = startY;

    for (let i = 0; i < maxTargets; i++) {
      let best: Enemy | null = null;
      let bestDist = range;
      for (const e of this.enemies) {
        if (e.life <= 0 || hitSet.has(e.id)) continue;
        const d = Math.hypot(e.x - cx, e.y - cy);
        if (d <= bestDist) {
          bestDist = d;
          best = e;
        }
      }
      if (!best) break;
      hitSet.add(best.id);
      points.push({ x: best.x, y: best.y });
      this.applyArtHit(best, def, extraMods, art);
      cx = best.x;
      cy = best.y;
    }

    if (points.length > 1) {
      this.arcs.push({ points, color: '#38bdf8', life: 0.16, maxLife: 0.16 });
    }
  }

  private applyArtHit(
    enemy: Enemy,
    spec: SkillDamageSpec,
    extraMods: Modifier[],
    art?: EquippedArt,
    procDepth = 0,
  ): void {
    if (enemy.life <= 0) return;

    const extraConvs = [
      ...(art ? art.inscriptions.flatMap((i) => i.conversions ?? []) : []),
      ...(art?.morph?.conversions ?? []),
    ];
    const extraExtras = [
      ...(art ? art.inscriptions.flatMap((i) => i.extras ?? []) : []),
      ...(art?.morph?.extras ?? []),
    ];
    const innateAilmentMods: Modifier[] = [];
    if (art?.artId === 'poison_nova') {
      innateAilmentMods.push({ stat: 'poisonChance', kind: 'flat', value: 0.6 });
    } else if (art?.artId === 'venom_fang') {
      innateAilmentMods.push({ stat: 'poisonChance', kind: 'flat', value: 0.55 });
    } else if (art?.artId === 'shambling_horde' || art?.artId === 'blight_zone') {
      innateAilmentMods.push({ stat: 'poisonChance', kind: 'flat', value: 0.45 });
    } else if (art?.artId === 'rend') {
      innateAilmentMods.push({ stat: 'bleedChance', kind: 'flat', value: 0.65 });
    } else if (art?.artId === 'sunder_maul') {
      innateAilmentMods.push({ stat: 'armorPen', kind: 'flat', value: 0.25 });
    }
    const mergedMods = innateAilmentMods.length > 0 ? [...extraMods, ...innateAilmentMods] : extraMods;

    const hasShock = enemy.ailments.some((a) => a.type === 'shock');
    const receipt = resolveHit(
      this.sheet,
      spec,
      {
        armor: enemy.armor,
        resistances: enemy.resistances,
        damageTakenMult: hasShock ? 1.25 : 1.0,
      },
      Math.random,
      mergedMods,
      extraConvs,
      extraExtras,
    );

    const execBonus =
      (art?.morph?.executeBonus ?? 0) +
      (art ? art.inscriptions.reduce((s, i) => s + (i.executeBonus ?? 0), 0) : 0);
    const isExecute = execBonus > 0 && enemy.life < enemy.maxLife * 0.5;
    const total = receipt.totalDamage * (isExecute ? 1 + execBonus : 1);

    enemy.life -= total;
    enemy.hitFlash = 0.1;
    this.totalDamageDealt += total;

    const knockForce =
      (art ? art.inscriptions.reduce((s, i) => s + (i.knockbackForce ?? 0), 0) : 0) +
      (art?.artId === 'sunder_maul' ? 28 : 0);
    if (knockForce > 0 && !enemy.isBoss && enemy.life > 0) {
      const kdx = enemy.x - this.player.x;
      const kdy = enemy.y - this.player.y;
      const kd = Math.max(1, Math.hypot(kdx, kdy));
      enemy.x += (kdx / kd) * knockForce;
      enemy.y += (kdy / kd) * knockForce;
    }

    const leech = this.sheet.get('lifeLeech', spec.tags, extraMods) + (art?.artId === 'unmaking_bolt' ? 0.03 : 0);
    if (leech > 0) {
      const maxLife = this.sheet.get('life');
      this.player.life = Math.min(maxLife, this.player.life + total * leech);
    }

    let dominant: DamageType = 'physical';
    let maxVal = -1;
    for (const [k, v] of Object.entries(receipt.byType) as Array<[DamageType, number]>) {
      if (v > maxVal) {
        maxVal = v;
        dominant = k;
      }
    }

    this.floatingTexts.push({
      x: enemy.x + (Math.random() - 0.5) * 14,
      y: enemy.y - enemy.radius - 6,
      vy: -38,
      text: receipt.isCrit ? `${Math.round(total)}!` : `${Math.round(total)}`,
      color: receipt.isCrit ? '#fde047' : DAMAGE_COLORS[dominant],
      life: receipt.isCrit ? 0.75 : 0.55,
      maxLife: receipt.isCrit ? 0.75 : 0.55,
      scale: receipt.isCrit ? 1.25 : 0.95,
    });

    const dotMult = this.sheet.get('dotDamage', spec.tags, extraMods);
    for (const ail of receipt.appliedAilments) {
      if (ail === 'ignite') {
        const dps = Math.max(4, receipt.byType.fire * 0.45 * dotMult);
        this.applyAilment(enemy, 'ignite', dps, 3.0);
      } else if (ail === 'bleed') {
        const dps = Math.max(4, receipt.byType.physical * 0.4 * dotMult);
        this.applyAilment(enemy, 'bleed', dps, 3.2);
      } else if (ail === 'poison') {
        const dps = Math.max(3, (receipt.byType.chaos + receipt.byType.physical * 0.3) * 0.32 * dotMult);
        enemy.ailments.push({ type: 'poison', dps, remaining: 3.5, maxDuration: 3.5 });
      } else if (ail === 'chill') {
        this.applyAilment(enemy, 'chill', 0, 2.5);
      } else if (ail === 'shock') {
        this.applyAilment(enemy, 'shock', 0, 3.0);
      }
    }

    this.procs.emit(
      'onHit',
      this.elapsed,
      { x: enemy.x, y: enemy.y, targetId: enemy.id, damage: total, depth: procDepth },
      (p, ctx) => this.executeProc(p, ctx),
    );
    if (receipt.isCrit) {
      this.procs.emit(
        'onCrit',
        this.elapsed,
        { x: enemy.x, y: enemy.y, targetId: enemy.id, damage: total, depth: procDepth },
        (p, ctx) => this.executeProc(p, ctx),
      );
    }

    if (enemy.life <= 0) {
      this.handleEnemyDeath(enemy, procDepth);
    }
  }

  private applyAilment(enemy: Enemy, type: 'ignite' | 'bleed' | 'chill' | 'shock', dps: number, duration: number): void {
    const existing = enemy.ailments.find((a) => a.type === type);
    if (existing) {
      existing.dps = Math.max(existing.dps, dps);
      existing.remaining = Math.max(existing.remaining, duration);
    } else {
      enemy.ailments.push({ type, dps, remaining: duration, maxDuration: duration });
    }
  }

  private executeProc(spec: ProcSpec, ctx: ProcEventContext): void {
    const depth = ctx.depth ?? 1;
    const power = spec.power ?? 25;

    if (spec.effectId === 'fire_eruption' || spec.effectId === 'ward_shockwave') {
      const isBig = spec.effectId === 'ward_shockwave';
      const radius = (isBig ? 175 : 85) * this.sheet.get('area', ['aoe', 'proc']);
      this.novas.push({
        x: ctx.x,
        y: ctx.y,
        radius: 10,
        maxRadius: radius,
        color: isBig ? '#f59e0b' : '#f97316',
        life: 0.25,
        maxLife: 0.25,
      });
      const procSpec: SkillDamageSpec = {
        baseDamage: isBig ? { physical: power * 0.5, fire: power * 0.5 } : { fire: power },
        baseCooldown: 0.5,
        tags: ['proc', 'aoe', 'fire'],
      };
      for (const e of this.enemies) {
        if (e.life <= 0) continue;
        if (Math.hypot(e.x - ctx.x, e.y - ctx.y) <= radius + e.radius) {
          this.applyArtHit(e, procSpec, [], undefined, depth);
        }
      }
    } else if (spec.effectId === 'arc_discharge') {
      const procSpec: SkillDamageSpec = {
        baseDamage: { lightning: power },
        baseCooldown: 0.5,
        tags: ['proc', 'chain', 'lightning'],
      };
      this.castChainLightning(ctx.x, ctx.y, 200, 3, procSpec, [], undefined);
    } else if (spec.effectId === 'void_dart' || spec.effectId === 'coc_firebolt') {
      const isFire = spec.effectId === 'coc_firebolt';
      const angle = Math.random() * Math.PI * 2;
      this.projectiles.push({
        id: nextEntityId++,
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * 560,
        vy: Math.sin(angle) * 560,
        radius: 6,
        color: isFire ? '#f97316' : '#c084fc',
        artId: isFire ? 'firebolt' : 'fan_of_blades',
        pierceLeft: 0,
        life: 1.2,
        hitIds: new Set(),
        homing: true,
      });
    }
  }

  private handleEnemyDeath(enemy: Enemy, procDepth: number): void {
    this.kills += 1;
    this.spawnParticles(enemy.x, enemy.y, enemy.color, enemy.isBoss ? 28 : 9, 160);

    const maxLife = this.sheet.get('life');
    const maxWard = this.sheet.get('ward');
    const lifeOnKill = this.sheet.get('lifeOnKill');
    const wardOnKill = this.sheet.get('wardOnKill');
    if (lifeOnKill > 0) this.player.life = Math.min(maxLife, this.player.life + lifeOnKill);
    if (wardOnKill > 0 && maxWard > 0) this.player.ward = Math.min(maxWard, this.player.ward + wardOnKill);

    this.pickups.push({
      id: nextEntityId++,
      kind: 'essence',
      x: enemy.x,
      y: enemy.y,
      value: enemy.xpValue,
      color: enemy.isBoss ? '#fbbf24' : '#38bdf8',
      radius: enemy.isBoss ? 8 : 5,
      magnetized: false,
    });

    if (enemy.isBoss || Math.random() < 0.015) {
      this.pickups.push({
        id: nextEntityId++,
        kind: 'magnet',
        x: enemy.x - 10,
        y: enemy.y,
        value: 1,
        color: '#fde047',
        radius: 8,
        magnetized: false,
      });
    } else if (Math.random() < 0.045) {
      this.pickups.push({
        id: nextEntityId++,
        kind: Math.random() < 0.65 ? 'life' : 'ward',
        x: enemy.x + 10,
        y: enemy.y,
        value: 18,
        color: '#22c55e',
        radius: 7,
        magnetized: false,
      });
    }

    this.procs.emit(
      'onKill',
      this.elapsed,
      { x: enemy.x, y: enemy.y, targetId: enemy.id, depth: procDepth },
      (p, ctx) => this.executeProc(p, ctx),
    );
  }

  private updateProjectiles(dt: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      if (p.boomerang) {
        if (!p.boomerang.returned && p.life <= p.boomerang.maxLife * 0.5) {
          p.boomerang.returned = true;
          p.pierceLeft = p.boomerang.initialPierce;
          p.spiral = undefined;
          p.hitIds.clear(); // Reset hit list on return pass!
        }
        if (p.boomerang.returned) {
          const speed = Math.max(240, Math.hypot(p.vx, p.vy));
          const retAngle = Math.atan2(this.player.y - p.y, this.player.x - p.x);
          p.vx = Math.cos(retAngle) * speed;
          p.vy = Math.sin(retAngle) * speed;
        }
      } else if (p.homing && !p.fromEnemy && this.enemies.length > 0) {
        let nearest: Enemy | null = null;
        let best = 450;
        for (const e of this.enemies) {
          if (e.life <= 0 || p.hitIds.has(e.id)) continue;
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d < best) {
            best = d;
            nearest = e;
          }
        }
        if (nearest) {
          const speed = Math.hypot(p.vx, p.vy);
          const curAngle = Math.atan2(p.vy, p.vx);
          const desired = Math.atan2(nearest.y - p.y, nearest.x - p.x);
          let diff = desired - curAngle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          const maxTurn = 3.6 * dt;
          const nextAngle = curAngle + Math.max(-maxTurn, Math.min(maxTurn, diff));
          p.vx = Math.cos(nextAngle) * speed;
          p.vy = Math.sin(nextAngle) * speed;
        }
      }

      if (p.spiral) {
        p.spiral.angle += p.spiral.angularSpeed * dt;
        p.spiral.radius += p.spiral.radialSpeed * dt;
        p.x = p.spiral.originX + Math.cos(p.spiral.angle) * p.spiral.radius;
        p.y = p.spiral.originY + Math.sin(p.spiral.angle) * p.spiral.radius;
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }

      if (p.fromEnemy) {
        const d = Math.hypot(p.x - this.player.x, p.y - this.player.y);
        if (d <= p.radius + this.player.radius) {
          this.damagePlayer(p.enemyDamage ?? 12);
          this.projectiles.splice(i, 1);
        }
        continue;
      }

      const art = this.arts.find((a) => a.artId === p.artId);
      const def = art ? this.getEffectiveArtSpec(art) : ARTS[p.artId];
      if (!def) continue;

      let removed = false;
      for (const e of this.enemies) {
        if (e.life <= 0 || p.hitIds.has(e.id)) continue;
        if (Math.hypot(e.x - p.x, e.y - p.y) <= p.radius + e.radius) {
          p.hitIds.add(e.id);
          const mods = p.extraMods ?? (art ? this.getArtExtraMods(art) : []);
          this.applyArtHit(e, def, mods, art);

          if (p.explodeRadius && p.explodeRadius > 0) {
            this.novas.push({
              x: p.x,
              y: p.y,
              radius: 8,
              maxRadius: p.explodeRadius,
              color: p.color,
              life: 0.22,
              maxLife: 0.22,
            });
            const scale = p.explodeScale ?? 0.6;
            const splashMods: Modifier[] = [...mods, { stat: 'damage', kind: 'more', value: scale - 1 }];
            for (const other of this.enemies) {
              if (other.id === e.id || other.life <= 0) continue;
              if (Math.hypot(other.x - p.x, other.y - p.y) <= p.explodeRadius + other.radius) {
                this.applyArtHit(other, def, splashMods, art);
              }
            }
          }

          if (p.splitOnHit && p.splitOnHit > 0) {
            const baseA = Math.atan2(p.vy, p.vx);
            const shardMods: Modifier[] = [...mods, { stat: 'damage', kind: 'more', value: -0.45 }];
            const splitCount = p.splitOnHit;
            for (let s = 0; s < splitCount; s++) {
              const offset = splitCount > 1 ? (s - (splitCount - 1) / 2) * 0.55 : 0;
              const sa = baseA + offset;
              this.projectiles.push({
                id: nextEntityId++,
                x: p.x,
                y: p.y,
                vx: Math.cos(sa) * 480,
                vy: Math.sin(sa) * 480,
                radius: Math.max(3.5, p.radius * 0.72),
                color: p.color,
                artId: p.artId,
                pierceLeft: 0,
                life: 0.65,
                hitIds: new Set([e.id]),
                homing: p.homing,
                explodeRadius: p.explodeRadius ? p.explodeRadius * 0.6 : undefined,
                explodeScale: p.explodeScale,
                extraMods: shardMods,
              });
            }
          }

          if (p.pierceLeft > 0) {
            p.pierceLeft -= 1;
          } else if (p.boomerang && !p.boomerang.returned) {
            // Instead of dying when outward pierce is exhausted, reverse into return pass with normal pierce budget
            p.boomerang.returned = true;
            p.pierceLeft = p.boomerang.initialPierce;
            p.life = Math.max(p.life, p.boomerang.maxLife * 0.65);
            p.spiral = undefined;
            p.hitIds = new Set([e.id]);
            const speed = Math.max(240, Math.hypot(p.vx, p.vy));
            const retAngle = Math.atan2(this.player.y - p.y, this.player.x - p.x);
            p.vx = Math.cos(retAngle) * speed;
            p.vy = Math.sin(retAngle) * speed;
            break;
          } else {
            this.projectiles.splice(i, 1);
            removed = true;
            break;
          }
        }
      }
      if (removed) continue;
    }
  }

  private updatePlayer(dt: number): void {
    const maxLife = this.sheet.get('life');
    const maxWard = this.sheet.get('ward');

    this.player.life = Math.min(maxLife, this.player.life + this.sheet.get('lifeRegen') * dt);
    if (this.player.wardDelayTimer > 0) {
      this.player.wardDelayTimer -= dt;
    } else if (maxWard > 0 && this.player.ward < maxWard) {
      this.player.ward = Math.min(maxWard, this.player.ward + this.sheet.get('wardRegen') * dt);
    }

    if (this.player.invulnTimer > 0) this.player.invulnTimer -= dt;
    if (this.player.dashCooldown > 0) this.player.dashCooldown -= dt;
    if (this.player.ultimateCooldown > 0) this.player.ultimateCooldown -= dt;
    if (this.player.bloodlustTimer > 0) {
      this.player.bloodlustTimer -= dt;
      if (this.player.bloodlustTimer <= 0) {
        this.sheet.removeSource('ult_red_hour');
      }
    }

    if (this.player.dashTimer > 0) {
      this.player.dashTimer -= dt;
      const dashSpeed = this.sheet.get('moveSpeed') * 3.1;
      this.player.vx = this.player.dashDirX * dashSpeed;
      this.player.vy = this.player.dashDirY * dashSpeed;
    } else {
      let mx = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);
      let my = (this.input.down ? 1 : 0) - (this.input.up ? 1 : 0);
      if (mx !== 0 || my !== 0) {
        const len = Math.hypot(mx, my);
        mx /= len;
        my /= len;
      }
      const speed = this.sheet.get('moveSpeed');
      this.player.vx = mx * speed;
      this.player.vy = my * speed;
    }

    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;
    this.player.orbitAngle += dt * 3.1;

    if (this.autoAim && this.enemies.length > 0) {
      let nearest: Enemy | null = null;
      let bestDist = Infinity;
      for (const e of this.enemies) {
        const d = (e.x - this.player.x) ** 2 + (e.y - this.player.y) ** 2;
        if (d < bestDist) {
          bestDist = d;
          nearest = e;
        }
      }
      if (nearest) {
        this.player.aimAngle = Math.atan2(nearest.y - this.player.y, nearest.x - this.player.x);
      }
    } else {
      const worldMouseX = this.player.x + (this.input.mouseX - this.viewportW / 2);
      const worldMouseY = this.player.y + (this.input.mouseY - this.viewportH / 2);
      this.player.aimAngle = Math.atan2(worldMouseY - this.player.y, worldMouseX - this.player.x);
    }
  }

  private updateEnemies(dt: number): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.life <= 0) {
        this.enemies.splice(i, 1);
        continue;
      }

      if (e.hitFlash > 0) e.hitFlash -= dt;
      if (e.orbitHitCooldown > 0) e.orbitHitCooldown -= dt;

      const chilled = e.ailments.some((a) => a.type === 'chill');
      const speed = e.speed * (chilled ? 0.68 : 1);

      if (e.fixedVelocity) {
        e.fixedVelocity.life -= dt;
        if (e.fixedVelocity.life <= 0) {
          this.enemies.splice(i, 1);
          continue;
        }
        e.vx = e.fixedVelocity.vx * (chilled ? 0.68 : 1);
        e.vy = e.fixedVelocity.vy * (chilled ? 0.68 : 1);
        e.facing = Math.atan2(e.vy, e.vx);
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        if (Math.hypot(this.player.x - e.x, this.player.y - e.y) <= e.radius + this.player.radius) {
          this.damagePlayer(e.damage);
        }
        continue;
      }

      // Interceptors (Hellhound, Blade Wraith) aim ahead of your velocity to cut off circle-strafing
      const isInterceptor = e.archetype === 'hellhound' || e.archetype === 'blade_wraith';
      const targetX = isInterceptor ? this.player.x + this.player.vx * 0.55 : this.player.x;
      const targetY = isInterceptor ? this.player.y + this.player.vy * 0.55 : this.player.y;

      const dx = targetX - e.x;
      const dy = targetY - e.y;
      const dist = Math.max(1, Math.hypot(this.player.x - e.x, this.player.y - e.y));
      const moveDist = Math.max(1, Math.hypot(dx, dy));
      e.facing = Math.atan2(this.player.y - e.y, this.player.x - e.x);

      const isRanged =
        e.archetype === 'skeleton_archer' ||
        e.archetype === 'skeleton_mage' ||
        e.archetype === 'barrow_watchman' ||
        e.archetype === 'skeletal_mortarman' ||
        e.archetype === 'void_acolyte' ||
        e.archetype === 'bone_warlock' ||
        e.archetype === 'abyssal_foldwright' ||
        e.archetype === 'pit_abomination' ||
        e.archetype === 'ash_whelp';

      // Barrow Shambler: living enemy-factory that periodically spawns undead fodder
      if (e.archetype === 'barrow_shambler') {
        e.abilityTimer -= dt;
        if (e.abilityTimer <= 0 && this.enemies.length < 225) {
          e.abilityTimer = 6.5;
          this.spawnParticles(e.x, e.y, '#a3e635', 10, 110);
          for (let s = 0; s < 2; s++) {
            const sa = Math.random() * Math.PI * 2;
            const spawnType: EnemyArchetype = Math.random() < 0.55 ? 'zombie' : 'ghoul';
            this.enemies.push(
              createEnemy(spawnType, e.x + Math.cos(sa) * 24, e.y + Math.sin(sa) * 24, this.elapsed),
            );
          }
        }
      }

      if (isRanged && dist < 260) {
        e.vx = 0;
        e.vy = 0;
      } else {
        e.vx = (dx / moveDist) * speed;
        e.vy = (dy / moveDist) * speed;
      }

      e.x += e.vx * dt;
      e.y += e.vy * dt;

      if (isRanged || e.isBoss) {
        e.abilityTimer -= dt;
        if (e.abilityTimer <= 0 && dist < 560) {
          e.abilityTimer = e.isBoss
            ? this.elapsed > 480
              ? 1.7
              : 2.3
            : e.archetype === 'void_acolyte' || e.archetype === 'abyssal_foldwright'
              ? 2.0
              : 2.4;

          // Skeletal Mortarmen lob non-leading ground zones at your current position; Bosses lead ahead of your path
          if (e.archetype === 'skeletal_mortarman' || (e.isBoss && Math.random() < 0.45)) {
            const leadFactor = e.isBoss ? 0.85 : 0;
            const leadX = this.player.x + this.player.vx * leadFactor + (Math.random() - 0.5) * 32;
            const leadY = this.player.y + this.player.vy * leadFactor + (Math.random() - 0.5) * 32;
            this.enemyHazards.push({
              id: nextEntityId++,
              x: leadX,
              y: leadY,
              radius: e.isBoss ? 68 : 54,
              timer: 1.15,
              maxTimer: 1.15,
              damage: e.damage * 1.1,
            });
          }

          const projSpeed = e.archetype === 'skeletal_mortarman' ? 195 : e.isBoss ? 255 : 245;
          // Only late-game Void Acolytes (7:30+) & Abyssal Foldwrights use lead-targeting; Skeleton Mages fire direct spreads
          const usesLead = e.archetype === 'void_acolyte' || e.archetype === 'abyssal_foldwright';
          const travelT = usesLead ? Math.min(1.2, dist / projSpeed) : 0;
          const aimX = this.player.x + this.player.vx * travelT;
          const aimY = this.player.y + this.player.vy * travelT;
          const baseAngle = Math.atan2(aimY - e.y, aimX - e.x);

          const bolts = e.isBoss
            ? this.elapsed > 540
              ? 10
              : this.elapsed > 360
                ? 7
                : 4
            : e.archetype === 'bone_warlock'
              ? this.elapsed >= 570
                ? 4
                : 3
              : e.archetype === 'pit_abomination'
                ? 3
                : e.archetype === 'skeletal_mortarman'
                  ? this.elapsed >= 510
                    ? 2
                    : 1
                  : e.archetype === 'skeleton_mage'
                    ? this.elapsed >= 420
                      ? 2
                      : 1
                    : e.archetype === 'void_acolyte' || e.archetype === 'abyssal_foldwright'
                      ? this.elapsed >= 570
                        ? 3
                        : 2
                      : e.archetype === 'barrow_watchman'
                        ? this.elapsed >= 360
                          ? 2
                          : 1
                        : 1;
          const spread = e.isBoss && bolts >= 8 ? (Math.PI * 2) / bolts : 0.24;

          for (let b = 0; b < bolts; b++) {
            const a =
              e.isBoss && bolts >= 8
                ? baseAngle + b * spread
                : baseAngle + (b - (bolts - 1) / 2) * spread;
            this.projectiles.push({
              id: nextEntityId++,
              x: e.x,
              y: e.y,
              vx: Math.cos(a) * projSpeed,
              vy: Math.sin(a) * projSpeed,
              radius: e.isBoss || e.archetype === 'skeletal_mortarman' ? 7.5 : 6,
              color: '#ff2a55',
              artId: '',
              pierceLeft: 0,
              life: 2.8,
              hitIds: new Set(),
              fromEnemy: true,
              enemyDamage: e.damage * 0.85,
            });
          }
        }
      }

      if (dist <= e.radius + this.player.radius) {
        this.damagePlayer(e.damage);
      }
    }

    // O(N) spatial-hash soft separation so enemies migrate side-by-side instead of clumping onto one pixel
    const cellSize = 52;
    const grid = new Map<number, Enemy[]>();
    for (const e of this.enemies) {
      if (e.life <= 0 || e.fixedVelocity) continue;
      const cx = Math.floor(e.x / cellSize);
      const cy = Math.floor(e.y / cellSize);
      const key = ((cx + 2048) << 12) ^ (cy + 2048);
      let bucket = grid.get(key);
      if (!bucket) {
        bucket = [];
        grid.set(key, bucket);
      }
      bucket.push(e);
    }

    for (const a of this.enemies) {
      if (a.life <= 0 || a.fixedVelocity) continue;
      const cx = Math.floor(a.x / cellSize);
      const cy = Math.floor(a.y / cellSize);
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const key = ((cx + ox + 2048) << 12) ^ (cy + oy + 2048);
          const bucket = grid.get(key);
          if (!bucket) continue;
          for (const b of bucket) {
            if (b.id <= a.id) continue;
            const minSep = (a.radius + b.radius) * 0.88;
            let dx = b.x - a.x;
            let dy = b.y - a.y;
            let dist = Math.hypot(dx, dy);
            if (dist < minSep) {
              if (dist < 0.01) {
                const ang = (a.id * 2.399 + b.id) % 6.283;
                dx = Math.cos(ang);
                dy = Math.sin(ang);
                dist = 1;
              }
              const overlap = (minSep - dist) / dist;
              const weightA = a.isBoss ? 0.1 : b.isBoss ? 0.65 : 0.34;
              const weightB = b.isBoss ? 0.1 : a.isBoss ? 0.65 : 0.34;
              a.x -= dx * overlap * weightA;
              a.y -= dy * overlap * weightA;
              b.x += dx * overlap * weightB;
              b.y += dy * overlap * weightB;
            }
          }
        }
      }
    }
  }

  private damagePlayer(rawAmount: number): void {
    if (this.player.invulnTimer > 0 || this.phase !== 'playing') return;
    this.player.invulnTimer = 0.42;
    this.player.wardDelayTimer = this.sheet.get('wardDelay');
    this.screenShake = 8;

    const armor = this.sheet.get('armor');
    const mit = Math.max(0.25, (10 * rawAmount) / (armor + 10 * rawAmount));
    let dmg = rawAmount * mit;

    if (this.player.ward > 0) {
      const absorbed = Math.min(this.player.ward, dmg);
      this.player.ward -= absorbed;
      dmg -= absorbed;
      if (this.player.ward <= 0.01) {
        this.player.ward = 0;
        this.procs.emit('onWardBreak', this.elapsed, { x: this.player.x, y: this.player.y }, (p, ctx) =>
          this.executeProc(p, ctx),
        );
      }
    }

    if (dmg > 0) {
      this.player.life -= dmg;
      this.floatingTexts.push({
        x: this.player.x,
        y: this.player.y - 22,
        vy: -32,
        text: `-${Math.round(dmg)}`,
        color: '#ef4444',
        life: 0.7,
        maxLife: 0.7,
        scale: 1.1,
      });
    }

    if (this.player.life <= 0) {
      this.player.life = 0;
      this.endRun();
    }
  }

  endRun(): void {
    if (this.phase === 'game_over' || this.phase === 'vessel_select') return;
    const earned = calculateRunShards(this.elapsed, this.kills, this.player.level);
    this.lastRunShards = earned;
    this.archive.shards += earned;
    this.archive.totalRuns += 1;
    saveArchive(this.archive);
    this.setPhase('game_over');
  }

  private updateAilments(dt: number): void {
    this.dotAccumulator += dt;
    const shouldTickText = this.dotAccumulator >= 0.35;
    if (shouldTickText) this.dotAccumulator = 0;

    for (const e of this.enemies) {
      if (e.life <= 0 || e.ailments.length === 0) continue;
      let dotTotal = 0;
      for (let i = e.ailments.length - 1; i >= 0; i--) {
        const a = e.ailments[i];
        a.remaining -= dt;
        if (a.dps > 0) {
          const movingBonus = a.type === 'bleed' && Math.hypot(e.vx, e.vy) > 5 ? 1.5 : 1.0;
          const dmg = a.dps * movingBonus * dt;
          e.life -= dmg;
          this.totalDamageDealt += dmg;
          dotTotal += dmg;
        }
        if (a.remaining <= 0) {
          e.ailments.splice(i, 1);
        }
      }
      if (shouldTickText && dotTotal > 1) {
        this.floatingTexts.push({
          x: e.x + (Math.random() - 0.5) * 10,
          y: e.y - e.radius,
          vy: -20,
          text: `${Math.round(dotTotal * 4)}`,
          color: '#fb923c',
          life: 0.4,
          maxLife: 0.4,
          scale: 0.8,
        });
      }
      if (e.life <= 0) {
        this.handleEnemyDeath(e, 0);
      }
    }
  }

  private updatePickups(dt: number): void {
    const radius = this.sheet.get('pickupRadius');
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pk = this.pickups[i];
      const dx = this.player.x - pk.x;
      const dy = this.player.y - pk.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= radius) pk.magnetized = true;
      if (pk.magnetized) {
        const speed = 440;
        pk.x += (dx / Math.max(1, dist)) * speed * dt;
        pk.y += (dy / Math.max(1, dist)) * speed * dt;
      }

      if (dist <= this.player.radius + pk.radius + 4) {
        if (pk.kind === 'essence') {
          this.player.xp += pk.value * this.sheet.get('essenceGain');
          if (this.player.xp >= this.player.xpToNext) {
            this.player.xp -= this.player.xpToNext;
            this.player.level += 1;
            this.player.xpToNext = Math.round(45 * Math.pow(1.24, this.player.level - 1));
            this.openDraft();
          }
        } else if (pk.kind === 'magnet') {
          for (const other of this.pickups) {
            if (other.kind === 'essence') other.magnetized = true;
          }
          this.floatingTexts.push({
            x: this.player.x,
            y: this.player.y - 26,
            vy: -28,
            text: 'LODESTONE SURGE!',
            color: '#fde047',
            life: 0.9,
            maxLife: 0.9,
            scale: 1.1,
          });
        } else if (pk.kind === 'life') {
          this.player.life = Math.min(this.sheet.get('life'), this.player.life + pk.value);
        } else if (pk.kind === 'ward') {
          this.player.ward = Math.min(this.sheet.get('ward'), this.player.ward + pk.value);
        }
        this.pickups.splice(i, 1);
      }
    }
  }

  private updateSpawner(dt: number): void {
    this.spawnTimer -= dt;
    const maxEnemies = Math.min(240, 150 + Math.floor(this.elapsed / 7));
    if (this.spawnTimer <= 0 && this.enemies.length < maxEnemies) {
      const rate = Math.max(0.16, 1.05 - this.elapsed * 0.0016);
      this.spawnTimer = rate;
      const batch = this.elapsed > 480 ? 3 : this.elapsed > 120 ? 2 : 1;
      for (let i = 0; i < batch; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.max(this.viewportW, this.viewportH) * 0.56 + 60;
        const arch = pickArchetypeForTime(this.elapsed, Math.random);
        this.enemies.push(
          createEnemy(arch, this.player.x + Math.cos(angle) * dist, this.player.y + Math.sin(angle) * dist, this.elapsed),
        );
      }
    }

    if (this.elapsed >= this.nextBossAt) {
      // Avoid spawning an Undead Boss while a Demonic Incursion Portal is active
      if (this.incursionPortals.length > 0) {
        this.nextBossAt = this.elapsed + 20;
      } else {
        this.nextBossAt += 90;
        const angle = Math.random() * Math.PI * 2;
        this.enemies.push(
          createEnemy('lich', this.player.x + Math.cos(angle) * 440, this.player.y + Math.sin(angle) * 440, this.elapsed),
        );
      }
    }

    if (this.elapsed >= this.nextSwarmSurgeAt) {
      this.nextSwarmSurgeAt += 55 + Math.random() * 40;
      const surgeCount = this.elapsed >= 420 ? 14 : 10;
      const ringDist = Math.max(this.viewportW, this.viewportH) * 0.56 + 70;
      const useMixed = Math.random() < 0.65;
      for (let i = 0; i < surgeCount; i++) {
        const a = (i / surgeCount) * Math.PI * 2 + Math.random() * 0.18;
        const arch: EnemyArchetype = useMixed ? (i % 2 === 0 ? 'ghoul' : 'zombie') : 'ghoul';
        this.enemies.push(
          createEnemy(arch, this.player.x + Math.cos(a) * ringDist, this.player.y + Math.sin(a) * ringDist, this.elapsed),
        );
      }
      this.floatingTexts.push({
        x: this.player.x,
        y: this.player.y - 34,
        vy: -18,
        text: 'UNDEAD HORDE SURGING!',
        color: '#a3e635',
        life: 1.6,
        maxLife: 1.6,
        scale: 1.1,
      });
    }
  }

  private pickDemonForIncursion(): EnemyArchetype {
    const r = Math.random();
    if (!this.thronelord) {
      if (this.elapsed < 210) return r < 0.6 ? 'imp' : 'hellhound';
      if (this.elapsed >= 330 && r < 0.18) return 'pit_abomination';
      if (r < 0.38) return 'imp';
      if (r < 0.64) return 'ash_whelp';
      if (r < 0.86) return 'hellhound';
      return 'demon_brute';
    }
    if (this.elapsed >= 330 && r < 0.16) return 'pit_abomination';
    switch (this.thronelord.id) {
      case 'malakor':
        if (r < 0.38) return 'ash_whelp';
        if (r < 0.72) return 'hellhound';
        return 'imp';
      case 'vexarion':
        if (r < 0.36) return 'abyssal_foldwright';
        if (r < 0.72) return 'imp';
        return 'ash_whelp';
      case 'karnath':
        if (r < 0.42) return 'demon_brute';
        if (r < 0.75) return 'hellhound';
        return 'imp';
    }
  }

  private updateIncursions(dt: number): void {
    // At 5:00 (300s), roll one of the 3 Demon Thronelords for this run
    if (!this.thronelord && this.elapsed >= 300) {
      const lords: Array<{ id: 'malakor' | 'vexarion' | 'karnath'; name: string; title: string }> = [
        { id: 'malakor', name: 'Malakor, Thronelord of Ash', title: 'Ash-Host' },
        { id: 'vexarion', name: 'Vexarion, Thronelord of the Abyss', title: 'Foldwright-Host' },
        { id: 'karnath', name: 'Karnath, Thronelord of Iron', title: 'Brute-Host' },
      ];
      this.thronelord = lords[Math.floor(Math.random() * lords.length)];
      this.floatingTexts.push({
        x: this.player.x,
        y: this.player.y - 46,
        vy: -16,
        text: `${this.thronelord.name.toUpperCase()} CLAIMS THE RIFT!`,
        color: '#f97316',
        life: 2.5,
        maxLife: 2.5,
        scale: 1.25,
      });
    }

    // Regular Incursion Portals start at 2:15 (135s), then every 90s; 10:00 (600s) triggers the Thronelord Boss!
    // Defer regular Incursions if an Undead Boss is currently alive so the two factions don't overshadow each other.
    const triggerMajor600 = !this.thronelordSpawnedAt600 && this.elapsed >= 600;
    if (triggerMajor600 || this.elapsed >= this.nextIncursionAt) {
      if (!triggerMajor600 && this.enemies.some((e) => e.isBoss && e.life > 0)) {
        this.nextIncursionAt = this.elapsed + 20;
      } else {
        if (triggerMajor600) {
          this.thronelordSpawnedAt600 = true;
        } else {
          this.nextIncursionAt += 90;
        }
      this.incursionCount += 1;
      const isMajor = triggerMajor600;
      const angle = Math.random() * Math.PI * 2;
      const px = this.player.x + Math.cos(angle) * 290;
      const py = this.player.y + Math.sin(angle) * 290;
      this.incursionPortals.push({
        id: nextEntityId++,
        x: px,
        y: py,
        life: isMajor ? 14 : 10,
        maxLife: isMajor ? 14 : 10,
        spawnTimer: 0.4,
        wavesLeft: isMajor ? 4 : 3,
        isMajor,
      });
      this.floatingTexts.push({
        x: this.player.x,
        y: this.player.y - 38,
        vy: -20,
        text: isMajor
          ? `THRONELORD INCURSION: ${this.thronelord?.name ?? 'DEMON LORD'}!`
          : 'DEMONIC INCURSION PORTAL!',
        color: '#f97316',
        life: 2.0,
        maxLife: 2.0,
        scale: 1.2,
      });
      }
    }

    for (let i = this.incursionPortals.length - 1; i >= 0; i--) {
      const portal = this.incursionPortals[i];
      portal.life -= dt;
      portal.spawnTimer -= dt;

      if (portal.spawnTimer <= 0 && portal.wavesLeft > 0) {
        portal.spawnTimer = 2.4;
        portal.wavesLeft -= 1;

        const count = 3 + Math.min(3, Math.floor(this.elapsed / 90));
        for (let k = 0; k < count; k++) {
          const a = Math.random() * Math.PI * 2;
          const arch = this.pickDemonForIncursion();
          this.enemies.push(
            createEnemy(arch, portal.x + Math.cos(a) * 26, portal.y + Math.sin(a) * 26, this.elapsed),
          );
        }

        if (portal.isMajor && portal.wavesLeft === 0) {
          const boss = createEnemy('demon_lord', portal.x, portal.y, this.elapsed);
          if (this.thronelord) boss.name = this.thronelord.name;
          this.enemies.push(boss);
        }
      }

      if (portal.life <= 0) {
        this.pickups.push({
          id: nextEntityId++,
          kind: 'magnet',
          x: portal.x,
          y: portal.y,
          value: 1,
          color: '#fde047',
          radius: 8,
          magnetized: false,
        });
        this.incursionPortals.splice(i, 1);
      }
    }
  }

  private updateWraithWalls(): void {
    if (this.elapsed < this.nextWraithWallAt) return;
    this.nextWraithWallAt += 65 + Math.random() * 25;

    // Spawn a full-screen off-screen marching phalanx of Grave Wraiths from any cardinal or diagonal direction
    const marchAngle = (Math.floor(Math.random() * 8) * Math.PI) / 4;
    const dirX = Math.cos(marchAngle);
    const dirY = Math.sin(marchAngle);
    const perpX = -dirY;
    const perpY = dirX;
    const halfDiag = Math.hypot(Math.max(640, this.viewportW * 0.5), Math.max(400, this.viewportH * 0.5)) + 140;
    const span = Math.max(1280, this.viewportW, this.viewportH) + 320;
    const spacing = 38;
    const count = Math.ceil(span / spacing);
    const ranks = this.elapsed >= 300 ? 2 : 1;
    const speed = 142;
    const life = (halfDiag * 2 + 240) / speed;

    for (let r = 0; r < ranks; r++) {
      const rankOffset = r * 42;
      for (let i = 0; i < count; i++) {
        const offset = (i - (count - 1) / 2) * spacing;
        const sx = this.player.x - dirX * (halfDiag + rankOffset) + perpX * offset;
        const sy = this.player.y - dirY * (halfDiag + rankOffset) + perpY * offset;
        const wraith = createEnemy('wraith', sx, sy, this.elapsed);
        wraith.fixedVelocity = {
          vx: dirX * speed,
          vy: dirY * speed,
          life,
        };
        this.enemies.push(wraith);
      }
    }

    this.floatingTexts.push({
      x: this.player.x,
      y: this.player.y - 34,
      vy: -20,
      text: 'WRAITH PHALANX APPROACHING!',
      color: '#7dd3fc',
      life: 1.6,
      maxLife: 1.6,
      scale: 1.1,
    });
  }

  private updateEnemyHazards(dt: number): void {
    for (let i = this.enemyHazards.length - 1; i >= 0; i--) {
      const hz = this.enemyHazards[i];
      hz.timer -= dt;
      if (hz.timer <= 0) {
        this.novas.push({
          x: hz.x,
          y: hz.y,
          radius: 10,
          maxRadius: hz.radius,
          color: '#ff2a55',
          life: 0.25,
          maxLife: 0.25,
        });
        if (Math.hypot(this.player.x - hz.x, this.player.y - hz.y) <= hz.radius + this.player.radius) {
          this.damagePlayer(hz.damage);
        }
        this.enemyHazards.splice(i, 1);
      }
    }
  }

  private updateVfx(dt: number): void {
    for (let i = this.arcs.length - 1; i >= 0; i--) {
      this.arcs[i].life -= dt;
      if (this.arcs[i].life <= 0) this.arcs.splice(i, 1);
    }
    for (let i = this.novas.length - 1; i >= 0; i--) {
      const n = this.novas[i];
      n.life -= dt;
      n.radius = n.maxRadius * (1 - n.life / n.maxLife);
      if (n.life <= 0) this.novas.splice(i, 1);
    }
    for (let i = this.sweeps.length - 1; i >= 0; i--) {
      this.sweeps[i].life -= dt;
      if (this.sweeps[i].life <= 0) this.sweeps.splice(i, 1);
    }
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y += ft.vy * dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
  }

  private spawnParticles(x: number, y: number, color: string, count: number, speed: number): void {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = (0.3 + Math.random() * 0.7) * speed;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        radius: 2 + Math.random() * 2.5,
        color,
        life: 0.25 + Math.random() * 0.25,
        maxLife: 0.5,
      });
    }
  }

  private clearSubOfferCaches(): void {
    this.cachedArtOffers.clear();
    this.cachedPassiveOffers.clear();
    this.cachedInscribeOffers.clear();
  }

  openDraft(): void {
    this.clearSubOfferCaches();
    this.draftOptions = this.rollDraftOptions(3);
    this.setPhase('draft');
  }

  rerollDraft(): void {
    if (this.player.rerolls <= 0 || this.phase !== 'draft') return;
    this.player.rerolls -= 1;
    this.clearSubOfferCaches();
    const prevIds = new Set(this.draftOptions.map((o) => o.card.id));
    let next = this.rollDraftOptions(3, prevIds);
    // Bad-luck protection: only fall back to allowing previous IDs if fewer than 3 alternatives exist
    if (next.length < 3) {
      const fill = this.rollDraftOptions(3 - next.length, new Set(next.map((o) => o.card.id)));
      next = [...next, ...fill];
    }
    this.draftOptions = next;
    this.onPhaseChange?.(this.phase);
  }

  backFromArtSelect(): void {
    if (this.phase !== 'art_select') return;
    this.artSelectChoice = null;
    this.setPhase('draft');
  }

  backFromPassiveSelect(): void {
    if (this.phase !== 'passive_select') return;
    this.passiveSelectChoice = null;
    this.setPhase('draft');
  }

  backFromInscribe(): void {
    if (this.phase !== 'inscribe') return;
    this.inscribeChoice = null;
    this.setPhase('draft');
  }

  banishDraftOption(index: number): void {
    if (this.player.banishes <= 0 || this.phase !== 'draft') return;
    const opt = this.draftOptions[index];
    if (!opt) return;
    this.player.banishes -= 1;
    this.banishedCards.add(opt.card.id);

    const existingIds = new Set(this.draftOptions.map((o) => o.card.id));
    const replacement = this.rollDraftOptions(1, existingIds);
    if (replacement.length > 0) {
      this.draftOptions[index] = replacement[0];
    } else {
      this.draftOptions.splice(index, 1);
    }
    this.onPhaseChange?.(this.phase);
  }

  private getActiveTagSet(): Set<string> {
    const tags = new Set<string>();
    for (const ar of this.arts) {
      const def = ARTS[ar.artId];
      if (def) {
        for (const t of def.tags) tags.add(t);
      }
    }
    return tags;
  }

  getCompatibleInscriptions(art: EquippedArt): InscriptionDef[] {
    const def = ARTS[art.artId];
    if (!def) return [];
    const extraMods = this.getArtExtraMods(art);
    const extraConvs = art.inscriptions.flatMap((i) => i.conversions ?? []);
    const extraExtras = art.inscriptions.flatMap((i) => i.extras ?? []);
    const outgoing = computeOutgoingByType(this.sheet, def, extraMods, extraConvs, extraExtras);

    return Object.values(INSCRIPTIONS).filter((ins) => {
      if (art.inscriptions.some((i) => i.id === ins.id)) return false;
      if (ins.requiredTags && !ins.requiredTags.every((t) => def.tags.includes(t))) return false;
      if (ins.explodeOnExpire && !def.timedSummon) return false;
      if (ins.minionCleaveRadius && (def.id === 'summon_flame_sprite' || def.id === 'shambling_horde')) return false;
      if (ins.relevantElements && ins.relevantElements.length > 0) {
        const hasRelevant = ins.relevantElements.some((dt) => outgoing[dt] > 0.1 || def.tags.includes(dt));
        if (!hasRelevant) return false;
      }
      return true;
    });
  }

  private getEligibleArtsForArchetype(archetype: ArtArchetypeFilter): ArtDefinition[] {
    return Object.values(ARTS).filter((def) => {
      const active = this.arts.find((a) => a.artId === def.id);
      if (active) {
        if (active.level >= MAX_ART_RANK) return false;
      } else {
        if (this.arts.length >= MAX_ACTIVE_ARTS) return false;
      }
      if (archetype === 'all') return true;
      if (archetype === 'construct') {
        return def.tags.includes('minion') || def.tags.includes('totem') || def.tags.includes('trap');
      }
      return def.tags.includes(archetype);
    });
  }

  private getEligiblePassivesForDomain(domain: PassiveDomain): UpgradeCardDef[] {
    return UPGRADE_POOL.filter((card) => {
      if (card.category !== 'passive' || card.passiveDomain !== domain) return false;
      if (this.banishedCards.has(card.id)) return false;
      const stacks = this.acquiredCards.get(card.id) ?? 0;
      if (card.maxStacks !== undefined && stacks >= card.maxStacks) return false;
      return true;
    });
  }

  private rollDraftOptions(count: number, excludeIds: Set<string> = new Set()): DraftOption[] {
    const maxIns = getArchiveBonuses(this.archive).maxInscriptionsPerArt;
    const affinityBoost = 1.2 + getArchiveBonuses(this.archive).affinityLevel * 1.4;
    const activeTags = this.getActiveTagSet();

    interface WeightedCandidate {
      card: UpgradeCardDef;
      weight: number;
    }

    const eligible: WeightedCandidate[] = [];

    for (const card of UPGRADE_POOL) {
      if (this.banishedCards.has(card.id) || excludeIds.has(card.id)) continue;
      // Individual Arts and domain-tagged Passives are grouped below to prevent pool dilution
      if (card.category === 'art') continue;
      if (card.category === 'passive' && card.passiveDomain) continue;

      const stacks = this.acquiredCards.get(card.id) ?? 0;
      if (card.maxStacks !== undefined && stacks >= card.maxStacks) continue;
      const shared = card.tags.filter((t) => activeTags.has(t)).length;
      eligible.push({ card, weight: 0.75 + shared * affinityBoost * 0.65 });
    }

    // Grouped "Passive: <Domain>" offerings
    const passiveDomains: Array<{ id: PassiveDomain; label: string; desc: string; tags: SkillTag[] }> = [
      {
        id: 'elemental',
        label: 'Elemental & Chaos',
        desc: 'Choose 1 of up to 4 Fire, Cold, Lightning, Chaos, or Penetration passives.',
        tags: ['fire', 'cold', 'lightning', 'chaos'],
      },
      {
        id: 'martial',
        label: 'Martial & Speed',
        desc: 'Choose 1 of up to 4 Physical, Crit, Attack/Cast Speed, Area, or Projectile passives.',
        tags: ['physical', 'attack', 'spell', 'projectile'],
      },
      {
        id: 'constructs',
        label: 'Constructs & Ailments',
        desc: 'Choose 1 of up to 4 Minion, Totem, Trap, or DoT/Ailment passives.',
        tags: ['minion', 'totem', 'trap', 'dot'],
      },
      {
        id: 'bastion',
        label: 'Bastion & Utility',
        desc: 'Choose 1 of up to 4 Life, Ward, Armor, Leech, Move Speed, Cooldown, or Essence passives.',
        tags: [],
      },
    ];
    for (const dom of passiveDomains) {
      const cardId = `passive_dom_${dom.id}`;
      if (this.banishedCards.has(cardId) || excludeIds.has(cardId)) continue;
      const pool = this.getEligiblePassivesForDomain(dom.id);
      if (pool.length === 0) continue;
      const shared = dom.tags.filter((t) => activeTags.has(t)).length;
      eligible.push({
        card: {
          id: cardId,
          name: `Passive: ${dom.label}`,
          category: 'passive_domain',
          rarity: 'common',
          passiveDomain: dom.id,
          description: `${dom.desc} (${pool.length} available).`,
          tags: dom.tags,
        },
        weight: 1.8 + shared * affinityBoost * 0.7,
      });
    }

    // Offer "Morph: <Active Art>" directly if any active Art is at level cap without a morph yet
    for (const ar of this.arts) {
      if (ar.level < ART_MORPH_TRIGGER_RANK || ar.morph) continue;
      const def = ARTS[ar.artId];
      const cardId = `morph_${ar.artId}`;
      if (this.banishedCards.has(cardId) || excludeIds.has(cardId)) continue;
      eligible.push({
        card: {
          id: cardId,
          name: `Morph: ${def.name}`,
          category: 'morph',
          rarity: 'mythic',
          artId: ar.artId,
          description: `${def.name} has reached Rank ${ART_MORPH_TRIGGER_RANK}. Choose one of two transformative Hollow Wake routes.`,
          tags: def.tags,
        },
        weight: 4.5,
      });
    }

    // Grouped "Art: <Archetype>" offerings (e.g. Art: Fire, Art: Cold)
    const artArchetypes: Array<{ id: ArtArchetypeFilter; label: string; tags: SkillTag[] }> = [
      { id: 'physical', label: 'Physical', tags: ['physical'] },
      { id: 'fire', label: 'Fire', tags: ['fire'] },
      { id: 'cold', label: 'Cold', tags: ['cold'] },
      { id: 'lightning', label: 'Lightning', tags: ['lightning'] },
      { id: 'chaos', label: 'Chaos', tags: ['chaos'] },
      { id: 'attack', label: 'Attack', tags: ['attack'] },
      { id: 'construct', label: 'Constructs', tags: ['minion', 'totem', 'trap'] },
    ];
    for (const arch of artArchetypes) {
      const cardId = `art_arch_${arch.id}`;
      if (this.banishedCards.has(cardId) || excludeIds.has(cardId)) continue;
      const matchingArts = this.getEligibleArtsForArchetype(arch.id);
      if (matchingArts.length === 0) continue;
      const shared = arch.tags.filter((t) => activeTags.has(t)).length;
      const hasActiveToRank = matchingArts.some((d) => this.arts.some((a) => a.artId === d.id));
      eligible.push({
        card: {
          id: cardId,
          name: `Art: ${arch.label}`,
          category: 'art_archetype',
          rarity: 'rare',
          archetype: arch.id,
          description: `Choose from up to 4 ${arch.label} Arts to learn or deepen in rank (${matchingArts.length} available).`,
          tags: arch.tags,
        },
        weight: (hasActiveToRank ? 2.4 : 1.7) + shared * affinityBoost * 0.9,
      });
    }

    // Inverted Inscription system: offer one "Inscribe: <Active Art>" card per active Art with open sockets
    for (const ar of this.arts) {
      if (ar.inscriptions.length >= maxIns) continue;
      const compatible = this.getCompatibleInscriptions(ar);
      if (compatible.length === 0) continue;
      const def = ARTS[ar.artId];
      const cardId = `inscribe_${ar.artId}`;
      if (this.banishedCards.has(cardId) || excludeIds.has(cardId)) continue;
      eligible.push({
        card: {
          id: cardId,
          name: `Inscribe: ${def.name}`,
          category: 'inscription',
          rarity: 'rare',
          artId: ar.artId,
          description: `Choose an Inscription from up to 4 compatible runes to etch onto ${def.name} (${ar.inscriptions.length}/${maxIns} etched).`,
          tags: def.tags,
        },
        weight: 2.2 + affinityBoost * 0.8,
      });
    }

    // Weighted sampling without replacement, capping Inscribe, Art Tome (1 each) & Passive Tome (max 2) per 3-card draft
    const picked: WeightedCandidate[] = [];
    const pool = [...eligible];
    let inscriptionCount = 0;
    let artArchCount = 0;
    let passiveDomCount = 0;

    while (picked.length < count && pool.length > 0) {
      let filtered = pool;
      if (inscriptionCount >= 1) {
        const alt = filtered.filter((c) => c.card.category !== 'inscription');
        if (alt.length > 0) filtered = alt;
      }
      if (artArchCount >= 1) {
        const alt = filtered.filter((c) => c.card.category !== 'art_archetype');
        if (alt.length > 0) filtered = alt;
      }
      if (passiveDomCount >= 2) {
        const alt = filtered.filter((c) => c.card.category !== 'passive_domain');
        if (alt.length > 0) filtered = alt;
      }

      const totalW = filtered.reduce((s, c) => s + c.weight, 0);
      let r = Math.random() * totalW;
      let chosen = filtered[0];
      for (const c of filtered) {
        r -= c.weight;
        if (r <= 0) {
          chosen = c;
          break;
        }
      }

      picked.push(chosen);
      if (chosen.card.category === 'inscription') inscriptionCount++;
      if (chosen.card.category === 'art_archetype') artArchCount++;
      if (chosen.card.category === 'passive_domain') passiveDomCount++;
      const idx = pool.indexOf(chosen);
      if (idx >= 0) pool.splice(idx, 1);
    }

    if (picked.length === 0 && excludeIds.size === 0) {
      return [
        {
          card: {
            id: 'fallback_shards',
            name: 'Claim Barrow Shards',
            category: 'shards',
            rarity: 'mythic',
            description: 'All upgrades in this run’s pool are mastered. Claim +25 Hollow Shards for The Barrow Archive.',
            tags: [],
          },
          summaryText: 'Barrow Archive',
        },
      ];
    }

    return picked.map(({ card }) => this.buildDraftOption(card));
  }

  private buildDraftOption(card: UpgradeCardDef): DraftOption {
    if (card.category === 'inscription') {
      return {
        card,
        summaryText: 'Etch Inscription',
      };
    }
    if (card.category === 'morph') {
      return {
        card,
        summaryText: 'Art Morph',
      };
    }
    if (card.category === 'passive_domain') {
      return {
        card,
        summaryText: 'Passive Tome',
      };
    }
    if (card.category === 'art_archetype') {
      return {
        card,
        summaryText: this.arts.length >= MAX_ACTIVE_ARTS ? 'Deepen Art' : `Art Tome (${this.arts.length}/${MAX_ACTIVE_ARTS})`,
      };
    }

    const beforeDps = this.getTotalEstimatedDps();
    const forked = this.sheet.fork();

    if (card.mods) forked.setSource(`preview_${card.id}`, card.mods);
    if (card.conversions) forked.setConversions(`preview_${card.id}`, card.conversions);
    if (card.extras) forked.setExtras(`preview_${card.id}`, card.extras);

    let afterDps = 0;
    for (const ar of this.arts) {
      const def = ARTS[ar.artId];
      const extraMods = [...this.getArtExtraMods(ar)];
      const extraConvs = ar.inscriptions.flatMap((i) => i.conversions ?? []);
      const extraExtras = ar.inscriptions.flatMap((i) => i.extras ?? []);
      const echoMult = 1 + ar.inscriptions.reduce((s, i) => s + (i.echoChance ?? 0), 0);

      if (card.category === 'art' && card.artId === ar.artId) {
        extraMods.push(...getArtRankStep(ar.artId, ar.level + 1).mods);
      }
      afterDps += previewSkillDps(
        forked,
        def,
        extraMods,
        def.baseProjectiles,
        extraConvs,
        extraExtras,
        echoMult,
      ).estimatedDps;
    }

    if (card.category === 'art' && card.artId && !this.arts.some((a) => a.artId === card.artId)) {
      const def = ARTS[card.artId];
      afterDps += previewSkillDps(forked, def, [], def.baseProjectiles).estimatedDps;
    }

    const dpsDeltaPct = beforeDps > 0 ? ((afterDps - beforeDps) / beforeDps) * 100 : 0;
    const summaryText =
      card.category === 'oath'
        ? 'Keystone Oath'
        : card.category === 'art'
          ? this.arts.some((a) => a.artId === card.artId)
            ? 'Deepen Art'
            : `New Art (${this.arts.length}/${MAX_ACTIVE_ARTS})`
          : card.category.toUpperCase();

    return { card, dpsDeltaPct, summaryText };
  }

  pickDraftOption(index: number): void {
    const opt = this.draftOptions[index];
    if (!opt) return;

    const { card } = opt;
    if (card.category === 'shards') {
      this.archive.shards += 25;
      saveArchive(this.archive);
      this.setPhase('playing');
      return;
    }

    if (card.category === 'inscription' && card.artId) {
      this.openInscribeForArt(card.artId);
      return;
    }

    if (card.category === 'morph' && card.artId) {
      this.openMorphForArt(card.artId);
      return;
    }

    if (card.category === 'art_archetype' && card.archetype) {
      this.openArtSelectForArchetype(card.archetype as ArtArchetypeFilter);
      return;
    }

    if (card.category === 'passive_domain' && card.passiveDomain) {
      this.openPassiveSelectForDomain(card.passiveDomain);
      return;
    }

    this.applyAcquiredUpgradeCard(card);
    if (this.phase === 'art_morph') return;

    this.player.life = Math.min(this.sheet.get('life'), this.player.life + 10);
    this.player.ward = Math.min(this.sheet.get('ward'), this.player.ward);

    this.setPhase('playing');
  }

  private applyAcquiredUpgradeCard(card: UpgradeCardDef): void {
    const stacks = (this.acquiredCards.get(card.id) ?? 0) + 1;
    this.acquiredCards.set(card.id, stacks);

    const sourceKey = `card_${card.id}_${stacks}`;
    if (card.mods) this.sheet.setSource(sourceKey, card.mods);
    if (card.conversions) this.sheet.setConversions(sourceKey, card.conversions);
    if (card.extras) this.sheet.setExtras(sourceKey, card.extras);
    if (card.procs) {
      for (const p of card.procs) this.procs.register(p);
    }

    if (card.category === 'art' && card.artId) {
      const updated = this.addOrRankArt(card.artId);
      if (updated.level >= ART_MORPH_TRIGGER_RANK && !updated.morph) {
        this.openMorphForArt(card.artId);
      }
    }
  }

  private openPassiveSelectForDomain(domain: PassiveDomain): void {
    const cached = this.cachedPassiveOffers.get(domain);
    if (cached) {
      this.passiveSelectChoice = cached;
      this.setPhase('passive_select');
      return;
    }

    const pool = [...this.getEligiblePassivesForDomain(domain)];
    if (pool.length === 0) {
      this.setPhase('playing');
      return;
    }
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const chosen = pool.slice(0, 4);
    const options = chosen.map((card) => {
      const opt = this.buildDraftOption(card);
      return {
        card,
        stacks: this.acquiredCards.get(card.id) ?? 0,
        dpsDeltaPct: opt.dpsDeltaPct ?? 0,
        summaryText: opt.summaryText,
      };
    });

    const labelMap: Record<PassiveDomain, string> = {
      elemental: 'Elemental & Chaos',
      martial: 'Martial & Speed',
      constructs: 'Constructs & Ailments',
      bastion: 'Bastion & Utility',
    };
    const state: PassiveSelectChoiceState = { domain, label: labelMap[domain], options };
    this.cachedPassiveOffers.set(domain, state);
    this.passiveSelectChoice = state;
    this.setPhase('passive_select');
  }

  pickPassiveChoice(cardId: string): void {
    if (!this.passiveSelectChoice) return;
    const found = this.passiveSelectChoice.options.find((o) => o.card.id === cardId);
    if (!found) return;
    this.passiveSelectChoice = null;
    this.clearSubOfferCaches();
    this.applyAcquiredUpgradeCard(found.card);
    this.player.life = Math.min(this.sheet.get('life'), this.player.life + 10);
    this.player.ward = Math.min(this.sheet.get('ward'), this.player.ward);
    this.setPhase('playing');
  }

  private openArtSelectForArchetype(archetype: ArtArchetypeFilter): void {
    const cached = this.cachedArtOffers.get(archetype);
    if (cached) {
      this.artSelectChoice = cached;
      this.setPhase('art_select');
      return;
    }

    const allEligible = [...this.getEligibleArtsForArchetype(archetype)];
    if (allEligible.length === 0) {
      this.setPhase('playing');
      return;
    }
    for (let i = allEligible.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allEligible[i], allEligible[j]] = [allEligible[j], allEligible[i]];
    }
    const chosen = allEligible.slice(0, 4);
    const beforeDps = this.getTotalEstimatedDps();

    const options = chosen.map((artDef) => {
      const active = this.arts.find((a) => a.artId === artDef.id);
      const isRankUp = Boolean(active);
      const nextRank = active ? active.level + 1 : 1;

      let afterDps = 0;
      for (const ar of this.arts) {
        const d = this.getEffectiveArtSpec(ar);
        const extraMods = [...this.getArtExtraMods(ar)];
        if (ar.artId === artDef.id) {
          extraMods.push(...getArtRankStep(ar.artId, nextRank).mods);
        }
        const extraConvs = [...ar.inscriptions.flatMap((i) => i.conversions ?? []), ...(ar.morph?.conversions ?? [])];
        const extraExtras = [...ar.inscriptions.flatMap((i) => i.extras ?? []), ...(ar.morph?.extras ?? [])];
        const echoMult = 1 + ar.inscriptions.reduce((s, i) => s + (i.echoChance ?? 0), 0);
        afterDps += previewSkillDps(this.sheet, d, extraMods, d.baseProjectiles, extraConvs, extraExtras, echoMult).estimatedDps;
      }
      if (!active) {
        afterDps += previewSkillDps(this.sheet, artDef, [], artDef.baseProjectiles).estimatedDps;
      }
      const dpsDeltaPct = beforeDps > 0 ? ((afterDps - beforeDps) / beforeDps) * 100 : 0;
      return { artDef, isRankUp, nextRank, dpsDeltaPct };
    });

    const labelMap: Record<ArtArchetypeFilter, string> = {
      all: 'All',
      physical: 'Physical',
      fire: 'Fire',
      cold: 'Cold',
      lightning: 'Lightning',
      chaos: 'Chaos',
      attack: 'Attack',
      construct: 'Constructs',
    };
    const state: ArtSelectChoiceState = { archetype, label: labelMap[archetype], options };
    this.cachedArtOffers.set(archetype, state);
    this.artSelectChoice = state;
    this.setPhase('art_select');
  }

  pickArtChoice(artId: string): void {
    if (!this.artSelectChoice) return;
    const updated = this.addOrRankArt(artId);
    this.artSelectChoice = null;
    this.clearSubOfferCaches();
    this.player.life = Math.min(this.sheet.get('life'), this.player.life + 10);
    this.player.ward = Math.min(this.sheet.get('ward'), this.player.ward);
    if (updated.level >= ART_MORPH_TRIGGER_RANK && !updated.morph) {
      this.openMorphForArt(artId);
      return;
    }
    this.setPhase('playing');
  }

  openMorphForArt(artId: string): void {
    const art = this.arts.find((a) => a.artId === artId);
    if (!art || art.morph) {
      this.setPhase('playing');
      return;
    }
    const [routeA, routeB] = getArtMorphRoutes(artId);
    const beforeArtDps = this.getArtPreview(art).estimatedDps;
    const calcRoute = (morph: ArtMorphDef) => {
      const base = ARTS[art.artId];
      const morphedSpec: ArtDefinition = {
        ...base,
        behavior: morph.overrideBehavior ?? base.behavior,
        baseProjectiles: base.baseProjectiles + (morph.extraProjectiles ?? 0),
        baseRadius: morph.overrideRadius ?? base.baseRadius,
        baseCooldown: morph.overrideCooldown ?? base.baseCooldown,
        tags: morph.addTags ? [...new Set([...base.tags, ...morph.addTags])] : base.tags,
      };
      const extraMods = [...this.getArtExtraMods(art), ...morph.mods];
      const extraConvs = [...art.inscriptions.flatMap((i) => i.conversions ?? []), ...(morph.conversions ?? [])];
      const extraExtras = [...art.inscriptions.flatMap((i) => i.extras ?? []), ...(morph.extras ?? [])];
      const echoMult = 1 + art.inscriptions.reduce((s, i) => s + (i.echoChance ?? 0), 0);
      const afterDps = previewSkillDps(
        this.sheet,
        morphedSpec,
        extraMods,
        morphedSpec.baseProjectiles,
        extraConvs,
        extraExtras,
        echoMult,
      ).estimatedDps;
      const dpsDeltaPct = beforeArtDps > 0 ? ((afterDps - beforeArtDps) / beforeArtDps) * 100 : 0;
      return { morph, dpsDeltaPct };
    };
    this.artMorphChoice = {
      artId,
      routes: [calcRoute(routeA), calcRoute(routeB)],
    };
    this.setPhase('art_morph');
  }

  pickArtMorph(morphId: string): void {
    if (!this.artMorphChoice) return;
    const art = this.arts.find((a) => a.artId === this.artMorphChoice!.artId);
    const chosen = this.artMorphChoice.routes.find((r) => r.morph.id === morphId)?.morph;
    if (art && chosen) {
      art.morph = chosen;
    }
    this.artMorphChoice = null;
    this.clearSubOfferCaches();
    this.setPhase('playing');
  }

  private openInscribeForArt(artId: string): void {
    const cached = this.cachedInscribeOffers.get(artId);
    if (cached) {
      this.inscribeChoice = cached;
      this.setPhase('inscribe');
      return;
    }

    const art = this.arts.find((a) => a.artId === artId);
    if (!art) {
      this.setPhase('playing');
      return;
    }
    const def = this.getEffectiveArtSpec(art);
    const pool = [...this.getCompatibleInscriptions(art)];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const chosen = pool.slice(0, 4);
    const beforeArtDps = this.getArtPreview(art).estimatedDps;

    const options = chosen.map((ins) => {
      const extraMods = [...this.getArtExtraMods(art), ...ins.mods];
      const extraConvs = [
        ...art.inscriptions.flatMap((i) => i.conversions ?? []),
        ...(art.morph?.conversions ?? []),
        ...(ins.conversions ?? []),
      ];
      const extraExtras = [
        ...art.inscriptions.flatMap((i) => i.extras ?? []),
        ...(art.morph?.extras ?? []),
        ...(ins.extras ?? []),
      ];
      const echoMult = 1 + art.inscriptions.reduce((s, i) => s + (i.echoChance ?? 0), 0) + (ins.echoChance ?? 0);
      const afterArtDps = previewSkillDps(
        this.sheet,
        def,
        extraMods,
        def.baseProjectiles,
        extraConvs,
        extraExtras,
        echoMult,
      ).estimatedDps;
      const dpsDeltaPct = beforeArtDps > 0 ? ((afterArtDps - beforeArtDps) / beforeArtDps) * 100 : 0;
      return { ins, dpsDeltaPct };
    });

    const state: InscribeChoiceState = { artId, options };
    this.cachedInscribeOffers.set(artId, state);
    this.inscribeChoice = state;
    this.setPhase('inscribe');
  }

  pickInscription(inscriptionId: string): void {
    if (!this.inscribeChoice) return;
    const target = this.arts.find((a) => a.artId === this.inscribeChoice!.artId);
    const ins = INSCRIPTIONS[inscriptionId];
    const maxIns = getArchiveBonuses(this.archive).maxInscriptionsPerArt;
    if (target && ins && target.inscriptions.length < maxIns) {
      target.inscriptions.push(ins);
    }
    this.inscribeChoice = null;
    this.clearSubOfferCaches();
    this.player.life = Math.min(this.sheet.get('life'), this.player.life + 10);
    this.player.ward = Math.min(this.sheet.get('ward'), this.player.ward);
    this.setPhase('playing');
  }
}
