import { Award, CheckCircle2, X } from 'lucide-react';
import { ACHIEVEMENTS, GAME_TAGLINE, GAME_TITLE } from '../game/config';
import type { SaveData } from '../game/types';
import { BrandLogo, DeveloperBanner } from './BrandLogo';

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050e1f] px-4">
      <BrandLogo size="lg" />
      <div className="mt-8 h-2.5 w-64 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full w-full origin-left animate-pulse rounded-full bg-gradient-to-r from-sky-400 to-amber-400" />
      </div>
      <p className="mt-3 text-xs font-semibold tracking-widest text-sky-200 uppercase">
        Preparing Worlds...
      </p>
      <div className="mt-8">
        <DeveloperBanner />
      </div>
    </div>
  );
}

export function HowToPlayModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040a17]/86 px-4 py-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="How To Play"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-sky-400/40 bg-[#081733] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="font-display text-2xl font-bold text-amber-300">HOW TO PLAY</h2>
          <button
            type="button"
            aria-label="Close how to play"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm text-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <h3 className="font-display text-base font-bold text-sky-300">Desktop Controls</h3>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                <li><strong>A / D</strong> or <strong>Left / Right Arrows</strong> — Move</li>
                <li><strong>Space / W / Up Arrow</strong> — Jump (hold for higher leap)</li>
                <li><strong>J</strong> — Melee Slash Attack</li>
                <li><strong>K</strong> — Special Energy Wave</li>
                <li><strong>Esc / P</strong> — Pause · <strong>R</strong> — Restart · <strong>F</strong> — Fullscreen</li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <h3 className="font-display text-base font-bold text-emerald-300">Mobile Touch Controls</h3>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                <li><strong>Left Virtual Joystick</strong> — Smooth analog movement</li>
                <li><strong>JUMP</strong> — Leap &amp; Double Jump</li>
                <li><strong>ATK</strong> — Melee Slash Attack</li>
                <li><strong>SPEC</strong> — Special Energy Wave</li>
                <li>Supports simultaneous movement + jumping! Customize layout in Settings.</li>
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <h3 className="font-display text-base font-bold text-amber-300">Adventure Tips</h3>
            <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
              <li>Stomp enemies from above or strike with Melee / Special waves.</li>
              <li>Watch for high secret ledges, Golden Keys, and locked Treasure Chests for bonus Blue Gems.</li>
              <li>Power-ups grant Speed Boost, Shield, Double Jump, Extra Heart, Invincibility, and Powered Special Attacks.</li>
              <li>Stage 5 of every world features a unique Boss Guardian. Observe their attack telegraph cues and counter when vulnerable!</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 bg-[#061126] px-5 py-3">
          <DeveloperBanner compact />
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-amber-400 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}

export function CreditsModal({ save, onClose }: { save: SaveData; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040a17]/86 px-4 py-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Credits and Achievements"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-sky-400/40 bg-[#081733] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="font-display text-2xl font-bold text-amber-300">CREDITS &amp; ACHIEVEMENTS</h2>
          <button
            type="button"
            aria-label="Close credits"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="flex flex-col items-center rounded-2xl border border-sky-400/30 bg-[#061124] p-5 text-center">
            <h3 className="font-display text-2xl font-bold text-amber-300">{GAME_TITLE}</h3>
            <p className="text-xs font-semibold tracking-[0.2em] text-sky-200">{GAME_TAGLINE}</p>
            <div className="mt-4">
              <DeveloperBanner />
            </div>
            <p className="mt-3 max-w-md text-xs leading-relaxed text-slate-300">
              Original 5-world, 25-level 2D side-scrolling platformer featuring procedural vector animation,
              custom physics, multi-touch controls, Web Audio synthesis, and 5 unique boss battles.
            </p>
          </div>

          <div>
            <h3 className="flex items-center gap-2 font-display text-lg font-bold text-white">
              <Award className="h-5 w-5 text-amber-400" />
              <span>Achievements ({save.achievements.length}/{ACHIEVEMENTS.length})</span>
            </h3>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ACHIEVEMENTS.map((ach) => {
                const unlocked = save.achievements.includes(ach.id);
                return (
                  <div
                    key={ach.id}
                    className={`flex items-start gap-3 rounded-xl border p-3 ${
                      unlocked
                        ? 'border-emerald-400/40 bg-emerald-950/30'
                        : 'border-slate-800 bg-slate-900/60 opacity-65'
                    }`}
                  >
                    <CheckCircle2
                      className={`mt-0.5 h-5 w-5 shrink-0 ${
                        unlocked ? 'text-emerald-400' : 'text-slate-600'
                      }`}
                    />
                    <div>
                      <p className="text-xs font-bold text-white">{ach.title}</p>
                      <p className="mt-0.5 text-[11px] text-slate-300">{ach.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-slate-800 bg-[#061126] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-sky-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function AchievementToast({ title }: { title: string | null }) {
  if (!title) return null;
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-amber-300/60 bg-[#07152e] px-5 py-2.5 shadow-2xl">
      <div className="flex items-center gap-2.5">
        <Award className="h-5 w-5 text-amber-400" />
        <div className="text-left">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Achievement Unlocked</p>
          <p className="text-sm font-bold text-white">{title}</p>
        </div>
      </div>
    </div>
  );
}
