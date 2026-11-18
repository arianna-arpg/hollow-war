import { SKILLS } from '../content/skills.ts';
import type { HollowWarEngine } from './engine.ts';

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

  // Subtle world grid
  const gridSize = 96;
  const startX = Math.floor((engine.player.x - width / 2) / gridSize) * gridSize;
  const endX = engine.player.x + width / 2 + gridSize;
  const startY = Math.floor((engine.player.y - height / 2) / gridSize) * gridSize;
  const endY = engine.player.y + height / 2 + gridSize;

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = startX; x <= endX; x += gridSize) {
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
  }
  for (let y = startY; y <= endY; y += gridSize) {
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
  }
  ctx.stroke();

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

  // Pickups
  for (const pk of engine.pickups) {
    ctx.save();
    ctx.fillStyle = pk.color;
    ctx.shadowColor = pk.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    if (pk.kind === 'xp') {
      ctx.moveTo(pk.x, pk.y - pk.radius);
      ctx.lineTo(pk.x + pk.radius, pk.y);
      ctx.lineTo(pk.x, pk.y + pk.radius);
      ctx.lineTo(pk.x - pk.radius, pk.y);
      ctx.closePath();
    } else {
      ctx.arc(pk.x, pk.y, pk.radius, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  }

  // Enemies
  for (const e of engine.enemies) {
    ctx.save();
    ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : e.color;
    ctx.strokeStyle = e.archetype === 'boss' ? '#fde047' : '#0f172a';
    ctx.lineWidth = e.archetype === 'boss' ? 3 : 2;

    ctx.beginPath();
    if (e.archetype === 'bulwark' || e.archetype === 'boss') {
      const sides = e.archetype === 'boss' ? 8 : 6;
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * Math.PI * 2;
        const px = e.x + Math.cos(a) * e.radius;
        const py = e.y + Math.sin(a) * e.radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else if (e.archetype === 'stalker') {
      const a = Math.atan2(engine.player.y - e.y, engine.player.x - e.x);
      ctx.moveTo(e.x + Math.cos(a) * e.radius * 1.3, e.y + Math.sin(a) * e.radius * 1.3);
      ctx.lineTo(e.x + Math.cos(a + 2.3) * e.radius, e.y + Math.sin(a + 2.3) * e.radius);
      ctx.lineTo(e.x + Math.cos(a - 2.3) * e.radius, e.y + Math.sin(a - 2.3) * e.radius);
      ctx.closePath();
    } else {
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();

    // Enemy HP bar (only if damaged or boss)
    if (e.life < e.maxLife || e.archetype === 'boss') {
      const bw = e.radius * 2.1;
      const bh = e.archetype === 'boss' ? 6 : 3.5;
      const bx = e.x - bw / 2;
      const by = e.y - e.radius - 10;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = e.archetype === 'boss' ? '#f59e0b' : '#ef4444';
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
        ctx.arc(ox, e.y + e.radius + 6, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ox += 8;
      }
    }
    ctx.restore();
  }

  // Orbiting Void Glaives
  const glaive = engine.skills.find((s) => s.skillId === 'void_glaive');
  if (glaive) {
    const def = SKILLS.void_glaive;
    const extraMods = engine.getSkillExtraMods(glaive);
    const count = def.baseProjectiles + Math.max(0, Math.round(engine.sheet.get('projectileCount', def.tags, extraMods)));
    const radius = def.baseRadius * engine.sheet.get('area', def.tags, extraMods);

    for (let i = 0; i < count; i++) {
      const a = engine.player.orbitAngle + (i / count) * Math.PI * 2;
      const bx = engine.player.x + Math.cos(a) * radius;
      const by = engine.player.y + Math.sin(a) * radius;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillStyle = '#c084fc';
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.lineTo(7, 0);
      ctx.lineTo(0, 13);
      ctx.lineTo(-7, 0);
      ctx.closePath();
      ctx.fill();
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
  ctx.save();
  ctx.translate(engine.player.x, engine.player.y);

  // Ward ring
  if (engine.player.ward > 0.5) {
    const maxWard = Math.max(1, engine.sheet.get('ward'));
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.35 + 0.5 * (engine.player.ward / maxWard)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, engine.player.radius + 7, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.rotate(engine.player.aimAngle);
  ctx.fillStyle = engine.player.invulnTimer > 0 && Math.floor(engine.elapsed * 20) % 2 === 0 ? '#ffffff' : engine.vessel.color;
  ctx.shadowColor = engine.vessel.color;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.moveTo(17, 0);
  ctx.lineTo(-11, 12);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-11, -12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

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
