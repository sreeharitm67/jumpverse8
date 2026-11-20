import { ArrowLeft, Lock, Star } from 'lucide-react';
import { WORLDS, levelKey } from '../game/config';
import type { SaveData, WorldInfo } from '../game/types';
import { DeveloperBanner } from './BrandLogo';

interface WorldSelectProps {
  save: SaveData;
  onSelectWorld: (worldId: number) => void;
  onBack: () => void;
}

function WorldEmblem({ world }: { world: WorldInfo }) {
  return (
    <div
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-white/20 shadow-inner"
      style={{
        background: `linear-gradient(160deg, ${world.skyTop}, ${world.skyBottom})`,
      }}
    >
      <svg viewBox="0 0 48 48" className="h-11 w-11" aria-hidden="true">
        {world.theme === 'meadows' && (
          <>
            <path d="M4 38 Q16 24 28 32 T44 36 L44 44 L4 44 Z" fill="#16A34A" />
            <circle cx="16" cy="18" r="7" fill="#22C55E" />
            <rect x="14" y="23" width="4" height="10" fill="#78350F" />
          </>
        )}
        {world.theme === 'desert' && (
          <>
            <polygon points="10,38 22,14 34,38" fill="#D97706" />
            <polygon points="24,38 34,20 44,38" fill="#B45309" />
            <circle cx="35" cy="12" r="5" fill="#FEF08A" />
          </>
        )}
        {world.theme === 'frozen' && (
          <>
            <polygon points="6,38 18,12 30,38" fill="#E0F2FE" />
            <polygon points="20,38 32,16 44,38" fill="#7DD3FC" />
          </>
        )}
        {world.theme === 'volcanic' && (
          <>
            <polygon points="8,40 19,14 29,14 40,40" fill="#27272A" />
            <path d="M20 14 L24 24 L28 14 Z" fill="#FB923C" />
            <rect x="4" y="38" width="40" height="6" fill="#EF4444" />
          </>
        )}
        {world.theme === 'sky' && (
          <>
            <rect x="16" y="16" width="16" height="18" fill="#E0E7FF" rx="2" />
            <polygon points="14,16 24,6 34,16" fill="#A855F7" />
            <ellipse cx="24" cy="36" rx="16" ry="5" fill="#FFFFFF" />
          </>
        )}
      </svg>
    </div>
  );
}

export function WorldSelect({ save, onSelectWorld, onBack }: WorldSelectProps) {
  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-[#061124]/92 px-4 py-5 sm:p-8 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Main Menu</span>
        </button>

        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-wide text-amber-300">
          SELECT WORLD
        </h1>

        <div className="hidden sm:block">
          <DeveloperBanner compact />
        </div>
      </div>

      <div className="mx-auto mt-6 grid w-full max-w-5xl grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
        {WORLDS.map((w) => {
          const unlocked = w.id <= save.unlockedWorld;
          let completedCount = 0;
          let starsEarned = 0;
          for (let l = 1; l <= 5; l++) {
            const p = save.levels[levelKey(w.id, l)];
            if (p?.completed) completedCount += 1;
            starsEarned += p?.stars ?? 0;
          }
          const pct = Math.round((completedCount / 5) * 100);

          return (
            <button
              key={w.id}
              type="button"
              disabled={!unlocked}
              onClick={() => onSelectWorld(w.id)}
              className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                unlocked
                  ? 'border-sky-400/35 bg-[#0a1d3d] hover:border-amber-300/70 hover:-translate-y-0.5 cursor-pointer shadow-lg'
                  : 'border-slate-800 bg-slate-950/75 opacity-65 cursor-not-allowed'
              }`}
            >
              <div>
                <div className="flex items-start gap-3.5">
                  <WorldEmblem world={w} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-num text-xs font-bold uppercase tracking-wider text-sky-300">
                        World {w.id}
                      </span>
                      {!unlocked && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                          <Lock className="h-3.5 w-3.5" /> Locked
                        </span>
                      )}
                    </div>
                    <h2 className="mt-0.5 font-display text-xl font-bold text-white truncate">{w.title}</h2>
                    <p className="mt-1 text-xs leading-relaxed text-slate-300">{w.description}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-mono-num">{completedCount}/5 Levels ({pct}%)</span>
                  <span className="inline-flex items-center gap-1 font-mono-num text-amber-300">
                    <Star className="h-3.5 w-3.5 fill-amber-300" /> {starsEarned}/15
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-900">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: w.accentHex }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
