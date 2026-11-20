import { PHYSICS } from './config';
import { getLevel } from './levels';
import { AudioManager } from './systems/AudioManager';
import { CameraSystem } from './systems/CameraSystem';
import { InputManager } from './systems/InputManager';
import { ParticleSystem } from './systems/ParticleSystem';
import { calculateLevelStars, rectsOverlap, stepPlayerPhysics, updatePlatforms } from './systems/PhysicsSystem';
import { Renderer } from './systems/Renderer';
import type {
  BossRuntime,
  CheckpointRuntime,
  CollectibleRuntime,
  EnemyRuntime,
  GameSettings,
  HudState,
  LevelData,
  PlatformRuntime,
  PlayerState,
  PowerUpRuntime,
  ProjectileRuntime,
  RunSnapshot,
  WorldTheme,
} from './types';

export interface EngineCallbacks {
  onHudUpdate: (hud: HudState) => void;
  onLevelComplete: (snapshot: RunSnapshot) => void;
  onGameOver: (snapshot: RunSnapshot) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer = new Renderer();
  private camera = new CameraSystem();
  private particles = new ParticleSystem();
  public input = new InputManager();
  public audio = new AudioManager();

  private callbacks: EngineCallbacks;
  private settings: GameSettings;

  private rafId: number | null = null;
  private lastTs = 0;
  private simTime = 0;
  private hitstopTimer = 0;
  private mode: 'attract' | 'playing' | 'paused' | 'ended' = 'attract';
  private attractTheme: WorldTheme = 'meadows';

  private level!: LevelData;
  private player!: PlayerState;
  private platforms: PlatformRuntime[] = [];
  private enemies: EnemyRuntime[] = [];
  private boss: BossRuntime | null = null;
  private projectiles: ProjectileRuntime[] = [];
  private projIdCounter = 1;
  private collectibles: CollectibleRuntime[] = [];
  private powerUps: PowerUpRuntime[] = [];
  private checkpoints: CheckpointRuntime[] = [];
  private discoveredSecrets = new Set<string>();
  private secretBannerTimer = 0;
  private secretBannerText: string | null = null;

  private levelCoins = 0;
  private totalLevelCoins = 0;
  private levelGems = 0;
  private totalLevelGems = 0;
  private score = 0;
  private damageTaken = 0;
  private elapsedSec = 0;
  private bossDefeated = false;
  private hudSyncAccum = 0;
  private lastHudSig = '';
  private viewW = 1280;
  private viewH = 720;
  private shakeOffset = { offsetX: 0, offsetY: 0 };

  constructor(canvas: HTMLCanvasElement, settings: GameSettings, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context unavailable');
    this.ctx = context;
    this.settings = settings;
    this.callbacks = callbacks;

    this.audio.applySettings(settings);
    this.input.setBindings(settings.keyBindings);
    this.loadAttract('meadows');
  }

  public startLoop(): void {
    if (this.rafId !== null) return;
    this.lastTs = performance.now();
    const isAutomated = typeof navigator !== 'undefined' && navigator.webdriver;
    const tick = (now: number) => {
      const rawDt = (now - this.lastTs) / 1000;
      if ((this.mode === 'attract' || isAutomated) && rawDt < 0.032) {
        this.rafId = window.requestAnimationFrame(tick);
        return;
      }
      this.lastTs = now;
      const dt = Math.min(Math.max(rawDt, 0), PHYSICS.MAX_DT);
      if (this.mode === 'paused' || this.mode === 'ended') {
        this.rafId = window.requestAnimationFrame(tick);
        return;
      }
      this.update(dt);
      this.draw();
      this.rafId = window.requestAnimationFrame(tick);
    };
    this.rafId = window.requestAnimationFrame(tick);
  }

  public destroy(): void {
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.audio.stopMusic();
  }

  public resize(width: number, height: number): void {
    const isAutomated = typeof navigator !== 'undefined' && navigator.webdriver;
    const maxDpr = isAutomated || this.settings.quality === 'low' ? 1 : this.settings.quality === 'medium' ? 1.5 : 2;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    this.viewW = Math.max(320, width);
    this.viewH = Math.max(240, height);
    this.canvas.width = Math.round(this.viewW * dpr);
    this.canvas.height = Math.round(this.viewH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.mode === 'paused' || this.mode === 'ended') {
      this.draw();
    }
  }

  public updateSettings(settings: GameSettings): void {
    this.settings = settings;
    this.audio.applySettings(settings);
    this.input.setBindings(settings.keyBindings);
  }

  public loadAttract(theme: WorldTheme = 'meadows'): void {
    this.mode = 'attract';
    this.attractTheme = theme;
    this.particles.clear();
    this.audio.setMusicMode('menu');
  }

  public setPaused(paused: boolean): void {
    if (this.mode === 'ended' || this.mode === 'attract') return;
    this.mode = paused ? 'paused' : 'playing';
    this.input.clearAll();
  }

  public startLevel(world: number, levelNum: number): void {
    const lvl = getLevel(world, levelNum);
    this.level = lvl;
    this.mode = 'playing';
    this.hitstopTimer = 0;
    this.elapsedSec = 0;
    this.score = 0;
    this.damageTaken = 0;
    this.bossDefeated = false;
    this.discoveredSecrets.clear();
    this.secretBannerTimer = 0;
    this.secretBannerText = null;
    this.lastHudSig = '';
    this.particles.clear();
    this.projectiles = [];
    this.input.clearAll();

    const maxHp = this.settings.difficulty === 'casual' ? 5 : this.settings.difficulty === 'heroic' ? 3 : 4;
    const lives = this.settings.difficulty === 'casual' ? 5 : this.settings.difficulty === 'heroic' ? 2 : 3;

    this.player = {
      x: lvl.spawn.x,
      y: lvl.spawn.y,
      w: PHYSICS.PLAYER_W,
      h: PHYSICS.PLAYER_H,
      vx: 0,
      vy: 0,
      facing: 1,
      onGround: false,
      onIce: false,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      jumpsRemaining: 1,
      maxJumps: 1,
      hp: maxHp,
      maxHp,
      lives,
      invulnTimer: 0,
      attackTimer: 0,
      attackCooldown: 0,
      specialCooldown: 0,
      hurtTimer: 0,
      landTimer: 0,
      animState: 'idle',
      walkDist: 0,
      scaleX: 1,
      scaleY: 1,
      respawnX: lvl.spawn.x,
      respawnY: lvl.spawn.y,
      keysHeld: 0,
      activePowerUps: {
        speed: 0,
        shield: 0,
        doubleJump: 0,
        invincibility: 0,
        specialAttack: 0,
      },
    };

    this.platforms = lvl.platforms.map((p) => ({
      ...p,
      prevX: p.x,
      prevY: p.y,
      phase: 0,
      fallTriggered: false,
      fallTimer: 0.55,
      respawnTimer: 0,
      broken: false,
    }));

    this.enemies = lvl.enemies.map((e, idx) => {
      const dims =
        e.kind === 'armored'
          ? { w: 36, h: 38 }
          : e.kind === 'jumper'
            ? { w: 30, h: 34 }
            : e.kind === 'fireImp'
              ? { w: 28, h: 32 }
              : { w: 32, h: 30 };
      return {
        ...e,
        w: dims.w,
        h: dims.h,
        vx: (idx % 2 === 0 ? 1 : -1) * 78,
        vy: 0,
        facing: idx % 2 === 0 ? 1 : -1,
        onGround: true,
        stateTimer: 1 + (idx % 3) * 0.4,
        telegraphTimer: 0,
        hurtFlash: 0,
        koTimer: 0,
        dead: false,
        baseY: e.y,
        animPhase: idx * 1.1,
      };
    });

    this.boss = lvl.boss
      ? {
          ...lvl.boss,
          w: 78,
          h: 92,
          vx: 0,
          vy: 0,
          hp: lvl.boss.maxHp,
          facing: -1,
          onGround: true,
          phase: 'intro',
          attackPattern: 0,
          stateTimer: 1.2,
          hurtFlash: 0,
          introShown: false,
          defeated: false,
        }
      : null;

    this.collectibles = lvl.collectibles.map((c, idx) => ({
      ...c,
      collected: false,
      bobPhase: idx * 0.6,
    }));
    this.totalLevelCoins = this.collectibles.filter((c) => c.kind === 'coin').length;
    this.totalLevelGems = this.collectibles.filter((c) => c.kind === 'gem').length;
    this.levelCoins = 0;
    this.levelGems = 0;

    this.powerUps = lvl.powerUps.map((pu, idx) => ({
      ...pu,
      collected: false,
      bobPhase: idx * 0.9,
    }));

    this.checkpoints = lvl.checkpoints.map((cp) => ({
      ...cp,
      activated: false,
      flagRise: 0,
    }));

    this.camera.reset(this.player.x, this.player.y, this.viewW, this.viewH, lvl.width, lvl.height);
    this.audio.setWorldMusic(lvl.theme, Boolean(lvl.boss));
    this.emitHud();
  }

  private update(dt: number): void {
    this.simTime += dt;

    if (this.mode === 'attract') {
      if (this.settings.visualEffects) {
        this.particles.emitAmbient(this.attractTheme, this.simTime * 35, 0, this.viewW, this.viewH, this.settings.quality, dt);
        this.particles.update(dt);
      }
      return;
    }

    if (this.mode !== 'playing') return;

    // Hitstop pauses simulation physics briefly while visuals/particles continue
    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      this.particles.update(dt);
      return;
    }

    this.elapsedSec += dt;
    if (this.secretBannerTimer > 0) {
      this.secretBannerTimer = Math.max(0, this.secretBannerTimer - dt);
      if (this.secretBannerTimer === 0) this.secretBannerText = null;
    }

    const input = this.input.consumeFrameInput();
    updatePlatforms(this.platforms, dt);

    // Player cooldowns & active power-up timers
    const p = this.player;
    p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    p.attackTimer = Math.max(0, p.attackTimer - dt);
    p.attackCooldown = Math.max(0, p.attackCooldown - dt);
    p.specialCooldown = Math.max(0, p.specialCooldown - dt);
    p.hurtTimer = Math.max(0, p.hurtTimer - dt);
    p.landTimer = Math.max(0, p.landTimer - dt);
    p.activePowerUps.speed = Math.max(0, p.activePowerUps.speed - dt);
    p.activePowerUps.doubleJump = Math.max(0, p.activePowerUps.doubleJump - dt);
    p.activePowerUps.invincibility = Math.max(0, p.activePowerUps.invincibility - dt);
    p.activePowerUps.specialAttack = Math.max(0, p.activePowerUps.specialAttack - dt);

    // Execute physics step
    const physEvents = stepPlayerPhysics(p, input, this.platforms, this.level.width, dt);
    if (physEvents.jumped || physEvents.doubleJumped) {
      this.audio.playJump(physEvents.doubleJumped);
      this.particles.emitDust(p.x + p.w * 0.5, p.y + p.h, physEvents.doubleJumped ? 7 : 5, '#E2E8F0');
    }
    if (physEvents.bounced) {
      this.audio.playJump(true);
      this.particles.emitBurst(p.x + p.w * 0.5, p.y + p.h, 8, ['#EC4899', '#FBCFE8'], 120, 4, 0.35, 220);
    }
    if (physEvents.landed) {
      this.audio.playLand();
      this.particles.emitDust(p.x + p.w * 0.5, p.y + p.h, 6, '#CBD5E1');
    }

    // Attack & Special Ability
    if (input.attackJustPressed && p.attackCooldown <= 0) {
      p.attackTimer = 0.2;
      p.attackCooldown = 0.28;
      this.audio.playAttack(false);
      this.performMeleeHit();
    }

    if (input.specialJustPressed && p.specialCooldown <= 0) {
      const powered = p.activePowerUps.specialAttack > 0;
      p.attackTimer = 0.22;
      p.specialCooldown = powered ? 0.45 : 1.1;
      this.audio.playAttack(true);
      this.spawnProjectile(
        true,
        p.x + p.w * 0.5 + p.facing * 20,
        p.y + p.h * 0.45,
        p.facing * (powered ? 540 : 420),
        0,
        powered ? 11 : 8,
        powered ? 3 : 2,
        powered ? '#F97316' : '#38BDF8',
        1.1
      );
    }

    // Update projectiles
    this.updateProjectiles(dt);

    // Update enemies
    this.updateEnemies(dt);

    // Update Boss
    if (this.boss) {
      this.updateBoss(dt);
    }

    // Collectibles, Power-Ups, Checkpoints, Secret Zones
    this.updateCollectiblesAndProps(dt);

    // Hazards & Pitfall check
    this.checkHazards();

    // Exit portal check
    this.checkExitPortal();

    // Camera & Ambient Particles
    this.shakeOffset = this.camera.update(
      p.x + p.w * 0.5,
      p.y + p.h * 0.5,
      p.facing,
      this.viewW,
      this.viewH,
      this.level.width,
      this.level.height,
      dt,
      this.settings.screenShake
    );

    if (this.settings.visualEffects) {
      this.particles.emitAmbient(
        this.level.theme,
        this.camera.x,
        this.camera.y,
        this.viewW,
        this.viewH,
        this.settings.quality,
        dt
      );
      this.particles.update(dt);
    }

    this.hudSyncAccum += dt;
    if (this.hudSyncAccum >= 0.08) {
      this.hudSyncAccum = 0;
      this.emitHud();
    }
  }

  private performMeleeHit(): void {
    const p = this.player;
    const range = p.activePowerUps.specialAttack > 0 ? 64 : 48;
    const hitBox = {
      x: p.facing > 0 ? p.x + p.w * 0.5 : p.x + p.w * 0.5 - range,
      y: p.y - 6,
      w: range,
      h: p.h + 10,
    };
    const dmg = p.activePowerUps.specialAttack > 0 ? 2 : 1;

    for (const e of this.enemies) {
      if (e.dead || e.koTimer > 0) continue;
      if (rectsOverlap(hitBox, e)) {
        this.damageEnemy(e, dmg, p.facing);
      }
    }
    if (this.boss && !this.boss.defeated && rectsOverlap(hitBox, this.boss)) {
      this.damageBoss(dmg);
    }
  }

  private spawnProjectile(
    fromPlayer: boolean,
    x: number,
    y: number,
    vx: number,
    vy: number,
    radius: number,
    damage: number,
    color: string,
    life: number
  ): void {
    this.projectiles.push({
      id: this.projIdCounter++,
      fromPlayer,
      x,
      y,
      vx,
      vy,
      radius,
      damage,
      color,
      life,
      active: true,
    });
  }

  private updateProjectiles(dt: number): void {
    const pRect = { x: this.player.x, y: this.player.y, w: this.player.w, h: this.player.h };
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      if (!pr.active) {
        this.projectiles.splice(i, 1);
        continue;
      }
      pr.life -= dt;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      if (pr.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }
      const box = { x: pr.x - pr.radius, y: pr.y - pr.radius, w: pr.radius * 2, h: pr.radius * 2 };

      if (pr.fromPlayer) {
        for (const e of this.enemies) {
          if (e.dead || e.koTimer > 0) continue;
          if (rectsOverlap(box, e)) {
            this.damageEnemy(e, pr.damage, pr.vx >= 0 ? 1 : -1);
            pr.active = false;
            break;
          }
        }
        if (pr.active && this.boss && !this.boss.defeated && rectsOverlap(box, this.boss)) {
          this.damageBoss(pr.damage);
          pr.active = false;
        }
      } else if (rectsOverlap(box, pRect)) {
        this.damagePlayer(1, pr.vx >= 0 ? 1 : -1);
        pr.active = false;
      }
    }
  }

  private damageEnemy(e: EnemyRuntime, dmg: number, dir: 1 | -1): void {
    e.hp -= dmg;
    e.hurtFlash = 0.08;
    e.vx = dir * 130;
    if (e.hp <= 0) {
      e.koTimer = 0.35;
      this.score += 100;
      this.hitstopTimer = 0.04;
      this.audio.playEnemyDefeat();
      this.camera.addTrauma(0.22);
      this.particles.emitBurst(e.x + e.w * 0.5, e.y + e.h * 0.5, 14, ['#FACC15', '#38BDF8', '#FFFFFF'], 170, 5, 0.45, 280);
      this.emitHud();
    } else {
      this.hitstopTimer = 0.025;
      this.audio.playAttack(false);
      this.particles.emitBurst(e.x + e.w * 0.5, e.y + e.h * 0.5, 6, ['#FFFFFF', '#FDE047'], 110, 4, 0.3, 180);
    }
  }

  private damageBoss(dmg: number): void {
    const b = this.boss;
    if (!b || b.defeated) return;
    b.hp = Math.max(0, b.hp - dmg);
    b.hurtFlash = 0.1;
    this.hitstopTimer = 0.05;
    this.camera.addTrauma(0.32);
    this.particles.emitBurst(b.x + b.w * 0.5, b.y + b.h * 0.5, 16, ['#FACC15', '#F97316', '#FFFFFF'], 200, 5.5, 0.5, 260);
    if (b.hp <= 0) {
      b.defeated = true;
      b.phase = 'defeated';
      this.bossDefeated = true;
      this.score += 1500;
      this.audio.playVictory();
      this.camera.addTrauma(0.7);
      this.particles.emitBurst(b.x + b.w * 0.5, b.y + b.h * 0.5, 32, ['#FACC15', '#38BDF8', '#EC4899', '#22C55E'], 260, 7, 0.85, 240);
    } else {
      this.audio.playEnemyDefeat();
    }
    this.emitHud();
  }

  private updateEnemies(dt: number): void {
    const p = this.player;
    const pRect = { x: p.x, y: p.y, w: p.w, h: p.h };

    for (const e of this.enemies) {
      if (e.dead) continue;
      e.hurtFlash = Math.max(0, e.hurtFlash - dt);

      if (e.koTimer > 0) {
        e.koTimer -= dt;
        e.x += e.vx * dt;
        e.y += 160 * dt;
        if (e.koTimer <= 0) e.dead = true;
        continue;
      }

      const distToPlayer = Math.hypot(p.x - e.x, p.y - e.y);

      if (e.kind === 'flyingInsect' || e.kind === 'iceWisp' || e.kind === 'skyGuardian') {
        const speed = e.kind === 'skyGuardian' ? 125 : 95;
        e.x += e.facing * speed * dt;
        if (e.x <= e.patrolMinX) {
          e.x = e.patrolMinX;
          e.facing = 1;
        } else if (e.x + e.w >= e.patrolMaxX) {
          e.x = e.patrolMaxX - e.w;
          e.facing = -1;
        }
        e.y = e.baseY + Math.sin(this.simTime * 3.2 + e.animPhase) * 26;
      } else if (e.kind === 'jumper') {
        e.stateTimer -= dt;
        if (e.onGround && e.stateTimer <= 0.35 && e.stateTimer > 0) {
          e.telegraphTimer = 0.25;
        }
        if (e.onGround && e.stateTimer <= 0) {
          e.vy = -440;
          e.onGround = false;
          e.stateTimer = 1.65;
          e.telegraphTimer = 0;
          e.facing = p.x < e.x ? -1 : 1;
          e.vx = e.facing * 120;
        }
        e.telegraphTimer = Math.max(0, e.telegraphTimer - dt);
        if (!e.onGround) {
          e.vy = Math.min(720, e.vy + 1350 * dt);
          e.x += e.vx * dt;
          e.y += e.vy * dt;
          if (e.y >= e.baseY) {
            e.y = e.baseY;
            e.vy = 0;
            e.vx = 0;
            e.onGround = true;
          }
        }
        e.x = Math.max(e.patrolMinX, Math.min(e.patrolMaxX - e.w, e.x));
      } else if (e.kind === 'fireImp') {
        e.x += e.facing * 65 * dt;
        if (e.x <= e.patrolMinX) e.facing = 1;
        if (e.x + e.w >= e.patrolMaxX) e.facing = -1;
        e.stateTimer -= dt;
        if (distToPlayer < 420 && e.stateTimer <= 0.35 && e.stateTimer > 0) {
          e.telegraphTimer = 0.25;
        }
        if (distToPlayer < 420 && e.stateTimer <= 0) {
          e.stateTimer = 2.4;
          e.telegraphTimer = 0;
          const dir = p.x < e.x ? -1 : 1;
          e.facing = dir;
          this.spawnProjectile(false, e.x + e.w * 0.5, e.y + 14, dir * 230, 0, 6, 1, '#FB923C', 2.0);
        }
        e.telegraphTimer = Math.max(0, e.telegraphTimer - dt);
      } else {
        // Ground patrol: slime, rollingBug, armored
        const spd = e.kind === 'rollingBug' ? (distToPlayer < 260 ? 155 : 95) : e.kind === 'armored' ? 75 : 70;
        e.x += e.facing * spd * dt;
        if (e.x <= e.patrolMinX) {
          e.x = e.patrolMinX;
          e.facing = 1;
        } else if (e.x + e.w >= e.patrolMaxX) {
          e.x = e.patrolMaxX - e.w;
          e.facing = -1;
        }
      }

      // Collision with player
      if (rectsOverlap(pRect, e)) {
        if (p.activePowerUps.invincibility > 0) {
          this.damageEnemy(e, 99, p.facing);
          continue;
        }
        // Stomp check: player descending and player feet near top of enemy
        const isStomp = p.vy > 40 && p.y + p.h - p.vy * dt <= e.y + e.h * 0.55;
        if (isStomp && e.kind !== 'armored') {
          p.vy = -460;
          p.jumpsRemaining = p.activePowerUps.doubleJump > 0 ? 1 : 0;
          this.damageEnemy(e, 1, p.facing);
        } else if (isStomp && e.kind === 'armored') {
          p.vy = -420;
          this.damageEnemy(e, 1, p.facing);
        } else {
          this.damagePlayer(1, p.x < e.x ? -1 : 1);
        }
      }
    }
  }

  private updateBoss(dt: number): void {
    const b = this.boss!;
    if (b.defeated) return;
    b.hurtFlash = Math.max(0, b.hurtFlash - dt);

    const p = this.player;
    const dist = Math.abs(p.x - b.x);

    // Activate only when player approaches arena
    if (b.phase === 'intro') {
      if (p.x >= b.arenaMinX - 80) {
        b.stateTimer -= dt;
        if (b.stateTimer <= 0) {
          b.phase = 'patrol';
          b.stateTimer = 1.4;
          b.introShown = true;
          this.emitHud();
        }
      }
      return;
    }

    b.stateTimer -= dt;
    b.facing = p.x < b.x ? -1 : 1;

    if (b.phase === 'patrol') {
      b.x += b.facing * 95 * dt;
      if (b.stateTimer <= 0) {
        b.phase = 'telegraph';
        b.stateTimer = 0.65;
        b.attackPattern = (b.attackPattern + 1) % 3;
      }
    } else if (b.phase === 'telegraph') {
      if (b.stateTimer <= 0) {
        b.phase = 'attack';
        if (b.attackPattern === 0) {
          // Charge dash
          b.vx = b.facing * 350;
          b.stateTimer = 0.85;
        } else if (b.attackPattern === 1) {
          // Leap slam
          b.vy = -540;
          b.vx = b.facing * 210;
          b.onGround = false;
          b.stateTimer = 1.1;
        } else {
          // Projectile burst
          for (let k = -1; k <= 1; k++) {
            this.spawnProjectile(
              false,
              b.x + b.w * 0.5,
              b.y + b.h * 0.45,
              b.facing * 260,
              k * 95,
              8,
              1,
              '#F43F5E',
              2.2
            );
          }
          b.stateTimer = 0.5;
        }
      }
    } else if (b.phase === 'attack') {
      b.x += b.vx * dt;
      if (!b.onGround) {
        b.vy = Math.min(820, b.vy + 1400 * dt);
        b.y += b.vy * dt;
        if (b.y >= this.level.exit.y - b.h) {
          b.y = this.level.exit.y - b.h;
          b.vy = 0;
          b.onGround = true;
          this.camera.addTrauma(0.35);
          this.spawnProjectile(false, b.x, b.y + b.h - 14, -220, 0, 7, 1, '#F97316', 1.6);
          this.spawnProjectile(false, b.x + b.w, b.y + b.h - 14, 220, 0, 7, 1, '#F97316', 1.6);
        }
      }
      if (b.stateTimer <= 0) {
        b.vx = 0;
        b.phase = 'vulnerable';
        b.stateTimer = 1.25;
      }
    } else if (b.phase === 'vulnerable') {
      if (b.stateTimer <= 0) {
        b.phase = 'patrol';
        b.stateTimer = 1.5;
      }
    }

    b.x = Math.max(b.arenaMinX, Math.min(b.arenaMaxX - b.w, b.x));

    // Player collision with boss
    const pRect = { x: p.x, y: p.y, w: p.w, h: p.h };
    if (rectsOverlap(pRect, b)) {
      const isStomp = p.vy > 40 && p.y + p.h - p.vy * dt <= b.y + 32;
      if (isStomp) {
        p.vy = -520;
        this.damageBoss(2);
      } else {
        this.damagePlayer(1, p.x < b.x ? -1 : 1);
      }
    }
    void dist;
  }

  private updateCollectiblesAndProps(dt: number): void {
    const p = this.player;
    const pRect = { x: p.x, y: p.y, w: p.w, h: p.h };

    for (const c of this.collectibles) {
      if (c.collected) continue;
      const box =
        c.kind === 'chest'
          ? { x: c.x - 18, y: c.y - 28, w: 36, h: 28 }
          : { x: c.x - 14, y: c.y - 14, w: 28, h: 28 };

      if (!rectsOverlap(pRect, box)) continue;

      if (c.kind === 'chest' && c.requiresKey && p.keysHeld <= 0) {
        continue;
      }
      if (c.kind === 'chest' && c.requiresKey) {
        p.keysHeld -= 1;
      }

      c.collected = true;
      if (c.kind === 'coin') {
        this.levelCoins += 1;
        this.score += 25;
        this.audio.playCoin();
        this.particles.emitBurst(c.x, c.y, 7, ['#FACC15', '#FEF08A'], 110, 4, 0.35, 160);
      } else if (c.kind === 'gem') {
        this.levelGems += 1;
        this.score += 150;
        this.audio.playGem();
        this.particles.emitBurst(c.x, c.y, 12, ['#38BDF8', '#BAE6FD', '#FFFFFF'], 140, 4.5, 0.45, 140);
      } else if (c.kind === 'star') {
        this.score += 250;
        this.audio.playGem();
        this.particles.emitBurst(c.x, c.y, 14, ['#FACC15', '#FFFFFF'], 150, 5, 0.5, 140);
      } else if (c.kind === 'key') {
        p.keysHeld += 1;
        this.score += 100;
        this.audio.playPowerUp();
        this.particles.emitBurst(c.x, c.y, 10, ['#FBBF24', '#FFFFFF'], 120, 4, 0.4, 140);
      } else if (c.kind === 'chest') {
        this.levelCoins += 10;
        this.score += 400;
        this.audio.playPowerUp();
        this.particles.emitBurst(c.x, c.y - 14, 18, ['#FACC15', '#38BDF8', '#FFFFFF'], 180, 5, 0.55, 220);
      }
      this.emitHud();
    }

    for (const pu of this.powerUps) {
      if (pu.collected) continue;
      if (rectsOverlap(pRect, { x: pu.x - 16, y: pu.y - 16, w: 32, h: 32 })) {
        pu.collected = true;
        this.audio.playPowerUp();
        this.score += 120;
        this.particles.emitBurst(pu.x, pu.y, 14, ['#FFFFFF', '#38BDF8', '#FACC15'], 150, 5, 0.45, 160);
        if (pu.kind === 'speed') p.activePowerUps.speed = 10;
        else if (pu.kind === 'shield') p.activePowerUps.shield = 2;
        else if (pu.kind === 'doubleJump') p.activePowerUps.doubleJump = 14;
        else if (pu.kind === 'extraHeart') p.hp = Math.min(p.maxHp, p.hp + 1);
        else if (pu.kind === 'invincibility') p.activePowerUps.invincibility = 8;
        else if (pu.kind === 'specialAttack') p.activePowerUps.specialAttack = 14;
        this.emitHud();
      }
    }

    for (const cp of this.checkpoints) {
      if (cp.activated && cp.flagRise < 1) {
        cp.flagRise = Math.min(1, cp.flagRise + dt * 3);
      }
      if (!cp.activated && rectsOverlap(pRect, { x: cp.x - 20, y: cp.y - 68, w: 40, h: 68 })) {
        cp.activated = true;
        p.respawnX = cp.x - p.w * 0.5;
        p.respawnY = cp.y - p.h - 4;
        this.audio.playCheckpoint();
        this.particles.emitBurst(cp.x, cp.y - 40, 12, ['#22C55E', '#FEF08A'], 130, 4.5, 0.45, 180);
        this.emitHud();
      }
    }

    for (const sz of this.level.secretZones) {
      if (!this.discoveredSecrets.has(sz.id) && rectsOverlap(pRect, sz)) {
        this.discoveredSecrets.add(sz.id);
        this.score += 200;
        this.secretBannerText = `Secret Found: ${sz.label}`;
        this.secretBannerTimer = 2.6;
        this.audio.playGem();
        this.emitHud();
      }
    }
  }

  private checkHazards(): void {
    const p = this.player;
    const pRect = { x: p.x + 4, y: p.y + 4, w: p.w - 8, h: p.h - 6 };

    // Pitfall below level bounds
    if (p.y > this.level.height + 40) {
      this.loseLifeOrRespawn();
      return;
    }

    for (const h of this.level.hazards) {
      if (rectsOverlap(pRect, h)) {
        if (h.kind === 'lava' || h.kind === 'water' || h.kind === 'void') {
          this.loseLifeOrRespawn();
          return;
        }
        this.damagePlayer(1, -p.facing as 1 | -1);
      }
    }
  }

  private damagePlayer(dmg: number, knockDir: 1 | -1): void {
    const p = this.player;
    if (p.invulnTimer > 0 || p.activePowerUps.invincibility > 0) return;

    if (p.activePowerUps.shield > 0) {
      p.activePowerUps.shield -= 1;
      p.invulnTimer = 1.0;
      p.vy = -260;
      p.vx = knockDir * 190;
      this.audio.playDamage();
      this.camera.addTrauma(0.28);
      this.particles.emitBurst(p.x + p.w * 0.5, p.y + p.h * 0.5, 12, ['#4ADE80', '#FFFFFF'], 160, 4.5, 0.4, 180);
      this.emitHud();
      return;
    }

    p.hp = Math.max(0, p.hp - dmg);
    this.damageTaken += dmg;
    p.invulnTimer = 1.25;
    p.hurtTimer = 0.25;
    p.vy = -320;
    p.vx = knockDir * 220;
    this.hitstopTimer = 0.045;
    this.audio.playDamage();
    this.camera.addTrauma(0.45);
    if (this.settings.vibration && navigator.vibrate) {
      navigator.vibrate(70);
    }
    this.particles.emitBurst(p.x + p.w * 0.5, p.y + p.h * 0.5, 14, ['#EF4444', '#FCA5A5', '#FFFFFF'], 180, 5, 0.4, 240);

    if (p.hp <= 0) {
      this.loseLifeOrRespawn();
    } else {
      this.emitHud();
    }
  }

  private loseLifeOrRespawn(): void {
    const p = this.player;
    p.lives -= 1;
    this.audio.playDamage();
    this.camera.addTrauma(0.5);

    if (p.lives <= 0) {
      this.mode = 'ended';
      this.audio.stopMusic();
      this.audio.playGameOver();
      this.callbacks.onGameOver({
        world: this.level.world,
        level: this.level.level,
        levelName: this.level.name,
        score: this.score,
        bestScore: this.score,
        coins: this.levelCoins,
        totalCoins: this.totalLevelCoins,
        gems: this.levelGems,
        totalGems: this.totalLevelGems,
        stars: 0,
        elapsedSec: Math.round(this.elapsedSec),
        damageTaken: this.damageTaken,
        bossDefeated: this.bossDefeated,
        nextUnlocked: null,
        isFinalVictory: false,
      });
      return;
    }

    // Respawn at last checkpoint or start
    p.hp = p.maxHp;
    p.x = p.respawnX;
    p.y = p.respawnY;
    p.vx = 0;
    p.vy = 0;
    p.invulnTimer = 1.6;
    this.emitHud();
  }

  private checkExitPortal(): void {
    if (this.boss && !this.boss.defeated) return;
    const p = this.player;
    const exitBox = { x: this.level.exit.x - 28, y: this.level.exit.y - 84, w: 56, h: 84 };
    if (rectsOverlap({ x: p.x, y: p.y, w: p.w, h: p.h }, exitBox)) {
      this.mode = 'ended';
      this.audio.stopMusic();
      this.audio.playVictory();
      const stars = calculateLevelStars({
        coinsCollected: this.levelCoins,
        totalCoins: this.totalLevelCoins,
        gemsCollected: this.levelGems,
        totalGems: this.totalLevelGems,
        damageTaken: this.damageTaken,
        elapsedSec: this.elapsedSec,
      });
      const finalScore = this.score + stars * 200 + p.hp * 100;
      this.callbacks.onLevelComplete({
        world: this.level.world,
        level: this.level.level,
        levelName: this.level.name,
        score: finalScore,
        bestScore: finalScore,
        coins: this.levelCoins,
        totalCoins: this.totalLevelCoins,
        gems: this.levelGems,
        totalGems: this.totalLevelGems,
        stars,
        elapsedSec: Math.round(this.elapsedSec),
        damageTaken: this.damageTaken,
        bossDefeated: this.bossDefeated,
        nextUnlocked: null,
        isFinalVictory: this.level.world === 5 && this.level.level === 5,
      });
    }
  }

  private getTutorialHint(): string | null {
    if (!this.level.tutorial || !this.settings.showTutorial) return null;
    const px = this.player.x;
    if (px < 480) return 'Move with A/D or Arrow Keys (or Joystick). Press Space / W / Jump to leap!';
    if (px < 920) return 'Jump onto enemies from above or press J / Attack to defeat them!';
    if (px < 1550) return 'Explore high platforms for secret Blue Gems and Coins!';
    if (px < 2200) return 'Touch checkpoints to save your respawn spot, and press K for Special Attack!';
    return 'Reach the glowing Exit Portal ahead to complete the level!';
  }

  private emitHud(force = false): void {
    if (!this.level || !this.player) return;
    const p = this.player;
    const hint = this.getTutorialHint();
    const bossHp = this.boss && !this.boss.defeated && this.boss.introShown ? this.boss.hp : -1;
    const sig = [
      this.level.world,
      this.level.level,
      p.hp,
      p.maxHp,
      p.lives,
      this.levelCoins,
      this.levelGems,
      p.keysHeld,
      this.score,
      Math.ceil(p.activePowerUps.speed),
      p.activePowerUps.shield,
      Math.ceil(p.activePowerUps.doubleJump),
      Math.ceil(p.activePowerUps.invincibility),
      Math.ceil(p.activePowerUps.specialAttack),
      bossHp,
      hint ?? '',
      this.secretBannerText ?? '',
    ].join('|');

    if (!force && sig === this.lastHudSig) return;
    this.lastHudSig = sig;

    this.callbacks.onHudUpdate({
      world: this.level.world,
      level: this.level.level,
      levelName: this.level.name,
      theme: this.level.theme,
      hp: p.hp,
      maxHp: p.maxHp,
      lives: p.lives,
      coins: this.levelCoins,
      totalLevelCoins: this.totalLevelCoins,
      gems: this.levelGems,
      totalLevelGems: this.totalLevelGems,
      keysHeld: p.keysHeld,
      score: this.score,
      elapsedSec: Math.floor(this.elapsedSec),
      checkpointReached: this.checkpoints.some((c) => c.activated),
      activePowerUps: { ...p.activePowerUps },
      boss:
        this.boss && !this.boss.defeated && this.boss.introShown
          ? {
              active: true,
              name: this.boss.name,
              subtitle: this.boss.subtitle,
              hp: this.boss.hp,
              maxHp: this.boss.maxHp,
            }
          : null,
      tutorialHint: hint,
      secretFoundBanner: this.secretBannerText,
    });
  }

  private draw(): void {
    if (this.mode === 'attract') {
      this.renderer.renderBackgroundOnly(
        this.ctx,
        this.attractTheme,
        this.simTime * 35,
        this.viewW,
        this.viewH,
        this.simTime,
        this.settings.quality
      );
      if (this.settings.visualEffects) {
        this.particles.render(this.ctx, this.simTime * 35, 0);
      }
      return;
    }

    if (!this.level || !this.player) return;
    this.renderer.render(this.ctx, {
      level: this.level,
      player: this.player,
      platforms: this.platforms,
      enemies: this.enemies,
      boss: this.boss,
      projectiles: this.projectiles,
      collectibles: this.collectibles,
      powerUps: this.powerUps,
      checkpoints: this.checkpoints,
      hazards: this.level.hazards,
      particles: this.particles,
      camX: this.camera.x + this.shakeOffset.offsetX,
      camY: this.camera.y + this.shakeOffset.offsetY,
      viewW: this.viewW,
      viewH: this.viewH,
      time: this.simTime,
      quality: this.settings.quality,
      visualEffects: this.settings.visualEffects,
    });
  }
}
