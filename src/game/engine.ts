import { SKILLS, SUPPORT_SOCKETS, type SkillDefinition } from '../content/skills.ts';
import { HOLLOW_WAR_STAT_RULES } from '../content/stats.ts';
import { UPGRADE_POOL, type UpgradeCardDef } from '../content/upgrades.ts';
import { VESSELS, type VesselDefinition } from '../content/vessels.ts';
import { previewSkillDps, resolveHit, type SkillDamageSpec } from '../sdk/combat-resolver.ts';
import { ProcRuntime, type ProcEventContext } from '../sdk/proc-runtime.ts';
import { StatSheet } from '../sdk/stat-sheet.ts';
import type { ConditionId, DamageType, Modifier, ProcSpec, SkillDpsPreview } from '../sdk/types.ts';
import type {
  Enemy,
  EquippedSkill,
  FloatingText,
  LightningArc,
  NovaRing,
  Particle,
  Pickup,
  Projectile,
} from './entities.ts';
import { createEnemy, pickArchetypeForTime, resetEnemyIds } from './spawner.ts';

export type GamePhase = 'vessel_select' | 'playing' | 'draft' | 'paused' | 'game_over';

export interface DraftOption {
  card: UpgradeCardDef;
  targetSkillId?: string; // for support cards
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

  // Player state
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

  skills: EquippedSkill[] = [];
  acquiredCards: Map<string, number> = new Map();

  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  arcs: LightningArc[] = [];
  novas: NovaRing[] = [];
  pickups: Pickup[] = [];
  floatingTexts: FloatingText[] = [];
  particles: Particle[] = [];

  draftOptions: DraftOption[] = [];

  private spawnTimer = 0;
  private nextBossAt = 60;
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

    this.skills = [];
    this.acquiredCards.clear();
    this.addOrRankSkill(found.startingSkillId);

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
    this.dotAccumulator = 0;

    // Spawn an initial small ring of thralls so action starts within 1 second
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      this.enemies.push(createEnemy('thrall', Math.cos(angle) * 340, Math.sin(angle) * 340, 0));
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

  addOrRankSkill(skillId: string): EquippedSkill {
    const existing = this.skills.find((s) => s.skillId === skillId);
    if (existing) {
      existing.level += 1;
      return existing;
    }
    const inst: EquippedSkill = {
      skillId,
      level: 1,
      cooldownTimer: 0.1,
      supports: [],
      getSkillMods() {
        const mods: Modifier[] = [];
        if (this.level > 1) {
          mods.push({
            stat: 'damage',
            kind: 'more',
            value: (this.level - 1) * 0.22,
            source: `Rank ${this.level}`,
          });
          if (this.skillId === 'arc_lash') {
            mods.push({ stat: 'chainCount', kind: 'flat', value: this.level - 1 });
          } else if (this.skillId === 'void_glaive' || this.skillId === 'frost_shard') {
            mods.push({ stat: 'projectileCount', kind: 'flat', value: this.level - 1 });
          } else if (this.skillId === 'ruin_nova') {
            mods.push({ stat: 'area', kind: 'inc', value: (this.level - 1) * 0.12 });
          }
        }
        for (const sup of this.supports) {
          mods.push(...sup.mods);
        }
        return mods;
      },
    };
    this.skills.push(inst);
    return inst;
  }

  getSkillExtraMods(skill: EquippedSkill): Modifier[] {
    return skill.getSkillMods();
  }

  getSkillPreview(skill: EquippedSkill): SkillDpsPreview {
    const def = SKILLS[skill.skillId];
    return previewSkillDps(this.sheet, def, this.getSkillExtraMods(skill), def.baseProjectiles);
  }

  getTotalEstimatedDps(): number {
    return this.skills.reduce((sum, s) => sum + this.getSkillPreview(s).estimatedDps, 0);
  }

  update(rawDt: number): void {
    if (this.phase !== 'playing') return;
    const dt = Math.min(rawDt, 0.05);
    this.elapsed += dt;
    this.screenShake = Math.max(0, this.screenShake - dt * 28);

    this.updatePlayer(dt);
    this.updateConditions(Math.hypot(this.player.vx, this.player.vy) > 15);
    this.updateSkills(dt);
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

  private updatePlayer(dt: number): void {
    const maxLife = this.sheet.get('life');
    const maxWard = this.sheet.get('ward');

    // Clamp & regen
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

    // Aiming
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

  private updateSkills(dt: number): void {
    for (const skill of this.skills) {
      const def = SKILLS[skill.skillId];
      if (!def) continue;

      if (def.behavior === 'orbit') {
        this.updateOrbitSkill(skill, def);
        continue;
      }

      skill.cooldownTimer -= dt;
      if (skill.cooldownTimer <= 0) {
        const extraMods = this.getSkillExtraMods(skill);
        const speedStat = def.tags.includes('attack') ? 'attackSpeed' : 'castSpeed';
        const speed = Math.max(0.15, this.sheet.get(speedStat, def.tags, extraMods));
        const cdr = Math.max(0.25, this.sheet.get('cooldownRecovery', def.tags, extraMods));
        skill.cooldownTimer = Math.max(0.08, def.baseCooldown / (speed * cdr));

        this.castSkill(skill, def, extraMods);

        // Echo Support check
        const echoSupport = skill.supports.find((s) => s.echoChance);
        if (echoSupport?.echoChance && Math.random() < echoSupport.echoChance) {
          this.castSkill(skill, def, extraMods);
        }
      }
    }
  }

  private updateOrbitSkill(skill: EquippedSkill, def: SkillDefinition): void {
    const extraMods = this.getSkillExtraMods(skill);
    const bladeCount = def.baseProjectiles + Math.max(0, Math.round(this.sheet.get('projectileCount', def.tags, extraMods)));
    const orbitRadius = def.baseRadius * this.sheet.get('area', def.tags, extraMods);

    for (let i = 0; i < bladeCount; i++) {
      const angle = this.player.orbitAngle + (i / bladeCount) * Math.PI * 2;
      const bx = this.player.x + Math.cos(angle) * orbitRadius;
      const by = this.player.y + Math.sin(angle) * orbitRadius;

      for (const e of this.enemies) {
        if (e.life <= 0 || e.orbitHitCooldown > 0) continue;
        const dist = Math.hypot(e.x - bx, e.y - by);
        if (dist <= e.radius + 16) {
          e.orbitHitCooldown = def.baseCooldown / Math.max(0.3, this.sheet.get('attackSpeed', def.tags, extraMods));
          this.applySkillHit(e, def, extraMods, skill);
        }
      }
    }
  }

  private castSkill(skill: EquippedSkill, def: SkillDefinition, extraMods: Modifier[]): void {
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
          skillId: def.id,
          pierceLeft: pierce,
          life: 1.8,
          hitIds: new Set(),
          extraMods,
        });
      }
    } else if (def.behavior === 'chain') {
      const range = def.baseRadius * this.sheet.get('area', def.tags, extraMods);
      const chains = (def.baseChain ?? 2) + Math.max(0, Math.round(this.sheet.get('chainCount', def.tags, extraMods)));
      this.castChainLightning(this.player.x, this.player.y, range, chains, def, extraMods, skill);
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
          this.applySkillHit(e, def, extraMods, skill);
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
    skill?: EquippedSkill,
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
      this.applySkillHit(best, def, extraMods, skill);
      cx = best.x;
      cy = best.y;
    }

    if (points.length > 1) {
      this.arcs.push({ points, color: '#38bdf8', life: 0.16, maxLife: 0.16 });
    }
  }

  private applySkillHit(
    enemy: Enemy,
    spec: SkillDamageSpec,
    extraMods: Modifier[],
    skill?: EquippedSkill,
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

    // Apply support conversions/extras if present on this skill
    let total = receipt.totalDamage;
    if (skill) {
      for (const sup of skill.supports) {
        if (sup.extras) {
          for (const ex of sup.extras) {
            total += (receipt.byType[ex.from] ?? 0) * ex.ratio;
          }
        }
      }
    }

    enemy.life -= total;
    enemy.hitFlash = 0.1;
    this.totalDamageDealt += total;

    // Life Leech
    const leech = this.sheet.get('lifeLeech', spec.tags, extraMods);
    if (leech > 0) {
      const maxLife = this.sheet.get('life');
      this.player.life = Math.min(maxLife, this.player.life + total * leech);
    }

    // Dominant damage color for floating text
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

    // Apply Ailments
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
        enemy.ailments.push({ type: 'poison', dps, remaining: 3.5, maxDuration: 3.5 }); // Poison stacks!
      } else if (ail === 'chill') {
        this.applyAilment(enemy, 'chill', 0, 2.5);
      } else if (ail === 'shock') {
        this.applyAilment(enemy, 'shock', 0, 3.0);
      }
    }

    // Procs
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
          this.applySkillHit(e, procSpec, [], undefined, depth);
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
        skillId: isFire ? 'firebolt' : 'void_glaive',
        pierceLeft: 0,
        life: 1.2,
        hitIds: new Set(),
        homing: true,
      });
    }
  }

  private handleEnemyDeath(enemy: Enemy, procDepth: number): void {
    this.kills += 1;
    this.spawnParticles(enemy.x, enemy.y, enemy.color, enemy.archetype === 'boss' ? 28 : 9, 160);

    // Sustain on Kill
    const maxLife = this.sheet.get('life');
    const maxWard = this.sheet.get('ward');
    const lifeOnKill = this.sheet.get('lifeOnKill');
    const wardOnKill = this.sheet.get('wardOnKill');
    if (lifeOnKill > 0) this.player.life = Math.min(maxLife, this.player.life + lifeOnKill);
    if (wardOnKill > 0 && maxWard > 0) this.player.ward = Math.min(maxWard, this.player.ward + wardOnKill);

    // Drop XP & occasional Life/Ward orb
    this.pickups.push({
      id: nextEntityId++,
      kind: 'xp',
      x: enemy.x,
      y: enemy.y,
      value: enemy.xpValue,
      color: enemy.archetype === 'boss' ? '#fbbf24' : '#38bdf8',
      radius: enemy.archetype === 'boss' ? 8 : 5,
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

      const skill = this.skills.find((s) => s.skillId === p.skillId);
      const def = SKILLS[p.skillId];
      if (!def) continue;

      let removed = false;
      for (const e of this.enemies) {
        if (e.life <= 0 || p.hitIds.has(e.id)) continue;
        if (Math.hypot(e.x - p.x, e.y - p.y) <= p.radius + e.radius) {
          p.hitIds.add(e.id);
          this.applySkillHit(e, def, p.extraMods ?? (skill ? this.getSkillExtraMods(skill) : []), skill);
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

      if (e.archetype === 'weaver' && dist < 240) {
        e.vx = 0;
        e.vy = 0;
      } else {
        e.vx = (dx / dist) * speed;
        e.vy = (dy / dist) * speed;
      }

      e.x += e.vx * dt;
      e.y += e.vy * dt;

      // Ranged weaver / boss projectile
      if (e.archetype === 'weaver' || e.archetype === 'boss') {
        e.abilityTimer -= dt;
        if (e.abilityTimer <= 0 && dist < 480) {
          e.abilityTimer = e.archetype === 'boss' ? 2.4 : 2.8;
          const baseAngle = Math.atan2(dy, dx);
          const bolts = e.archetype === 'boss' ? 5 : 1;
          for (let b = 0; b < bolts; b++) {
            const a = baseAngle + (b - (bolts - 1) / 2) * 0.24;
            this.projectiles.push({
              id: nextEntityId++,
              x: e.x,
              y: e.y,
              vx: Math.cos(a) * 240,
              vy: Math.sin(a) * 240,
              radius: 6,
              color: '#e879f9',
              skillId: '',
              pierceLeft: 0,
              life: 2.5,
              hitIds: new Set(),
              fromEnemy: true,
              enemyDamage: e.damage * 0.85,
            });
          }
        }
      }

      // Contact damage
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
      const angle = Math.random() * Math.PI * 2;
      this.enemies.push(
        createEnemy('boss', this.player.x + Math.cos(angle) * 440, this.player.y + Math.sin(angle) * 440, this.elapsed),
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
    const eligible: Array<{ card: UpgradeCardDef; targetSkillId?: string }> = [];

    for (const card of UPGRADE_POOL) {
      const stacks = this.acquiredCards.get(card.id) ?? 0;
      if (card.maxStacks !== undefined && stacks >= card.maxStacks) continue;

      if (card.category === 'support' && card.supportId) {
        const sup = SUPPORT_SOCKETS[card.supportId];
        if (!sup) continue;
        // Find equipped skills compatible with this support that don't already have it
        const compatible = this.skills.filter((sk) => {
          const def = SKILLS[sk.skillId];
          if (!def) return false;
          if (sk.supports.some((s) => s.id === sup.id)) return false;
          if (sup.requiredTags && !sup.requiredTags.every((t) => def.tags.includes(t))) return false;
          return true;
        });
        if (compatible.length === 0) continue;
        const chosen = compatible[Math.floor(Math.random() * compatible.length)];
        eligible.push({ card, targetSkillId: chosen.skillId });
      } else {
        eligible.push({ card });
      }
    }

    // Shuffle and pick `count`
    for (let i = eligible.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
    }

    return eligible.slice(0, count).map(({ card, targetSkillId }) => this.buildDraftOption(card, targetSkillId));
  }

  private buildDraftOption(card: UpgradeCardDef, targetSkillId?: string): DraftOption {
    const beforeDps = this.getTotalEstimatedDps();
    const forked = this.sheet.fork();

    if (card.mods) forked.setSource(`preview_${card.id}`, card.mods);
    if (card.conversions) forked.setConversions(`preview_${card.id}`, card.conversions);
    if (card.extras) forked.setExtras(`preview_${card.id}`, card.extras);

    let afterDps = 0;
    for (const sk of this.skills) {
      const def = SKILLS[sk.skillId];
      const extraMods = [...this.getSkillExtraMods(sk)];
      if (card.category === 'skill' && card.skillId === sk.skillId) {
        extraMods.push({ stat: 'damage', kind: 'more', value: 0.22 });
      } else if (card.category === 'support' && card.supportId && targetSkillId === sk.skillId) {
        const sup = SUPPORT_SOCKETS[card.supportId];
        if (sup) extraMods.push(...sup.mods);
      }
      afterDps += previewSkillDps(forked, def, extraMods, def.baseProjectiles).estimatedDps;
    }

    if (card.category === 'skill' && card.skillId && !this.skills.some((s) => s.skillId === card.skillId)) {
      const def = SKILLS[card.skillId];
      afterDps += previewSkillDps(forked, def, [], def.baseProjectiles).estimatedDps;
    }

    const dpsDeltaPct = beforeDps > 0 ? ((afterDps - beforeDps) / beforeDps) * 100 : 0;
    const targetName = targetSkillId ? SKILLS[targetSkillId]?.name : undefined;
    const summaryText = targetName ? `Socket into ${targetName}` : card.category.toUpperCase();

    return { card, targetSkillId, dpsDeltaPct, summaryText };
  }

  pickDraftOption(index: number): void {
    const opt = this.draftOptions[index];
    if (!opt) return;

    const { card, targetSkillId } = opt;
    const stacks = (this.acquiredCards.get(card.id) ?? 0) + 1;
    this.acquiredCards.set(card.id, stacks);

    const sourceKey = `card_${card.id}_${stacks}`;
    if (card.mods) this.sheet.setSource(sourceKey, card.mods);
    if (card.conversions) this.sheet.setConversions(sourceKey, card.conversions);
    if (card.extras) this.sheet.setExtras(sourceKey, card.extras);
    if (card.procs) {
      for (const p of card.procs) this.procs.register(p);
    }

    if (card.category === 'skill' && card.skillId) {
      this.addOrRankSkill(card.skillId);
    } else if (card.category === 'support' && card.supportId && targetSkillId) {
      const target = this.skills.find((s) => s.skillId === targetSkillId);
      const sup = SUPPORT_SOCKETS[card.supportId];
      if (target && sup) {
        target.supports.push(sup);
      }
    }

    // Re-clamp vitals
    this.player.life = Math.min(this.sheet.get('life'), this.player.life + 10);
    this.player.ward = Math.min(this.sheet.get('ward'), this.player.ward);

    this.setPhase('playing');
  }
}
