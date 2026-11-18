import './styles/main.css';
import { HollowWarEngine } from './game/engine.ts';
import { renderGame } from './game/renderer.ts';
import { renderHud } from './ui/hud.ts';
import { renderModal } from './ui/modals.ts';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const hudEl = document.getElementById('hud-overlay')!;
const modalEl = document.getElementById('modal-overlay')!;

const engine = new HollowWarEngine();

function resize(): void {
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  engine.setViewport(w, h);
}

window.addEventListener('resize', resize);
resize();

function toggleInspector(): void {
  if (engine.phase === 'playing') {
    engine.setPhase('paused');
  } else if (engine.phase === 'paused') {
    engine.setPhase('playing');
  }
}

function toggleAutoAim(): void {
  engine.autoAim = !engine.autoAim;
  syncUi();
}

function syncUi(): void {
  renderModal(modalEl, engine, { onCloseInspector: toggleInspector });
  renderHud(hudEl, engine, toggleInspector, toggleAutoAim);
}

engine.onPhaseChange = () => syncUi();
syncUi();

// Input bindings
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'w' || k === 'arrowup') engine.input.up = true;
  if (k === 's' || k === 'arrowdown') engine.input.down = true;
  if (k === 'a' || k === 'arrowleft') engine.input.left = true;
  if (k === 'd' || k === 'arrowright') engine.input.right = true;
  if (k === ' ' || k === 'shift') {
    if (engine.phase === 'playing') {
      e.preventDefault();
      engine.triggerUltimate();
    }
  }
  if (k === 'q' && engine.phase === 'playing') {
    toggleAutoAim();
  }
  if (k === 'tab' || k === 'escape' || k === 'p') {
    if (engine.phase === 'playing' || engine.phase === 'paused') {
      e.preventDefault();
      toggleInspector();
    }
  }
});

window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'w' || k === 'arrowup') engine.input.up = false;
  if (k === 's' || k === 'arrowdown') engine.input.down = false;
  if (k === 'a' || k === 'arrowleft') engine.input.left = false;
  if (k === 'd' || k === 'arrowright') engine.input.right = false;
});

window.addEventListener('mousemove', (e) => {
  engine.input.mouseX = e.clientX;
  engine.input.mouseY = e.clientY;
});

let lastTime = performance.now();
let hudTimer = 0;

function loop(now: number): void {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  engine.update(dt);
  renderGame(ctx, engine, window.innerWidth, window.innerHeight);

  hudTimer += dt;
  if (hudTimer >= 0.1 && engine.phase === 'playing') {
    hudTimer = 0;
    renderHud(hudEl, engine, toggleInspector, toggleAutoAim);
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
