import { useEffect, useState } from 'react';
import { Maximize, RotateCcw, Trash2, X } from 'lucide-react';
import { DEFAULT_KEY_BINDINGS } from '../game/config';
import { formatKeyCode } from '../game/systems/InputManager';
import type { GameSettings, KeyBindings } from '../game/types';
import { DeveloperBanner } from './BrandLogo';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdate: (next: GameSettings) => void;
  onResetProgress: () => void;
  onToggleFullscreen: () => void;
  onRemappingChange: (active: boolean) => void;
  onClose: () => void;
}

type SettingsTab = 'audio' | 'video' | 'controls' | 'gameplay';

export function SettingsModal({
  settings,
  onUpdate,
  onResetProgress,
  onToggleFullscreen,
  onRemappingChange,
  onClose,
}: SettingsModalProps) {
  const [tab, setTab] = useState<SettingsTab>('audio');
  const [listeningKey, setListeningKey] = useState<keyof KeyBindings | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    onRemappingChange(listeningKey !== null);
    if (!listeningKey) return;

    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onUpdate({
        ...settings,
        keyBindings: {
          ...settings.keyBindings,
          [listeningKey]: e.code,
        },
      });
      setListeningKey(null);
    };
    window.addEventListener('keydown', handler, true);
    return () => {
      window.removeEventListener('keydown', handler, true);
      onRemappingChange(false);
    };
  }, [listeningKey, onRemappingChange, onUpdate, settings]);

  const setField = <K extends keyof GameSettings>(key: K, val: GameSettings[K]) => {
    onUpdate({ ...settings, [key]: val });
  };

  const keyLabels: Array<{ key: keyof KeyBindings; label: string }> = [
    { key: 'left', label: 'Move Left' },
    { key: 'right', label: 'Move Right' },
    { key: 'jump', label: 'Jump' },
    { key: 'jumpAlt', label: 'Jump (Alt)' },
    { key: 'attack', label: 'Attack' },
    { key: 'special', label: 'Special Ability' },
    { key: 'pause', label: 'Pause' },
    { key: 'restart', label: 'Restart Level' },
    { key: 'fullscreen', label: 'Fullscreen' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040a17]/86 px-4 py-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-sky-400/40 bg-[#081733] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="font-display text-2xl font-bold text-amber-300">SETTINGS</h2>
          <button
            type="button"
            aria-label="Close settings"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1.5 border-b border-slate-800 bg-[#061126] px-5 py-2.5 overflow-x-auto">
          {(['audio', 'video', 'controls', 'gameplay'] as SettingsTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                tab === t
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {tab === 'audio' && (
            <div className="space-y-4">
              <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
                <span className="text-sm font-semibold text-white">Mute All Audio</span>
                <input
                  type="checkbox"
                  checked={settings.muted}
                  onChange={(e) => setField('muted', e.target.checked)}
                  className="h-5 w-5 accent-sky-400 cursor-pointer"
                />
              </label>

              <label className="block rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
                <div className="flex justify-between text-sm font-semibold text-white">
                  <span>Music Volume</span>
                  <span className="font-mono-num text-sky-300">{Math.round(settings.musicVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.musicVolume}
                  onChange={(e) => setField('musicVolume', Number(e.target.value))}
                  className="mt-2 w-full accent-sky-400"
                />
              </label>

              <label className="block rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
                <div className="flex justify-between text-sm font-semibold text-white">
                  <span>Sound Effects Volume</span>
                  <span className="font-mono-num text-sky-300">{Math.round(settings.sfxVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.sfxVolume}
                  onChange={(e) => setField('sfxVolume', Number(e.target.value))}
                  className="mt-2 w-full accent-sky-400"
                />
              </label>
            </div>
          )}

          {tab === 'video' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
                <span className="block text-sm font-semibold text-white">Graphics Quality</span>
                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setField('quality', q)}
                      className={`rounded-lg py-2 text-xs font-bold uppercase tracking-wider cursor-pointer ${
                        settings.quality === q
                          ? 'bg-sky-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
                <span className="text-sm font-semibold text-white">Screen Shake</span>
                <input
                  type="checkbox"
                  checked={settings.screenShake}
                  onChange={(e) => setField('screenShake', e.target.checked)}
                  className="h-5 w-5 accent-sky-400 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
                <span className="text-sm font-semibold text-white">Particle & Weather Effects</span>
                <input
                  type="checkbox"
                  checked={settings.visualEffects}
                  onChange={(e) => setField('visualEffects', e.target.checked)}
                  className="h-5 w-5 accent-sky-400 cursor-pointer"
                />
              </label>

              <button
                type="button"
                onClick={onToggleFullscreen}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-500/40 bg-[#0d2752] py-3 text-sm font-bold text-sky-100 hover:bg-[#143770] cursor-pointer"
              >
                <Maximize className="h-4 w-4" />
                <span>Toggle Fullscreen (F)</span>
              </button>
            </div>
          )}

          {tab === 'controls' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                  <div className="flex justify-between text-xs font-semibold text-white">
                    <span>Joystick Size</span>
                    <span className="font-mono-num text-sky-300">{Math.round(settings.joystickSize * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.75}
                    max={1.35}
                    step={0.05}
                    value={settings.joystickSize}
                    onChange={(e) => setField('joystickSize', Number(e.target.value))}
                    className="mt-2 w-full accent-sky-400"
                  />
                </label>

                <label className="block rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                  <div className="flex justify-between text-xs font-semibold text-white">
                    <span>Touch Button Size</span>
                    <span className="font-mono-num text-sky-300">{Math.round(settings.buttonSize * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.75}
                    max={1.35}
                    step={0.05}
                    value={settings.buttonSize}
                    onChange={(e) => setField('buttonSize', Number(e.target.value))}
                    className="mt-2 w-full accent-sky-400"
                  />
                </label>

                <label className="block rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                  <div className="flex justify-between text-xs font-semibold text-white">
                    <span>Touch Control Opacity</span>
                    <span className="font-mono-num text-sky-300">{Math.round(settings.buttonOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.35}
                    max={0.95}
                    step={0.05}
                    value={settings.buttonOpacity}
                    onChange={(e) => setField('buttonOpacity', Number(e.target.value))}
                    className="mt-2 w-full accent-sky-400"
                  />
                </label>

                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                  <span className="block text-xs font-semibold text-white">Control Layout</span>
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {(['compact', 'standard', 'wide'] as const).map((lay) => (
                      <button
                        key={lay}
                        type="button"
                        onClick={() => setField('controlLayout', lay)}
                        className={`rounded py-1 text-[11px] font-bold uppercase cursor-pointer ${
                          settings.controlLayout === lay
                            ? 'bg-sky-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {lay}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
                <span className="text-sm font-semibold text-white">Always Show On-Screen Touch Controls</span>
                <input
                  type="checkbox"
                  checked={settings.alwaysShowTouch}
                  onChange={(e) => setField('alwaysShowTouch', e.target.checked)}
                  className="h-5 w-5 accent-sky-400 cursor-pointer"
                />
              </label>

              {/* Keyboard Customization */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Keyboard Bindings</span>
                  <button
                    type="button"
                    onClick={() => setField('keyBindings', { ...DEFAULT_KEY_BINDINGS })}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-sky-300 hover:text-sky-200 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reset Defaults
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {keyLabels.map((item) => {
                    const active = listeningKey === item.key;
                    return (
                      <div
                        key={item.key}
                        className="flex items-center justify-between rounded-lg bg-slate-950/70 px-3 py-2 text-xs"
                      >
                        <span className="text-slate-300">{item.label}</span>
                        <button
                          type="button"
                          onClick={() => setListeningKey(active ? null : item.key)}
                          className={`rounded px-2.5 py-1 font-mono-num font-bold cursor-pointer ${
                            active
                              ? 'bg-amber-400 text-slate-950'
                              : 'border border-slate-700 bg-slate-800 text-sky-200 hover:bg-slate-700'
                          }`}
                        >
                          {active ? 'Press Key...' : formatKeyCode(settings.keyBindings[item.key])}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'gameplay' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
                <span className="block text-sm font-semibold text-white">Difficulty</span>
                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  {(['casual', 'normal', 'heroic'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setField('difficulty', d)}
                      className={`rounded-lg py-2 text-xs font-bold uppercase tracking-wider cursor-pointer ${
                        settings.difficulty === d
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
                <span className="text-sm font-semibold text-white">Show In-Game Tutorial Prompts</span>
                <input
                  type="checkbox"
                  checked={settings.showTutorial}
                  onChange={(e) => setField('showTutorial', e.target.checked)}
                  className="h-5 w-5 accent-sky-400 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
                <span className="text-sm font-semibold text-white">Haptic Vibration on Damage (Mobile)</span>
                <input
                  type="checkbox"
                  checked={settings.vibration}
                  onChange={(e) => setField('vibration', e.target.checked)}
                  className="h-5 w-5 accent-sky-400 cursor-pointer"
                />
              </label>

              {/* Reset Progress with Confirmation */}
              <div className="rounded-xl border border-rose-500/40 bg-rose-950/25 p-4">
                {!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-500/60 bg-rose-600/20 py-2.5 text-sm font-bold text-rose-200 hover:bg-rose-600/35 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Reset All Saved Progress</span>
                  </button>
                ) : (
                  <div className="space-y-3 text-center">
                    <p className="text-xs font-semibold text-rose-200">
                      Erase all unlocked worlds, stars, coins, and achievements?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onResetProgress();
                          setConfirmReset(false);
                        }}
                        className="flex-1 rounded-lg bg-rose-600 py-2 text-xs font-bold text-white hover:bg-rose-500 cursor-pointer"
                      >
                        Confirm Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmReset(false)}
                        className="flex-1 rounded-lg bg-slate-800 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with About / Developer Credit */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-[#061126] px-5 py-3">
          <span className="text-xs text-slate-400">JUMPVERSE · Saved automatically</span>
          <DeveloperBanner compact />
        </div>
      </div>
    </div>
  );
}
