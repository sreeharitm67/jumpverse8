import type {
  CollectibleDef,
  EnemyDef,
  EnemyKind,
  HazardDef,
  HazardKind,
  LevelData,
  PlatformDef,
  PlatformKind,
  PowerUpDef,
  PowerUpKind,
} from '../types';

export const GROUND_Y = 540;
export const WORLD_H = 660;

let uidCounter = 0;
function uid(prefix: string): string {
  uidCounter += 1;
  return `${prefix}_${uidCounter}`;
}

export function resetBuilderIds(): void {
  uidCounter = 0;
}

export function plat(
  x: number,
  y: number,
  w: number,
  h = 28,
  kind: PlatformKind = 'solid',
  extra: Partial<PlatformDef> = {}
): PlatformDef {
  return { id: uid('p'), x, y, w, h, kind, ...extra };
}

export function groundSeg(
  x: number,
  w: number,
  y = GROUND_Y,
  kind: PlatformKind = 'solid'
): PlatformDef {
  return plat(x, y, w, WORLD_H - y + 480, kind);
}

export function coinRow(x: number, y: number, count: number, spacing = 38, inSecret = false): CollectibleDef[] {
  const list: CollectibleDef[] = [];
  for (let i = 0; i < count; i++) {
    list.push({ id: uid('c'), kind: 'coin', x: x + i * spacing, y, inSecret });
  }
  return list;
}

export function coinArc(cx: number, peakY: number, spanW: number, count: number): CollectibleDef[] {
  const list: CollectibleDef[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const x = cx - spanW / 2 + t * spanW;
    const parabola = 1 - Math.pow(2 * t - 1, 2);
    const y = peakY + (1 - parabola) * 44;
    list.push({ id: uid('c'), kind: 'coin', x, y });
  }
  return list;
}

export function gem(x: number, y: number, inSecret = false): CollectibleDef {
  return { id: uid('g'), kind: 'gem', x, y, inSecret };
}

export function starCol(x: number, y: number, inSecret = false): CollectibleDef {
  return { id: uid('s'), kind: 'star', x, y, inSecret };
}

export function keyCol(x: number, y: number): CollectibleDef {
  return { id: uid('k'), kind: 'key', x, y };
}

export function chest(x: number, y: number, requiresKey = false, inSecret = false): CollectibleDef {
  return { id: uid('ch'), kind: 'chest', x, y, requiresKey, inSecret };
}

export function powerUp(kind: PowerUpKind, x: number, y: number): PowerUpDef {
  return { id: uid('pu'), kind, x, y };
}

export function enemy(
  kind: EnemyKind,
  x: number,
  y: number,
  patrolMinX: number,
  patrolMaxX: number,
  hp = 1
): EnemyDef {
  return { id: uid('e'), kind, x, y, patrolMinX, patrolMaxX, hp };
}

export function hazard(kind: HazardKind, x: number, y: number, w: number, h = 24): HazardDef {
  return { id: uid('h'), kind, x, y, w, h };
}

export function checkpoint(x: number, y: number): { id: string; x: number; y: number } {
  return { id: uid('cp'), x, y };
}

export function makeLevel(partial: LevelData): LevelData {
  return partial;
}
