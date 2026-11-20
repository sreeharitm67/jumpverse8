import type { GraphicsQuality, Particle, WorldTheme } from '../types';

const POOL_SIZE = 280;

export class ParticleSystem {
  private pool: Particle[] = [];
  private cursor = 0;
  private ambientTimer = 0;

  constructor() {
    for (let i = 0; i < POOL_SIZE; i++) {
      this.pool.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 4,
        color: '#fff',
        alpha: 1,
        life: 0,
        maxLife: 1,
        gravity: 0,
      });
    }
  }

  public clear(): void {
    for (let i = 0; i < POOL_SIZE; i++) {
      this.pool[i].active = false;
    }
  }

  public spawn(
    x: number,
    y: number,
    vx: number,
    vy: number,
    size: number,
    color: string,
    maxLife: number,
    gravity = 0
  ): void {
    const p = this.pool[this.cursor];
    this.cursor = (this.cursor + 1) % POOL_SIZE;
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.size = size;
    p.color = color;
    p.alpha = 1;
    p.life = maxLife;
    p.maxLife = maxLife;
    p.gravity = gravity;
  }

  public emitBurst(
    x: number,
    y: number,
    count: number,
    colors: string[],
    speed = 140,
    size = 5,
    life = 0.45,
    gravity = 320
  ): void {
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const spd = speed * (0.45 + Math.random() * 0.75);
      this.spawn(
        x,
        y,
        Math.cos(ang) * spd,
        Math.sin(ang) * spd - 35,
        size * (0.7 + Math.random() * 0.6),
        colors[i % colors.length],
        life * (0.75 + Math.random() * 0.5),
        gravity
      );
    }
  }

  public emitDust(x: number, y: number, count = 5, color = '#E2E8F0'): void {
    for (let i = 0; i < count; i++) {
      this.spawn(
        x + (Math.random() - 0.5) * 18,
        y,
        (Math.random() - 0.5) * 95,
        -25 - Math.random() * 55,
        3 + Math.random() * 3.5,
        color,
        0.28 + Math.random() * 0.16,
        60
      );
    }
  }

  public emitAmbient(theme: WorldTheme, camX: number, camY: number, viewW: number, viewH: number, quality: GraphicsQuality, dt: number): void {
    if (quality === 'low') return;
    const rate = quality === 'high' ? 0.08 : 0.18;
    this.ambientTimer += dt;
    if (this.ambientTimer < rate) return;
    this.ambientTimer = 0;

    const rx = camX + Math.random() * viewW;
    if (theme === 'meadows') {
      this.spawn(rx, camY - 10, -18 - Math.random() * 20, 34 + Math.random() * 20, 4, '#86EFAC', 4.5, 0);
    } else if (theme === 'desert') {
      this.spawn(camX + viewW + 10, camY + Math.random() * viewH, -150 - Math.random() * 80, 10, 2.5, '#FDE68A', 2.4, 0);
    } else if (theme === 'frozen') {
      this.spawn(rx, camY - 10, -24 + Math.random() * 14, 52 + Math.random() * 34, 3.2, '#E0F2FE', 5.0, 0);
    } else if (theme === 'volcanic') {
      this.spawn(rx, camY + viewH + 10, (Math.random() - 0.5) * 28, -55 - Math.random() * 45, 3, '#FB923C', 3.4, -10);
    } else {
      this.spawn(rx, camY + Math.random() * viewH, -36, -8, 3.2, '#E9D5FF', 3.6, 0);
    }
  }

  public update(dt: number): void {
    for (let i = 0; i < POOL_SIZE; i++) {
      const p = this.pool[i];
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
    }
  }

  public render(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    for (let i = 0; i < POOL_SIZE; i++) {
      const p = this.pool[i];
      if (!p.active) continue;
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x - camX, p.y - camY, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
