import { PHYSICS } from '../config';
import type { InputState, PlatformRuntime, PlayerState } from '../types';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function updatePlatforms(platforms: PlatformRuntime[], dt: number): void {
  for (let i = 0; i < platforms.length; i++) {
    const p = platforms[i];
    p.prevX = p.x;
    p.prevY = p.y;

    if (p.kind === 'moving') {
      const speed = p.moveSpeed ?? 1.5;
      p.phase += dt * speed;
      if (p.moveX) {
        const velX = Math.cos(p.phase) * p.moveX * speed;
        p.x += velX * dt;
      }
      if (p.moveY) {
        const velY = Math.cos(p.phase) * p.moveY * speed;
        p.y += velY * dt;
      }
    } else if (p.kind === 'falling') {
      if (p.fallTriggered && !p.broken) {
        p.fallTimer -= dt;
        if (p.fallTimer <= 0) {
          p.broken = true;
          p.respawnTimer = 3.0;
        }
      } else if (p.broken) {
        p.respawnTimer -= dt;
        if (p.respawnTimer <= 0) {
          p.broken = false;
          p.fallTriggered = false;
          p.fallTimer = 0.55;
        }
      }
    }
  }
}

export interface PhysicsStepEvents {
  jumped: boolean;
  doubleJumped: boolean;
  bounced: boolean;
  landed: boolean;
  landingImpactVy: number;
}

export function stepPlayerPhysics(
  player: PlayerState,
  input: InputState,
  platforms: PlatformRuntime[],
  levelWidth: number,
  dt: number
): PhysicsStepEvents {
  const events: PhysicsStepEvents = {
    jumped: false,
    doubleJumped: false,
    bounced: false,
    landed: false,
    landingImpactVy: 0,
  };

  const wasOnGround = player.onGround;
  const speedMult = player.activePowerUps.speed > 0 ? PHYSICS.SPEED_BOOST_MULT : 1;
  const maxSpeed = PHYSICS.MAX_MOVE_SPEED * speedMult;

  // Horizontal movement with acceleration & surface friction
  const moveDir = Math.abs(input.moveX) > 0.08 ? input.moveX : 0;
  if (moveDir !== 0) {
    player.facing = moveDir > 0 ? 1 : -1;
    const accel = player.onGround
      ? (player.onIce ? PHYSICS.MOVE_ACCEL * 0.48 : PHYSICS.MOVE_ACCEL)
      : PHYSICS.AIR_ACCEL;
    player.vx += moveDir * accel * dt;
    const cap = maxSpeed * Math.min(1, Math.abs(moveDir) * 1.15);
    if (player.vx > cap) player.vx = cap;
    if (player.vx < -cap) player.vx = -cap;
  } else {
    const friction = player.onGround
      ? (player.onIce ? PHYSICS.ICE_FRICTION : PHYSICS.GROUND_FRICTION)
      : PHYSICS.GROUND_FRICTION * 0.25;
    if (player.vx > 0) {
      player.vx = Math.max(0, player.vx - friction * dt);
    } else if (player.vx < 0) {
      player.vx = Math.min(0, player.vx + friction * dt);
    }
  }

  // Coyote time & jump buffering
  if (player.onGround) {
    player.coyoteTimer = PHYSICS.COYOTE_TIME;
    player.jumpsRemaining = player.activePowerUps.doubleJump > 0 ? 2 : 1;
  } else {
    player.coyoteTimer = Math.max(0, player.coyoteTimer - dt);
  }

  if (input.jumpJustPressed) {
    player.jumpBufferTimer = PHYSICS.JUMP_BUFFER_TIME;
  } else {
    player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - dt);
  }

  // Execute Jump (Ground / Coyote) or Double Jump
  if (player.jumpBufferTimer > 0) {
    if (player.coyoteTimer > 0) {
      player.vy = PHYSICS.JUMP_VELOCITY;
      player.onGround = false;
      player.coyoteTimer = 0;
      player.jumpBufferTimer = 0;
      player.jumpsRemaining = player.activePowerUps.doubleJump > 0 ? 1 : 0;
      player.scaleX = 0.84;
      player.scaleY = 1.2;
      events.jumped = true;
    } else if (player.jumpsRemaining > 0 && player.activePowerUps.doubleJump > 0) {
      player.vy = PHYSICS.DOUBLE_JUMP_VELOCITY;
      player.jumpsRemaining -= 1;
      player.jumpBufferTimer = 0;
      player.scaleX = 0.86;
      player.scaleY = 1.18;
      events.doubleJumped = true;
    }
  }

  // Variable jump height cut when jump button released early
  if (!input.jumpHeld && player.vy < -160) {
    player.vy *= Math.pow(PHYSICS.JUMP_CUT_MULT, dt * 12);
  }

  // Gravity
  player.vy = Math.min(PHYSICS.MAX_FALL_SPEED, player.vy + PHYSICS.GRAVITY * dt);

  // Horizontal integration & solid wall collision
  player.x += player.vx * dt;
  if (player.x < 8) {
    player.x = 8;
    player.vx = Math.max(0, player.vx);
  }
  if (player.x + player.w > levelWidth - 8) {
    player.x = levelWidth - 8 - player.w;
    player.vx = Math.min(0, player.vx);
  }

  for (let i = 0; i < platforms.length; i++) {
    const p = platforms[i];
    if (p.broken || p.kind === 'oneway' || p.kind === 'bridge') continue;
    if (rectsOverlap({ x: player.x, y: player.y, w: player.w, h: player.h }, p)) {
      if (player.vx > 0) {
        player.x = p.x - player.w;
        player.vx = 0;
      } else if (player.vx < 0) {
        player.x = p.x + p.w;
        player.vx = 0;
      }
    }
  }

  // Vertical integration & ground/ceiling collision
  const prevBottom = player.y + player.h;
  player.y += player.vy * dt;
  player.onGround = false;
  player.onIce = false;

  let standingPlatform: PlatformRuntime | null = null;

  for (let i = 0; i < platforms.length; i++) {
    const p = platforms[i];
    if (p.broken) continue;

    const horizOverlap = player.x + player.w > p.x + 2 && player.x < p.x + p.w - 2;
    if (!horizOverlap) continue;

    if (p.kind === 'oneway' || p.kind === 'bridge') {
      // Land only when descending and previous bottom was above or near platform top
      if (player.vy >= 0 && prevBottom <= p.y + 12 && player.y + player.h >= p.y) {
        player.y = p.y - player.h;
        if (!wasOnGround && player.vy > 140) {
          events.landed = true;
          events.landingImpactVy = player.vy;
        }
        player.vy = 0;
        player.onGround = true;
        standingPlatform = p;
      }
      continue;
    }

    if (rectsOverlap({ x: player.x, y: player.y, w: player.w, h: player.h }, p)) {
      if (player.vy >= 0) {
        player.y = p.y - player.h;
        if (p.kind === 'bounce') {
          player.vy = PHYSICS.BOUNCE_VELOCITY;
          player.onGround = false;
          player.scaleX = 0.78;
          player.scaleY = 1.26;
          events.bounced = true;
        } else {
          if (!wasOnGround && player.vy > 140) {
            events.landed = true;
            events.landingImpactVy = player.vy;
          }
          player.vy = 0;
          player.onGround = true;
          player.onIce = p.kind === 'ice';
          standingPlatform = p;
          if (p.kind === 'falling' && !p.fallTriggered) {
            p.fallTriggered = true;
            p.fallTimer = 0.55;
          }
        }
      } else if (player.vy < 0) {
        player.y = p.y + p.h;
        player.vy = 0;
      }
    }
  }

  // Carry player with moving platform
  if (standingPlatform && standingPlatform.kind === 'moving') {
    player.x += standingPlatform.x - standingPlatform.prevX;
    player.y += standingPlatform.y - standingPlatform.prevY;
  }

  // Squash & stretch recovery
  const damp = 1 - Math.exp(-14 * dt);
  if (events.landed) {
    player.scaleX = 1.22;
    player.scaleY = 0.78;
    player.landTimer = 0.14;
  } else {
    player.scaleX += (1 - player.scaleX) * damp;
    player.scaleY += (1 - player.scaleY) * damp;
  }

  // Walk cycle synced to actual distance traveled
  if (player.onGround && Math.abs(player.vx) > 12) {
    player.walkDist += Math.abs(player.vx) * dt;
  }

  return events;
}

export function calculateLevelStars(params: {
  coinsCollected: number;
  totalCoins: number;
  gemsCollected: number;
  totalGems: number;
  damageTaken: number;
  elapsedSec: number;
}): number {
  let stars = 1; // Always at least 1 star for completing the level
  const coinRatio = params.totalCoins > 0 ? params.coinsCollected / params.totalCoins : 1;
  const gemRatio = params.totalGems > 0 ? params.gemsCollected / params.totalGems : 1;
  if (coinRatio >= 0.65 || gemRatio >= 0.5) stars += 1;
  if (coinRatio >= 0.85 && gemRatio >= 1 && params.damageTaken <= 2) stars += 1;
  return Math.min(3, stars);
}
