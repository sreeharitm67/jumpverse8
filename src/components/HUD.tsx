import { Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { WORLDS } from '../game/config';
import type { HudState } from '../game/types';

interface HUDProps {
  hud: HudState | null;
  muted: boolean;
  onPause: () => void;
  onRestart: () => void;
  onToggleMute: () => void;
  onSkipTutorial: () => void;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true">
      <path
        d="M12 21s-7.2-4.6-9.4-8.8C.9 9 2.4 5.2 6 4.4c2.1-.5 4.4.4 6 2.3 1.6-1.9 3.9-2.8 6-2.3 3.6.8 5.1 4.6 3.4 7.8C19.2 16.4 12 21 12 21z"
        fill={filled ? '#EF4444' : 'rgba(15,23,42,0.75)'}
        stroke="#0F172A"
        strokeWidth="2"
      />
      {filled && (
        <path
          d="M6.4 7.3c.7-.9 1.8-1.2 2.7-.8"
          stroke="#FCA5A5"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </svg>
  );
}

export function HUD({
  hud,
  muted,
  onPause,
  onRestart,
  onToggleMute,
  onSkipTutorial,
}: HUDProps) {
  if (!hud) return null;
  const worldInfo = WORLDS.find((w) => w.id === hud.world) ?? WORLDS[0];

  const activeBoosts: Array<{ label: string; value: string; color: string }> = [];
  if (hud.activePowerUps.speed > 0) {
    activeBoosts.push({ label: 'SPD', value: `${Math.ceil(hud.activePowerUps.speed)}s`, color: 'bg-sky-600' });
  }
  if (hud.activePowerUps.shield > 0) {
    activeBoosts.push({ label: 'SHD', value: `x${hud.activePowerUps.shield}`, color: 'bg-emerald-600' });
  }
  if (hud.activePowerUps.doubleJump > 0) {
    activeBoosts.push({ label: '2X', value: `${Math.ceil(hud.activePowerUps.doubleJump)}s`, color: 'bg-purple-600' });
  }
  if (hud.activePowerUps.invincibility > 0) {
    activeBoosts.push({ label: 'INV', value: `${Math.ceil(hud.activePowerUps.invincibility)}s`, color: 'bg-amber-500' });
  }
  if (hud.activePowerUps.specialAttack > 0) {
    activeBoosts.push({ label: 'PWR', value: `${Math.ceil(hud.activePowerUps.specialAttack)}s`, color: 'bg-orange-600' });
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-2.5 sm:p-4">
      {/* Top Row: Left cluster, Center Boss Bar, Right cluster */}
      <div className="flex items-start justify-between gap-2">
        {/* Top-Left: Vitality Hearts, Lives, Keys, Active Power-Ups */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3 rounded-xl border border-slate-900/60 bg-[#09172e]/90 px-3 py-1.5 shadow-lg">
            <div className="flex items-center gap-1" aria-label={`Health ${hud.hp} of ${hud.maxHp}`}>
              {Array.from({ length: hud.maxHp }).map((_, idx) => (
                <HeartIcon key={idx} filled={idx < hud.hp} />
              ))}
            </div>
            <div className="h-4 w-px bg-slate-700" aria-hidden="true" />
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300">Lives</span>
              <span className="font-mono-num text-sm sm:text-base font-bold text-white" data-testid="hud-lives">
                {hud.lives}
              </span>
            </div>
            {hud.keysHeld > 0 && (
              <>
                <div className="h-4 w-px bg-slate-700" aria-hidden="true" />
                <span className="font-mono-num text-xs font-bold text-amber-300">
                  Keys {hud.keysHeld}
                </span>
              </>
            )}
          </div>

          {activeBoosts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {activeBoosts.map((b) => (
                <div
                  key={b.label}
                  className={`flex items-center gap-1 rounded-md border border-white/25 ${b.color} px-2 py-0.5 text-[11px] font-bold text-white shadow`}
                >
                  <span>{b.label}</span>
                  <span className="font-mono-num">{b.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top-Center: Boss Health Bar when active */}
        {hud.boss && hud.boss.active && (
          <div className="mx-auto hidden sm:flex min-w-[260px] max-w-md flex-1 flex-col items-center rounded-xl border border-red-400/50 bg-[#1a0a10]/90 px-4 py-2 shadow-lg">
            <div className="flex w-full items-baseline justify-between text-xs">
              <span className="font-display font-bold tracking-wide text-red-200">{hud.boss.name}</span>
              <span className="font-mono-num text-[11px] text-red-300">
                {hud.boss.hp}/{hud.boss.maxHp}
              </span>
            </div>
            <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-900">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-amber-400 transition-transform duration-150 origin-left"
                style={{ transform: `scaleX(${Math.max(0, hud.boss.hp / hud.boss.maxHp)})` }}
              />
            </div>
          </div>
        )}

        {/* Top-Right: Coins, Gems, Score, Stage, Utility Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3.5 rounded-xl border border-slate-900/60 bg-[#09172e]/90 px-3 py-1.5 shadow-lg">
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Coins</span>
              <span className="font-mono-num text-sm sm:text-base font-bold text-amber-200" data-testid="hud-coins">
                {hud.coins}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300">Gems</span>
              <span className="font-mono-num text-sm sm:text-base font-bold text-sky-200" data-testid="hud-gems">
                {hud.gems}/{hud.totalLevelGems}
              </span>
            </div>
            <div className="hidden md:flex items-baseline gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Score</span>
              <span className="font-mono-num text-sm sm:text-base font-bold text-white" data-testid="hud-score">
                {hud.score}
              </span>
            </div>
            <div className="hidden lg:flex items-baseline gap-1.5 border-l border-slate-700 pl-2.5">
              <span className="font-mono-num text-xs font-bold text-emerald-300">
                {hud.world}-{hud.level}
              </span>
              <span className="text-xs font-medium text-slate-200">{worldInfo.title}</span>
            </div>
          </div>

          {/* Utility Icon Buttons */}
          <div className="pointer-events-auto flex items-center gap-1.5">
            <button
              type="button"
              tabIndex={-1}
              aria-label={muted ? 'Unmute audio' : 'Mute audio'}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-700 bg-[#09172e]/90 text-slate-200 hover:bg-slate-800 hover:text-white active:scale-95 transition-transform"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label="Restart level"
              onClick={(e) => {
                e.currentTarget.blur();
                onRestart();
              }}
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-700 bg-[#09172e]/90 text-slate-200 hover:bg-slate-800 hover:text-white active:scale-95 transition-transform"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label="Pause game"
              onClick={(e) => {
                e.currentTarget.blur();
                onPause();
              }}
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-sky-400/50 bg-[#0c2247]/95 text-sky-100 hover:bg-sky-700 active:scale-95 transition-transform"
            >
              <Pause className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Notification / Tutorial Banner (never blocks center playfield) */}
      <div className="flex flex-col items-center gap-2 pb-1">
        {hud.secretFoundBanner && (
          <div className="rounded-lg border border-amber-300/60 bg-[#09172e]/95 px-4 py-1.5 text-xs sm:text-sm font-bold text-amber-200 shadow-lg">
            {hud.secretFoundBanner}
          </div>
        )}
        {hud.tutorialHint && (
          <div className="pointer-events-auto flex max-w-[260px] sm:max-w-xl items-center gap-2 sm:gap-3 rounded-xl border border-sky-400/40 bg-[#07152e]/95 px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm text-sky-100 shadow-xl">
            <span className="leading-snug">{hud.tutorialHint}</span>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onSkipTutorial();
              }}
              className="shrink-0 rounded-md border border-sky-400/40 bg-sky-500/20 px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-sky-200 hover:bg-sky-500/35"
            >
              Skip Tutorial
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
