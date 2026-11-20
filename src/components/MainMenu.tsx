import { BookOpen, Compass, Info, Play, RotateCw, Settings } from 'lucide-react';
import { BrandLogo, DeveloperBanner } from './BrandLogo';
import type { SaveData } from '../game/types';

interface MainMenuProps {
  save: SaveData;
  onPlay: () => void;
  onContinue: () => void;
  onWorldSelect: () => void;
  onSettings: () => void;
  onHowToPlay: () => void;
  onCredits: () => void;
}

export function MainMenu({
  save,
  onPlay,
  onContinue,
  onWorldSelect,
  onSettings,
  onHowToPlay,
  onCredits,
}: MainMenuProps) {
  const hasProgress = save.lastWorld > 1 || save.lastLevel > 1 || save.levels['1-1']?.completed;

  return (
    <div className="fixed inset-0 z-30 flex flex-col items-center justify-between px-4 py-5 sm:py-8 overflow-y-auto">
      {/* Top Safe Spacer + Developer Banner */}
      <div className="flex w-full max-w-4xl items-center justify-between gap-4">
        <DeveloperBanner />
        <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-sky-100/90 drop-shadow">
          <span className="font-mono-num">Coins {save.totalCoins}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-num">Gems {save.totalGems}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-num">Achievements {save.achievements.length}/7</span>
        </div>
      </div>

      {/* Center Focal Lockup & Menu Actions */}
      <div className="my-auto flex w-full max-w-xl flex-col items-center py-4">
        <BrandLogo size="lg" />

        <div className="mt-7 w-full rounded-2xl border border-sky-400/30 bg-[#07142b]/88 p-4 sm:p-6 shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              data-start="true"
              onClick={onPlay}
              className="sm:col-span-2 flex items-center justify-center gap-2.5 rounded-xl border-2 border-amber-300 bg-gradient-to-b from-amber-400 to-orange-500 px-6 py-3.5 font-display text-lg sm:text-xl font-bold tracking-wide text-slate-950 shadow-lg hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Play className="h-5 w-5 fill-slate-950" />
              <span>PLAY</span>
            </button>

            <button
              type="button"
              onClick={onContinue}
              className="flex items-center justify-center gap-2 rounded-xl border border-sky-400/50 bg-[#0d2752] px-4 py-3 font-display text-base font-bold text-sky-100 hover:bg-[#143770] active:scale-[0.98] transition-all cursor-pointer"
            >
              <RotateCw className="h-4 w-4 text-sky-300" />
              <span>{hasProgress ? `CONTINUE (${save.lastWorld}-${save.lastLevel})` : 'CONTINUE'}</span>
            </button>

            <button
              type="button"
              onClick={onWorldSelect}
              className="flex items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-[#0c2d36] px-4 py-3 font-display text-base font-bold text-emerald-100 hover:bg-[#12414d] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Compass className="h-4 w-4 text-emerald-300" />
              <span>WORLD SELECT</span>
            </button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={onSettings}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <Settings className="h-4 w-4 text-sky-300" />
              <span>SETTINGS</span>
            </button>
            <button
              type="button"
              onClick={onHowToPlay}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <BookOpen className="h-4 w-4 text-amber-300" />
              <span>HOW TO PLAY</span>
            </button>
            <button
              type="button"
              onClick={onCredits}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <Info className="h-4 w-4 text-purple-300" />
              <span>CREDITS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Flat Control Hint Line */}
      <p className="text-center text-xs font-medium text-sky-100/85 drop-shadow">
        A/D or Arrows Move · Space/W Jump · J Attack · K Special · Esc Pause · F Fullscreen
      </p>
    </div>
  );
}
