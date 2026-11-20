import { ArrowRight, Compass, Home, Play, RotateCcw, Settings, Star, Trophy } from 'lucide-react';
import type { RunSnapshot } from '../game/types';
import { DeveloperBanner } from './BrandLogo';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onSettings: () => void;
  onMainMenu: () => void;
}

export function PauseModal({ onResume, onRestart, onSettings, onMainMenu }: PauseModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#040a17]/80 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Game Paused"
        className="w-full max-w-sm rounded-2xl border border-sky-400/40 bg-[#081733] p-6 text-center shadow-2xl"
      >
        <h2 className="font-display text-3xl font-bold tracking-wide text-amber-300">PAUSED</h2>
        <p className="mt-1 text-xs text-slate-300">Gameplay simulation is frozen</p>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-500 px-4 py-3 font-display text-base font-bold text-slate-950 hover:bg-emerald-400 cursor-pointer"
          >
            <Play className="h-4 w-4 fill-slate-950" />
            <span>RESUME</span>
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>RESTART</span>
          </button>
          <button
            type="button"
            onClick={onSettings}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700 cursor-pointer"
          >
            <Settings className="h-4 w-4" />
            <span>SETTINGS</span>
          </button>
          <button
            type="button"
            onClick={onMainMenu}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface LevelCompleteModalProps {
  snapshot: RunSnapshot;
  onNextLevel: () => void;
  onReplay: () => void;
  onWorldSelect: () => void;
}

export function LevelCompleteModal({
  snapshot,
  onNextLevel,
  onReplay,
  onWorldSelect,
}: LevelCompleteModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#040a17]/84 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Level Complete"
        className="w-full max-w-md rounded-2xl border border-amber-300/50 bg-[#081733] p-6 text-center shadow-2xl"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/20 text-amber-300">
          <Trophy className="h-6 w-6" />
        </div>
        <h2 className="mt-2 font-display text-3xl font-bold text-amber-300">
          {snapshot.isFinalVictory ? 'JUMPVERSE CHAMPION!' : 'LEVEL COMPLETE!'}
        </h2>
        <p className="mt-0.5 text-sm text-sky-200">
          Stage {snapshot.world}-{snapshot.level} · {snapshot.levelName}
        </p>

        {/* Stars */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <Star
              key={s}
              className={`h-8 w-8 ${
                s <= snapshot.stars ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Metrics */}
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-slate-700/80 bg-slate-900/80 p-3 text-center">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Score</p>
            <p className="font-mono-num text-lg font-bold text-white">{snapshot.score}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-amber-300">Coins</p>
            <p className="font-mono-num text-lg font-bold text-amber-200">
              {snapshot.coins}/{snapshot.totalCoins}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-sky-300">Gems</p>
            <p className="font-mono-num text-lg font-bold text-sky-200">
              {snapshot.gems}/{snapshot.totalGems}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          {!snapshot.isFinalVictory && snapshot.nextUnlocked && (
            <button
              type="button"
              data-start="true"
              onClick={onNextLevel}
              className="flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-gradient-to-b from-amber-400 to-orange-500 px-5 py-3 font-display text-base font-bold text-slate-950 hover:brightness-105 cursor-pointer"
            >
              <span>NEXT LEVEL</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onReplay}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm font-bold text-white hover:bg-slate-700 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>REPLAY</span>
            </button>
            <button
              type="button"
              onClick={onWorldSelect}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-sky-500/40 bg-[#0d2752] px-3 py-2.5 text-sm font-bold text-sky-100 hover:bg-[#143770] cursor-pointer"
            >
              <Compass className="h-4 w-4" />
              <span>WORLD SELECT</span>
            </button>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 flex justify-center">
          <DeveloperBanner compact />
        </div>
      </div>
    </div>
  );
}

interface GameOverModalProps {
  snapshot: RunSnapshot;
  onRetry: () => void;
  onMainMenu: () => void;
}

export function GameOverModal({ snapshot, onRetry, onMainMenu }: GameOverModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0a040a]/85 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Game Over"
        className="w-full max-w-md rounded-2xl border border-rose-500/50 bg-[#120a18] p-6 text-center shadow-2xl"
      >
        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-wide text-rose-400">
          GAME OVER
        </h2>
        <p className="mt-1 text-sm text-slate-300">
          Stage {snapshot.world}-{snapshot.level} · {snapshot.levelName}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-800 bg-slate-900/90 p-3.5">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Final Score</p>
            <p className="font-mono-num text-xl font-bold text-white">{snapshot.score}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-amber-300">Coins Collected</p>
            <p className="font-mono-num text-xl font-bold text-amber-200">{snapshot.coins}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            data-start="true"
            onClick={onRetry}
            className="flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-500 px-5 py-3 font-display text-base font-bold text-slate-950 hover:bg-emerald-400 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>RETRY</span>
          </button>
          <button
            type="button"
            onClick={onMainMenu}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>MAIN MENU</span>
          </button>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 flex justify-center">
          <DeveloperBanner compact />
        </div>
      </div>
    </div>
  );
}
