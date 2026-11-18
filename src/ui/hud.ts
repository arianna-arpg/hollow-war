import { SKILLS } from '../content/skills.ts';
import type { HollowWarEngine } from '../game/engine.ts';

export function renderHud(
  container: HTMLElement,
  engine: HollowWarEngine,
  onToggleInspector: () => void,
  onToggleAutoAim: () => void,
): void {
  if (engine.phase === 'vessel_select') {
    container.innerHTML = '';
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

  container.innerHTML = `
    <div class="hud-top">
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
            <span>LVL ${engine.player.level}</span>
            <span>${Math.floor(engine.player.xp)} / ${engine.player.xpToNext} XP</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${xpPct}%;background:#f59e0b"></div>
          </div>
        </div>
      </div>

      <div class="hud-center-stats">
        <div class="stat-chip">TIME <strong>${mins}:${secs}</strong></div>
        <div class="stat-chip">KILLS <strong>${engine.kills}</strong></div>
        <div class="stat-chip">EST. DPS <strong>${estDps}</strong></div>
        <div class="stat-chip">DASH <strong>${engine.player.dashCooldown <= 0 ? 'READY' : engine.player.dashCooldown.toFixed(1) + 's'}</strong></div>
      </div>

      <div class="hud-actions">
        <button class="btn" id="btn-auto-aim">[Q] Aim: ${engine.autoAim ? 'AUTO' : 'MOUSE'}</button>
        <button class="btn btn-primary" id="btn-inspector">[TAB] Build & Stats</button>
      </div>
    </div>

    <div class="hud-bottom">
      <div class="skill-rack">
        ${engine.skills
          .map((sk) => {
            const def = SKILLS[sk.skillId];
            const preview = engine.getSkillPreview(sk);
            return `
              <div class="skill-slot" style="border-color:${def.color}55">
                <div class="skill-slot-header">
                  <span style="color:${def.color}">${def.name}</span>
                  <span>Lv.${sk.level}</span>
                </div>
                <div style="font-size:11px;color:#94a3b8;margin-top:2px">
                  ${Math.round(preview.estimatedDps)} DPS · ${(preview.critChance * 100).toFixed(0)}% Crit
                </div>
                <div class="support-pips">
                  ${sk.supports
                    .map((s) => `<span class="support-pip" style="color:${s.color};border-color:${s.color}55">${s.name.replace(' Support', '')}</span>`)
                    .join('')}
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    </div>
  `;

  container.querySelector('#btn-inspector')?.addEventListener('click', onToggleInspector);
  container.querySelector('#btn-auto-aim')?.addEventListener('click', onToggleAutoAim);
}
