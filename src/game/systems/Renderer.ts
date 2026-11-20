import { WORLDS } from '../config';
import type {
  BossRuntime,
  CheckpointRuntime,
  CollectibleRuntime,
  EnemyRuntime,
  GraphicsQuality,
  HazardDef,
  LevelData,
  PlatformRuntime,
  PlayerState,
  PowerUpRuntime,
  ProjectileRuntime,
  WorldTheme,
} from '../types';
import type { ParticleSystem } from './ParticleSystem';

export interface RenderContextData {
  level: LevelData;
  player: PlayerState;
  platforms: PlatformRuntime[];
  enemies: EnemyRuntime[];
  boss: BossRuntime | null;
  projectiles: ProjectileRuntime[];
  collectibles: CollectibleRuntime[];
  powerUps: PowerUpRuntime[];
  checkpoints: CheckpointRuntime[];
  hazards: HazardDef[];
  particles: ParticleSystem;
  camX: number;
  camY: number;
  viewW: number;
  viewH: number;
  time: number;
  quality: GraphicsQuality;
  visualEffects: boolean;
}

export class Renderer {
  private skyGradCache: { key: string; grad: CanvasGradient } | null = null;

  public renderBackgroundOnly(
    ctx: CanvasRenderingContext2D,
    theme: WorldTheme,
    camX: number,
    viewW: number,
    viewH: number,
    time: number,
    quality: GraphicsQuality
  ): void {
    this.drawParallaxBackdrop(ctx, theme, camX, 0, viewW, viewH, time, quality);
  }

  public render(ctx: CanvasRenderingContext2D, data: RenderContextData): void {
    const { level, camX, camY, viewW, viewH, time, quality } = data;
    ctx.clearRect(0, 0, viewW, viewH);

    // 1. Multi-layer parallax backdrop
    this.drawParallaxBackdrop(ctx, level.theme, camX, camY, viewW, viewH, time, quality);

    // 2. Hazards behind/on ground (water/lava pools)
    this.drawHazards(ctx, data.hazards, camX, camY, viewW, time);

    // 3. Platforms
    this.drawPlatforms(ctx, data.platforms, level.theme, camX, camY, viewW, time);

    // 4. Checkpoints & Finish Portal
    this.drawCheckpoints(ctx, data.checkpoints, camX, camY, time);
    this.drawExitPortal(ctx, level.exit.x, level.exit.y, level.theme, camX, camY, time, Boolean(data.boss && !data.boss.defeated));

    // 5. Collectibles & Power-Ups
    this.drawCollectibles(ctx, data.collectibles, camX, camY, time);
    this.drawPowerUps(ctx, data.powerUps, camX, camY, time);

    // 6. Enemies & Boss
    this.drawEnemies(ctx, data.enemies, camX, camY, time);
    if (data.boss) {
      this.drawBoss(ctx, data.boss, camX, camY, time);
    }

    // 7. Player Hero
    this.drawPlayer(ctx, data.player, camX, camY, time);

    // 8. Projectiles
    this.drawProjectiles(ctx, data.projectiles, camX, camY, time);

    // 9. Particles
    if (data.visualEffects) {
      data.particles.render(ctx, camX, camY);
    }
  }

  private drawParallaxBackdrop(
    ctx: CanvasRenderingContext2D,
    theme: WorldTheme,
    camX: number,
    _camY: number,
    viewW: number,
    viewH: number,
    time: number,
    quality: GraphicsQuality
  ): void {
    const world = WORLDS.find((w) => w.theme === theme) ?? WORLDS[0];
    const gradKey = `${theme}:${viewH}`;
    if (!this.skyGradCache || this.skyGradCache.key !== gradKey) {
      const g = ctx.createLinearGradient(0, 0, 0, viewH);
      g.addColorStop(0, world.skyTop);
      g.addColorStop(1, world.skyBottom);
      this.skyGradCache = { key: gradKey, grad: g };
    }
    ctx.fillStyle = this.skyGradCache.grad;
    ctx.fillRect(0, 0, viewW, viewH);

    // Sun / Moon / Celestial orb
    ctx.save();
    if (theme === 'meadows' || theme === 'desert') {
      const sunX = viewW * 0.8 - (camX * 0.03) % 240;
      const sunY = viewH * 0.18;
      ctx.fillStyle = theme === 'desert' ? 'rgba(254, 240, 138, 0.35)' : 'rgba(255, 255, 255, 0.28)';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 54, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = theme === 'desert' ? '#FEF08A' : '#FFFBEB';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 34, 0, Math.PI * 2);
      ctx.fill();
    } else if (theme === 'frozen') {
      // Aurora ribbons
      if (quality !== 'low') {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
        ctx.beginPath();
        ctx.moveTo(0, viewH * 0.22);
        for (let x = 0; x <= viewW; x += 60) {
          ctx.lineTo(x, viewH * 0.2 + Math.sin(x * 0.01 + time * 0.8) * 26);
        }
        ctx.lineTo(viewW, 0);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
      }
    } else if (theme === 'sky') {
      const moonX = viewW * 0.76;
      const moonY = viewH * 0.2;
      ctx.fillStyle = 'rgba(244, 114, 182, 0.26)';
      ctx.beginPath();
      ctx.arc(moonX, moonY, 64, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FDE68A';
      ctx.beginPath();
      ctx.arc(moonX, moonY, 36, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Drifting clouds (except volcanic)
    if (theme !== 'volcanic' && quality !== 'low') {
      ctx.fillStyle =
        theme === 'sky'
          ? 'rgba(255,241,242,0.55)'
          : theme === 'desert'
            ? 'rgba(254,243,199,0.45)'
            : 'rgba(255,255,255,0.72)';
      for (let i = 0; i < 6; i++) {
        const cx = ((i * 290 - camX * 0.12 - time * (12 + i * 2)) % (viewW + 240) + viewW + 240) % (viewW + 240) - 120;
        const cy = 58 + (i % 3) * 44;
        ctx.beginPath();
        ctx.arc(cx, cy, 24, 0, Math.PI * 2);
        ctx.arc(cx + 22, cy - 8, 28, 0, Math.PI * 2);
        ctx.arc(cx + 46, cy, 22, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Distant silhouette ridge layer (parallax 0.18)
    const ridgeColors: Record<WorldTheme, string> = {
      meadows: '#4ADE80',
      desert: '#D97706',
      frozen: '#1E3A8A',
      volcanic: '#271216',
      sky: '#4C1D95',
    };
    ctx.fillStyle = ridgeColors[theme];
    ctx.beginPath();
    ctx.moveTo(0, viewH);
    const step = 180;
    const offset1 = (camX * 0.18) % step;
    for (let x = -step; x <= viewW + step; x += step) {
      const idx = Math.floor((x + camX * 0.18) / step);
      const peakH = theme === 'desert' ? 110 + ((idx * 53) % 70) : 140 + ((idx * 79) % 110);
      ctx.lineTo(x - offset1 + step * 0.5, viewH - peakH);
      ctx.lineTo(x - offset1 + step, viewH - 55);
    }
    ctx.lineTo(viewW, viewH);
    ctx.closePath();
    ctx.fill();

    // Mid-ground layer (parallax 0.36)
    const midColors: Record<WorldTheme, string> = {
      meadows: '#16A34A',
      desert: '#B45309',
      frozen: '#1E40AF',
      volcanic: '#3F1D20',
      sky: '#312E81',
    };
    ctx.fillStyle = midColors[theme];
    ctx.beginPath();
    ctx.moveTo(0, viewH);
    const step2 = 140;
    const offset2 = (camX * 0.36) % step2;
    for (let x = -step2; x <= viewW + step2; x += step2) {
      const idx = Math.floor((x + camX * 0.36) / step2);
      const h = 72 + ((idx * 47) % 65);
      ctx.lineTo(x - offset2 + step2 * 0.5, viewH - h);
      ctx.lineTo(x - offset2 + step2, viewH - 30);
    }
    ctx.lineTo(viewW, viewH);
    ctx.closePath();
    ctx.fill();

    // Ambient distant birds / castle towers / crystals on high quality
    if (quality === 'high') {
      if (theme === 'meadows') {
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
        ctx.lineWidth = 2;
        for (let b = 0; b < 4; b++) {
          const bx = ((b * 340 + time * 42 - camX * 0.25) % (viewW + 120) + viewW + 120) % (viewW + 120) - 60;
          const by = 95 + b * 24 + Math.sin(time * 3 + b) * 6;
          const flap = Math.sin(time * 9 + b) * 5;
          ctx.beginPath();
          ctx.moveTo(bx - 8, by - flap);
          ctx.quadraticCurveTo(bx - 3, by - 5, bx, by);
          ctx.quadraticCurveTo(bx + 3, by - 5, bx + 8, by - flap);
          ctx.stroke();
        }
      } else if (theme === 'volcanic') {
        // Subtle glowing magma cracks in background
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        for (let i = 0; i < 4; i++) {
          const lx = ((i * 360 - camX * 0.25) % (viewW + 200) + viewW + 200) % (viewW + 200) - 80;
          ctx.fillRect(lx, viewH - 120, 8, 120);
        }
      }
    }
  }

  private drawPlatforms(
    ctx: CanvasRenderingContext2D,
    platforms: PlatformRuntime[],
    theme: WorldTheme,
    camX: number,
    camY: number,
    viewW: number,
    time: number
  ): void {
    const world = WORLDS.find((w) => w.theme === theme) ?? WORLDS[0];

    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (p.broken) continue;
      if (p.x + p.w < camX - 40 || p.x > camX + viewW + 40) continue;

      let sx = p.x - camX;
      const sy = p.y - camY;
      if (p.kind === 'falling' && p.fallTriggered) {
        sx += Math.sin(time * 48) * 3;
      }

      ctx.save();
      if (p.kind === 'bridge') {
        // Wooden bridge planks
        ctx.fillStyle = '#78350F';
        ctx.fillRect(sx, sy + 6, p.w, 8);
        const plankW = 24;
        for (let px = 0; px < p.w; px += plankW) {
          ctx.fillStyle = px % 48 === 0 ? '#B45309' : '#92400E';
          ctx.fillRect(sx + px + 1, sy, Math.min(plankW - 2, p.w - px - 1), 12);
        }
        ctx.restore();
        continue;
      }

      if (p.kind === 'bounce') {
        // Spring / Mushroom bounce pad
        ctx.fillStyle = '#334155';
        ctx.fillRect(sx + 8, sy + 10, p.w - 16, p.h - 10);
        ctx.fillStyle = '#EC4899';
        ctx.beginPath();
        ctx.roundRect(sx, sy, p.w, 13, 6);
        ctx.fill();
        ctx.fillStyle = '#FBCFE8';
        ctx.fillRect(sx + 10, sy + 2, p.w - 20, 4);
        ctx.restore();
        continue;
      }

      if (p.kind === 'oneway') {
        ctx.fillStyle = theme === 'sky' ? '#E0E7FF' : theme === 'frozen' ? '#7DD3FC' : '#D97706';
        ctx.beginPath();
        ctx.roundRect(sx, sy, p.w, 14, 6);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(sx + 6, sy + 2, p.w - 12, 4);
        ctx.restore();
        continue;
      }

      if (p.kind === 'moving') {
        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        ctx.roundRect(sx, sy, p.w, p.h, 7);
        ctx.fill();
        ctx.fillStyle = world.accentHex;
        ctx.fillRect(sx + 4, sy + 2, p.w - 8, 5);
        // Thruster dots
        ctx.fillStyle = '#F8FAFC';
        ctx.beginPath();
        ctx.arc(sx + 12, sy + p.h * 0.55, 3, 0, Math.PI * 2);
        ctx.arc(sx + p.w - 12, sy + p.h * 0.55, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }

      if (p.kind === 'falling') {
        ctx.fillStyle = p.fallTriggered ? '#EF4444' : '#64748B';
        ctx.beginPath();
        ctx.roundRect(sx, sy, p.w, p.h, 5);
        ctx.fill();
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx + p.w * 0.35, sy);
        ctx.lineTo(sx + p.w * 0.42, sy + p.h);
        ctx.moveTo(sx + p.w * 0.7, sy);
        ctx.lineTo(sx + p.w * 0.65, sy + p.h);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      // Solid or Ice ground block
      const isIce = p.kind === 'ice';
      ctx.fillStyle = isIce ? '#0284C7' : world.groundColor;
      ctx.beginPath();
      ctx.roundRect(sx, sy, p.w, p.h, 5);
      ctx.fill();

      // Top cap (grass, sand, ice, basalt, sky marble)
      ctx.fillStyle = isIce ? '#E0F2FE' : world.grassColor;
      ctx.beginPath();
      ctx.roundRect(sx, sy, p.w, Math.min(12, p.h), [5, 5, 2, 2]);
      ctx.fill();

      // Subtle texture pebbles/shine
      ctx.fillStyle = isIce ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.16)';
      for (let bx = 18; bx < p.w - 18; bx += 46) {
        ctx.fillRect(sx + bx, sy + 18, 12, 5);
      }
      ctx.restore();
    }
  }

  private drawHazards(
    ctx: CanvasRenderingContext2D,
    hazards: HazardDef[],
    camX: number,
    camY: number,
    viewW: number,
    time: number
  ): void {
    for (let i = 0; i < hazards.length; i++) {
      const h = hazards[i];
      if (h.x + h.w < camX - 30 || h.x > camX + viewW + 30) continue;
      const sx = h.x - camX;
      const sy = h.y - camY;

      if (h.kind === 'spikes') {
        const count = Math.max(2, Math.floor(h.w / 16));
        const sw = h.w / count;
        ctx.fillStyle = '#CBD5E1';
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 1.5;
        for (let s = 0; s < count; s++) {
          ctx.beginPath();
          ctx.moveTo(sx + s * sw, sy + h.h);
          ctx.lineTo(sx + s * sw + sw * 0.5, sy);
          ctx.lineTo(sx + (s + 1) * sw, sy + h.h);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      } else if (h.kind === 'lava') {
        const drawH = Math.max(h.h, 480);
        const grad = ctx.createLinearGradient(0, sy, 0, sy + drawH);
        grad.addColorStop(0, '#FB923C');
        grad.addColorStop(0.25, '#EF4444');
        grad.addColorStop(1, '#7F1D1D');
        ctx.fillStyle = grad;
        ctx.fillRect(sx, sy + Math.sin(time * 4 + i) * 2, h.w, drawH);
        ctx.fillStyle = '#FDE047';
        for (let bx = 12; bx < h.w - 12; bx += 38) {
          const by = sy + 6 + Math.sin(time * 5 + bx) * 3;
          ctx.beginPath();
          ctx.arc(sx + bx, by, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (h.kind === 'water') {
        const drawH = Math.max(h.h, 480);
        ctx.fillStyle = 'rgba(14, 165, 233, 0.78)';
        ctx.fillRect(sx, sy + Math.sin(time * 3.5 + i) * 2, h.w, drawH);
        ctx.fillStyle = 'rgba(186, 230, 253, 0.72)';
        ctx.fillRect(sx, sy, h.w, 6);
      }
    }
  }

  private drawCheckpoints(
    ctx: CanvasRenderingContext2D,
    checkpoints: CheckpointRuntime[],
    camX: number,
    camY: number,
    time: number
  ): void {
    for (let i = 0; i < checkpoints.length; i++) {
      const cp = checkpoints[i];
      const sx = cp.x - camX;
      const sy = cp.y - camY;
      // Pole
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(sx - 3, sy - 58, 6, 58);
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.arc(sx, sy - 60, 5, 0, Math.PI * 2);
      ctx.fill();

      // Flag
      const flagY = sy - 24 - cp.flagRise * 32;
      const wave = Math.sin(time * 6) * 3;
      ctx.fillStyle = cp.activated ? '#22C55E' : '#64748B';
      ctx.beginPath();
      ctx.moveTo(sx + 3, flagY);
      ctx.lineTo(sx + 34, flagY + 8 + wave);
      ctx.lineTo(sx + 3, flagY + 18);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawExitPortal(
    ctx: CanvasRenderingContext2D,
    ex: number,
    ey: number,
    theme: WorldTheme,
    camX: number,
    camY: number,
    time: number,
    lockedByBoss: boolean
  ): void {
    const sx = ex - camX;
    const sy = ey - camY - 46;
    const world = WORLDS.find((w) => w.theme === theme) ?? WORLDS[0];

    ctx.save();
    // Arch base
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.roundRect(sx - 28, sy - 38, 56, 84, [28, 28, 4, 4]);
    ctx.fill();

    // Inner swirl
    ctx.fillStyle = lockedByBoss ? '#475569' : world.accentHex;
    ctx.beginPath();
    ctx.ellipse(sx, sy + 4, 19, 31, 0, 0, Math.PI * 2);
    ctx.fill();

    if (!lockedByBoss) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(sx, sy + 4, 12 + Math.sin(time * 5) * 3, time * 2, time * 2 + Math.PI * 1.4);
      ctx.stroke();
    } else {
      // Lock icon when boss still alive
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(sx - 7, sy + 2, 14, 11);
      ctx.strokeStyle = '#F8FAFC';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(sx, sy + 1, 5, Math.PI, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawCollectibles(
    ctx: CanvasRenderingContext2D,
    items: CollectibleRuntime[],
    camX: number,
    camY: number,
    time: number
  ): void {
    for (let i = 0; i < items.length; i++) {
      const c = items[i];
      if (c.collected) continue;
      const sx = c.x - camX;
      const sy = c.y - camY + Math.sin(time * 4 + c.bobPhase) * 4;

      if (c.kind === 'coin') {
        const spinW = Math.max(0.28, Math.abs(Math.cos(time * 4.5 + c.bobPhase)));
        ctx.save();
        ctx.translate(sx, sy);
        ctx.scale(spinW, 1);
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FDE047';
        ctx.beginPath();
        ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#D97706';
        ctx.fillRect(-2, -5, 4, 10);
        ctx.restore();
      } else if (c.kind === 'gem') {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.fillStyle = '#0284C7';
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(12, -3);
        ctx.lineTo(8, 12);
        ctx.lineTo(-8, 12);
        ctx.lineTo(-12, -3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#7DD3FC';
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(7, -2);
        ctx.lineTo(0, 8);
        ctx.lineTo(-7, -2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (c.kind === 'star') {
        this.drawStarShape(ctx, sx, sy, 14, 6.5, '#FACC15', '#FEF08A');
      } else if (c.kind === 'key') {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(-5, 0, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#FBBF24';
        ctx.fillRect(1, -2, 14, 4);
        ctx.fillRect(9, 2, 3, 5);
        ctx.fillRect(13, 2, 3, 4);
        ctx.restore();
      } else if (c.kind === 'chest') {
        const cy = c.y - camY;
        ctx.save();
        ctx.fillStyle = '#78350F';
        ctx.beginPath();
        ctx.roundRect(sx - 18, cy - 28, 36, 28, 5);
        ctx.fill();
        ctx.fillStyle = '#B45309';
        ctx.fillRect(sx - 18, cy - 28, 36, 10);
        ctx.fillStyle = c.requiresKey ? '#38BDF8' : '#FBBF24';
        ctx.fillRect(sx - 4, cy - 20, 8, 9);
        ctx.restore();
      }
    }
  }

  private drawPowerUps(
    ctx: CanvasRenderingContext2D,
    powerUps: PowerUpRuntime[],
    camX: number,
    camY: number,
    time: number
  ): void {
    const colors: Record<string, string> = {
      speed: '#38BDF8',
      shield: '#22C55E',
      doubleJump: '#A855F7',
      extraHeart: '#EF4444',
      invincibility: '#FACC15',
      specialAttack: '#F97316',
    };
    const labels: Record<string, string> = {
      speed: 'SPD',
      shield: 'SHD',
      doubleJump: '2X',
      extraHeart: '+HP',
      invincibility: 'INV',
      specialAttack: 'PWR',
    };

    for (let i = 0; i < powerUps.length; i++) {
      const pu = powerUps[i];
      if (pu.collected) continue;
      const sx = pu.x - camX;
      const sy = pu.y - camY + Math.sin(time * 4 + pu.bobPhase) * 5;
      const col = colors[pu.kind] ?? '#38BDF8';

      ctx.save();
      // Outer aura
      ctx.fillStyle = `${col}33`;
      ctx.beginPath();
      ctx.arc(sx, sy, 20 + Math.sin(time * 6) * 2, 0, Math.PI * 2);
      ctx.fill();

      // Orb badge
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(sx, sy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 9px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[pu.kind] ?? '+', sx, sy + 0.5);
      ctx.restore();
    }
  }

  private drawPlayer(
    ctx: CanvasRenderingContext2D,
    p: PlayerState,
    camX: number,
    camY: number,
    time: number
  ): void {
    if (p.invulnTimer > 0 && Math.floor(time * 18) % 2 === 0) {
      // Blink during invulnerability frames
      ctx.globalAlpha = 0.45;
    }

    const cx = p.x + p.w * 0.5 - camX;
    const bottomY = p.y + p.h - camY;

    ctx.save();
    ctx.translate(cx, bottomY);

    // Shield bubble
    if (p.activePowerUps.shield > 0) {
      ctx.strokeStyle = '#4ADE80';
      ctx.fillStyle = 'rgba(74, 222, 128, 0.16)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -p.h * 0.5, 31, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Invincibility halo
    if (p.activePowerUps.invincibility > 0) {
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -p.h * 0.5, 34 + Math.sin(time * 16) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.scale(p.facing * p.scaleX, p.scaleY);

    // Ground shadow when near ground
    if (p.onGround) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const stride = p.onGround ? Math.sin(p.walkDist * 0.11) * (Math.abs(p.vx) > 20 ? 1 : 0) : 0.7;
    const armSwing = stride * 7;

    // Trailing adventure scarf
    const scarfWave = Math.sin(time * 10 + p.walkDist * 0.08) * 4;
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.moveTo(-6, -29);
    ctx.quadraticCurveTo(-20, -27 + scarfWave, -26, -21 + scarfWave);
    ctx.lineTo(-22, -16 + scarfWave);
    ctx.quadraticCurveTo(-15, -22, -6, -23);
    ctx.closePath();
    ctx.fill();

    // Explorer Backpack
    ctx.fillStyle = '#B45309';
    ctx.beginPath();
    ctx.roundRect(-17, -31, 11, 18, 4);
    ctx.fill();
    ctx.fillStyle = '#FBBF24';
    ctx.fillRect(-15, -24, 7, 3);

    // Back leg
    ctx.fillStyle = '#1E3A8A';
    ctx.beginPath();
    ctx.roundRect(-7 - stride * 5, -13, 8, 13, 3);
    ctx.fill();

    // Torso (Explorer Tunic)
    ctx.fillStyle = p.hurtTimer > 0 ? '#EF4444' : '#0EA5E9';
    ctx.beginPath();
    ctx.roundRect(-10, -32, 20, 20, 6);
    ctx.fill();

    // Belt
    ctx.fillStyle = '#78350F';
    ctx.fillRect(-10, -17, 20, 4);
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(1, -17, 5, 4);

    // Front leg & boot
    ctx.fillStyle = '#2563EB';
    ctx.beginPath();
    ctx.roundRect(-1 + stride * 5, -13, 8, 13, 3);
    ctx.fill();
    ctx.fillStyle = '#78350F';
    ctx.fillRect(-1 + stride * 5, -4, 10, 4);

    // Head
    ctx.fillStyle = '#FDE68A';
    ctx.beginPath();
    ctx.arc(0, -40, 12, 0, Math.PI * 2);
    ctx.fill();

    // Expressive Eye
    const blink = Math.sin(time * 2.1) > 0.98;
    ctx.fillStyle = '#0F172A';
    if (blink) {
      ctx.fillRect(3, -41, 5, 2);
    } else {
      ctx.beginPath();
      ctx.arc(5, -41, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(6, -42, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Explorer Cap + Goggles
    ctx.fillStyle = '#0284C7';
    ctx.beginPath();
    ctx.arc(0, -43, 12.5, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#0369A1';
    ctx.beginPath();
    ctx.roundRect(-2, -45, 16, 4.5, 2);
    ctx.fill();
    // Goggles resting on brim
    ctx.fillStyle = '#38BDF8';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(4, -47, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Front Arm (raises on attack)
    ctx.save();
    ctx.translate(4, -27);
    if (p.attackTimer > 0) {
      ctx.rotate(-0.9);
    } else {
      ctx.rotate(armSwing * 0.06);
    }
    ctx.fillStyle = '#FDE68A';
    ctx.beginPath();
    ctx.roundRect(-2, 0, 6, 12, 3);
    ctx.fill();
    ctx.restore();

    // Melee Attack Slash Crescent
    if (p.attackTimer > 0) {
      ctx.strokeStyle = p.activePowerUps.specialAttack > 0 ? '#F97316' : '#38BDF8';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(16, -24, 24, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  private drawEnemies(
    ctx: CanvasRenderingContext2D,
    enemies: EnemyRuntime[],
    camX: number,
    camY: number,
    time: number
  ): void {
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.dead) continue;
      const sx = e.x + e.w * 0.5 - camX;
      const sy = e.y + e.h - camY;

      ctx.save();
      ctx.translate(sx, sy);

      if (e.koTimer > 0) {
        ctx.globalAlpha = Math.max(0, e.koTimer / 0.35);
        ctx.rotate(e.facing * (1 - e.koTimer / 0.35) * 1.4);
      }
      ctx.scale(e.facing, 1);

      const flash = e.hurtFlash > 0;
      const bounce = Math.abs(Math.sin(time * 5 + e.animPhase)) * 3;

      if (e.kind === 'slime') {
        ctx.fillStyle = flash ? '#FFFFFF' : '#22C55E';
        ctx.beginPath();
        ctx.moveTo(-16, 0);
        ctx.quadraticCurveTo(-16, -28 + bounce, 0, -28 + bounce);
        ctx.quadraticCurveTo(16, -28 + bounce, 16, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(6, -13 + bounce * 0.5, 2.5, 0, Math.PI * 2);
        ctx.arc(-2, -13 + bounce * 0.5, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.kind === 'rollingBug') {
        ctx.save();
        ctx.translate(0, -15);
        ctx.rotate(time * 7 * e.facing);
        ctx.fillStyle = flash ? '#FFFFFF' : '#B45309';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(-13, -3, 26, 6);
        ctx.restore();
      } else if (e.kind === 'flyingInsect' || e.kind === 'iceWisp' || e.kind === 'skyGuardian') {
        const wingFlap = Math.sin(time * 22 + e.animPhase) * 8;
        const bodyCol =
          e.kind === 'iceWisp' ? '#38BDF8' : e.kind === 'skyGuardian' ? '#A855F7' : '#EC4899';
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath();
        ctx.ellipse(-6, -24 + wingFlap * 0.4, 10, 5, -0.4, 0, Math.PI * 2);
        ctx.ellipse(6, -24 - wingFlap * 0.4, 10, 5, 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = flash ? '#FFFFFF' : bodyCol;
        ctx.beginPath();
        ctx.arc(0, -16, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(5, -17, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.kind === 'jumper') {
        if (e.telegraphTimer > 0) {
          ctx.scale(1.18, 0.8);
        }
        ctx.fillStyle = flash ? '#FFFFFF' : '#F97316';
        ctx.beginPath();
        ctx.roundRect(-15, -34, 30, 34, 10);
        ctx.fill();
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(5, -22, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.kind === 'armored') {
        ctx.fillStyle = flash ? '#FFFFFF' : '#475569';
        ctx.beginPath();
        ctx.roundRect(-18, -38, 36, 38, 8);
        ctx.fill();
        ctx.fillStyle = '#94A3B8';
        ctx.fillRect(-16, -34, 32, 10);
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(3, -24, 9, 4);
      } else if (e.kind === 'fireImp') {
        ctx.fillStyle = flash ? '#FFFFFF' : '#DC2626';
        ctx.beginPath();
        ctx.roundRect(-14, -32, 28, 32, 8);
        ctx.fill();
        // Horns
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        ctx.moveTo(-10, -32);
        ctx.lineTo(-14, -42);
        ctx.lineTo(-4, -32);
        ctx.moveTo(4, -32);
        ctx.lineTo(14, -42);
        ctx.lineTo(10, -32);
        ctx.fill();
      }

      // Telegraph exclamation cue
      if (e.telegraphTimer > 0) {
        ctx.fillStyle = '#FACC15';
        ctx.font = '700 16px "Fredoka", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', 0, -44);
      }

      ctx.restore();
    }
  }

  private drawBoss(
    ctx: CanvasRenderingContext2D,
    b: BossRuntime,
    camX: number,
    camY: number,
    time: number
  ): void {
    if (b.defeated) return;
    const sx = b.x + b.w * 0.5 - camX;
    const sy = b.y + b.h - camY;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(b.facing, 1);

    const flash = b.hurtFlash > 0;
    const palette: Record<string, { body: string; accent: string }> = {
      mossback: { body: '#16A34A', accent: '#FACC15' },
      scarab: { body: '#B45309', accent: '#38BDF8' },
      frostwing: { body: '#0284C7', accent: '#E0F2FE' },
      magmaTitan: { body: '#B91C1C', accent: '#FB923C' },
      skySovereign: { body: '#6D28D9', accent: '#F472B6' },
    };
    const pal = palette[b.kind] ?? palette.mossback;

    if (b.phase === 'telegraph') {
      const pulse = 1 + Math.sin(time * 26) * 0.08;
      ctx.scale(pulse, 2 - pulse);
    }

    // Body silhouette
    ctx.fillStyle = flash ? '#FFFFFF' : pal.body;
    ctx.beginPath();
    ctx.roundRect(-b.w * 0.5, -b.h, b.w, b.h, 22);
    ctx.fill();

    // Armor trim / crown
    ctx.fillStyle = pal.accent;
    ctx.beginPath();
    ctx.moveTo(-26, -b.h);
    ctx.lineTo(-16, -b.h - 20);
    ctx.lineTo(0, -b.h - 6);
    ctx.lineTo(16, -b.h - 20);
    ctx.lineTo(26, -b.h);
    ctx.closePath();
    ctx.fill();

    // Glowing eyes
    ctx.fillStyle = b.phase === 'vulnerable' ? '#38BDF8' : '#FEF08A';
    ctx.beginPath();
    ctx.arc(14, -b.h * 0.62, 7, 0, Math.PI * 2);
    ctx.arc(-8, -b.h * 0.62, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawProjectiles(
    ctx: CanvasRenderingContext2D,
    projectiles: ProjectileRuntime[],
    camX: number,
    camY: number,
    time: number
  ): void {
    for (let i = 0; i < projectiles.length; i++) {
      const pr = projectiles[i];
      if (!pr.active) continue;
      const sx = pr.x - camX;
      const sy = pr.y - camY;
      ctx.save();
      ctx.fillStyle = pr.color;
      ctx.beginPath();
      ctx.arc(sx, sy, pr.radius + Math.sin(time * 24) * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(sx, sy, pr.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawStarShape(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    outerR: number,
    innerR: number,
    fill: string,
    inner: string
  ): void {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = fill;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const ang = -Math.PI / 2 + (i * Math.PI) / 5;
      const x = Math.cos(ang) * r;
      const y = Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = inner;
    ctx.beginPath();
    ctx.arc(0, 0, innerR * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
