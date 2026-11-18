import { VESSELS, type VesselDefinition } from './content/vessels';
import { ARTS } from './content/skills';

const vesselChoices = document.querySelector<HTMLElement>('#vessel-choices')!;
const portrait = document.querySelector<HTMLImageElement>('#portrait')!;
const portraitDirectory = new URL('.', portrait.src);
const vesselButtons = new Map<string, HTMLButtonElement>();

function showVessel(vessel: VesselDefinition): void {
  portrait.src = new URL(vessel.id + '.webp', portraitDirectory).href;
  document.querySelector('#vessel-title')!.textContent = vessel.title;
  document.querySelector('#vessel-name')!.textContent = vessel.name;
  document.querySelector('#art-name')!.textContent = ARTS[vessel.startingArtId].name;
  document.querySelector('#ultimate-name')!.textContent = vessel.ultimate.name;
  document.querySelector('#ultimate-description')!.textContent = vessel.ultimate.description;
  for (const [id, button] of vesselButtons) {
    button.setAttribute('aria-pressed', String(id === vessel.id));
  }
}

for (const vessel of VESSELS) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = vessel.name;
  button.addEventListener('click', () => showVessel(vessel));
  vesselChoices.append(button);
  vesselButtons.set(vessel.id, button);
}
showVessel(VESSELS[0]);

const diagram = document.querySelector<HTMLCanvasElement>('#trajectory')!;
const caption = document.querySelector<HTMLElement>('#etch-caption')!;
const captions = [
  'Firebolt sends a single bolt of cinder toward its target.',
  'Split Volley sends three bolts in a spread. Each deals 18% less projectile damage.',
  'Cascade adds two shards on impact and applies a further 22% less projectile damage.',
];

function drawFlight(stage: number): void {
  caption.textContent = captions[stage];
  const pen = diagram.getContext('2d');
  if (!pen) return;
  pen.clearRect(0, 0, diagram.width, diagram.height);
  function stroke(x: number, y: number, endX: number, endY: number, color: string): void {
    if (!pen) return;
    const gradient = pen.createLinearGradient(x, y, endX, endY);
    gradient.addColorStop(0, '#ac785840');
    gradient.addColorStop(1, color);
    pen.strokeStyle = gradient;
    pen.lineWidth = 2;
    pen.beginPath();
    pen.moveTo(x, y);
    pen.lineTo(endX, endY);
    pen.stroke();
    pen.fillStyle = color;
    pen.beginPath();
    pen.arc(endX, endY, 3.5, 0, Math.PI * 2);
    pen.fill();
  }
  const offsets = stage === 0 ? [0] : [-42, 0, 42];
  for (const offset of offsets) {
    const targetY = 75 + offset;
    stroke(56, 75, 338, targetY, '#ffbf75');
    if (stage === 2) {
      stroke(338, targetY, 483, targetY - 17, '#a8d6d7');
      stroke(338, targetY, 483, targetY + 17, '#a8d6d7');
    }
  }
}
for (const radio of document.querySelectorAll<HTMLInputElement>('input[name="etch"]')) {
  radio.addEventListener('change', () => drawFlight(Number(radio.value)));
}
drawFlight(0);
