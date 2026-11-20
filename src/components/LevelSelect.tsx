import { ArrowLeft, Crown, Lock, Play, Star } from 'lucide-react';
import { WORLDS, levelKey } from '../game/config';
import { getWorldLevels } from '../game/levels';
import type { SaveData } from '../game/types';
import { DeveloperBanner } from './BrandLogo';

interface LevelSelectProps {
  worldId: number;
  save: SaveData;
  onSelectLevel: (worldId: number, levelNum: number) => void;
  onBack: () => void;
}

export function LevelSelect({ worldId, save, onSelectLevel, onBack }: LevelSelectProps) {
  const world = WORLDS.find((w) => w.id === worldId) ?? WORLDS[0];
  const levels = getWorldLevels(worldId);

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-[#061124]/94 px-4 py-5 sm:p-8 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Worlds</span>
        </button>

        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-sky-300">World {world.id}</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">{world.title}</h1>
        </div>

        <div className="hidden sm:block">
          <DeveloperBanner compact />
        </div>
      </div>

      <div className="mx-auto mt-6 grid w-full max-w-5xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
        {levels.map((lvl) => {
          const prog = save.levels[levelKey(lvl.world, lvl.level)];
          const unlocked = prog?.unlocked ?? false;
          const isBoss = Boolean(lvl.boss);

          return (
            <button
              key={lvl.level}
              type="button"
              disabled={!unlocked}
              onClick={() => onSelectLevel(lvl.world, lvl.level)}
              className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                unlocked
                  ? isBoss
                    ? 'border-rose-400/60 bg-[#220d19] hover:border-amber-300 hover:-translate-y-0.5 cursor-pointer shadow-lg'
                    : 'border-sky-400/35 bg-[#0a1d3d] hover:border-amber-300 hover:-translate-y-0.5 cursor-pointer shadow-lg'
                  : 'border-slate-800 bg-slate-950/75 opacity-60 cursor-not-allowed'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-num text-sm font-bold text-sky-300">
                    Stage {lvl.world}-{lvl.level}
                  </span>
                  {isBoss ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-300">
                      <Crown className="h-3.5 w-3.5" /> Boss Battle
                    </span>
                  ) : !unlocked ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                      <Lock className="h-3.5 w-3.5" /> Locked
                    </span>
                  ) : null}
                </div>

                <h2 className="mt-1.5 font-display text-xl font-bold text-white">{lvl.name}</h2>
                <p className="mt-1 text-xs text-slate-300">{lvl.subtitle}</p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                <div className="flex items-center gap-1" aria-label={`${prog?.stars ?? 0} of 3 stars`}>
                  {[1, 2, 3].map((s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${
                        s <= (prog?.stars ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="font-mono-num text-slate-300">
                    Best: {prog?.bestScore ?? 0}
                  </span>
                  {unlocked && (
                    <span className="inline-flex items-center gap-1 font-bold text-amber-300">
                      <Play className="h-3.5 w-3.5 fill-amber-300" /> Play
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
