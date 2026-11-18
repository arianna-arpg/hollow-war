import {
  ARTS,
  getArtModsForRank,
  getArtRankStep,
  INSCRIPTIONS,
  MAX_ACTIVE_ARTS,
  MAX_ART_RANK,
  type ArtDefinition,
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
import { UPGRADE_POOL, type UpgradeCardDef } from '../content/upgrades.ts';
import { VESSELS, type VesselDefinition } from '../content/vessels.ts';
import { previewSkillDps, resolveHit, type SkillDamageSpec } from '../sdk/combat-resolver.ts';
import { ProcRuntime, type ProcEventContext } from '../sdk/proc-runtime.ts';
import { StatSheet } from '../sdk/stat-sheet.ts';
import type { ConditionId, DamageType, Modifier, ProcSpec, SkillDpsPreview } from '../sdk/types.ts';
import type {
  ActiveUltEffect,
  Enemy,
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

export type GamePhase = 'vessel_select' | 'archive' | 'playing' | 'draft' | 'inscribe' | 'paused' | 'game_over';

export interface InscribeChoiceState {
  artId: string;
  options: Array<{ ins: InscriptionDef; dpsDeltaPct: number }>;
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
  pendingProjectiles: PendingProjectile[] = [];
  activeUltEffects: ActiveUltEffect[] = [];
  pickups: Pickup[] = [];
  floatingTexts: FloatingText[] = [];
  particles: Particle[] = [];

  draftOptions: DraftOption[] = [];
  inscribeChoice: InscribeChoiceState | null = null;

  private spawnTimer = 0;
  private nextBossAt = 60;
  private nextIncursionAt = 35;
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
    this.pendingProjectiles = [];
    this.activeUltEffects = [];
    this.pickups = [];
    this.floatingTexts = [];
    this.particles = [];
    this.draftOptions = [];
    this.inscribeChoice = null;

    this.elapsed = 0;
    this.kills = 0;
    this.totalDamageDealt = 0;
    this.screenShake = 0;
    this.spawnTimer = 0.2;
    this.nextBossAt = 60;
    this.nextIncursionAt = 35;
    this.incursionCount = 0;
    this.dotAccumulator = 0;

    // Opening pack of Undead (Risen Ghouls & Skeleton Warriors)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const arch = i % 2 === 0 ? 'ghoul' : 'skeleton_warrior';
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
        return mods;
      },
    };
    this.arts.push(inst);
    return inst;
  }

  getArtExtraMods(art: EquippedArt): Modifier[] {
    return art.getArtMods();
  }

  getArtPreview(art: EquippedArt): SkillDpsPreview {
    const def = ARTS[art.artId];
    const extraConvs = art.inscriptions.flatMap((i) => i.conversions ?? []);
    const extraExtras = art.inscriptions.flatMap((i) => i.extras ?? []);
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
      const def = ARTS[art.artId];
      if (!def) continue;

      if (def.behavior === 'orbit') {
        this.updateOrbitArt(art, def);
        continue;
      }

      if (def.behavior === 'minion') {
        this.syncMinionRoster(art, def);
        continue;
      }

      art.cooldownTimer -= dt;
      if (art.cooldownTimer <= 0) {
        const extraMods = this.getArtExtraMods(art);
        const speedStat = def.tags.includes('attack') ? 'attackSpeed' : 'castSpeed';
        const speed = Math.max(0.15, this.sheet.get(speedStat, def.tags, extraMods));
        const cdr = Math.max(0.25, this.sheet.get('cooldownRecovery', def.tags, extraMods));
        art.cooldownTimer = Math.max(0.08, def.baseCooldown / (speed * cdr));

        this.castArt(art, def, extraMods);

        const echoIns = art.inscriptions.find((s) => s.echoChance);
        if (echoIns?.echoChance && Math.random() < echoIns.echoChance) {
          this.pendingEchoes.push({ artId: art.artId, delay: 0.14 });
        }
      }
    }
  }

  private updateEchoes(dt: number): void {
    for (let i = this.pendingEchoes.length - 1; i >= 0; i--) {
      const echo = this.pendingEchoes[i];
      echo.delay -= dt;
      if (echo.delay <= 0) {
        this.pendingEchoes.splice(i, 1);
        const art = this.arts.find((a) => a.artId === echo.artId);
        const def = ARTS[echo.artId];
        if (art && def) {
          this.castArt(art, def, this.getArtExtraMods(art));
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
        this.projectiles.push({
          id: nextEntityId++,
          ...item.proj,
          x: this.player.x + Math.cos(Math.atan2(item.proj.vy, item.proj.vx)) * 16,
          y: this.player.y + Math.sin(Math.atan2(item.proj.vy, item.proj.vx)) * 16,
          hitIds: new Set(),
        });
      }
    }
  }

  private castArt(art: EquippedArt, def: ArtDefinition, extraMods: Modifier[]): void {
    if (def.behavior === 'projectile') {
      const count = def.baseProjectiles + Math.max(0, Math.round(this.sheet.get('projectileCount', def.tags, extraMods)));
      const pierce =
        (def.basePierce ?? 0) +
        Math.max(0, Math.round(this.sheet.get('pierceCount', def.tags, extraMods)));
      const areaScale = this.sheet.get('area', def.tags, extraMods);
      const speedScale = this.sheet.get('projectileSpeed', def.tags, extraMods);
      const durScale = this.sheet.get('projectileDuration', def.tags, extraMods);
      const speed = (def.projectileSpeed ?? 520) * speedScale;
      const life = (def.baseDuration ?? 1.6) * durScale;

      const isBoomerang = art.inscriptions.some((i) => i.returnBoomerang);
      const isHoming = def.homing || art.inscriptions.some((i) => i.forceHoming);
      const spreadScale = art.inscriptions.reduce((s, i) => s * (i.spreadScale ?? 1), 1);
      const staggerOverride = art.inscriptions.find((i) => i.staggerOverride !== undefined)?.staggerOverride;
      const splitOnHit = art.inscriptions.reduce((s, i) => s + (i.splitOnHit ?? 0), 0);

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
          pierceLeft: isBoomerang ? Math.max(pierce, 99) : pierce,
          life,
          hitIds: new Set<number>(),
          homing: isHoming,
          explodeRadius: def.explodeRadius ? def.explodeRadius * areaScale : undefined,
          explodeScale: def.explodeScale,
          splitOnHit: splitOnHit > 0 ? splitOnHit : undefined,
          boomerang: isBoomerang ? { maxLife: life, returned: false } : undefined,
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
      const areaScale = this.sheet.get('area', def.tags, extraMods);
      for (let i = 0; i < count; i++) {
        const a = this.player.aimAngle + (i / count) * Math.PI * 2;
        this.projectiles.push({
          id: nextEntityId++,
          x: this.player.x + Math.cos(a) * 18,
          y: this.player.y + Math.sin(a) * 18,
          vx: 0,
          vy: 0,
          radius: def.baseRadius * Math.sqrt(areaScale),
          color: def.color,
          artId: def.id,
          pierceLeft: pierce,
          life: 2.6,
          hitIds: new Set(),
          spiral: {
            originX: this.player.x,
            originY: this.player.y,
            angle: a,
            angularSpeed: 5.2,
            radius: 18,
            radialSpeed: 105,
          },
          extraMods,
        });
      }
    } else if (def.behavior === 'projectile_nova') {
      const count = def.baseProjectiles + Math.max(0, Math.round(this.sheet.get('projectileCount', def.tags, extraMods)));
      const pierce =
        (def.basePierce ?? 0) +
        Math.max(0, Math.round(this.sheet.get('pierceCount', def.tags, extraMods)));
      const areaScale = this.sheet.get('area', def.tags, extraMods);
      const speed = (def.projectileSpeed ?? 430) * this.sheet.get('projectileSpeed', def.tags, extraMods);
      const life = (def.baseDuration ?? 1.5) * this.sheet.get('projectileDuration', def.tags, extraMods);
      for (let i = 0; i < count; i++) {
        const a = this.player.aimAngle + (i / count) * Math.PI * 2;
        this.projectiles.push({
          id: nextEntityId++,
          x: this.player.x + Math.cos(a) * 14,
          y: this.player.y + Math.sin(a) * 14,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          radius: def.baseRadius * Math.sqrt(areaScale),
          color: def.color,
          artId: def.id,
          pierceLeft: pierce,
          life,
          hitIds: new Set(),
          extraMods,
        });
      }
    } else if (def.behavior === 'ground_zone') {
      if (this.groundZones.length >= 4) this.groundZones.shift();
      const radius = def.baseRadius * this.sheet.get('area', def.tags, extraMods);
      this.groundZones.push({
        id: nextEntityId++,
        artId: def.id,
        x: this.player.x,
        y: this.player.y,
        radius,
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
    } else if (def.behavior === 'sweep') {
      const radius = def.baseRadius * this.sheet.get('area', def.tags, extraMods);
      const arcSpread = Math.PI * 0.78;
      this.sweeps.push({
        x: this.player.x,
        y: this.player.y,
        angle: this.player.aimAngle,
        radius,
        arcSpread,
        color: def.color,
        life: 0.2,
        maxLife: 0.2,
      });
      for (const e of this.enemies) {
        if (e.life <= 0) continue;
        const dx = e.x - this.player.x;
        const dy = e.y - this.player.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= radius + e.radius) {
          let diff = Math.atan2(dy, dx) - this.player.aimAngle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          if (Math.abs(diff) <= arcSpread / 2 + 0.25) {
            this.applyArtHit(e, def, extraMods, art);
          }
        }
      }
    } else if (def.behavior === 'totem') {
      if (this.totems.length >= 3) this.totems.shift();
      this.totems.push({
        id: nextEntityId++,
        artId: def.id,
        x: this.player.x + Math.cos(this.player.aimAngle) * 42,
        y: this.player.y + Math.sin(this.player.aimAngle) * 42,
        life: 8.5,
        maxLife: 8.5,
        fireTimer: 0.2,
      });
    } else if (def.behavior === 'trap') {
      if (this.traps.length >= 6) this.traps.shift();
      const areaScale = this.sheet.get('area', def.tags, extraMods);
      this.traps.push({
        id: nextEntityId++,
        artId: def.id,
        x: this.player.x + (Math.random() - 0.5) * 46,
        y: this.player.y + (Math.random() - 0.5) * 46,
        life: 14,
        triggerRadius: 38 * Math.sqrt(areaScale),
        blastRadius: def.baseRadius * areaScale,
      });
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

  private updateMinions(dt: number): void {
    for (let i = this.minions.length - 1; i >= 0; i--) {
      const m = this.minions[i];
      if (m.temporary && m.life !== undefined) {
        m.life -= dt;
        if (m.life <= 0) {
          this.minions.splice(i, 1);
          continue;
        }
      }
      const art = this.arts.find((a) => a.artId === m.artId);
      const def = ARTS[m.artId];
      if (!def) continue;
      if (!art && !m.temporary) continue;
      const extraMods = art ? this.getArtExtraMods(art) : [];

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

      if (m.kind === 'skeleton' || m.kind === 'bone_golem') {
        if (nearest) {
          const dx = nearest.x - m.x;
          const dy = nearest.y - m.y;
          m.facing = Math.atan2(dy, dx);
          const moveSpd = m.kind === 'bone_golem' ? 165 : 195;
          const reach = m.kind === 'bone_golem' ? 28 : 18;
          if (bestDist > nearest.radius + reach) {
            m.x += (dx / bestDist) * moveSpd * dt;
            m.y += (dy / bestDist) * moveSpd * dt;
          } else if (m.attackTimer <= 0) {
            const spd = Math.max(0.2, this.sheet.get('attackSpeed', def.tags, extraMods));
            m.attackTimer = def.baseCooldown / spd;
            if (m.kind === 'bone_golem') {
              const slamR = def.baseRadius * this.sheet.get('area', def.tags, extraMods);
              this.novas.push({ x: nearest.x, y: nearest.y, radius: 8, maxRadius: slamR, color: '#d6d3d1', life: 0.24, maxLife: 0.24 });
              for (const e of this.enemies) {
                if (e.life > 0 && Math.hypot(e.x - nearest.x, e.y - nearest.y) <= slamR + e.radius) {
                  this.applyArtHit(e, def, extraMods, art);
                }
              }
            } else {
              this.applyArtHit(nearest, def, extraMods, art);
            }
          }
        } else {
          // Patrol around player
          const dx = this.player.x - m.x;
          const dy = this.player.y - m.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 64) {
            m.facing = Math.atan2(dy, dx);
            m.x += (dx / dist) * 210 * dt;
            m.y += (dy / dist) * 210 * dt;
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
          const speed = def.projectileSpeed ?? 480;
          this.projectiles.push({
            id: nextEntityId++,
            x: m.x,
            y: m.y,
            vx: Math.cos(a) * speed,
            vy: Math.sin(a) * speed,
            radius: 5.5,
            color: def.color,
            artId: def.id,
            pierceLeft: 0,
            life: 1.4,
            hitIds: new Set(),
            extraMods,
          });
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
        const def = ARTS[t.artId];
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
          const count = def.baseProjectiles + Math.max(0, Math.round(this.sheet.get('projectileCount', def.tags, extraMods)));
          const pierce = (def.basePierce ?? 0) + Math.max(0, Math.round(this.sheet.get('pierceCount', def.tags, extraMods)));
          const baseA = Math.atan2(nearest.y - t.y, nearest.x - t.x);
          const projSpeed = def.projectileSpeed ?? 540;
          const spread = count > 1 ? 0.16 : 0;
          for (let k = 0; k < count; k++) {
            const a = baseA + (k - (count - 1) / 2) * spread;
            this.projectiles.push({
              id: nextEntityId++,
              x: t.x,
              y: t.y,
              vx: Math.cos(a) * projSpeed,
              vy: Math.sin(a) * projSpeed,
              radius: 6,
              color: def.color,
              artId: def.id,
              pierceLeft: pierce,
              life: 1.4,
              hitIds: new Set(),
              extraMods,
            });
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
        const def = ARTS[tr.artId];
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
      gz.tickTimer -= dt;
      if (gz.tickTimer <= 0) {
        const art = this.arts.find((a) => a.artId === gz.artId);
        const def = ARTS[gz.artId];
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
        if (Math.hypot(this.player.x - gz.x, this.player.y - gz.y) <= gz.radius + this.player.radius) {
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

    const extraConvs = art ? art.inscriptions.flatMap((i) => i.conversions ?? []) : [];
    const extraExtras = art ? art.inscriptions.flatMap((i) => i.extras ?? []) : [];
    const innateAilmentMods: Modifier[] = [];
    if (art?.artId === 'poison_nova') {
      innateAilmentMods.push({ stat: 'poisonChance', kind: 'flat', value: 0.6 });
    } else if (art?.artId === 'rend') {
      innateAilmentMods.push({ stat: 'bleedChance', kind: 'flat', value: 0.65 });
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

    const total = receipt.totalDamage;

    enemy.life -= total;
    enemy.hitFlash = 0.1;
    this.totalDamageDealt += total;

    const leech = this.sheet.get('lifeLeech', spec.tags, extraMods);
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
      const def = ARTS[p.artId];
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
            for (let s = 0; s < p.splitOnHit; s++) {
              const offset = s === 0 ? -0.45 : 0.45;
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
                extraMods: shardMods,
              });
            }
          }

          if (p.pierceLeft > 0) {
            p.pierceLeft -= 1;
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

      const dx = this.player.x - e.x;
      const dy = this.player.y - e.y;
      const dist = Math.max(1, Math.hypot(dx, dy));
      e.facing = Math.atan2(dy, dx);

      const isRanged =
        e.archetype === 'skeleton_archer' ||
        e.archetype === 'skeleton_mage' ||
        e.archetype === 'barrow_watchman' ||
        e.archetype === 'skeletal_mortarman';

      if (isRanged && dist < 260) {
        e.vx = 0;
        e.vy = 0;
      } else {
        e.vx = (dx / dist) * speed;
        e.vy = (dy / dist) * speed;
      }

      e.x += e.vx * dt;
      e.y += e.vy * dt;

      if (isRanged || e.isBoss) {
        e.abilityTimer -= dt;
        if (e.abilityTimer <= 0 && dist < 540) {
          e.abilityTimer = e.isBoss ? (this.elapsed > 480 ? 1.7 : 2.3) : e.archetype === 'skeleton_mage' ? 2.1 : 2.5;
          const baseAngle = Math.atan2(dy, dx);
          const bolts = e.isBoss
            ? this.elapsed > 540
              ? 12
              : this.elapsed > 360
                ? 8
                : 5
            : e.archetype === 'skeletal_mortarman'
              ? 5
              : e.archetype === 'skeleton_mage'
                ? 3
                : e.archetype === 'barrow_watchman'
                  ? 2
                  : 1;
          const projSpeed = e.archetype === 'skeletal_mortarman' ? 195 : e.isBoss ? 255 : 240;
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
      this.nextBossAt += 60;
      const angle = Math.random() * Math.PI * 2;
      this.enemies.push(
        createEnemy('lich', this.player.x + Math.cos(angle) * 440, this.player.y + Math.sin(angle) * 440, this.elapsed),
      );
    }
  }

  private updateIncursions(dt: number): void {
    if (this.elapsed >= this.nextIncursionAt) {
      this.nextIncursionAt += 45;
      this.incursionCount += 1;
      const isMajor = this.incursionCount % 2 === 0;
      const angle = Math.random() * Math.PI * 2;
      const px = this.player.x + Math.cos(angle) * 280;
      const py = this.player.y + Math.sin(angle) * 280;
      this.incursionPortals.push({
        id: nextEntityId++,
        x: px,
        y: py,
        life: 11,
        maxLife: 11,
        spawnTimer: 0.4,
        wavesLeft: isMajor ? 4 : 3,
        isMajor,
      });
      this.floatingTexts.push({
        x: this.player.x,
        y: this.player.y - 38,
        vy: -20,
        text: isMajor ? 'MAJOR DEMONIC INCURSION!' : 'DEMONIC INCURSION PORTAL!',
        color: '#f97316',
        life: 1.8,
        maxLife: 1.8,
        scale: 1.2,
      });
    }

    for (let i = this.incursionPortals.length - 1; i >= 0; i--) {
      const portal = this.incursionPortals[i];
      portal.life -= dt;
      portal.spawnTimer -= dt;

      if (portal.spawnTimer <= 0 && portal.wavesLeft > 0) {
        portal.spawnTimer = 2.4;
        portal.wavesLeft -= 1;

        const imps = 3 + Math.min(3, Math.floor(this.elapsed / 50));
        for (let k = 0; k < imps; k++) {
          const a = Math.random() * Math.PI * 2;
          const arch = k === 0 && this.elapsed > 45 ? 'demon_brute' : k % 2 === 0 ? 'imp' : 'hellhound';
          this.enemies.push(
            createEnemy(arch, portal.x + Math.cos(a) * 26, portal.y + Math.sin(a) * 26, this.elapsed),
          );
        }

        if (portal.isMajor && portal.wavesLeft === 0) {
          this.enemies.push(createEnemy('demon_lord', portal.x, portal.y, this.elapsed));
        }
      }

      if (portal.life <= 0) {
        // Portal seals and rewards a Lodestone Magnet or Essence cache
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

  openDraft(): void {
    this.draftOptions = this.rollDraftOptions(3);
    this.setPhase('draft');
  }

  rerollDraft(): void {
    if (this.player.rerolls <= 0 || this.phase !== 'draft') return;
    this.player.rerolls -= 1;
    this.draftOptions = this.rollDraftOptions(3);
    this.onPhaseChange?.(this.phase);
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

  private getCompatibleInscriptions(art: EquippedArt): InscriptionDef[] {
    const def = ARTS[art.artId];
    if (!def) return [];
    return Object.values(INSCRIPTIONS).filter((ins) => {
      if (art.inscriptions.some((i) => i.id === ins.id)) return false;
      if (ins.requiredTags && !ins.requiredTags.every((t) => def.tags.includes(t))) return false;
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

      if (card.category === 'art' && card.artId) {
        const active = this.arts.find((a) => a.artId === card.artId);
        if (active) {
          if (active.level >= MAX_ART_RANK) continue;
        } else {
          if (this.arts.length >= MAX_ACTIVE_ARTS) continue;
        }
        const shared = card.tags.filter((t) => activeTags.has(t)).length;
        const rankBonus = active ? 1.5 : 1.0;
        eligible.push({ card, weight: rankBonus * (1 + shared * affinityBoost) });
        continue;
      }

      const stacks = this.acquiredCards.get(card.id) ?? 0;
      if (card.maxStacks !== undefined && stacks >= card.maxStacks) continue;
      const shared = card.tags.filter((t) => activeTags.has(t)).length;
      eligible.push({ card, weight: 1 + shared * affinityBoost });
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

    // Weighted sampling without replacement, capping Inscribe cards to at most 1 per 3-card draft
    const picked: WeightedCandidate[] = [];
    const pool = [...eligible];
    let inscriptionCount = 0;

    while (picked.length < count && pool.length > 0) {
      const nonInsLeft = pool.some((c) => c.card.category !== 'inscription');
      const filtered =
        inscriptionCount >= 1 && nonInsLeft
          ? pool.filter((c) => c.card.category !== 'inscription')
          : pool;

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
      const idx = pool.indexOf(chosen);
      if (idx >= 0) pool.splice(idx, 1);
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
    if (card.category === 'inscription' && card.artId) {
      this.openInscribeForArt(card.artId);
      return;
    }

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
      this.addOrRankArt(card.artId);
    }

    this.player.life = Math.min(this.sheet.get('life'), this.player.life + 10);
    this.player.ward = Math.min(this.sheet.get('ward'), this.player.ward);

    this.setPhase('playing');
  }

  private openInscribeForArt(artId: string): void {
    const art = this.arts.find((a) => a.artId === artId);
    if (!art) {
      this.setPhase('playing');
      return;
    }
    const def = ARTS[art.artId];
    const compatible = this.getCompatibleInscriptions(art);
    for (let i = compatible.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [compatible[i], compatible[j]] = [compatible[j], compatible[i]];
    }
    const chosen = compatible.slice(0, 4);
    const beforeArtDps = this.getArtPreview(art).estimatedDps;

    const options = chosen.map((ins) => {
      const extraMods = [...this.getArtExtraMods(art), ...ins.mods];
      const extraConvs = [...art.inscriptions.flatMap((i) => i.conversions ?? []), ...(ins.conversions ?? [])];
      const extraExtras = [...art.inscriptions.flatMap((i) => i.extras ?? []), ...(ins.extras ?? [])];
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

    this.inscribeChoice = { artId, options };
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
    this.player.life = Math.min(this.sheet.get('life'), this.player.life + 10);
    this.player.ward = Math.min(this.sheet.get('ward'), this.player.ward);
    this.setPhase('playing');
  }
}
