import type { AchievementDef, GameSettings, KeyBindings, WorldInfo } from './types';

export const GAME_TITLE = 'JUMPVERSE';
export const GAME_TAGLINE = 'THE ADVENTURE NEVER ENDS';
export const GAME_DEVELOPER = 'SREEHARITM';
export const GAME_CREDIT = 'BUILT BY SREEHARITM';

export const SAVE_STORAGE_KEY = 'jumpverse_save_v1';
export const SAVE_VERSION = 1;

export const PHYSICS = {
  GRAVITY: 1680,
  MAX_FALL_SPEED: 880,
  MOVE_ACCEL: 2250,
  AIR_ACCEL: 1550,
  GROUND_FRICTION: 1850,
  ICE_FRICTION: 310,
  MAX_MOVE_SPEED: 295,
  SPEED_BOOST_MULT: 1.42,
  JUMP_VELOCITY: -625,
  DOUBLE_JUMP_VELOCITY: -565,
  JUMP_CUT_MULT: 0.46,
  COYOTE_TIME: 0.11,
  JUMP_BUFFER_TIME: 0.12,
  BOUNCE_VELOCITY: -835,
  PLAYER_W: 34,
  PLAYER_H: 48,
  MAX_DT: 0.05,
} as const;

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  left: 'KeyA',
  leftAlt: 'ArrowLeft',
  right: 'KeyD',
  rightAlt: 'ArrowRight',
  jump: 'Space',
  jumpAlt: 'KeyW',
  jumpAlt2: 'ArrowUp',
  attack: 'KeyJ',
  special: 'KeyK',
  pause: 'Escape',
  restart: 'KeyR',
  fullscreen: 'KeyF',
};

export const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.55,
  sfxVolume: 0.75,
  muted: false,
  quality: 'high',
  screenShake: true,
  visualEffects: true,
  joystickSize: 1,
  buttonSize: 1,
  buttonOpacity: 0.72,
  controlLayout: 'standard',
  alwaysShowTouch: false,
  difficulty: 'normal',
  showTutorial: true,
  vibration: true,
  keyBindings: { ...DEFAULT_KEY_BINDINGS },
};

export const WORLDS: WorldInfo[] = [
  {
    id: 1,
    theme: 'meadows',
    title: 'Green Meadows',
    description: 'Sunlit rolling hills, wooden bridges, gentle rivers, and bouncy slimes.',
    accentHex: '#22C55E',
    skyTop: '#38BDF8',
    skyBottom: '#BAE6FD',
    groundColor: '#6B4423',
    grassColor: '#22C55E',
    bossName: 'King Mossback',
  },
  {
    id: 2,
    theme: 'desert',
    title: 'Mystic Desert',
    description: 'Golden dunes, sandstone ruins, hidden vaults, and swift sand scarabs.',
    accentHex: '#F59E0B',
    skyTop: '#EA580C',
    skyBottom: '#FDE68A',
    groundColor: '#92400E',
    grassColor: '#F59E0B',
    bossName: 'Scarab Colossus',
  },
  {
    id: 3,
    theme: 'frozen',
    title: 'Frozen Kingdom',
    description: 'Glistening ice caverns, slick glaciers, snowstorms, and frost wisps.',
    accentHex: '#38BDF8',
    skyTop: '#0F172A',
    skyBottom: '#7DD3FC',
    groundColor: '#1E3A5F',
    grassColor: '#BAE6FD',
    bossName: 'Frostwing Yeti',
  },
  {
    id: 4,
    theme: 'volcanic',
    title: 'Volcanic Caverns',
    description: 'Obsidian ledges, bubbling magma lakes, falling stones, and fire imps.',
    accentHex: '#EF4444',
    skyTop: '#180B0B',
    skyBottom: '#7F1D1D',
    groundColor: '#27272A',
    grassColor: '#EF4444',
    bossName: 'Magma Titan',
  },
  {
    id: 5,
    theme: 'sky',
    title: 'Sky Castle',
    description: 'Floating cloud islands, twilight towers, golden bridges, and sky guardians.',
    accentHex: '#A855F7',
    skyTop: '#1E1B4B',
    skyBottom: '#F472B6',
    groundColor: '#4338CA',
    grassColor: '#E0E7FF',
    bossName: 'Astral Sky Sovereign',
  },
];

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_jump',
    title: 'First Jump',
    description: 'Complete the introductory adventure in Green Meadows.',
    icon: 'boots',
  },
  {
    id: 'coin_collector',
    title: 'Coin Collector',
    description: 'Amass 100 total Gold Coins across your adventures.',
    icon: 'coin',
  },
  {
    id: 'gem_hunter',
    title: 'Gem Hunter',
    description: 'Discover 15 rare Blue Gems tucked across the worlds.',
    icon: 'gem',
  },
  {
    id: 'world_explorer',
    title: 'World Explorer',
    description: 'Clear every level of an entire world.',
    icon: 'compass',
  },
  {
    id: 'boss_slayer',
    title: 'Boss Slayer',
    description: 'Defeat your first World Guardian boss.',
    icon: 'sword',
  },
  {
    id: 'perfect_level',
    title: 'Perfect Run',
    description: 'Earn 3 stars on any level with all major collectibles.',
    icon: 'star',
  },
  {
    id: 'jumpverse_master',
    title: 'Jumpverse Master',
    description: 'Complete all 25 levels across the five realms of Jumpverse.',
    icon: 'crown',
  },
];

export function levelKey(world: number, level: number): string {
  return `${world}-${level}`;
}
