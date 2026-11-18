import { ARTS } from '../content/skills.ts';
import type { HollowWarEngine } from './engine.ts';
import type { Enemy } from './entities.ts';
import { renderHollowTerrain } from './terrain.ts';

function drawSkull(ctx: CanvasRenderingContext2D, x: number, r: number, color: string, eyeColor = '#090b10'): void {
  ctx.fillStyle = color;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(x, 0, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Eye pits
  ctx.fillStyle = eyeColor;
  ctx.beginPath();
  ctx.arc(x + r * 0.14, -r * 0.15, r * 0.11, 0, Math.PI * 2);
  ctx.arc(x + r * 0.14, r * 0.15, r * 0.11, 0, Math.PI * 2);
  ctx.fill();
}

function drawRibcage(ctx: CanvasRenderingContext2D, r: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.55, 0);
  ctx.lineTo(r * 0.35, 0);
  for (const ox of [-r * 0.35, -r * 0.1, r * 0.15]) {
    ctx.moveTo(ox, -r * 0.55);
    ctx.quadraticCurveTo(ox + r * 0.12, 0, ox, r * 0.55);
  }
  ctx.stroke();
}

function drawWings(ctx: CanvasRenderingContext2D, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 1.2;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.15, side * r * 0.3);
    ctx.quadraticCurveTo(-r * 0.9, side * r * 1.45, -r * 1.15, side * r * 0.65);
    ctx.lineTo(-r * 0.55, side * r * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

function drawHorns(ctx: CanvasRenderingContext2D, r: number, color: string): void {
  ctx.fillStyle = color;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(r * 0.2, side * r * 0.32);
    ctx.quadraticCurveTo(r * 0.72, side * r * 0.75, r * 0.55, side * r * 0.98);
    ctx.quadraticCurveTo(r * 0.4, side * r * 0.6, r * 0.05, side * r * 0.42);
    ctx.closePath();
    ctx.fill();
  }
}

function drawEnemyLook(ctx: CanvasRenderingContext2D, e: Enemy, elapsed: number): void {
  const r = e.radius;
  const flash = e.hitFlash > 0;
  const baseColor = flash ? '#ffffff' : e.color;

  ctx.save();
  ctx.translate(e.x, e.y);

  // Ground contact shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.22, r * 1.02, r * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.rotate(e.facing);

  switch (e.archetype) {
    case 'ghoul': {
      // Hunched ragged corpse with claws and maw
      ctx.fillStyle = baseColor;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(-r * 0.08, 0, r * 0.85, r * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Claws
      ctx.strokeStyle = flash ? '#ffffff' : '#d6d3d1';
      ctx.lineWidth = 2;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(r * 0.45, s * r * 0.48);
        ctx.lineTo(r * 1.05, s * r * 0.35);
        ctx.stroke();
      }
      // Glowing eyes
      ctx.fillStyle = '#bef264';
      ctx.beginPath();
      ctx.arc(r * 0.45, -r * 0.2, 2, 0, Math.PI * 2);
      ctx.arc(r * 0.45, r * 0.2, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'skeleton_warrior': {
      drawRibcage(ctx, r, baseColor);
      // Iron broadsword
      ctx.fillStyle = flash ? '#ffffff' : '#94a3b8';
      ctx.fillRect(r * 0.15, r * 0.48, r * 0.95, r * 0.2);
      drawSkull(ctx, r * 0.45, r, baseColor);
      break;
    }
    case 'skeleton_archer': {
      // Burial tatters + ribs + glow staff + skull
      ctx.fillStyle = flash ? '#ffffff' : '#334155';
      ctx.beginPath();
      ctx.ellipse(-r * 0.2, 0, r * 0.75, r * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
      drawRibcage(ctx, r, baseColor);
      // Necrotic staff
      ctx.strokeStyle = '#78716c';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-r * 0.3, r * 0.62);
      ctx.lineTo(r * 0.95, r * 0.62);
      ctx.stroke();
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(r * 0.95, r * 0.62, 3.5, 0, Math.PI * 2);
      ctx.fill();
      drawSkull(ctx, r * 0.42, r, baseColor, '#c084fc');
      break;
    }
    case 'wraith': {
      // Tattered shroud + spectral hood + wisps
      ctx.fillStyle = flash ? '#ffffff' : 'rgba(56, 189, 248, 0.28)';
      ctx.beginPath();
      ctx.moveTo(r * 0.6, 0);
      ctx.lineTo(-r * 1.15, -r * 0.75);
      ctx.lineTo(-r * 0.75, 0);
      ctx.lineTo(-r * 1.15, r * 0.75);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.arc(r * 0.2, 0, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.arc(r * 0.38, -r * 0.16, 2.2, 0, Math.PI * 2);
      ctx.arc(r * 0.38, r * 0.16, 2.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'lich': {
      // Undead Boss: burial robe, glowing orb-staff, crowned skull, orbiting runes
      ctx.fillStyle = flash ? '#ffffff' : '#3b0764';
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Orbiting runes
      for (let i = 0; i < 4; i++) {
        const a = elapsed * 2.2 + (i / 4) * Math.PI * 2;
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      drawSkull(ctx, r * 0.25, r * 1.05, '#e2e8f0', '#c084fc');
      // Gold/Bone Crown
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(r * 0.15, 0, r * 0.52, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();
      break;
    }
    case 'imp': {
      drawWings(ctx, r, flash ? '#ffffff' : '#9f1239');
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
      ctx.fill();
      drawHorns(ctx, r * 0.85, '#1c1917');
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(r * 0.35, -r * 0.18, 2, 0, Math.PI * 2);
      ctx.arc(r * 0.35, r * 0.18, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'hellhound': {
      // Ember-pelted hound + barbed tail + live flame glow
      ctx.fillStyle = flash ? '#ffffff' : 'rgba(249, 115, 22, 0.32)';
      ctx.beginPath();
      ctx.arc(-r * 0.35, 0, r * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.95, r * 0.58, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(r * 0.5, -r * 0.16, 2.2, 0, Math.PI * 2);
      ctx.arc(r * 0.5, r * 0.16, 2.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'demon_brute': {
      drawWings(ctx, r, flash ? '#ffffff' : '#7f1d1d');
      ctx.fillStyle = baseColor;
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawHorns(ctx, r, '#292524');
      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.arc(r * 0.42, -r * 0.22, 2.6, 0, Math.PI * 2);
      ctx.arc(r * 0.42, r * 0.22, 2.6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'demon_lord': {
      drawWings(ctx, r * 1.1, flash ? '#ffffff' : '#450a0a');
      ctx.fillStyle = baseColor;
      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawHorns(ctx, r * 1.15, '#1c1917');
      // Blazing greatsword
      ctx.fillStyle = '#fb923c';
      ctx.fillRect(r * 0.2, r * 0.55, r * 1.15, r * 0.22);
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(r * 0.45, -r * 0.22, 3.2, 0, Math.PI * 2);
      ctx.arc(r * 0.45, r * 0.22, 3.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  ctx.restore();

  // Enemy HP bar
  if (e.life < e.maxLife || e.isBoss) {
    const bw = e.radius * 2.2;
    const bh = e.isBoss ? 6 : 3.5;
    const bx = e.x - bw / 2;
    const by = e.y - e.radius - 12;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = e.isBoss ? '#f59e0b' : e.faction === 'demon' ? '#f97316' : '#a855f7';
    ctx.fillRect(bx, by, bw * Math.max(0, e.life / e.maxLife), bh);
  }

  // Ailment pips
  if (e.ailments.length > 0) {
    const types = new Set(e.ailments.map((a) => a.type));
    let ox = e.x - (types.size - 1) * 4;
    for (const t of types) {
      ctx.fillStyle =
        t === 'ignite'
          ? '#f97316'
          : t === 'poison'
            ? '#a855f7'
            : t === 'bleed'
              ? '#ef4444'
              : t === 'chill'
                ? '#67e8f9'
                : '#fde047';
      ctx.beginPath();
      ctx.arc(ox, e.y + e.radius + 7, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ox += 8;
    }
  }
}

function drawPlayerVessel(ctx: CanvasRenderingContext2D, engine: HollowWarEngine): void {
  const { player, vessel, elapsed } = engine;
  const r = player.radius;
  const flash = player.invulnTimer > 0 && Math.floor(elapsed * 20) % 2 === 0;
  const col = flash ? '#ffffff' : vessel.color;

  ctx.save();
  ctx.translate(player.x, player.y);

  // Contact shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.25, r * 1.15, r * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ward ring
  if (player.ward > 0.5) {
    const maxWard = Math.max(1, engine.sheet.get('ward'));
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.38 + 0.52 * (player.ward / maxWard)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r + 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.rotate(player.aimAngle);

  // Class cape / robe base
  ctx.fillStyle = flash ? '#ffffff' : '#1e293b';
  ctx.beginPath();
  ctx.moveTo(r * 0.4, -r * 0.75);
  ctx.lineTo(-r * 1.15, -r * 0.85);
  ctx.lineTo(-r * 0.9, 0);
  ctx.lineTo(-r * 1.15, r * 0.85);
  ctx.lineTo(r * 0.4, r * 0.75);
  ctx.closePath();
  ctx.fill();

  // Torso / Robe
  ctx.fillStyle = col;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (vessel.id === 'magician' || vessel.id === 'pyromancer' || vessel.id === 'necromancer') {
    // Staff + Orb / Skull tip
    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-r * 0.2, r * 0.72);
    ctx.lineTo(r * 1.3, r * 0.72);
    ctx.stroke();
    ctx.fillStyle = vessel.id === 'pyromancer' ? '#fb923c' : vessel.id === 'necromancer' ? '#c084fc' : '#7dd3fc';
    ctx.beginPath();
    ctx.arc(r * 1.32, r * 0.72, 4.2, 0, Math.PI * 2);
    ctx.fill();
    // Pointed Hood
    ctx.fillStyle = flash ? '#ffffff' : '#0f172a';
    ctx.beginPath();
    ctx.arc(r * 0.22, 0, r * 0.46, 0, Math.PI * 2);
    ctx.fill();
  } else if (vessel.id === 'warrior' || vessel.id === 'guardian') {
    // Shield + Sword/Hammer
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(r * 0.25, r * 0.58, r * 1.1, r * 0.22);
    ctx.fillStyle = col;
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(r * 0.35, -r * 0.68, r * 0.42, -Math.PI * 0.6, Math.PI * 0.6);
    ctx.fill();
    ctx.stroke();
    // Helm crest
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(r * 0.18, 0, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Rogue twin daggers + hood
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(r * 0.35, r * 0.52, r * 0.75, r * 0.14);
    ctx.fillRect(r * 0.35, -r * 0.66, r * 0.75, r * 0.14);
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(r * 0.24, 0, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function renderGame(
  ctx: CanvasRenderingContext2D,
  engine: HollowWarEngine,
  width: number,
  height: number,
): void {
  ctx.fillStyle = '#090b10';
  ctx.fillRect(0, 0, width, height);

  const shakeX = engine.screenShake > 0 ? (Math.random() - 0.5) * engine.screenShake : 0;
  const shakeY = engine.screenShake > 0 ? (Math.random() - 0.5) * engine.screenShake : 0;

  ctx.save();
  ctx.translate(width / 2 - engine.player.x + shakeX, height / 2 - engine.player.y + shakeY);

  // Hollow Wake Warfront / Ashen Barrow terrain & doodads
  renderHollowTerrain(ctx, engine.player.x, engine.player.y, width, height, engine.elapsed);

  // Novas
  for (const n of engine.novas) {
    const alpha = Math.max(0, n.life / n.maxLife);
    ctx.save();
    ctx.strokeStyle = n.color;
    ctx.globalAlpha = alpha * 0.85;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = alpha * 0.14;
    ctx.fillStyle = n.color;
    ctx.fill();
    ctx.restore();
  }

  // Cleave Sweeps
  for (const sw of engine.sweeps) {
    const alpha = Math.max(0, sw.life / sw.maxLife);
    ctx.save();
    ctx.translate(sw.x, sw.y);
    ctx.globalAlpha = alpha * 0.8;
    ctx.strokeStyle = sw.color;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(0, 0, sw.radius * 0.85, sw.angle - sw.arcSpread / 2, sw.angle + sw.arcSpread / 2);
    ctx.stroke();
    ctx.globalAlpha = alpha * 0.22;
    ctx.fillStyle = sw.color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, sw.radius, sw.angle - sw.arcSpread / 2, sw.angle + sw.arcSpread / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Pickups (Mortal Essence, Lodestone Magnet, Life/Ward orbs)
  for (const pk of engine.pickups) {
    ctx.save();
    ctx.fillStyle = pk.color;
    ctx.shadowColor = pk.color;
    ctx.shadowBlur = pk.kind === 'magnet' ? 16 : 10;
    ctx.beginPath();
    if (pk.kind === 'essence') {
      ctx.moveTo(pk.x, pk.y - pk.radius);
      ctx.lineTo(pk.x + pk.radius, pk.y);
      ctx.lineTo(pk.x, pk.y + pk.radius);
      ctx.lineTo(pk.x - pk.radius, pk.y);
      ctx.closePath();
    } else if (pk.kind === 'magnet') {
      ctx.arc(pk.x, pk.y, pk.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pk.x, pk.y, pk.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      continue;
    } else {
      ctx.arc(pk.x, pk.y, pk.radius, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  }

  // Traps (Cinder Trap & Frost Trap)
  for (const tr of engine.traps) {
    ctx.save();
    ctx.translate(tr.x, tr.y);
    const isCold = tr.artId === 'frost_trap';
    const pulse = 0.75 + Math.sin(engine.elapsed * 8 + tr.id) * 0.25;
    ctx.strokeStyle = isCold ? `rgba(34, 211, 238, ${0.48 * pulse})` : `rgba(244, 63, 94, ${0.45 * pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, tr.triggerRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = isCold ? '#67e8f9' : '#fb923c';
    ctx.beginPath();
    ctx.arc(0, 0, 5 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Totems (Storm Totem & Searing Bond)
  for (const t of engine.totems) {
    ctx.save();
    ctx.translate(t.x, t.y);
    const isFire = t.artId === 'searing_bond';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 14, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = isFire ? '#ea580c' : '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = isFire ? '#fb923c' : '#7dd3fc';
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Player Minions (Skeletal Vanguards, Bone Golems & Flame Sprites)
  for (const m of engine.minions) {
    ctx.save();
    ctx.translate(m.x, m.y);
    if (m.kind === 'skeleton') {
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.rotate(m.facing);
      drawRibcage(ctx, 11, '#d6d3d1');
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(2, 5, 11, 2.5);
      drawSkull(ctx, 5, 11, '#e7e5e4', '#a855f7');
    } else if (m.kind === 'bone_golem') {
      ctx.strokeStyle = 'rgba(214, 211, 209, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 21, 0, Math.PI * 2);
      ctx.stroke();
      ctx.rotate(m.facing);
      ctx.fillStyle = '#a8a29e';
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawRibcage(ctx, 15, '#e7e5e4');
      drawSkull(ctx, 8, 15, '#f5f5f4', '#fbbf24');
    } else {
      const bob = Math.sin(engine.elapsed * 7 + m.id) * 2.5;
      ctx.fillStyle = 'rgba(249, 115, 22, 0.35)';
      ctx.beginPath();
      ctx.arc(0, bob, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.arc(0, bob, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(0, bob, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Undead & Demon Enemies
  for (const e of engine.enemies) {
    drawEnemyLook(ctx, e, engine.elapsed);
  }

  // Orbiting Hammers of Judgment
  const hammer = engine.arts.find((a) => a.artId === 'hammer_of_judgment');
  if (hammer) {
    const def = ARTS.hammer_of_judgment;
    const extraMods = engine.getArtExtraMods(hammer);
    const count = def.baseProjectiles + Math.max(0, Math.round(engine.sheet.get('projectileCount', def.tags, extraMods)));
    const radius = def.baseRadius * engine.sheet.get('area', def.tags, extraMods);

    for (let i = 0; i < count; i++) {
      const a = engine.player.orbitAngle + (i / count) * Math.PI * 2;
      const bx = engine.player.x + Math.cos(a) * radius;
      const by = engine.player.y + Math.sin(a) * radius;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 12;
      ctx.fillRect(-3, -10, 6, 20);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(-9, -12, 18, 8);
      ctx.restore();
    }
  }

  // Projectiles
  for (const p of engine.projectiles) {
    ctx.save();
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Lightning Arcs
  for (const arc of engine.arcs) {
    ctx.save();
    ctx.strokeStyle = arc.color;
    ctx.shadowColor = arc.color;
    ctx.shadowBlur = 12;
    ctx.globalAlpha = Math.max(0, arc.life / arc.maxLife);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    arc.points.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else {
        const prev = arc.points[idx - 1];
        const mx = (prev.x + pt.x) / 2 + (Math.random() - 0.5) * 16;
        const my = (prev.y + pt.y) / 2 + (Math.random() - 0.5) * 16;
        ctx.lineTo(mx, my);
        ctx.lineTo(pt.x, pt.y);
      }
    });
    ctx.stroke();
    ctx.restore();
  }

  // Particles
  for (const pt of engine.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Player Vessel
  drawPlayerVessel(ctx, engine);

  // Floating Damage Numbers
  ctx.textAlign = 'center';
  for (const ft of engine.floatingTexts) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, ft.life / (ft.maxLife * 0.5));
    ctx.font = `700 ${Math.round(13 * ft.scale)}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }

  ctx.restore();
}
