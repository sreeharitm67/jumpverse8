import {
  DEFAULT_KEY_BINDINGS,
  DEFAULT_SETTINGS,
  SAVE_STORAGE_KEY,
  SAVE_VERSION,
  levelKey,
} from '../config';
import type { GameSettings, LevelProgress, SaveData } from '../types';

export function createDefaultSave(): SaveData {
  const levels: Record<string, LevelProgress> = {};
  for (let w = 1; w <= 5; w++) {
    for (let l = 1; l <= 5; l++) {
      levels[levelKey(w, l)] = {
        unlocked: w === 1 && l === 1,
        completed: false,
        stars: 0,
        bestScore: 0,
        bestCoins: 0,
        bestGems: 0,
      };
    }
  }
  return {
    version: SAVE_VERSION,
    unlockedWorld: 1,
    lastWorld: 1,
    lastLevel: 1,
    totalCoins: 0,
    totalGems: 0,
    levels,
    achievements: [],
    tutorialCompleted: false,
    settings: {
      ...DEFAULT_SETTINGS,
      keyBindings: { ...DEFAULT_KEY_BINDINGS },
    },
  };
}

function clamp(n: unknown, min: number, max: number, fallback: number): number {
  if (typeof n !== 'number' || Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export function sanitizeSaveData(raw: unknown): SaveData {
  const base = createDefaultSave();
  if (!raw || typeof raw !== 'object') return base;
  const obj = raw as Record<string, unknown>;

  const unlockedWorld = Math.round(clamp(obj.unlockedWorld, 1, 5, 1));
  const lastWorld = Math.round(clamp(obj.lastWorld, 1, 5, 1));
  const lastLevel = Math.round(clamp(obj.lastLevel, 1, 5, 1));
  const totalCoins = Math.max(0, Math.round(clamp(obj.totalCoins, 0, 9999999, 0)));
  const totalGems = Math.max(0, Math.round(clamp(obj.totalGems, 0, 9999999, 0)));

  const rawLevels = (obj.levels && typeof obj.levels === 'object' ? obj.levels : {}) as Record<string, unknown>;
  for (let w = 1; w <= 5; w++) {
    for (let l = 1; l <= 5; l++) {
      const k = levelKey(w, l);
      const item = rawLevels[k];
      if (item && typeof item === 'object') {
        const rec = item as Record<string, unknown>;
        base.levels[k] = {
          unlocked: Boolean(rec.unlocked) || (w === 1 && l === 1),
          completed: Boolean(rec.completed),
          stars: Math.round(clamp(rec.stars, 0, 3, 0)),
          bestScore: Math.max(0, Math.round(clamp(rec.bestScore, 0, 9999999, 0))),
          bestCoins: Math.max(0, Math.round(clamp(rec.bestCoins, 0, 9999, 0))),
          bestGems: Math.max(0, Math.round(clamp(rec.bestGems, 0, 9999, 0))),
        };
      }
    }
  }

  const rawSettings = (obj.settings && typeof obj.settings === 'object' ? obj.settings : {}) as Record<string, unknown>;
  const rawKeys = (rawSettings.keyBindings && typeof rawSettings.keyBindings === 'object'
    ? rawSettings.keyBindings
    : {}) as Record<string, unknown>;

  const settings: GameSettings = {
    musicVolume: clamp(rawSettings.musicVolume, 0, 1, DEFAULT_SETTINGS.musicVolume),
    sfxVolume: clamp(rawSettings.sfxVolume, 0, 1, DEFAULT_SETTINGS.sfxVolume),
    muted: Boolean(rawSettings.muted),
    quality:
      rawSettings.quality === 'low' || rawSettings.quality === 'medium' || rawSettings.quality === 'high'
        ? rawSettings.quality
        : DEFAULT_SETTINGS.quality,
    screenShake: rawSettings.screenShake !== undefined ? Boolean(rawSettings.screenShake) : DEFAULT_SETTINGS.screenShake,
    visualEffects:
      rawSettings.visualEffects !== undefined ? Boolean(rawSettings.visualEffects) : DEFAULT_SETTINGS.visualEffects,
    joystickSize: clamp(rawSettings.joystickSize, 0.75, 1.35, DEFAULT_SETTINGS.joystickSize),
    buttonSize: clamp(rawSettings.buttonSize, 0.75, 1.35, DEFAULT_SETTINGS.buttonSize),
    buttonOpacity: clamp(rawSettings.buttonOpacity, 0.35, 0.95, DEFAULT_SETTINGS.buttonOpacity),
    controlLayout:
      rawSettings.controlLayout === 'standard' ||
      rawSettings.controlLayout === 'compact' ||
      rawSettings.controlLayout === 'wide'
        ? rawSettings.controlLayout
        : DEFAULT_SETTINGS.controlLayout,
    alwaysShowTouch: Boolean(rawSettings.alwaysShowTouch),
    difficulty:
      rawSettings.difficulty === 'casual' || rawSettings.difficulty === 'normal' || rawSettings.difficulty === 'heroic'
        ? rawSettings.difficulty
        : DEFAULT_SETTINGS.difficulty,
    showTutorial: rawSettings.showTutorial !== undefined ? Boolean(rawSettings.showTutorial) : DEFAULT_SETTINGS.showTutorial,
    vibration: rawSettings.vibration !== undefined ? Boolean(rawSettings.vibration) : DEFAULT_SETTINGS.vibration,
    keyBindings: {
      left: typeof rawKeys.left === 'string' ? rawKeys.left : DEFAULT_KEY_BINDINGS.left,
      leftAlt: typeof rawKeys.leftAlt === 'string' ? rawKeys.leftAlt : DEFAULT_KEY_BINDINGS.leftAlt,
      right: typeof rawKeys.right === 'string' ? rawKeys.right : DEFAULT_KEY_BINDINGS.right,
      rightAlt: typeof rawKeys.rightAlt === 'string' ? rawKeys.rightAlt : DEFAULT_KEY_BINDINGS.rightAlt,
      jump: typeof rawKeys.jump === 'string' ? rawKeys.jump : DEFAULT_KEY_BINDINGS.jump,
      jumpAlt: typeof rawKeys.jumpAlt === 'string' ? rawKeys.jumpAlt : DEFAULT_KEY_BINDINGS.jumpAlt,
      jumpAlt2: typeof rawKeys.jumpAlt2 === 'string' ? rawKeys.jumpAlt2 : DEFAULT_KEY_BINDINGS.jumpAlt2,
      attack: typeof rawKeys.attack === 'string' ? rawKeys.attack : DEFAULT_KEY_BINDINGS.attack,
      special: typeof rawKeys.special === 'string' ? rawKeys.special : DEFAULT_KEY_BINDINGS.special,
      pause: typeof rawKeys.pause === 'string' ? rawKeys.pause : DEFAULT_KEY_BINDINGS.pause,
      restart: typeof rawKeys.restart === 'string' ? rawKeys.restart : DEFAULT_KEY_BINDINGS.restart,
      fullscreen: typeof rawKeys.fullscreen === 'string' ? rawKeys.fullscreen : DEFAULT_KEY_BINDINGS.fullscreen,
    },
  };

  const achievements = Array.isArray(obj.achievements)
    ? obj.achievements.filter((a): a is string => typeof a === 'string')
    : [];

  return {
    version: SAVE_VERSION,
    unlockedWorld,
    lastWorld,
    lastLevel,
    totalCoins,
    totalGems,
    levels: base.levels,
    achievements: Array.from(new Set(achievements)),
    tutorialCompleted: Boolean(obj.tutorialCompleted),
    settings,
  };
}

export function loadSave(): SaveData {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return createDefaultSave();
    const raw = window.localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) {
      const def = createDefaultSave();
      persistSave(def);
      return def;
    }
    return sanitizeSaveData(JSON.parse(raw));
  } catch {
    return createDefaultSave();
  }
}

export function persistSave(save: SaveData): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(save));
    }
  } catch {
    // Ignore storage quota or private browsing errors gracefully
  }
}

export function recordLevelCompletion(
  save: SaveData,
  params: {
    world: number;
    level: number;
    score: number;
    coins: number;
    gems: number;
    stars: number;
    bossDefeated: boolean;
  }
): { nextSave: SaveData; newlyUnlockedAchievements: string[]; nextLevel: { world: number; level: number } | null } {
  const next: SaveData = {
    ...save,
    levels: { ...save.levels },
    achievements: [...save.achievements],
    settings: { ...save.settings, keyBindings: { ...save.settings.keyBindings } },
  };

  const key = levelKey(params.world, params.level);
  const prev = next.levels[key] ?? {
    unlocked: true,
    completed: false,
    stars: 0,
    bestScore: 0,
    bestCoins: 0,
    bestGems: 0,
  };

  const coinDelta = Math.max(0, params.coins);
  const gemDelta = Math.max(0, params.gems);
  next.totalCoins += coinDelta;
  next.totalGems += gemDelta;

  next.levels[key] = {
    unlocked: true,
    completed: true,
    stars: Math.max(prev.stars, params.stars),
    bestScore: Math.max(prev.bestScore, params.score),
    bestCoins: Math.max(prev.bestCoins, params.coins),
    bestGems: Math.max(prev.bestGems, params.gems),
  };

  let nextLevel: { world: number; level: number } | null = null;
  if (params.level < 5) {
    nextLevel = { world: params.world, level: params.level + 1 };
  } else if (params.world < 5) {
    nextLevel = { world: params.world + 1, level: 1 };
    next.unlockedWorld = Math.max(next.unlockedWorld, params.world + 1);
  }

  if (nextLevel) {
    const nk = levelKey(nextLevel.world, nextLevel.level);
    const nPrev = next.levels[nk];
    next.levels[nk] = {
      unlocked: true,
      completed: nPrev?.completed ?? false,
      stars: nPrev?.stars ?? 0,
      bestScore: nPrev?.bestScore ?? 0,
      bestCoins: nPrev?.bestCoins ?? 0,
      bestGems: nPrev?.bestGems ?? 0,
    };
    next.lastWorld = nextLevel.world;
    next.lastLevel = nextLevel.level;
  } else {
    next.lastWorld = params.world;
    next.lastLevel = params.level;
  }

  if (params.world === 1 && params.level === 1) {
    next.tutorialCompleted = true;
  }

  // Evaluate achievements
  const newlyUnlockedAchievements: string[] = [];
  const grant = (id: string) => {
    if (!next.achievements.includes(id)) {
      next.achievements.push(id);
      newlyUnlockedAchievements.push(id);
    }
  };

  if (params.world === 1 && params.level === 1) grant('first_jump');
  if (next.totalCoins >= 100) grant('coin_collector');
  if (next.totalGems >= 15) grant('gem_hunter');
  if (params.stars >= 3) grant('perfect_level');
  if (params.bossDefeated) grant('boss_slayer');

  for (let w = 1; w <= 5; w++) {
    let allDone = true;
    for (let l = 1; l <= 5; l++) {
      if (!next.levels[levelKey(w, l)]?.completed) {
        allDone = false;
        break;
      }
    }
    if (allDone) {
      grant('world_explorer');
      break;
    }
  }

  let all25 = true;
  for (let w = 1; w <= 5; w++) {
    for (let l = 1; l <= 5; l++) {
      if (!next.levels[levelKey(w, l)]?.completed) {
        all25 = false;
        break;
      }
    }
  }
  if (all25) grant('jumpverse_master');

  persistSave(next);
  return { nextSave: next, newlyUnlockedAchievements, nextLevel };
}

export function resetSaveProgress(keepSettings = true): SaveData {
  const prev = loadSave();
  const fresh = createDefaultSave();
  if (keepSettings) {
    fresh.settings = prev.settings;
  }
  persistSave(fresh);
  return fresh;
}
