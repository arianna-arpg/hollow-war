function hash2d(ix: number, iy: number): number {
  let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263);
  n = (n ^ (n >>> 13)) >>> 0;
  n = Math.imul(n, 1274126177) >>> 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

const TILE = 160;

/**
 * Renders Hollow Wake-inspired Warfront & Ashen Barrow terrain:
 * weathered flagstones, scorched fissures, rune circles, gravestones,
 * broken stone pillars, bone piles, and flickering iron braziers.
 */
export function renderHollowTerrain(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  viewW: number,
  viewH: number,
  elapsed: number,
): void {
  const minTx = Math.floor((camX - viewW / 2 - TILE) / TILE);
  const maxTx = Math.floor((camX + viewW / 2 + TILE) / TILE);
  const minTy = Math.floor((camY - viewH / 2 - TILE) / TILE);
  const maxTy = Math.floor((camY + viewH / 2 + TILE) / TILE);

  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      const wx = tx * TILE;
      const wy = ty * TILE;
      const h1 = hash2d(tx, ty);
      const h2 = hash2d(tx + 71, ty - 37);
      const h3 = hash2d(tx - 19, ty + 113);

      // Base weathered stone tile variation
      const shade = Math.floor(11 + h1 * 8);
      ctx.fillStyle = `rgb(${shade}, ${shade + 2}, ${shade + 7})`;
      ctx.fillRect(wx, wy, TILE, TILE);

      // Subtle flagstone mortar lines
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.045)';
      ctx.lineWidth = 1;
      ctx.strokeRect(wx + 0.5, wy + 0.5, TILE - 1, TILE - 1);
      if (h2 > 0.5) {
        ctx.beginPath();
        ctx.moveTo(wx + TILE * 0.5, wy);
        ctx.lineTo(wx + TILE * 0.5, wy + TILE);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(wx, wy + TILE * 0.5);
        ctx.lineTo(wx + TILE, wy + TILE * 0.5);
        ctx.stroke();
      }

      // Mossy / ash ground wash
      if (h1 > 0.68) {
        ctx.fillStyle = h2 > 0.5 ? 'rgba(63, 78, 66, 0.14)' : 'rgba(92, 42, 32, 0.12)';
        ctx.beginPath();
        ctx.ellipse(wx + TILE * h2, wy + TILE * h3, 28 + h1 * 24, 18 + h2 * 16, h1 * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }

      // Doodads (sparse, atmospheric, non-blocking)
      const dx = wx + 32 + h2 * (TILE - 64);
      const dy = wy + 32 + h3 * (TILE - 64);

      if (h1 < 0.08) {
        // Ancient Rune Ring
        ctx.save();
        ctx.translate(dx, dy);
        ctx.strokeStyle = 'rgba(122, 154, 255, 0.18)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 17, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (h1 >= 0.08 && h1 < 0.16) {
        // Broken Stone Pillar
        ctx.save();
        ctx.translate(dx, dy);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(4, 5, 15, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#272c38';
        ctx.strokeStyle = '#3f4656';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#1b1f29';
        ctx.beginPath();
        ctx.arc(-2, -2, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (h1 >= 0.16 && h1 < 0.24) {
        // Weathered Gravestone
        ctx.save();
        ctx.translate(dx, dy);
        ctx.rotate((h2 - 0.5) * 0.4);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
        ctx.fillRect(-7, -2, 16, 10);
        ctx.fillStyle = '#333946';
        ctx.strokeStyle = '#4b5563';
        ctx.lineWidth = 1;
        ctx.fillRect(-8, -6, 16, 11);
        ctx.strokeRect(-8, -6, 16, 11);
        ctx.restore();
      } else if (h1 >= 0.24 && h1 < 0.31) {
        // Scattered Bones
        ctx.save();
        ctx.translate(dx, dy);
        ctx.strokeStyle = 'rgba(201, 191, 168, 0.28)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-7, -3);
        ctx.lineTo(7, 4);
        ctx.moveTo(-4, 5);
        ctx.lineTo(5, -5);
        ctx.stroke();
        ctx.restore();
      } else if (h1 >= 0.94) {
        // Iron Brazier with flickering ember glow
        const flicker = 0.75 + Math.sin(elapsed * 8 + tx * 3 + ty) * 0.25;
        ctx.save();
        ctx.translate(dx, dy);
        const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 44 * flicker);
        grad.addColorStop(0, 'rgba(249, 115, 22, 0.24)');
        grad.addColorStop(1, 'rgba(249, 115, 22, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 44 * flicker, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2c221e';
        ctx.strokeStyle = '#57463c';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fb923c';
        ctx.beginPath();
        ctx.arc(0, 0, 3.5 * flicker, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }
}
