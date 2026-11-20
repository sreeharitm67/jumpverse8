export type WorldTheme = 'meadows' | 'desert' | 'frozen' | 'volcanic' | 'sky';

export type GameScreen =
  | 'loading'
  | 'menu'
  | 'worldSelect'
  | 'levelSelect'
  | 'playing'
  | 'paused'
  | 'levelComplete'
  | 'gameOver';

export type PlatformKind = 'solid' | 'oneway' | 'moving' | 'falling' | 'ice' | 'bounce' | 'bridge';

export interface PlatformDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: PlatformKind;
  moveX?: number;
  moveY?: number;
  moveSpeed?: number;
  secretWall?: boolean;
}

export type EnemyKind =
  | 'slime'
  | 'rollingBug'
  | 'flyingInsect'
  | 'jumper'
  | 'armored'
  | 'fireImp'
  | 'iceWisp'
  | 'skyGuardian';

export interface EnemyDef {
  id: string;
  kind: EnemyKind;
  x: number;
  y: number;
  patrolMinX: number;
  patrolMaxX: number;
  hp: number;
}

export type BossKind =
  | 'mossback'
  | 'scarab'
  | 'frostwing'
  | 'magmaTitan'
  | 'skySovereign';

export interface BossDef {
  kind: BossKind;
  name: string;
  subtitle: string;
  x: number;
  y: number;
  arenaMinX: number;
  arenaMaxX: number;
  maxHp: number;
}

export type CollectibleKind = 'coin' | 'gem' | 'star' | 'key' | 'chest';

export interface CollectibleDef {
  id: string;
  kind: CollectibleKind;
  x: number;
  y: number;
  inSecret?: boolean;
  requiresKey?: boolean;
}

export type PowerUpKind =
  | 'speed'
  | 'shield'
  | 'doubleJump'
  | 'extraHeart'
  | 'invincibility'
  | 'specialAttack';

export interface PowerUpDef {
  id: string;
  kind: PowerUpKind;
  x: number;
  y: number;
}

export type HazardKind = 'spikes' | 'lava' | 'water' | 'fallingStone' | 'void';

export interface HazardDef {
  id: string;
  kind: HazardKind;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CheckpointDef {
  id: string;
  x: number;
  y: number;
}

export interface SecretZoneDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

export interface LevelData {
  world: number; // 1..5
  level: number; // 1..5
  theme: WorldTheme;
  name: string;
  subtitle: string;
  width: number;
  height: number;
  spawn: { x: number; y: number };
  exit: { x: number; y: number };
  platforms: PlatformDef[];
  enemies: EnemyDef[];
  collectibles: CollectibleDef[];
  powerUps: PowerUpDef[];
  hazards: HazardDef[];
  checkpoints: CheckpointDef[];
  secretZones: SecretZoneDef[];
  boss?: BossDef;
  tutorial?: boolean;
}

export interface WorldInfo {
  id: number;
  theme: WorldTheme;
  title: string;
  description: string;
  accentHex: string;
  skyTop: string;
  skyBottom: string;
  groundColor: string;
  grassColor: string;
  bossName: string;
}

export type PlayerAnimState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'jump'
  | 'fall'
  | 'land'
  | 'attack'
  | 'special'
  | 'hurt'
  | 'defeated'
  | 'victory';

export interface PlayerState {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  onGround: boolean;
  onIce: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;
  jumpsRemaining: number;
  maxJumps: number;
  hp: number;
  maxHp: number;
  lives: number;
  invulnTimer: number;
  attackTimer: number;
  attackCooldown: number;
  specialCooldown: number;
  hurtTimer: number;
  landTimer: number;
  animState: PlayerAnimState;
  walkDist: number;
  scaleX: number;
  scaleY: number;
  respawnX: number;
  respawnY: number;
  keysHeld: number;
  activePowerUps: {
    speed: number;
    shield: number; // charges remaining
    doubleJump: number;
    invincibility: number;
    specialAttack: number;
  };
}

export interface PlatformRuntime extends PlatformDef {
  prevX: number;
  prevY: number;
  phase: number;
  fallTriggered: boolean;
  fallTimer: number;
  respawnTimer: number;
  broken: boolean;
}

export interface EnemyRuntime extends EnemyDef {
  w: number;
  h: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  onGround: boolean;
  stateTimer: number;
  telegraphTimer: number;
  hurtFlash: number;
  koTimer: number;
  dead: boolean;
  baseY: number;
  animPhase: number;
}

export interface BossRuntime extends BossDef {
  w: number;
  h: number;
  vx: number;
  vy: number;
  hp: number;
  facing: 1 | -1;
  onGround: boolean;
  phase: 'intro' | 'patrol' | 'telegraph' | 'attack' | 'vulnerable' | 'defeated';
  attackPattern: number;
  stateTimer: number;
  hurtFlash: number;
  introShown: boolean;
  defeated: boolean;
}

export interface ProjectileRuntime {
  id: number;
  fromPlayer: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  life: number;
  active: boolean;
}

export interface CollectibleRuntime extends CollectibleDef {
  collected: boolean;
  bobPhase: number;
}

export interface PowerUpRuntime extends PowerUpDef {
  collected: boolean;
  bobPhase: number;
}

export interface CheckpointRuntime extends CheckpointDef {
  activated: boolean;
  flagRise: number;
}

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  gravity: number;
}

export interface InputState {
  moveX: number; // -1..1 analog
  jumpHeld: boolean;
  jumpJustPressed: boolean;
  attackJustPressed: boolean;
  specialJustPressed: boolean;
}

export type GraphicsQuality = 'low' | 'medium' | 'high';
export type DifficultyMode = 'casual' | 'normal' | 'heroic';
export type ControlLayout = 'standard' | 'compact' | 'wide';

export interface KeyBindings {
  left: string;
  leftAlt: string;
  right: string;
  rightAlt: string;
  jump: string;
  jumpAlt: string;
  jumpAlt2: string;
  attack: string;
  special: string;
  pause: string;
  restart: string;
  fullscreen: string;
}

export interface GameSettings {
  musicVolume: number; // 0..1
  sfxVolume: number; // 0..1
  muted: boolean;
  quality: GraphicsQuality;
  screenShake: boolean;
  visualEffects: boolean;
  joystickSize: number; // 0.75..1.35
  buttonSize: number; // 0.75..1.35
  buttonOpacity: number; // 0.35..0.95
  controlLayout: ControlLayout;
  alwaysShowTouch: boolean;
  difficulty: DifficultyMode;
  showTutorial: boolean;
  vibration: boolean;
  keyBindings: KeyBindings;
}

export interface LevelProgress {
  unlocked: boolean;
  completed: boolean;
  stars: number; // 0..3
  bestScore: number;
  bestCoins: number;
  bestGems: number;
}

export interface SaveData {
  version: number;
  unlockedWorld: number;
  lastWorld: number;
  lastLevel: number;
  totalCoins: number;
  totalGems: number;
  levels: Record<string, LevelProgress>; // key: "w-l", e.g. "1-1"
  achievements: string[];
  tutorialCompleted: boolean;
  settings: GameSettings;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface HudState {
  world: number;
  level: number;
  levelName: string;
  theme: WorldTheme;
  hp: number;
  maxHp: number;
  lives: number;
  coins: number;
  totalLevelCoins: number;
  gems: number;
  totalLevelGems: number;
  keysHeld: number;
  score: number;
  elapsedSec: number;
  checkpointReached: boolean;
  activePowerUps: {
    speed: number;
    shield: number;
    doubleJump: number;
    invincibility: number;
    specialAttack: number;
  };
  boss: {
    active: boolean;
    name: string;
    subtitle: string;
    hp: number;
    maxHp: number;
  } | null;
  tutorialHint: string | null;
  secretFoundBanner: string | null;
}

export interface RunSnapshot {
  world: number;
  level: number;
  levelName: string;
  score: number;
  bestScore: number;
  coins: number;
  totalCoins: number;
  gems: number;
  totalGems: number;
  stars: number;
  elapsedSec: number;
  damageTaken: number;
  bossDefeated: boolean;
  nextUnlocked: { world: number; level: number } | null;
  isFinalVictory: boolean;
}
