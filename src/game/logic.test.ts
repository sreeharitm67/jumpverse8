import test from 'node:test';
import assert from 'node:assert/strict';
import { PHYSICS } from './config';
import { getAllLevels, getLevel } from './levels';
import { calculateLevelStars, stepPlayerPhysics, updatePlatforms } from './systems/PhysicsSystem';
import { createDefaultSave, recordLevelCompletion, sanitizeSaveData } from './systems/SaveManager';
import type { InputState, PlatformRuntime, PlayerState } from './types';

function makePlayer(x = 100, y = 400): PlayerState {
  return {
    x,
    y,
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
    hp: 4,
    maxHp: 4,
    lives: 3,
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
    respawnX: x,
    respawnY: y,
    keysHeld: 0,
    activePowerUps: {
      speed: 0,
      shield: 0,
      doubleJump: 0,
      invincibility: 0,
      specialAttack: 0,
    },
  };
}

function makePlatform(x: number, y: number, w: number, kind: PlatformRuntime['kind'] = 'solid'): PlatformRuntime {
  return {
    id: 'p_test',
    x,
    y,
    w,
    h: 30,
    kind,
    prevX: x,
    prevY: y,
    phase: 0,
    fallTriggered: false,
    fallTimer: 0.55,
    respawnTimer: 0,
    broken: false,
  };
}

const IDLE_INPUT: InputState = {
  moveX: 0,
  jumpHeld: false,
  jumpJustPressed: false,
  attackJustPressed: false,
  specialJustPressed: false,
};

test('all 25 levels exist across 5 worlds with unique names, safe spawns, and bosses on stage 5', () => {
  const levels = getAllLevels();
  assert.equal(levels.length, 25);

  const names = new Set<string>();
  for (let w = 1; w <= 5; w++) {
    for (let l = 1; l <= 5; l++) {
      const lvl = getLevel(w, l);
      assert.equal(lvl.world, w);
      assert.equal(lvl.level, l);
      assert.ok(!names.has(lvl.name), `Duplicate level name: ${lvl.name}`);
      names.add(lvl.name);

      // Verify spawn sits above a solid/ice platform wide enough to stand safely
      const spawnFootX = lvl.spawn.x + PHYSICS.PLAYER_W * 0.5;
      const support = lvl.platforms.find(
        (p) =>
          (p.kind === 'solid' || p.kind === 'ice') &&
          p.w >= 140 &&
          spawnFootX >= p.x &&
          spawnFootX <= p.x + p.w &&
          p.y >= lvl.spawn.y + PHYSICS.PLAYER_H - 4
      );
      assert.ok(support, `Level ${w}-${l} missing safe spawn ground`);

      if (l === 5) {
        assert.ok(lvl.boss, `Level ${w}-5 must have a boss`);
      }
    }
  }
});

test('player lands cleanly on ground and survives idle without falling through', () => {
  const player = makePlayer(100, 460);
  const platforms = [makePlatform(0, 540, 800, 'solid')];
  for (let i = 0; i < 120; i++) {
    stepPlayerPhysics(player, IDLE_INPUT, platforms, 1200, 1 / 60);
  }
  assert.equal(player.onGround, true);
  assert.equal(player.y + player.h, 540);
  assert.equal(player.vy, 0);
});

test('coyote time allows jumping shortly after stepping off a ledge', () => {
  const player = makePlayer(180, 540 - PHYSICS.PLAYER_H);
  player.onGround = true;
  player.coyoteTimer = PHYSICS.COYOTE_TIME;
  const platforms = [makePlatform(0, 540, 160, 'solid')];

  // Step 1 frame off ledge without pressing jump
  stepPlayerPhysics(player, IDLE_INPUT, platforms, 1000, 0.02);
  assert.equal(player.onGround, false);
  assert.ok(player.coyoteTimer > 0);

  // Press jump within coyote window
  const ev = stepPlayerPhysics(
    player,
    { ...IDLE_INPUT, jumpHeld: true, jumpJustPressed: true },
    platforms,
    1000,
    0.02
  );
  assert.equal(ev.jumped, true);
  assert.ok(player.vy < 0);
});

test('moving platforms update and carry standing player horizontally', () => {
  const plat = makePlatform(100, 400, 160, 'moving');
  plat.moveX = 120;
  plat.moveSpeed = 1.5;
  const player = makePlayer(140, 400 - PHYSICS.PLAYER_H);
  player.onGround = true;

  const startX = player.x;
  updatePlatforms([plat], 0.05);
  stepPlayerPhysics(player, IDLE_INPUT, [plat], 1000, 0.05);
  assert.ok(player.x > startX);
});

test('calculateLevelStars awards 1, 2, or 3 stars accurately', () => {
  assert.equal(
    calculateLevelStars({ coinsCollected: 0, totalCoins: 20, gemsCollected: 0, totalGems: 2, damageTaken: 3, elapsedSec: 90 }),
    1
  );
  assert.equal(
    calculateLevelStars({ coinsCollected: 15, totalCoins: 20, gemsCollected: 1, totalGems: 2, damageTaken: 3, elapsedSec: 60 }),
    2
  );
  assert.equal(
    calculateLevelStars({ coinsCollected: 20, totalCoins: 20, gemsCollected: 2, totalGems: 2, damageTaken: 1, elapsedSec: 45 }),
    3
  );
});

test('SaveManager sanitizes corrupted saves and unlocks progression and achievements', () => {
  const corrupted = sanitizeSaveData({ unlockedWorld: 99, totalCoins: -50, levels: 'bad' });
  assert.equal(corrupted.unlockedWorld, 5);
  assert.equal(corrupted.totalCoins, 0);
  assert.equal(corrupted.levels['1-1'].unlocked, true);

  let save = createDefaultSave();
  const r1 = recordLevelCompletion(save, {
    world: 1,
    level: 1,
    score: 1200,
    coins: 15,
    gems: 2,
    stars: 3,
    bossDefeated: false,
  });
  save = r1.nextSave;
  assert.equal(save.levels['1-2'].unlocked, true);
  assert.ok(save.achievements.includes('first_jump'));
  assert.ok(save.achievements.includes('perfect_level'));

  const rBoss = recordLevelCompletion(save, {
    world: 1,
    level: 5,
    score: 3000,
    coins: 90,
    gems: 1,
    stars: 2,
    bossDefeated: true,
  });
  assert.equal(rBoss.nextSave.unlockedWorld, 2);
  assert.equal(rBoss.nextSave.levels['2-1'].unlocked, true);
  assert.ok(rBoss.nextSave.achievements.includes('boss_slayer'));
  assert.ok(rBoss.nextSave.achievements.includes('coin_collector'));
});
