import { ARTS } from '../content/skills.ts';
import type { HollowWarEngine } from '../game/engine.ts';

let lastHotbarKey = '';

function buildHotbarHtml(engine: HollowWarEngine): string {
  return engine.arts
    .map((ar) => {
      const def = ARTS[ar.artId];
      const preview = engine.getArtPreview(ar);
      const insTooltip =
        ar.inscriptions.length > 0
          ? `<div style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(148,163,184,0.2)">
              ${ar.inscriptions
                .map(
                  (ins) =>
                    `<div style="margin-bottom:4px"><strong style="color:${ins.color}">${ins.name}:</strong> <span style="color:#cbd5e1">${ins.description}</span></div>`,
                )
                .join('')}
            </div>`
          : '';

      return `
        <div class="skill-slot" style="border-color:${def.color}55">
          <div class="skill-slot-header">
            <span style="color:${def.color}">${def.name}</span>
            <span>Rank ${ar.level}</span>
          </div>
          <div style="font-size:11px;color:#94a3b8;margin-top:2px">
            ${Math.round(preview.estimatedDps)} DPS · ${(preview.critChance * 100).toFixed(0)}% Crit
          </div>
          <div class="support-pips">
            ${ar.inscriptions
              .map((ins) => `<span class="support-pip" style="color:${ins.color};border-color:${ins.color}55">${ins.shortName}</span>`)
              .join('')}
          </div>
          <div class="hw-tooltip">
            <div style="font-weight:800;color:${def.color};margin-bottom:3px">${def.name} (Rank ${ar.level})</div>
            <div style="color:#cbd5e1;margin-bottom:6px">${def.description}</div>
            <div class="tag-row" style="margin-bottom:4px">
              ${def.tags.map((t) => `<span class="tag-pill">${t}</span>`).join('')}
            </div>
            <div style="font-size:11px;color:#94a3b8">
              Avg Hit: ${preview.avgHit.toFixed(1)} · ${preview.castsPerSecond.toFixed(2)}/s · Crit ${(preview.critChance * 100).toFixed(0)}% (x${preview.critMulti.toFixed(2)})
            </div>
            ${insTooltip}
          </div>
        </div>
      `;
    })
    .join('');
}

export function renderHud(
  container: HTMLElement,
  engine: HollowWarEngine,
  onToggleInspector: () => void,
  onToggleAutoAim: () => void,
): void {
  if (engine.phase === 'vessel_select' || engine.phase === 'archive') {
    container.innerHTML = '';
    lastHotbarKey = '';
    return;
  }

  const maxLife = engine.sheet.get('life');
  const maxWard = engine.sheet.get('ward');
  const lifePct = Math.max(0, Math.min(100, (engine.player.life / Math.max(1, maxLife)) * 100));
  const wardPct = maxWard > 0 ? Math.max(0, Math.min(100, (engine.player.ward / maxWard) * 100)) : 0;
  const xpPct = Math.max(0, Math.min(100, (engine.player.xp / Math.max(1, engine.player.xpToNext)) * 100));

  const mins = Math.floor(engine.elapsed / 60);
  const secs = Math.floor(engine.elapsed % 60)
    .toString()
    .padStart(2, '0');
  const estDps = Math.round(engine.getTotalEstimatedDps());

  const hotbarKey = `${engine.sheet.revision}|${engine.arts.map((a) => `${a.artId}:${a.level}:${a.inscriptions.map((i) => i.id).join(',')}`).join(';')}`;

  const ult = engine.vessel.ultimate;
  const ultReady = engine.player.ultimateCooldown <= 0;

  const topHtml = `
    <div class="hud-vitals">
      <div class="bar-row">
        <div class="bar-label">
          <span>LIFE</span>
          <span>${Math.ceil(engine.player.life)} / ${Math.round(maxLife)}</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${lifePct}%;background:#ef4444"></div>
        </div>
      </div>
      ${
        maxWard > 0
          ? `<div class="bar-row">
              <div class="bar-label">
                <span>WARD</span>
                <span>${Math.ceil(engine.player.ward)} / ${Math.round(maxWard)}</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill" style="width:${wardPct}%;background:#38bdf8"></div>
              </div>
            </div>`
          : ''
      }
      <div class="bar-row" style="margin-bottom:0">
        <div class="bar-label">
          <span>LVL ${engine.player.level} · ESSENCE</span>
          <span>${Math.floor(engine.player.xp)} / ${engine.player.xpToNext}</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${xpPct}%;background:#f59e0b"></div>
        </div>
      </div>
    </div>

    <div class="hud-center-stats" style="pointer-events:auto">
      <div class="stat-chip">TIME <strong id="hud-time">${mins}:${secs}</strong></div>
      <div class="stat-chip">SLAIN <strong id="hud-kills">${engine.kills}</strong></div>
      <div class="stat-chip">EST. DPS <strong id="hud-dps">${estDps}</strong></div>
      <div class="stat-chip hw-tooltip-wrap" style="cursor:help">
        [SPACE] ${ult.name.toUpperCase()} <strong id="hud-ult-cd" style="color:${ultReady ? '#4ade80' : '#f59e0b'}">${ultReady ? 'READY' : engine.player.ultimateCooldown.toFixed(1) + 's'}</strong>
        <div class="hw-tooltip hw-tooltip-down">
          <div style="font-weight:800;color:${engine.vessel.color};margin-bottom:3px">${ult.name} (${ult.cooldown}s Cooldown)</div>
          <div style="color:#cbd5e1">${ult.description}</div>
        </div>
      </div>
    </div>

    <div class="hud-actions">
      <button class="btn" id="btn-auto-aim">[Q] Aim: ${engine.autoAim ? 'AUTO' : 'MOUSE'}</button>
      <button class="btn btn-primary" id="btn-inspector">[TAB] Build & Arts</button>
    </div>
  `;

  const existingVitals = container.querySelector('.hud-vitals');
  const existingRack = container.querySelector('.skill-rack');

  if (!existingVitals || !existingRack) {
    container.innerHTML = `
      <div class="hud-top">${topHtml}</div>
      <div class="hud-bottom">
        <div class="skill-rack">${buildHotbarHtml(engine)}</div>
      </div>
    `;
    lastHotbarKey = hotbarKey;
    container.querySelector('#btn-inspector')?.addEventListener('click', onToggleInspector);
    container.querySelector('#btn-auto-aim')?.addEventListener('click', onToggleAutoAim);
  } else {
    // Update vitals and text nodes in-place so hover tooltips on Ultimate and Hotbar never flicker
    const vitalsTmp = document.createElement('div');
    vitalsTmp.innerHTML = topHtml;
    const nextVitals = vitalsTmp.querySelector('.hud-vitals');
    if (nextVitals) existingVitals.innerHTML = nextVitals.innerHTML;

    const tEl = container.querySelector('#hud-time');
    const kEl = container.querySelector('#hud-kills');
    const dEl = container.querySelector('#hud-dps');
    const uEl = container.querySelector<HTMLElement>('#hud-ult-cd');
    const aimBtn = container.querySelector('#btn-auto-aim');
    if (tEl) tEl.textContent = `${mins}:${secs}`;
    if (kEl) kEl.textContent = String(engine.kills);
    if (dEl) dEl.textContent = String(estDps);
    if (uEl) {
      uEl.textContent = ultReady ? 'READY' : `${engine.player.ultimateCooldown.toFixed(1)}s`;
      uEl.style.color = ultReady ? '#4ade80' : '#f59e0b';
    }
    if (aimBtn) aimBtn.textContent = `[Q] Aim: ${engine.autoAim ? 'AUTO' : 'MOUSE'}`;

    if (hotbarKey !== lastHotbarKey) {
      existingRack.innerHTML = buildHotbarHtml(engine);
      lastHotbarKey = hotbarKey;
    }
  }
}
