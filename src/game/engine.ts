import { ARTS, INSCRIPTIONS, type ArtDefinition } from '../content/skills.ts';
import { HOLLOW_WAR_STAT_RULES } from '../content/stats.ts';
import { UPGRADE_POOL, type UpgradeCardDef } from '../content/upgrades.ts';
import { VESSELS, type VesselDefinition } from '../content/vessels.ts';
import { previewSkillDps, resolveHit, type SkillDamageSpec } from '../sdk/combat-resolver.ts';
import { ProcRuntime, type ProcEventContext } from '../sdk/proc-runtime.ts';
import { StatSheet } from '../sdk/stat-sheet.ts';
import type { ConditionId, DamageType, Modifier, ProcSpec, SkillDpsPreview } from '../sdk/types.ts';
import type {
  Enemy,
  EquippedArt,
  FloatingText,
  LightningArc,
  NovaRing,
  Particle,
  Pickup,
  Projectile,
  SweepArc,
} from './entities.ts';
import { createEnemy, pickArchetypeForTime, resetEnemyIds } from './spawner.ts';

export type GamePhase = 'vessel_select' | 'playing' | 'draft' | 'paused' | 'game_over';

export interface DraftOption {
  card: UpgradeCardDef;
  targetArtId?: string;
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
    dashDirX: 1,
    dashDirY: 0,
    invulnTimer: 0,
    aimAngle: 0,
    orbitAngle: 0,
    rerolls: 2,
  };

  autoAim = true;
  elapsed = 0;
  kills = 0;
  totalDamageDealt = 0;
  screenShake = 0;

  arts: EquippedArt[] = [];
  acquiredCards: Map<string, number> = new Map();

  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  arcs: LightningArc[] = [];
  novas: NovaRing[] = [];
  sweeps: SweepArc[] = [];
  pickups: Pickup[] = [];
  floatingTexts: FloatingText[] = [];
  particles: Particle[] = [];

  draftOptions: DraftOption[] = [];

  private spawnTimer = 0;
  private nextBossAt = 60;
  private bossCount = 0;
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

    this.sheet.setSource('vessel', found.mods);
    if (found.conversions) this.sheet.setConversions('vessel', found.conversions);
    if (found.extras) this.sheet.setExtras('vessel', found.extras);
    if (found.procs) {
      for (const p of found.procs) this.procs.register(p);
    }

    this.arts = [];
    this.acquiredCards.clear();
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
      dashDirX: 1,
      dashDirY: 0,
      invulnTimer: 0,
      aimAngle: 0,
      orbitAngle: 0,
      rerolls: 2,
    };

    resetEnemyIds();
    this.enemies = [];
    this.projectiles = [];
    this.arcs = [];
    this.novas = [];
    this.sweeps = [];
    this.pickups = [];
    this.floatingTexts = [];
    this.particles = [];
    this.draftOptions = [];

    this.elapsed = 0;
    this.kills = 0;
    this.totalDamageDealt = 0;
    this.screenShake = 0;
    this.spawnTimer = 0.2;
    this.nextBossAt = 60;
    this.bossCount = 0;
    this.dotAccumulator = 0;

    // Opening pack of Risen Ghouls & Ash Imps
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const arch = i % 2 === 0 ? 'ghoul' : 'imp';
      this.enemies.push(createEnemy(arch, Math.cos(angle) * 340, Math.sin(angle) * 340, 0));
    }

    this.setPhase('playing');
  }

  setPhase(next: GamePhase): void {
    this.phase = next;
    this.onPhaseChange?.(next);
  }

  triggerDash(): void {
    if (this.phase !== 'playing') return;
    if (this.player.dashCooldown > 0 || this.player.dashTimer > 0) return;

    let dx = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);
    let dy = (this.input.down ? 1 : 0) - (this.input.up ? 1 : 0);
    if (dx === 0 && dy === 0) {
      dx = Math.cos(this.player.aimAngle);
      dy = Math.sin(this.player.aimAngle);
    } else {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
    }

    this.player.dashDirX = dx;
    this.player.dashDirY = dy;
    this.player.dashTimer = 0.16;
    this.player.invulnTimer = Math.max(this.player.invulnTimer, 0.22);
    this.player.dashCooldown = this.sheet.get('dashCooldown');

    this.spawnParticles(this.player.x, this.player.y, this.vessel.color, 10, 140);
    this.procs.emit('onDash', this.elapsed, { x: this.player.x, y: this.player.y }, (spec, ctx) =>
      this.executeProc(spec, ctx),
    );
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
        const mods: Modifier[] = [];
        if (this.level > 1) {
          mods.push({
            stat: 'damage',
            kind: 'more',
            value: (this.level - 1) * 0.22,
            source: `Rank ${this.level}`,
          });
          if (this.artId === 'chain_lightning') {
            mods.push({ stat: 'chainCount', kind: 'flat', value: this.level - 1 });
          } else if (this.artId === 'hammer_of_judgment' || this.artId === 'fan_of_blades') {
            mods.push({ stat: 'projectileCount', kind: 'flat', value: this.level - 1 });
          } else if (
            this.artId === 'cleave' ||
            this.artId === 'poison_nova' ||
            this.artId === 'frost_nova'
          ) {
            mods.push({ stat: 'area', kind: 'inc', value: (this.level - 1) * 0.12 });
          }
        }
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
    return previewSkillDps(this.sheet, def, this.getArtExtraMods(art), def.baseProjectiles);
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
    this.updateProjectiles(dt);
    this.updateEnemies(dt);
    this.updateAilments(dt);
    this.updatePickups(dt);
    this.updateSpawner(dt);
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
          this.castArt(art, def, extraMods);
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

  private castArt(art: EquippedArt, def: ArtDefinition, extraMods: Modifier[]): void {
    if (def.behavior === 'projectile') {
      const count = def.baseProjectiles + Math.max(0, Math.round(this.sheet.get('projectileCount', def.tags, extraMods)));
      const pierce = Math.max(0, Math.round(this.sheet.get('pierceCount', def.tags, extraMods)));
      const areaScale = this.sheet.get('area', def.tags, extraMods);
      const speed = def.projectileSpeed ?? 520;
      const spreadStep = count > 1 ? 0.14 : 0;
      const startAngle = this.player.aimAngle - ((count - 1) * spreadStep) / 2;

      for (let i = 0; i < count; i++) {
        const a = startAngle + i * spreadStep;
        this.projectiles.push({
          id: nextEntityId++,
          x: this.player.x + Math.cos(a) * 16,
          y: this.player.y + Math.sin(a) * 16,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          radius: def.baseRadius * Math.sqrt(areaScale),
          color: def.color,
          artId: def.id,
          pierceLeft: pierce,
          life: 1.8,
          hitIds: new Set(),
          extraMods,
        });
      }
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
      extraMods,
    );

    let total = receipt.totalDamage;
    if (art) {
      for (const ins of art.inscriptions) {
        if (ins.extras) {
          for (const ex of ins.extras) {
            total += (receipt.byType[ex.from] ?? 0) * ex.ratio;
          }
        }
      }
    }

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
      kind: 'xp',
      x: enemy.x,
      y: enemy.y,
      value: enemy.xpValue,
      color: enemy.isBoss ? '#fbbf24' : '#38bdf8',
      radius: enemy.isBoss ? 8 : 5,
      magnetized: false,
    });

    if (Math.random() < 0.045) {
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

      if (p.homing && !p.fromEnemy && this.enemies.length > 0) {
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
          const desired = Math.atan2(nearest.y - p.y, nearest.x - p.x);
          p.vx = Math.cos(desired) * speed;
          p.vy = Math.sin(desired) * speed;
        }
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

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
          this.applyArtHit(e, def, p.extraMods ?? (art ? this.getArtExtraMods(art) : []), art);
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

      if (e.archetype === 'skeleton_archer' && dist < 245) {
        e.vx = 0;
        e.vy = 0;
      } else {
        e.vx = (dx / dist) * speed;
        e.vy = (dy / dist) * speed;
      }

      e.x += e.vx * dt;
      e.y += e.vy * dt;

      if (e.archetype === 'skeleton_archer' || e.isBoss) {
        e.abilityTimer -= dt;
        if (e.abilityTimer <= 0 && dist < 500) {
          e.abilityTimer = e.isBoss ? 2.3 : 2.6;
          const baseAngle = Math.atan2(dy, dx);
          const bolts = e.isBoss ? 5 : 1;
          for (let b = 0; b < bolts; b++) {
            const a = baseAngle + (b - (bolts - 1) / 2) * 0.24;
            this.projectiles.push({
              id: nextEntityId++,
              x: e.x,
              y: e.y,
              vx: Math.cos(a) * 245,
              vy: Math.sin(a) * 245,
              radius: e.isBoss ? 7 : 5.5,
              color: e.faction === 'demon' ? '#f97316' : '#c084fc',
              artId: '',
              pierceLeft: 0,
              life: 2.5,
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
      this.setPhase('game_over');
    }
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
        if (pk.kind === 'xp') {
          this.player.xp += pk.value;
          if (this.player.xp >= this.player.xpToNext) {
            this.player.xp -= this.player.xpToNext;
            this.player.level += 1;
            this.player.xpToNext = Math.round(45 * Math.pow(1.24, this.player.level - 1));
            this.openDraft();
          }
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
    if (this.spawnTimer <= 0 && this.enemies.length < 160) {
      const rate = Math.max(0.22, 1.05 - this.elapsed * 0.0045);
      this.spawnTimer = rate;
      const batch = this.elapsed > 70 ? 2 : 1;
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
      this.bossCount += 1;
      const bossArch = this.bossCount % 2 === 1 ? 'lich' : 'demon_lord';
      const angle = Math.random() * Math.PI * 2;
      this.enemies.push(
        createEnemy(bossArch, this.player.x + Math.cos(angle) * 440, this.player.y + Math.sin(angle) * 440, this.elapsed),
      );
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

  private rollDraftOptions(count: number): DraftOption[] {
    const eligible: Array<{ card: UpgradeCardDef; targetArtId?: string }> = [];

    for (const card of UPGRADE_POOL) {
      const stacks = this.acquiredCards.get(card.id) ?? 0;
      if (card.maxStacks !== undefined && stacks >= card.maxStacks) continue;

      if (card.category === 'inscription' && card.inscriptionId) {
        const ins = INSCRIPTIONS[card.inscriptionId];
        if (!ins) continue;
        const compatible = this.arts.filter((ar) => {
          const def = ARTS[ar.artId];
          if (!def) return false;
          if (ar.inscriptions.some((i) => i.id === ins.id)) return false;
          if (ins.requiredTags && !ins.requiredTags.every((t) => def.tags.includes(t))) return false;
          return true;
        });
        if (compatible.length === 0) continue;
        const chosen = compatible[Math.floor(Math.random() * compatible.length)];
        eligible.push({ card, targetArtId: chosen.artId });
      } else {
        eligible.push({ card });
      }
    }

    for (let i = eligible.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
    }

    return eligible.slice(0, count).map(({ card, targetArtId }) => this.buildDraftOption(card, targetArtId));
  }

  private buildDraftOption(card: UpgradeCardDef, targetArtId?: string): DraftOption {
    const beforeDps = this.getTotalEstimatedDps();
    const forked = this.sheet.fork();

    if (card.mods) forked.setSource(`preview_${card.id}`, card.mods);
    if (card.conversions) forked.setConversions(`preview_${card.id}`, card.conversions);
    if (card.extras) forked.setExtras(`preview_${card.id}`, card.extras);

    let afterDps = 0;
    for (const ar of this.arts) {
      const def = ARTS[ar.artId];
      const extraMods = [...this.getArtExtraMods(ar)];
      if (card.category === 'art' && card.artId === ar.artId) {
        extraMods.push({ stat: 'damage', kind: 'more', value: 0.22 });
      } else if (card.category === 'inscription' && card.inscriptionId && targetArtId === ar.artId) {
        const ins = INSCRIPTIONS[card.inscriptionId];
        if (ins) extraMods.push(...ins.mods);
      }
      afterDps += previewSkillDps(forked, def, extraMods, def.baseProjectiles).estimatedDps;
    }

    if (card.category === 'art' && card.artId && !this.arts.some((a) => a.artId === card.artId)) {
      const def = ARTS[card.artId];
      afterDps += previewSkillDps(forked, def, [], def.baseProjectiles).estimatedDps;
    }

    const dpsDeltaPct = beforeDps > 0 ? ((afterDps - beforeDps) / beforeDps) * 100 : 0;
    const targetName = targetArtId ? ARTS[targetArtId]?.name : undefined;
    const summaryText = targetName
      ? `Inscribe onto ${targetName}`
      : card.category === 'oath'
        ? 'Keystone Oath'
        : card.category.toUpperCase();

    return { card, targetArtId, dpsDeltaPct, summaryText };
  }

  pickDraftOption(index: number): void {
    const opt = this.draftOptions[index];
    if (!opt) return;

    const { card, targetArtId } = opt;
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
    } else if (card.category === 'inscription' && card.inscriptionId && targetArtId) {
      const target = this.arts.find((a) => a.artId === targetArtId);
      const ins = INSCRIPTIONS[card.inscriptionId];
      if (target && ins) {
        target.inscriptions.push(ins);
      }
    }

    this.player.life = Math.min(this.sheet.get('life'), this.player.life + 10);
    this.player.ward = Math.min(this.sheet.get('ward'), this.player.ward);

    this.setPhase('playing');
  }
}
